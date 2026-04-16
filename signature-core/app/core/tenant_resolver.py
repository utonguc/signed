from sqlalchemy.orm import Session
from app.db.models import Domain
from app.db.repository import get_domain_by_name


def resolve_tenant(db: Session, from_email: str) -> Domain | None:
    """
    Return the Domain record for the sender's domain, or None if unknown.
    The Domain object carries tenant_id — no separate tenant lookup needed.
    """
    if "@" not in from_email:
        return None
    domain = from_email.split("@")[-1].lower().strip()
    return get_domain_by_name(db, domain)
