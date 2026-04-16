"""
Global dashboard stats — super admin overview.
GET /v1/admin/dashboard/stats
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Tenant, User, EmailEvent, Subscription
from app.api.admin.deps import require_super_admin

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total_tenants: int
    active_tenants: int
    total_users: int
    emails_sent_30d: int
    emails_opened_30d: int
    open_rate_30d: float
    trial_tenants: int
    active_subscriptions: int


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _=Depends(require_super_admin),
):
    since = datetime.utcnow() - timedelta(days=30)

    total_tenants  = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.status == "active").count()
    total_users    = db.query(User).count()

    sent   = db.query(EmailEvent).filter(EmailEvent.sent_at >= since).count()
    opened = db.query(EmailEvent).filter(
        EmailEvent.sent_at >= since,
        EmailEvent.opened_at != None,  # noqa: E711
    ).count()

    trial_count  = db.query(Subscription).filter(Subscription.status == "trial").count()
    active_count = db.query(Subscription).filter(Subscription.status == "active").count()

    return DashboardStats(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_users=total_users,
        emails_sent_30d=sent,
        emails_opened_30d=opened,
        open_rate_30d=round(opened / sent * 100, 1) if sent else 0.0,
        trial_tenants=trial_count,
        active_subscriptions=active_count,
    )
