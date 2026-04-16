#!/usr/bin/env python3
"""
Postfix content_filter processor.

stdin  → full RFC 2822 email (raw bytes)
argv   → sys.argv[1] = envelope sender
         sys.argv[2:] = envelope recipient(s)  (Postfix passes these via flags=Rq)

Flow:
  1. Parse MIME
  2. Extract From: header → tenant resolution in API
  3. Find HTML part
  4. POST html to signature-core API
  5. Replace HTML part payload with signed version
  6. Re-inject via `sendmail -G -i` (bypasses content filter, prevents loop)
"""

import sys
import email
import email.utils
import email.policy
import subprocess
import os
import logging

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [processor] %(levelname)s — %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("processor")

API_URL = os.getenv("SIGNATURE_API_URL", "http://api:5000/v1/render")
API_KEY = os.getenv("SIGNATURE_API_KEY", "")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_html_part(msg):
    """Return the first text/html MIME part, or None."""
    if msg.get_content_type() == "text/html":
        return msg
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                return part
    return None


def _call_api(from_email: str, html: str, to_emails: list) -> str:
    """
    POST to signature-core. Returns modified HTML.
    Falls back to the original on any error — mail must not be lost.
    """
    try:
        headers = {"X-API-Key": API_KEY} if API_KEY else {}
        resp = requests.post(
            API_URL,
            json={"from_email": from_email, "html": html, "to_emails": to_emails},
            headers=headers,
            timeout=5,
        )
        if resp.ok:
            return resp.json().get("html", html)
        log.warning("API %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        log.warning("API call failed: %s", exc)
    return html


def _reinject(message_bytes: bytes, sender: str, recipients: list):
    """Re-inject the (modified) message into Postfix, bypassing content filter."""
    cmd = ["sendmail", "-G", "-i", "-f", sender] + recipients
    result = subprocess.run(cmd, input=message_bytes, capture_output=True)
    if result.returncode != 0:
        log.error("sendmail rc=%d: %s", result.returncode, result.stderr.decode())
        sys.exit(result.returncode)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Postfix provides envelope data via argv when master.cf uses flags=Rq
    envelope_sender     = sys.argv[1] if len(sys.argv) > 1 else ""
    envelope_recipients = sys.argv[2:] if len(sys.argv) > 2 else []

    raw = sys.stdin.buffer.read()
    if not raw.strip():
        log.warning("Empty message — exiting cleanly")
        sys.exit(0)

    try:
        msg = email.message_from_bytes(raw, policy=email.policy.compat32)
    except Exception as exc:
        log.error("MIME parse failed: %s — passing through", exc)
        _reinject(raw, envelope_sender, envelope_recipients or ["postmaster"])
        sys.exit(0)

    # Determine from_email for tenant lookup
    from_header = msg.get("From", "")
    from_email  = email.utils.parseaddr(from_header)[1] or envelope_sender

    # Derive recipients from headers if Postfix didn't supply them
    if not envelope_recipients:
        envelope_recipients = [
            addr
            for _, addr in email.utils.getaddresses(
                msg.get_all("To", []) + msg.get_all("Cc", [])
            )
            if addr
        ]

    if not from_email or not envelope_recipients:
        log.warning("Cannot determine sender/recipients — passing through")
        _reinject(raw, envelope_sender or "postmaster", envelope_recipients or ["postmaster"])
        sys.exit(0)

    # Find HTML part
    html_part = _find_html_part(msg)
    if html_part is None:
        log.info("No HTML part from <%s> — passing through", from_email)
        _reinject(raw, envelope_sender or from_email, envelope_recipients)
        sys.exit(0)

    # Decode HTML payload
    payload = html_part.get_payload(decode=True)
    charset  = html_part.get_content_charset() or "utf-8"

    if payload is None:
        raw_payload = html_part.get_payload()
        if isinstance(raw_payload, str):
            payload = raw_payload.encode(charset)
        else:
            log.warning("Unreadable HTML payload — passing through")
            _reinject(raw, envelope_sender or from_email, envelope_recipients)
            sys.exit(0)

    html_str = payload.decode(charset, errors="replace")

    # Inject signature
    log.info("Calling signature API for <%s>", from_email)
    modified_html = _call_api(from_email, html_str, envelope_recipients)

    # Write modified payload back into the MIME structure
    html_part.set_payload(modified_html.encode(charset))
    html_part.set_charset(charset)

    _reinject(msg.as_bytes(), envelope_sender or from_email, envelope_recipients)
    log.info("Re-injected signed message for <%s>", from_email)
    sys.exit(0)


if __name__ == "__main__":
    main()
