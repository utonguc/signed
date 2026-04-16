from fastapi import APIRouter
from app.core.signature_engine import render_signature

router = APIRouter(prefix="/v1/signature")

@router.post("/render")
def render_v1(req: dict):
    return render_signature(req)
