from fastapi import APIRouter

router = APIRouter(prefix="/v1/signature")

@router.post("/render")
def render(req: dict):
    return {"status": "OK", "input": req}
