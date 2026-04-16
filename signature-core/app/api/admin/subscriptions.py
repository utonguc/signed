from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Tenant, User
from app.models.admin_schemas import SubscriptionOut, SubscriptionUpdate
from app.api.admin.deps import get_current_admin
from app.core.subscription_service import get_or_create_subscription

router = APIRouter(prefix="/tenants/{tenant_id}/subscription", tags=["subscription"])


def _get_tenant_or_404(db, tenant_id):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


@router.get("", response_model=SubscriptionOut)
def get_subscription(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    sub = get_or_create_subscription(db, tenant_id)
    used = db.query(User).filter(User.tenant_id == tenant_id).count()
    return SubscriptionOut.from_orm_with_usage(sub, used)


@router.put("", response_model=SubscriptionOut)
def update_subscription(
    tenant_id: str,
    body: SubscriptionUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    sub = get_or_create_subscription(db, tenant_id)
    for field in ("status", "seats", "trial_ends_at", "period_end"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(sub, field, val)
    db.commit()
    db.refresh(sub)
    used = db.query(User).filter(User.tenant_id == tenant_id).count()
    return SubscriptionOut.from_orm_with_usage(sub, used)
