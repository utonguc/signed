"""
User Token Engine — magic links for the self-service portal.
"""
import os
import uuid
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import UserToken, User

log = logging.getLogger(__name__)

PUBLIC_URL  = os.getenv("PUBLIC_URL", "http://localhost:5000").rstrip("/")
TOKEN_HOURS = int(os.getenv("PORTAL_TOKEN_HOURS", "48"))


def generate_magic_link(db: Session, user_id) -> str:
    """
    Create a single-use token and return the full magic link URL.
    Any existing unused token for this user is invalidated first.
    """
    db.query(UserToken).filter(
        UserToken.user_id == user_id,
        UserToken.used_at == None,  # noqa: E711
    ).delete()

    token = str(uuid.uuid4())
    ut = UserToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=TOKEN_HOURS),
    )
    db.add(ut)
    db.commit()

    return f"{PUBLIC_URL}/portal?token={token}"


def validate_token(db: Session, token: str) -> User | None:
    """
    Validate a magic-link token. Returns the User if valid, else None.
    Does NOT consume the token — call consume_token separately.
    """
    ut = (
        db.query(UserToken)
        .filter(
            UserToken.token == token,
            UserToken.used_at == None,  # noqa: E711
            UserToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if ut is None:
        return None
    return db.query(User).filter(User.id == ut.user_id).first()


def consume_token(db: Session, token: str) -> None:
    """Mark a token as used."""
    ut = db.query(UserToken).filter(UserToken.token == token).first()
    if ut:
        ut.used_at = datetime.utcnow()
        db.commit()
