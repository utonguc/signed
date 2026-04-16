"""
Public QR code & vCard endpoints — no auth required.

GET /v1/users/{user_id}/vcard      → download .vcf
GET /v1/users/{user_id}/qr.png     → QR code PNG
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.qr_engine import build_vcard, generate_qr_png

router = APIRouter(prefix="/users", tags=["qr-vcard"])


def _get_user_or_404(db: Session, user_id: str) -> User:
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.get("/{user_id}/vcard")
def download_vcard(user_id: str, db: Session = Depends(get_db)):
    user = _get_user_or_404(db, user_id)
    vcf  = build_vcard(user)
    filename = (user.display_name or user.email).replace(" ", "_") + ".vcf"
    return Response(
        content=vcf.encode("utf-8"),
        media_type="text/vcard",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{user_id}/qr.png")
def download_qr(user_id: str, db: Session = Depends(get_db)):
    user = _get_user_or_404(db, user_id)
    vcf  = build_vcard(user)
    png  = generate_qr_png(vcf)
    if not png:
        raise HTTPException(status_code=503, detail="QR generation unavailable")
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )
