"""
Rule engine: selects the best matching template for a given user.

Rules are evaluated in ascending priority order (lower number = higher precedence).
condition_type values:
  'email'      — exact sender email match
  'department' — user.department match
  'job_title'  — user.job_title match
  None         — catch-all (matches everyone)
"""
from sqlalchemy.orm import Session
from app.db.models import User, Template
from app.db.repository import get_active_rules, get_template_by_id, get_default_template


def resolve_template(db: Session, tenant_id, user: User | None) -> Template | None:
    """
    Walk rules by priority and return the first matching template.
    Falls back to the tenant's is_default template if nothing matches.
    Returns None only when the tenant has no templates at all.
    """
    rules = get_active_rules(db, tenant_id)

    for rule in rules:
        # Catch-all — always matches
        if rule.condition_type is None:
            return get_template_by_id(db, rule.template_id)

        # Remaining condition types require a known user
        if user is None:
            continue

        match rule.condition_type:
            case "email":
                if user.email == rule.condition_value:
                    return get_template_by_id(db, rule.template_id)
            case "department":
                if user.department == rule.condition_value:
                    return get_template_by_id(db, rule.template_id)
            case "job_title":
                if user.job_title == rule.condition_value:
                    return get_template_by_id(db, rule.template_id)

    # No rule matched — fall back to default template
    return get_default_template(db, tenant_id)
