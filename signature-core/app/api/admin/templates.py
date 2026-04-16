from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Template
from app.models.admin_schemas import (
    TemplateCreate, TemplateUpdate, TemplateOut,
    PreviewRequest, PreviewResponse,
)
from app.core.template_engine import render_template
from app.api.admin.deps import get_current_admin

router = APIRouter(tags=["templates"])


def _get_template_or_404(db, tenant_id, template_id):
    t = db.query(Template).filter(
        Template.id == template_id, Template.tenant_id == tenant_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


@router.get("/tenants/{tenant_id}/templates", response_model=list[TemplateOut])
def list_templates(tenant_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Template).filter(Template.tenant_id == tenant_id)\
             .order_by(Template.created_at.desc()).all()


@router.post("/tenants/{tenant_id}/templates", response_model=TemplateOut, status_code=201)
def create_template(
    tenant_id: str,
    body: TemplateCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    if body.is_default:
        # un-default others
        db.query(Template).filter(
            Template.tenant_id == tenant_id, Template.is_default == True
        ).update({"is_default": False})
    t = Template(
        tenant_id=tenant_id,
        name=body.name,
        html_content=body.html_content,
        is_default=body.is_default,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/tenants/{tenant_id}/templates/{template_id}", response_model=TemplateOut)
def get_template(tenant_id: str, template_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return _get_template_or_404(db, tenant_id, template_id)


@router.put("/tenants/{tenant_id}/templates/{template_id}", response_model=TemplateOut)
def update_template(
    tenant_id: str,
    template_id: str,
    body: TemplateUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    t = _get_template_or_404(db, tenant_id, template_id)
    if body.name is not None:
        t.name = body.name
    if body.html_content is not None:
        t.html_content = body.html_content
    if body.is_default is not None:
        if body.is_default:
            db.query(Template).filter(
                Template.tenant_id == tenant_id, Template.is_default == True
            ).update({"is_default": False})
        t.is_default = body.is_default
    db.commit()
    db.refresh(t)
    return t


@router.delete("/tenants/{tenant_id}/templates/{template_id}", status_code=204)
def delete_template(
    tenant_id: str, template_id: str,
    db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    t = _get_template_or_404(db, tenant_id, template_id)
    db.delete(t)
    db.commit()


@router.post("/tenants/{tenant_id}/templates/preview", response_model=PreviewResponse)
def preview_template(
    tenant_id: str,
    body: PreviewRequest,
    _=Depends(get_current_admin),
):
    """Render a template HTML with sample user data — no DB write."""
    html = render_template(body.html_content, body.user_data)
    return PreviewResponse(html=html)
