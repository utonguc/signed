"""
QR Code & vCard Engine

Generates vCard 3.0 strings and QR code PNGs (as bytes or base64 data URIs).
"""
import os
import io
import base64
import logging

log = logging.getLogger(__name__)

PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:5000").rstrip("/")


def build_vcard(user) -> str:
    """Build a vCard 3.0 string from a User ORM object."""
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"FN:{user.display_name or ''}",
        f"EMAIL:{user.email}",
    ]
    if user.job_title:
        lines.append(f"TITLE:{user.job_title}")
    if user.department:
        lines.append(f"ORG:{user.department}")
    if user.mobile_phone:
        lines.append(f"TEL;TYPE=CELL:{user.mobile_phone}")
    lines.append("END:VCARD")
    return "\r\n".join(lines)


def generate_qr_png(data: str) -> bytes:
    """Generate a QR code PNG and return raw bytes."""
    try:
        import qrcode
        from qrcode.image.pil import PilImage

        qr = qrcode.QRCode(
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(image_factory=PilImage)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except ImportError:
        log.error("qrcode/Pillow not installed — cannot generate QR code")
        return b""


def generate_qr_data_uri(data: str) -> str:
    """Generate a QR code PNG and return a base64 data URI (for email embedding)."""
    png = generate_qr_png(data)
    if not png:
        return ""
    b64 = base64.b64encode(png).decode()
    return f"data:image/png;base64,{b64}"


def user_vcard_url(user_id: str) -> str:
    return f"{PUBLIC_URL}/v1/users/{user_id}/vcard"


def user_qr_url(user_id: str) -> str:
    return f"{PUBLIC_URL}/v1/users/{user_id}/qr.png"
