"""
Public tracking endpoints — no auth required.

GET /v1/track/{tracking_id}/open.gif
    Returns a 1×1 transparent GIF and records the open event.

GET /v1/track/{tracking_id}/csat/{score}
    Records the CSAT score and redirects to a thank-you page.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.tracking_engine import TRANSPARENT_GIF, record_open, record_csat

router = APIRouter(prefix="/track", tags=["tracking"])

THANK_YOU_HTML = """
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Thank you!</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;}
.card{text-align:center;padding:40px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);}
h1{font-size:2rem;margin-bottom:8px;} p{color:#6b7280;}</style>
</head>
<body><div class="card">
<h1>&#127881; Thank you!</h1>
<p>Your feedback has been recorded.</p>
</div></body>
</html>
"""

ALREADY_RATED_HTML = """
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Already rated</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;}
.card{text-align:center;padding:40px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);}
h1{font-size:2rem;margin-bottom:8px;} p{color:#6b7280;}</style>
</head>
<body><div class="card">
<h1>&#128338; Already rated</h1>
<p>You have already submitted feedback for this email.</p>
</div></body>
</html>
"""


@router.get("/{tracking_id}/open.gif")
def track_open(
    tracking_id: str,
    db: Session = Depends(get_db),
):
    record_open(db, tracking_id)
    return Response(
        content=TRANSPARENT_GIF,
        media_type="image/gif",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )


@router.get("/{tracking_id}/csat/{score}")
def track_csat(
    tracking_id: str,
    score: int,
    db: Session = Depends(get_db),
):
    accepted = record_csat(db, tracking_id, score)
    html = THANK_YOU_HTML if accepted else ALREADY_RATED_HTML
    return Response(content=html, media_type="text/html")
