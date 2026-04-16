"""
HTML parsing utilities for email body manipulation.

Detects reply/forward quote blocks so the signature can be injected
between the composed body and the quoted thread.
"""
import re
from bs4 import BeautifulSoup

SIGNATURE_MARKER = "<!-- SIGNATURE-ID -->"

# Each finder takes a BeautifulSoup object and returns the first quote element or None.
_QUOTE_FINDERS = [
    lambda s: s.find("blockquote"),
    lambda s: s.find(id="divRplyFwdMsg"),                           # Outlook reply/forward
    lambda s: s.find(attrs={"class": "gmail_quote"}),              # Gmail
    lambda s: s.find(attrs={"class": "yahoo_quoted"}),             # Yahoo Mail
    lambda s: s.find(attrs={"class": "protonmail_quote"}),         # ProtonMail
    lambda s: s.find(attrs={"data-marker": "__QUOTED_TEXT__"}),    # Spark
]


def has_signature(html: str) -> bool:
    return SIGNATURE_MARKER in html


def split_quote_block(html: str) -> dict:
    """
    Split email HTML into {"body": ..., "quote": ...}.
    The signature is injected between body and quote.
    Falls back to {"body": html, "quote": ""} when no quote is found.
    """
    soup = BeautifulSoup(html, "html.parser")

    for finder in _QUOTE_FINDERS:
        el = finder(soup)
        if el is None:
            continue
        quote_str = str(el)
        idx = html.find(quote_str)
        if idx != -1:
            return {
                "body": html[:idx].rstrip(),
                "quote": html[idx:],
            }

    return {"body": html, "quote": ""}


def sanitize_html(html: str) -> str:
    """Strip script tags and inline event handlers."""
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'\s+on\w+="[^"]*"', "", html)
    html = re.sub(r"\s+on\w+='[^']*'", "", html)
    return html
