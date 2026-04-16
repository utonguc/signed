import logging
from sqlalchemy.orm import Session
from app.core.tenant_resolver import resolve_tenant
from app.core.rule_engine import resolve_template
from app.core.template_engine import render_template, user_to_dict
from app.core.html_parser import has_signature, split_quote_block, sanitize_html, SIGNATURE_MARKER
from app.core.disclaimer_engine import apply_disclaimers
from app.core.banner_engine import apply_banners
from app.core.tracking_engine import create_event, inject_tracking
from app.core.subscription_service import is_active
from app.core.qr_engine import build_vcard, generate_qr_data_uri, user_vcard_url, user_qr_url
from app.db.repository import get_user_by_email

log = logging.getLogger(__name__)


def render_signature(
    db: Session,
    from_email: str,
    html: str,
    to_emails: list[str] | None = None,
) -> dict:
    """
    Orchestrates signature injection for a single outbound email.

    Returns a dict with:
      signature_applied: bool
      html:              str  (modified or original)
      reason:            str  (only when signature_applied is False)
      template_id:       str  (only when signature_applied is True)
      tracking_id:       str  (only when signature_applied is True)
    """
    if to_emails is None:
        to_emails = []

    from_email = from_email.lower().strip()

    # 1. Resolve tenant via sender domain
    domain_record = resolve_tenant(db, from_email)
    if domain_record is None:
        log.info("Unknown domain for <%s> — passing through", from_email)
        return {"signature_applied": False, "html": html, "reason": "unknown_domain"}

    tenant_id = domain_record.tenant_id

    # 2. Check subscription / licensing
    allowed, reason = is_active(db, tenant_id)
    if not allowed:
        log.info("Subscription check failed for tenant %s: %s", tenant_id, reason)
        return {"signature_applied": False, "html": html, "reason": reason}

    # 3. Sanitize and guard against double-signing
    html = sanitize_html(html)
    if has_signature(html):
        return {"signature_applied": False, "html": html, "reason": "already_signed"}

    # 4. Resolve user (missing user is allowed — renders with empty fields)
    user = get_user_by_email(db, from_email)
    if user is None:
        log.info("No user record for <%s> — rendering with empty fields", from_email)

    # 5. Select template via rule engine
    template = resolve_template(db, tenant_id, user)
    if template is None:
        log.info("No template for tenant %s — passing through", tenant_id)
        return {"signature_applied": False, "html": html, "reason": "no_template"}

    # 6. Build user data dict, adding QR / vCard context when user exists
    user_data = user_to_dict(user) if user else {}
    if user:
        uid = str(user.id)
        vcard_text  = build_vcard(user)
        user_data["vcard_url"]     = user_vcard_url(uid)
        user_data["qr_code_url"]   = user_qr_url(uid)
        user_data["qr_code_img"]   = generate_qr_data_uri(vcard_text)
        user_data["user_id"]       = uid

    # 7. Render Jinja2 template with user data
    signature_html = render_template(template.html_content, user_data)

    # 8. Split at quote block and inject signature
    parts = split_quote_block(html)
    final_html = parts["body"] + signature_html + SIGNATURE_MARKER + parts["quote"]

    # 9. Apply disclaimers (appended after signature)
    final_html = apply_disclaimers(db, tenant_id, final_html, to_emails)

    # 9b. Apply marketing banners (header prepended, footer appended)
    final_html = apply_banners(db, tenant_id, final_html, to_emails)

    # 10. Create tracking event and inject pixel + CSAT widget
    tracking_id = create_event(db, tenant_id, from_email)
    final_html  = inject_tracking(final_html, tracking_id)

    return {
        "signature_applied": True,
        "html": final_html,
        "template_id": str(template.id),
        "tracking_id": tracking_id,
    }
