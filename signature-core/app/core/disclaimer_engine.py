"""
Disclaimer Engine

Fetches active disclaimers for a tenant and appends them to the email HTML.
Discriminates between 'internal' (recipient in tenant's own domains) and
'external' (recipient in a foreign domain) to apply the correct disclaimers.
"""
import logging
from sqlalchemy.orm import Session
from app.db.models import Disclaimer, Domain

log = logging.getLogger(__name__)


def _is_internal(db: Session, tenant_id, to_emails: list[str]) -> bool:
    """
    Returns True if ALL recipients belong to one of the tenant's own domains.
    If any single recipient is external the email is classified as external.
    """
    if not to_emails:
        return False

    tenant_domains = {
        d.domain.lower()
        for d in db.query(Domain).filter(Domain.tenant_id == tenant_id).all()
    }

    for addr in to_emails:
        parts = addr.strip().lower().split("@")
        if len(parts) != 2:
            return False
        if parts[1] not in tenant_domains:
            return False
    return True


def apply_disclaimers(
    db: Session,
    tenant_id,
    html: str,
    to_emails: list[str],
) -> str:
    """
    Appends applicable disclaimer blocks to the HTML body.
    Returns the (possibly unchanged) HTML.
    """
    internal = _is_internal(db, tenant_id, to_emails)
    direction = "internal" if internal else "external"

    disclaimers = (
        db.query(Disclaimer)
        .filter(
            Disclaimer.tenant_id == tenant_id,
            Disclaimer.enabled == True,
            Disclaimer.applies_to.in_(["all", direction]),
        )
        .order_by(Disclaimer.created_at)
        .all()
    )

    if not disclaimers:
        return html

    disclaimer_html = ""
    for d in disclaimers:
        disclaimer_html += (
            f'<div class="email-disclaimer" style="'
            f'margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;'
            f'font-size:11px;color:#6b7280;line-height:1.5;">'
            f"{d.html_content}</div>\n"
        )

    log.info(
        "Appending %d disclaimer(s) [%s] for tenant %s",
        len(disclaimers), direction, tenant_id,
    )
    return html + disclaimer_html
