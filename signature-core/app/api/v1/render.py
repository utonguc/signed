import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schemas import RenderRequest, RenderResponse
from app.services.render_service import render_signature

router = APIRouter()

_GATEWAY_KEY = os.getenv("SIGNATURE_API_KEY", "")


def _require_api_key(x_api_key: str = Header(default="")):
    if _GATEWAY_KEY and x_api_key != _GATEWAY_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/render", response_model=RenderResponse)
def render(
    req: RenderRequest,
    db: Session = Depends(get_db),
    _: None = Depends(_require_api_key),
):
    result = render_signature(db, req.from_email, req.html, req.to_emails)
    return RenderResponse(**result)
