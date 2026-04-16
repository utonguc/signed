from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AdminUser
from app.services.auth_service import verify_password, create_token
from app.models.admin_schemas import LoginRequest, TokenResponse
from app.api.admin.deps import get_current_admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({
        "sub":       str(user.id),
        "email":     user.email,
        "role":      user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    })
    return TokenResponse(token=token, role=user.role, email=user.email)


@router.get("/me")
def me(admin: dict = Depends(get_current_admin)):
    return admin
