import re

def sanitize_html(html: str):
    return re.sub(r"<script.*?>.*?</script>", "", html, flags=re.S)
