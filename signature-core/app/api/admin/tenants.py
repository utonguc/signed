from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Tenant, Domain
from app.models.admin_schemas import (
    TenantCreate, TenantUpdate, TenantOut,
    DomainCreate, DomainOut,
)
from app.api.admin.deps import get_current_admin, require_super_admin

router = APIRouter(prefix="/tenants", tags=["tenants"])


def _get_tenant_or_404(db, tenant_id):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


@router.get("", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Tenant).order_by(Tenant.created_at.desc()).all()


@router.post("", response_model=TenantOut, status_code=201)
def create_tenant(
    body: TenantCreate,
    db: Session = Depends(get_db),
    _=Depends(require_super_admin),
):
    if db.query(Tenant).filter(Tenant.slug == body.slug).first():
        raise HTTPException(status_code=409, detail="Slug already in use")
    t = Tenant(name=body.name, slug=body.slug, status=body.status)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{tenant_id}", response_model=TenantOut)
def get_tenant(tenant_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return _get_tenant_or_404(db, tenant_id)


@router.put("/{tenant_id}", response_model=TenantOut)
def update_tenant(
    tenant_id: str,
    body: TenantUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    t = _get_tenant_or_404(db, tenant_id)
    if body.name is not None:
        t.name = body.name
    if body.status is not None:
        t.status = body.status
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{tenant_id}", status_code=204)
def delete_tenant(tenant_id: str, db: Session = Depends(get_db), _=Depends(require_super_admin)):
    t = _get_tenant_or_404(db, tenant_id)
    db.delete(t)
    db.commit()


# ── Domains ───────────────────────────────────────────────────────────────────

@router.get("/{tenant_id}/domains", response_model=list[DomainOut])
def list_domains(tenant_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    _get_tenant_or_404(db, tenant_id)
    return db.query(Domain).filter(Domain.tenant_id == tenant_id).all()


@router.post("/{tenant_id}/domains", response_model=DomainOut, status_code=201)
def add_domain(
    tenant_id: str,
    body: DomainCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    _get_tenant_or_404(db, tenant_id)
    if db.query(Domain).filter(Domain.domain == body.domain.lower()).first():
        raise HTTPException(status_code=409, detail="Domain already registered")
    d = Domain(tenant_id=tenant_id, domain=body.domain.lower(), verified=body.verified)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{tenant_id}/domains/{domain_id}", status_code=204)
def delete_domain(
    tenant_id: str,
    domain_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    d = db.query(Domain).filter(Domain.id == domain_id, Domain.tenant_id == tenant_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Domain not found")
    db.delete(d)
    db.commit()
