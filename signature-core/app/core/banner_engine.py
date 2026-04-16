"""
Banner Engine

Fetches active banners for a tenant and injects them into the email HTML.
- header banners: prepended before the email body content
- footer banners: appended after disclaimers / at the very end

Applies the same internal/external discrimination as the disclaimer engine.
"""
import logging
import re
from sqlalchemy.orm import Session
from app.db.models import Banner, Domain

log = logging.getLogger(__name__)


def _is_internal(db: Session, tenant_id, to_emails: list[str]) -> bool:
    if not to_emails:
        return False
    tenant_domains = {
        d.domain.lower()
        for d in db.query(Domain).filter(Domain.tenant_id == tenant_id).all()
    }
    for addr in to_emails:
        parts = addr.strip().lower().split("@")
        if len(parts) != 2 or parts[1] not in tenant_domains:
            return False
    return True


def _get_banners(db: Session, tenant_id, direction: str, position: str) -> list[Banner]:
    return (
        db.query(Banner)
        .filter(
            Banner.tenant_id == tenant_id,
            Banner.enabled == True,  # noqa: E712
            Banner.position == position,
            Banner.applies_to.in_(["all", direction]),
        )
        .order_by(Banner.created_at)
        .all()
    )


def _wrap_banner(b: Banner) -> str:
    return (
        f'<div class="email-banner email-banner--{b.position}" style="'
        f'margin-bottom:12px;line-height:1.4;">'
        f"{b.html_content}</div>\n"
    )


def apply_banners(
    db: Session,
    tenant_id,
    html: str,
    to_emails: list[str],
) -> str:
    """
    Injects header and footer banners into the HTML.
    Header banners are inserted at the very beginning of the visible content.
    Footer banners are appended at the end.
    Returns the (possibly unchanged) HTML.
    """
    internal  = _is_internal(db, tenant_id, to_emails)
    direction = "internal" if internal else "external"

    header_banners = _get_banners(db, tenant_id, direction, "header")
    footer_banners = _get_banners(db, tenant_id, direction, "footer")

    if not header_banners and not footer_banners:
        return html

    if header_banners:
        header_block = "".join(_wrap_banner(b) for b in header_banners)
        # Insert after <body ...> tag if present, otherwise prepend
        body_tag = re.search(r"<body[^>]*>", html, re.IGNORECASE)
        if body_tag:
            insert_pos = body_tag.end()
            html = html[:insert_pos] + "\n" + header_block + html[insert_pos:]
        else:
            html = header_block + html
        log.info("Injected %d header banner(s) for tenant %s", len(header_banners), tenant_id)

    if footer_banners:
        footer_block = "".join(_wrap_banner(b) for b in footer_banners)
        html = html + footer_block
        log.info("Injected %d footer banner(s) for tenant %s", len(footer_banners), tenant_id)

    return html
