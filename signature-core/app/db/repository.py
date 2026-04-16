from sqlalchemy.orm import Session
from app.db.models import Domain, User, Template, Rule


def get_domain_by_name(db: Session, domain: str) -> Domain | None:
    return db.query(Domain).filter(Domain.domain == domain.lower()).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_active_rules(db: Session, tenant_id) -> list[Rule]:
    """Return enabled rules for a tenant, ordered by priority (lowest first)."""
    return (
        db.query(Rule)
        .filter(Rule.tenant_id == tenant_id, Rule.enabled == True)  # noqa: E712
        .order_by(Rule.priority.asc())
        .all()
    )


def get_template_by_id(db: Session, template_id) -> Template | None:
    return db.query(Template).filter(Template.id == template_id).first()


def get_default_template(db: Session, tenant_id) -> Template | None:
    return (
        db.query(Template)
        .filter(Template.tenant_id == tenant_id, Template.is_default == True)  # noqa: E712
        .first()
    )
