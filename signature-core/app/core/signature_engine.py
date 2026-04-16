from app.core.tenant_resolver import resolve_tenant
from app.services.user_resolver import resolve_user
from app.core.template_engine import render_template
from app.core.html_sanitizer import sanitize_html

def has_signature(html: str):
    return "<!-- SIGNATURE-ID:" in html


def render_signature(req):
    tenant = resolve_tenant(req.from_email)
    user = resolve_user(req.from_email)

    html = sanitize_html(req.html)

    if has_signature(html):
        return {
            "tenant": tenant["tenant"],
            "signature_applied": False,
            "html": html
        }

    template = """
<br/>
<div>
{{name}}<br/>
{{title}}<br/>
{{phone}}
</div>
<!-- SIGNATURE-ID -->
"""

    signature = render_template(user, template)

    return {
        "tenant": tenant["tenant"],
        "signature_applied": True,
        "html": html + signature
    }
