from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Rule, Template
from app.models.admin_schemas import RuleCreate, RuleUpdate, RuleOut
from app.api.admin.deps import get_current_admin

router = APIRouter(tags=["rules"])


def _rule_to_out(r: Rule) -> RuleOut:
    return RuleOut(
        id=str(r.id),
        priority=r.priority,
        condition_type=r.condition_type,
        condition_value=r.condition_value,
        template_id=str(r.template_id),
        template_name=r.template.name if r.template else None,
        enabled=r.enabled,
        created_at=r.created_at,
    )


@router.get("/tenants/{tenant_id}/rules", response_model=list[RuleOut])
def list_rules(tenant_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    rules = db.query(Rule).filter(Rule.tenant_id == tenant_id)\
               .order_by(Rule.priority.asc()).all()
    return [_rule_to_out(r) for r in rules]


@router.post("/tenants/{tenant_id}/rules", response_model=RuleOut, status_code=201)
def create_rule(
    tenant_id: str,
    body: RuleCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    # Verify template belongs to this tenant
    tmpl = db.query(Template).filter(
        Template.id == body.template_id, Template.tenant_id == tenant_id
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found in this tenant")

    r = Rule(
        tenant_id=tenant_id,
        priority=body.priority,
        condition_type=body.condition_type,
        condition_value=body.condition_value,
        template_id=body.template_id,
        enabled=body.enabled,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _rule_to_out(r)


@router.put("/tenants/{tenant_id}/rules/{rule_id}", response_model=RuleOut)
def update_rule(
    tenant_id: str,
    rule_id: str,
    body: RuleUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    r = db.query(Rule).filter(Rule.id == rule_id, Rule.tenant_id == tenant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")

    if body.priority is not None:
        r.priority = body.priority
    if body.condition_type is not None:
        r.condition_type = body.condition_type
    if body.condition_value is not None:
        r.condition_value = body.condition_value
    if body.template_id is not None:
        r.template_id = body.template_id
    if body.enabled is not None:
        r.enabled = body.enabled

    db.commit()
    db.refresh(r)
    return _rule_to_out(r)


@router.delete("/tenants/{tenant_id}/rules/{rule_id}", status_code=204)
def delete_rule(
    tenant_id: str, rule_id: str,
    db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    r = db.query(Rule).filter(Rule.id == rule_id, Rule.tenant_id == tenant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(r)
    db.commit()
