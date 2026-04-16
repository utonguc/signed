from pydantic import BaseModel
from typing import Optional


class RenderRequest(BaseModel):
    from_email: str
    html: str
    to_emails: list[str] = []


class RenderResponse(BaseModel):
    signature_applied: bool
    html: str
    template_id: Optional[str] = None
    reason: Optional[str] = None
    tracking_id: Optional[str] = None
