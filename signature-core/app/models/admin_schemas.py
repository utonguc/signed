from pydantic import BaseModel, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

# Coerces UUID (and anything else) to str — needed because SQLAlchemy returns
# native uuid.UUID objects which Pydantic v2 won't silently cast to str.
UUIDStr = Annotated[str, BeforeValidator(str)]


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    role: str
    email: str


# ── Tenant ────────────────────────────────────────────────────────────────────

class TenantCreate(BaseModel):
    name: str
    slug: str
    status: str = "active"

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class TenantOut(BaseModel):
    id: UUIDStr
    name: str
    slug: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Domain ────────────────────────────────────────────────────────────────────

class DomainCreate(BaseModel):
    domain: str
    verified: bool = False

class DomainOut(BaseModel):
    id: UUIDStr
    domain: str
    verified: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Template ──────────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    html_content: str
    is_default: bool = False

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    html_content: Optional[str] = None
    is_default: Optional[bool] = None

class TemplateOut(BaseModel):
    id: UUIDStr
    name: str
    html_content: str
    is_default: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class PreviewRequest(BaseModel):
    html_content: str
    user_data: dict = {
        "display_name": "John Doe",
        "job_title": "Manager",
        "mobile_phone": "+90 555 000 00 00",
        "department": "Engineering",
    }

class PreviewResponse(BaseModel):
    html: str


# ── Rule ──────────────────────────────────────────────────────────────────────

class RuleCreate(BaseModel):
    priority: int = 100
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    template_id: str
    enabled: bool = True

class RuleUpdate(BaseModel):
    priority: Optional[int] = None
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    template_id: Optional[str] = None
    enabled: Optional[bool] = None

class RuleOut(BaseModel):
    id: UUIDStr
    priority: int
    condition_type: Optional[str]
    condition_value: Optional[str]
    template_id: UUIDStr
    template_name: Optional[str] = None
    enabled: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    mobile_phone: Optional[str] = None
    department: Optional[str] = None
    extra_fields: dict = {}

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    mobile_phone: Optional[str] = None
    department: Optional[str] = None
    extra_fields: Optional[dict] = None

class UserOut(BaseModel):
    id: UUIDStr
    email: str
    display_name: Optional[str]
    job_title: Optional[str]
    mobile_phone: Optional[str]
    department: Optional[str]
    extra_fields: dict
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Disclaimer ────────────────────────────────────────────────────────────────

class DisclaimerCreate(BaseModel):
    name: str
    html_content: str
    applies_to: str = "all"
    enabled: bool = True

class DisclaimerUpdate(BaseModel):
    name: Optional[str] = None
    html_content: Optional[str] = None
    applies_to: Optional[str] = None
    enabled: Optional[bool] = None

class DisclaimerOut(BaseModel):
    id: UUIDStr
    name: str
    html_content: str
    applies_to: str
    enabled: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Subscription ──────────────────────────────────────────────────────────────

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    seats: Optional[int] = None
    trial_ends_at: Optional[datetime] = None
    period_end: Optional[datetime] = None

class SubscriptionOut(BaseModel):
    id: str
    tenant_id: str
    status: str
    seats: int
    trial_ends_at: Optional[datetime]
    period_end: Optional[datetime]
    created_at: datetime
    used_seats: int = 0

    @classmethod
    def from_orm_with_usage(cls, sub, used: int):
        return cls(
            id=str(sub.id),
            tenant_id=str(sub.tenant_id),
            status=sub.status,
            seats=sub.seats,
            trial_ends_at=sub.trial_ends_at,
            period_end=sub.period_end,
            created_at=sub.created_at,
            used_seats=used,
        )

    model_config = {"from_attributes": True}


# ── Banner ────────────────────────────────────────────────────────────────────

class BannerCreate(BaseModel):
    name: str
    html_content: str
    position: str = "header"   # header | footer
    applies_to: str = "all"    # all | external | internal
    enabled: bool = True

class BannerUpdate(BaseModel):
    name: Optional[str] = None
    html_content: Optional[str] = None
    position: Optional[str] = None
    applies_to: Optional[str] = None
    enabled: Optional[bool] = None

class BannerOut(BaseModel):
    id: UUIDStr
    name: str
    html_content: str
    position: str
    applies_to: str
    enabled: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    period_days: int
    total_sent: int
    total_opened: int
    open_rate: float
    total_csat_responses: int
    avg_csat_score: Optional[float]
    csat_distribution: dict[str, int]
