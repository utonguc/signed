"""
Azure AD / Microsoft 365 integration endpoints.

GET  /v1/admin/tenants/{id}/integrations/azure        → get config (secret masked)
PUT  /v1/admin/tenants/{id}/integrations/azure        → save config
POST /v1/admin/tenants/{id}/integrations/azure/sync   → pull users from Graph API
POST /v1/admin/tenants/{id}/integrations/azure/test   → test connection only
"""
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.admin.deps import get_current_admin
from app.db.models import Tenant, User
from app.db.session import get_db
from app.core.subscription_service import check_seat_limit

router = APIRouter(tags=["azure"])

GRAPH_SCOPE = "https://graph.microsoft.com/.default"
GRAPH_USERS_URL = (
    "https://graph.microsoft.com/v1.0/users"
    "?$select=id,displayName,mail,userPrincipalName,jobTitle"
    ",mobilePhone,businessPhones,department,companyName,officeLocation"
    "&$top=999"
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class AzureConfigIn(BaseModel):
    azure_tenant_id:     str
    azure_client_id:     str
    azure_client_secret: Optional[str] = None   # None = keep existing
    azure_sync_enabled:  bool = True


class AzureConfigOut(BaseModel):
    azure_tenant_id:        Optional[str]
    azure_client_id:        Optional[str]
    azure_secret_set:       bool           # never expose the actual secret
    azure_sync_enabled:     bool
    azure_last_sync_at:     Optional[datetime]
    azure_last_sync_created: int
    azure_last_sync_updated: int


class SyncResult(BaseModel):
    created:   int
    updated:   int
    errors:    list[str]
    synced_at: datetime


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_tenant_or_404(db: Session, tenant_id: str) -> Tenant:
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


def _get_graph_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    """Obtain an OAuth2 client-credentials token from Microsoft."""
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "grant_type":    "client_credentials",
        "client_id":     client_id,
        "client_secret": client_secret,
        "scope":         GRAPH_SCOPE,
    }
    resp = httpx.post(url, data=data, timeout=15)
    if resp.status_code != 200:
        detail = resp.json().get("error_description", resp.text)
        raise HTTPException(status_code=400, detail=f"Azure auth failed: {detail}")
    return resp.json()["access_token"]


def _fetch_all_users(access_token: str) -> list[dict]:
    """Fetch all users from Microsoft Graph, handling pagination."""
    headers = {"Authorization": f"Bearer {access_token}"}
    users: list[dict] = []
    url = GRAPH_USERS_URL

    while url:
        resp = httpx.get(url, headers=headers, timeout=30)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Graph API error {resp.status_code}: {resp.text[:300]}"
            )
        body = resp.json()
        users.extend(body.get("value", []))
        url = body.get("@odata.nextLink")

    return users


def _upsert_users(db: Session, tenant_id: str, graph_users: list[dict]) -> SyncResult:
    """Upsert Graph API users into local DB. Returns sync counts."""
    created = updated = 0
    errors: list[str] = []

    for gu in graph_users:
        # Prefer mail over userPrincipalName; skip guest/service accounts with no mail
        email = (gu.get("mail") or gu.get("userPrincipalName") or "").strip().lower()
        if not email or "#ext#" in email:
            continue

        # Pick first business phone if mobilePhone is null
        mobile = gu.get("mobilePhone") or (
            gu["businessPhones"][0] if gu.get("businessPhones") else None
        )

        try:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                existing.display_name = gu.get("displayName") or existing.display_name
                existing.job_title    = gu.get("jobTitle")    or existing.job_title
                existing.mobile_phone = mobile               or existing.mobile_phone
                existing.department   = gu.get("department") or existing.department
                updated += 1
            else:
                ok, reason = check_seat_limit(db, tenant_id)
                if not ok:
                    errors.append(f"{email}: seat limit — {reason}")
                    continue
                db.add(User(
                    tenant_id=tenant_id,
                    email=email,
                    display_name=gu.get("displayName"),
                    job_title=gu.get("jobTitle"),
                    mobile_phone=mobile,
                    department=gu.get("department"),
                ))
                created += 1
        except Exception as exc:
            errors.append(f"{email}: {exc}")

    db.commit()
    return SyncResult(
        created=created,
        updated=updated,
        errors=errors,
        synced_at=datetime.utcnow(),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/tenants/{tenant_id}/integrations/azure", response_model=AzureConfigOut)
def get_azure_config(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    t = _get_tenant_or_404(db, tenant_id)
    return AzureConfigOut(
        azure_tenant_id=t.azure_tenant_id,
        azure_client_id=t.azure_client_id,
        azure_secret_set=bool(t.azure_client_secret),
        azure_sync_enabled=bool(t.azure_sync_enabled),
        azure_last_sync_at=t.azure_last_sync_at,
        azure_last_sync_created=t.azure_last_sync_created or 0,
        azure_last_sync_updated=t.azure_last_sync_updated or 0,
    )


@router.put("/tenants/{tenant_id}/integrations/azure", response_model=AzureConfigOut)
def save_azure_config(
    tenant_id: str,
    body: AzureConfigIn,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    t = _get_tenant_or_404(db, tenant_id)
    t.azure_tenant_id    = body.azure_tenant_id.strip()
    t.azure_client_id    = body.azure_client_id.strip()
    t.azure_sync_enabled = body.azure_sync_enabled
    if body.azure_client_secret:          # keep old secret if not provided
        t.azure_client_secret = body.azure_client_secret.strip()
    db.commit()
    db.refresh(t)
    return AzureConfigOut(
        azure_tenant_id=t.azure_tenant_id,
        azure_client_id=t.azure_client_id,
        azure_secret_set=bool(t.azure_client_secret),
        azure_sync_enabled=bool(t.azure_sync_enabled),
        azure_last_sync_at=t.azure_last_sync_at,
        azure_last_sync_created=t.azure_last_sync_created or 0,
        azure_last_sync_updated=t.azure_last_sync_updated or 0,
    )


@router.post("/tenants/{tenant_id}/integrations/azure/test")
def test_azure_connection(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Test credentials — returns user count without syncing."""
    t = _get_tenant_or_404(db, tenant_id)
    if not (t.azure_tenant_id and t.azure_client_id and t.azure_client_secret):
        raise HTTPException(status_code=400, detail="Azure credentials not configured")

    token = _get_graph_token(t.azure_tenant_id, t.azure_client_id, t.azure_client_secret)
    users = _fetch_all_users(token)
    valid = [u for u in users if (u.get("mail") or u.get("userPrincipalName", "")) and
             "#ext#" not in (u.get("mail") or u.get("userPrincipalName", ""))]
    return {"status": "ok", "user_count": len(valid)}


@router.post("/tenants/{tenant_id}/integrations/azure/sync", response_model=SyncResult)
def sync_azure_users(
    tenant_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    t = _get_tenant_or_404(db, tenant_id)
    if not (t.azure_tenant_id and t.azure_client_id and t.azure_client_secret):
        raise HTTPException(status_code=400, detail="Azure credentials not configured. Save configuration first.")

    access_token = _get_graph_token(t.azure_tenant_id, t.azure_client_id, t.azure_client_secret)
    graph_users  = _fetch_all_users(access_token)
    result       = _upsert_users(db, tenant_id, graph_users)

    # Persist last sync metadata
    t.azure_last_sync_at      = result.synced_at
    t.azure_last_sync_created = result.created
    t.azure_last_sync_updated = result.updated
    db.commit()

    return result
