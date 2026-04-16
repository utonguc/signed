from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Banner, Tenant
from app.models.admin_schemas import BannerCreate, BannerUpdate, BannerOut
from app.api.admin.deps import get_current_admin

router = APIRouter(prefix="/tenants/{tenant_id}/banners", tags=["banners"])


def _get_tenant_or_404(db, tenant_id):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


def _get_banner_or_404(db, tenant_id, banner_id):
    b = db.query(Banner).filter(
        Banner.id == banner_id,
        Banner.tenant_id == tenant_id,
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    return b


@router.get("", response_model=list[BannerOut])
def list_banners(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    return db.query(Banner).filter(Banner.tenant_id == tenant_id).order_by(Banner.created_at).all()


@router.post("", response_model=BannerOut, status_code=201)
def create_banner(
    tenant_id: str,
    body: BannerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    b = Banner(
        tenant_id=tenant_id,
        name=body.name,
        html_content=body.html_content,
        position=body.position,
        applies_to=body.applies_to,
        enabled=body.enabled,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{banner_id}", response_model=BannerOut)
def update_banner(
    tenant_id: str,
    banner_id: str,
    body: BannerUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    b = _get_banner_or_404(db, tenant_id, banner_id)
    for field in ("name", "html_content", "position", "applies_to", "enabled"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(b, field, val)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{banner_id}", status_code=204)
def delete_banner(
    tenant_id: str,
    banner_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    b = _get_banner_or_404(db, tenant_id, banner_id)
    db.delete(b)
    db.commit()
