from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.services.auth_service import decode_token

_bearer = HTTPBearer()


def get_current_admin(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    try:
        return decode_token(creds.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_super_admin(admin: dict = Depends(get_current_admin)) -> dict:
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin required")
    return admin
