from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Signature Core")

class Req(BaseModel):
    message_id: str | None = None
    from_email: str | None = None
    to: list[str] = []
    html: str

@app.post("/v1/signature/render")
def render(req: Req):
    # SIMULATION: signature processing layer
    processed = f"<div class='signed'>{req.html}</div>"
    return {
        "status": "OK",
        "final_output": processed
    }
