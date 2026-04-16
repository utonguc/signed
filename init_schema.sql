CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Core ──────────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE domains (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain      TEXT UNIQUE NOT NULL,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         TEXT UNIQUE NOT NULL,
    display_name  TEXT,
    job_title     TEXT,
    mobile_phone  TEXT,
    department    TEXT,
    extra_fields  JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    html_content  TEXT NOT NULL,
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority         INTEGER NOT NULL DEFAULT 100,
    condition_type   TEXT,
    condition_value  TEXT,
    template_id      UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE api_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,
    key_hash      TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ
);

CREATE TABLE admin_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'super_admin',
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── A: Disclaimers ────────────────────────────────────────────────────────────

CREATE TABLE disclaimers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    html_content  TEXT NOT NULL,
    applies_to    TEXT NOT NULL DEFAULT 'all',  -- all | external | internal
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── B: CSAT & Analytics ───────────────────────────────────────────────────────

CREATE TABLE email_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    sender_email        TEXT NOT NULL,
    tracking_id         TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at           TIMESTAMPTZ,
    open_count          INTEGER NOT NULL DEFAULT 0,
    csat_score          INTEGER,          -- 1..5
    csat_responded_at   TIMESTAMPTZ
);

-- ── D: Subscriptions (user-based licensing) ───────────────────────────────────

CREATE TABLE subscriptions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status         TEXT NOT NULL DEFAULT 'trial',  -- trial | active | suspended | cancelled
    seats          INTEGER NOT NULL DEFAULT 999,
    trial_ends_at  TIMESTAMPTZ,
    period_end     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── E: User self-service magic links ─────────────────────────────────────────

CREATE TABLE user_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_domains_domain          ON domains(domain);
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_rules_tenant_priority   ON rules(tenant_id, priority) WHERE enabled = TRUE;
CREATE INDEX idx_templates_tenant_def    ON templates(tenant_id) WHERE is_default = TRUE;
CREATE INDEX idx_disclaimers_tenant      ON disclaimers(tenant_id) WHERE enabled = TRUE;
CREATE INDEX idx_email_events_tracking   ON email_events(tracking_id);
CREATE INDEX idx_email_events_tenant     ON email_events(tenant_id, sent_at DESC);
CREATE INDEX idx_subscriptions_tenant    ON subscriptions(tenant_id);
CREATE INDEX idx_user_tokens_token       ON user_tokens(token);
