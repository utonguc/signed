from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import User
from app.models.admin_schemas import UserCreate, UserUpdate, UserOut
from app.api.admin.deps import get_current_admin
from app.core.subscription_service import check_seat_limit
from app.core.token_engine import generate_magic_link

router = APIRouter(tags=["users"])


@router.get("/tenants/{tenant_id}/users", response_model=list[UserOut])
def list_users(tenant_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(User).filter(User.tenant_id == tenant_id)\
             .order_by(User.email.asc()).all()


@router.post("/tenants/{tenant_id}/users", response_model=UserOut, status_code=201)
def create_user(
    tenant_id: str,
    body: UserCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    ok, reason = check_seat_limit(db, tenant_id)
    if not ok:
        raise HTTPException(status_code=402, detail=f"Seat limit reached: {reason}")
    u = User(
        tenant_id=tenant_id,
        email=body.email.lower(),
        display_name=body.display_name,
        job_title=body.job_title,
        mobile_phone=body.mobile_phone,
        department=body.department,
        extra_fields=body.extra_fields,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/tenants/{tenant_id}/users/{user_id}", response_model=UserOut)
def update_user(
    tenant_id: str,
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    for field in ("display_name", "job_title", "mobile_phone", "department", "extra_fields"):
        val = getattr(body, field)
        if val is not None:
            setattr(u, field, val)

    db.commit()
    db.refresh(u)
    return u


@router.delete("/tenants/{tenant_id}/users/{user_id}", status_code=204)
def delete_user(
    tenant_id: str, user_id: str,
    db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()


class ImportRow(BaseModel):
    email: str
    display_name: str | None = None
    job_title: str | None = None
    mobile_phone: str | None = None
    department: str | None = None

class ImportRequest(BaseModel):
    rows: list[ImportRow]

class ImportResponse(BaseModel):
    created: int
    updated: int
    errors: list[str]


@router.post("/tenants/{tenant_id}/users/import", response_model=ImportResponse)
def import_users(
    tenant_id: str,
    body: ImportRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    created = updated = 0
    errors: list[str] = []

    for row in body.rows:
        email = row.email.strip().lower()
        if not email:
            continue
        try:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                for field in ("display_name", "job_title", "mobile_phone", "department"):
                    val = getattr(row, field)
                    if val is not None:
                        setattr(existing, field, val)
                updated += 1
            else:
                ok, reason = check_seat_limit(db, tenant_id)
                if not ok:
                    errors.append(f"{email}: {reason}")
                    continue
                db.add(User(
                    tenant_id=tenant_id,
                    email=email,
                    display_name=row.display_name,
                    job_title=row.job_title,
                    mobile_phone=row.mobile_phone,
                    department=row.department,
                ))
                created += 1
        except Exception as exc:
            errors.append(f"{email}: {exc}")

    db.commit()
    return ImportResponse(created=created, updated=updated, errors=errors)


class MagicLinkResponse(BaseModel):
    magic_link: str


@router.post("/tenants/{tenant_id}/users/{user_id}/magic-link", response_model=MagicLinkResponse)
def create_magic_link(
    tenant_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    link = generate_magic_link(db, user_id)
    return MagicLinkResponse(magic_link=link)
