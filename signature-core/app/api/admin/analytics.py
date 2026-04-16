from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.session import get_db
from app.db.models import EmailEvent
from app.models.admin_schemas import AnalyticsOut
from app.api.admin.deps import get_current_admin

router = APIRouter(prefix="/tenants/{tenant_id}/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    tenant_id: str,
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    since = datetime.utcnow() - timedelta(days=days)

    base = db.query(EmailEvent).filter(
        EmailEvent.tenant_id == tenant_id,
        EmailEvent.sent_at >= since,
    )

    total_sent = base.count()
    total_opened = base.filter(EmailEvent.opened_at != None).count()  # noqa: E711
    total_csat = base.filter(EmailEvent.csat_score != None).count()  # noqa: E711
    avg_csat_row = db.query(func.avg(EmailEvent.csat_score)).filter(
        EmailEvent.tenant_id == tenant_id,
        EmailEvent.sent_at >= since,
        EmailEvent.csat_score != None,  # noqa: E711
    ).scalar()
    avg_csat = round(float(avg_csat_row), 2) if avg_csat_row is not None else None

    # CSAT score distribution
    distribution = {}
    for score in range(1, 6):
        cnt = base.filter(EmailEvent.csat_score == score).count()
        distribution[str(score)] = cnt

    return AnalyticsOut(
        period_days=days,
        total_sent=total_sent,
        total_opened=total_opened,
        open_rate=round(total_opened / total_sent * 100, 1) if total_sent else 0.0,
        total_csat_responses=total_csat,
        avg_csat_score=avg_csat,
        csat_distribution=distribution,
    )
