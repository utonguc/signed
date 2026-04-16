from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Disclaimer, Tenant
from app.models.admin_schemas import DisclaimerCreate, DisclaimerUpdate, DisclaimerOut
from app.api.admin.deps import get_current_admin

router = APIRouter(prefix="/tenants/{tenant_id}/disclaimers", tags=["disclaimers"])


def _get_tenant_or_404(db, tenant_id):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


def _get_disclaimer_or_404(db, tenant_id, disclaimer_id):
    d = db.query(Disclaimer).filter(
        Disclaimer.id == disclaimer_id,
        Disclaimer.tenant_id == tenant_id,
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Disclaimer not found")
    return d


@router.get("", response_model=list[DisclaimerOut])
def list_disclaimers(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    return db.query(Disclaimer).filter(Disclaimer.tenant_id == tenant_id).order_by(Disclaimer.created_at).all()


@router.post("", response_model=DisclaimerOut, status_code=201)
def create_disclaimer(
    tenant_id: str,
    body: DisclaimerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    d = Disclaimer(
        tenant_id=tenant_id,
        name=body.name,
        html_content=body.html_content,
        applies_to=body.applies_to,
        enabled=body.enabled,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{disclaimer_id}", response_model=DisclaimerOut)
def update_disclaimer(
    tenant_id: str,
    disclaimer_id: str,
    body: DisclaimerUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    d = _get_disclaimer_or_404(db, tenant_id, disclaimer_id)
    for field in ("name", "html_content", "applies_to", "enabled"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(d, field, val)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{disclaimer_id}", status_code=204)
def delete_disclaimer(
    tenant_id: str,
    disclaimer_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    d = _get_disclaimer_or_404(db, tenant_id, disclaimer_id)
    db.delete(d)
    db.commit()
