"""
User Self-Service Portal — public endpoints.

GET  /v1/portal?token={token}      → return user profile
PUT  /v1/portal?token={token}      → update display_name, job_title, mobile_phone, department
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.core.token_engine import validate_token
from app.models.admin_schemas import UserOut
from app.services.render_service import render_signature

router = APIRouter(prefix="/portal", tags=["portal"])


class PortalUpdate(BaseModel):
    display_name: Optional[str] = None
    job_title:    Optional[str] = None
    mobile_phone: Optional[str] = None
    department:   Optional[str] = None


@router.get("", response_model=UserOut)
def get_profile(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    user = validate_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


class PortalPreviewResponse(BaseModel):
    html: str
    has_signature: bool


@router.get("/preview", response_model=PortalPreviewResponse)
def preview_signature(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """Return a rendered signature preview for the authenticated user."""
    user = validate_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = render_signature(
        db=db,
        from_email=user.email,
        html="<p><!-- preview --></p>",
        to_emails=[],
    )
    preview_html = result.get("html", "")
    applied = result.get("signature_applied", False)
    return PortalPreviewResponse(html=preview_html, has_signature=applied)


@router.put("", response_model=UserOut)
def update_profile(
    body: PortalUpdate,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    user = validate_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    for field in ("display_name", "job_title", "mobile_phone", "department"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(user, field, val)

    db.commit()
    db.refresh(user)
    return user
