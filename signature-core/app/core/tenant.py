from app.db.repository import get_tenant_by_domain

def resolve_tenant(email: str):
    domain = email.split("@")[-1]
    return get_tenant_by_domain(domain)
