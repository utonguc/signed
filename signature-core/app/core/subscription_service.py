"""
Subscription / Licensing Service

Enforces user-based (per-mailbox) seat limits and subscription status checks.
Trial: 14 days from tenant creation, 999 seats (unlimited in practice).
Active: paid, seats enforced.
Suspended / Cancelled: signature injection disabled.
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import Subscription, User

log = logging.getLogger(__name__)

TRIAL_DAYS = 14


def get_or_create_subscription(db: Session, tenant_id) -> Subscription:
    """Return the subscription for a tenant, creating a trial if none exists."""
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if sub is None:
        sub = Subscription(
            tenant_id=tenant_id,
            status="trial",
            seats=999,
            trial_ends_at=datetime.utcnow() + timedelta(days=TRIAL_DAYS),
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


def is_active(db: Session, tenant_id) -> tuple[bool, str]:
    """
    Returns (True, "") if the tenant is allowed to inject signatures.
    Returns (False, reason) otherwise.
    """
    sub = get_or_create_subscription(db, tenant_id)

    if sub.status == "trial":
        if sub.trial_ends_at and datetime.utcnow() > sub.trial_ends_at:
            return False, "trial_expired"
        return True, ""

    if sub.status == "active":
        if sub.period_end and datetime.utcnow() > sub.period_end:
            return False, "subscription_expired"
        return True, ""

    return False, f"subscription_{sub.status}"


def check_seat_limit(db: Session, tenant_id) -> tuple[bool, str]:
    """
    Returns (True, "") if adding one more user is within the seat limit.
    """
    sub = get_or_create_subscription(db, tenant_id)
    current_users = db.query(User).filter(User.tenant_id == tenant_id).count()
    if current_users >= sub.seats:
        return False, f"seat_limit_reached ({sub.seats} seats)"
    return True, ""
