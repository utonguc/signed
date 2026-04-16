"""
Jinja2-based template rendering for email signatures.

Supported variables: {{ display_name }}, {{ job_title }}, {{ mobile_phone }},
                     {{ department }}, {{ email }}, plus any keys in extra_fields.
Conditionals:        {% if department %} ... {% endif %}
Missing variables render as empty string (SilentUndefined).
"""
from jinja2 import Environment, BaseLoader, Undefined


class _SilentUndefined(Undefined):
    """Missing template variables produce an empty string instead of an error."""
    def __str__(self):
        return ""

    def __iter__(self):
        return iter([])

    def __bool__(self):
        return False


_env = Environment(loader=BaseLoader(), undefined=_SilentUndefined)


def render_template(html_content: str, user_data: dict) -> str:
    template = _env.from_string(html_content)
    return template.render(**user_data)


def user_to_dict(user) -> dict:
    """Flatten a User ORM object into a dict for Jinja2 rendering."""
    extra = user.extra_fields or {}
    return {
        "display_name": user.display_name or "",
        "job_title":    user.job_title    or "",
        "mobile_phone": user.mobile_phone or "",
        "department":   user.department   or "",
        "email":        user.email        or "",
        "extra_fields": extra,
        **extra,   # allow {{ any_custom_key }} directly in templates
    }
