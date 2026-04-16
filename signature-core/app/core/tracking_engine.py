"""
Tracking Engine

Creates email_event records and injects tracking pixels + CSAT widgets.
"""
import os
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import EmailEvent

log = logging.getLogger(__name__)

PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:5000").rstrip("/")

# Minimal 1×1 transparent GIF
TRANSPARENT_GIF = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
    b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00\x00"
    b"\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
)

STAR_SCORES = [
    (5, "⭐⭐⭐⭐⭐", "Excellent"),
    (4, "⭐⭐⭐⭐", "Good"),
    (3, "⭐⭐⭐", "Average"),
    (2, "⭐⭐", "Poor"),
    (1, "⭐", "Terrible"),
]


def create_event(db: Session, tenant_id, sender_email: str) -> str:
    """Create an EmailEvent record and return its tracking_id."""
    tracking_id = str(uuid.uuid4())
    event = EmailEvent(
        tenant_id=tenant_id,
        sender_email=sender_email,
        tracking_id=tracking_id,
        sent_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    return tracking_id


def inject_tracking(html: str, tracking_id: str) -> str:
    """
    Append a 1×1 tracking pixel and CSAT rating widget to the HTML.
    Must be called after signature and disclaimer injection.
    """
    pixel_url = f"{PUBLIC_URL}/v1/track/{tracking_id}/open.gif"

    # Build CSAT widget
    csat_links = " &nbsp; ".join(
        f'<a href="{PUBLIC_URL}/v1/track/{tracking_id}/csat/{score}" '
        f'style="text-decoration:none;color:inherit;" '
        f'title="{label}">{stars}</a>'
        for score, stars, label in STAR_SCORES
    )

    csat_widget = (
        f'<div style="margin-top:12px;font-size:12px;color:#9ca3af;text-align:center;">'
        f"How satisfied were you with this response? &nbsp; {csat_links}"
        f"</div>"
    )

    pixel = (
        f'<img src="{pixel_url}" width="1" height="1" '
        f'style="display:block;visibility:hidden;" alt="" />'
    )

    return html + csat_widget + pixel


def record_open(db: Session, tracking_id: str) -> None:
    event = db.query(EmailEvent).filter(EmailEvent.tracking_id == tracking_id).first()
    if not event:
        return
    if event.opened_at is None:
        event.opened_at = datetime.utcnow()
    event.open_count = (event.open_count or 0) + 1
    db.commit()


def record_csat(db: Session, tracking_id: str, score: int) -> bool:
    """Returns True if the score was accepted, False if already rated."""
    if score not in range(1, 6):
        return False
    event = db.query(EmailEvent).filter(EmailEvent.tracking_id == tracking_id).first()
    if not event or event.csat_score is not None:
        return False
    event.csat_score = score
    event.csat_responded_at = datetime.utcnow()
    db.commit()
    return True
