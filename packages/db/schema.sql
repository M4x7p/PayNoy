-- ============================================================
-- PayNoy — Discord QR Payment Bot Platform
-- Full Database Schema (Supabase / PostgreSQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_id  VARCHAR(32) NOT NULL UNIQUE,
  email       VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Servers (Tenants) ──────────────────────────────────────

CREATE TABLE servers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_guild_id  VARCHAR(32) NOT NULL UNIQUE,
  owner_id          UUID NOT NULL REFERENCES users(id),
  plan              VARCHAR(20) NOT NULL DEFAULT 'free',
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  promptpay_name    VARCHAR(255),
  promptpay_account VARCHAR(32),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_servers_guild_id ON servers(discord_guild_id);

-- ── Subscriptions ──────────────────────────────────────────

CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id         UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  plan              VARCHAR(20) NOT NULL DEFAULT 'free',
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  next_billing_date TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_server ON subscriptions(server_id);

-- ── Products ───────────────────────────────────────────────

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id     UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  price         INTEGER NOT NULL CHECK (price > 0),  -- in satang (cents)
  role_id       VARCHAR(32) NOT NULL,
  embed_json    JSONB NOT NULL DEFAULT '{}',
  button_config JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_server ON products(server_id);

-- ── Orders ─────────────────────────────────────────────────

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id         UUID NOT NULL REFERENCES servers(id),
  product_id        UUID NOT NULL REFERENCES products(id),
  user_discord_id   VARCHAR(32) NOT NULL,
  amount            INTEGER NOT NULL CHECK (amount > 0),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  omise_source_id   VARCHAR(64),
  omise_charge_id   VARCHAR(64),
  idempotency_key   VARCHAR(128) UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  role_assigned_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user ON orders(user_discord_id);
CREATE INDEX idx_orders_pending_expiry ON orders(status, expires_at)
  WHERE status = 'pending';
CREATE INDEX idx_orders_charge ON orders(omise_charge_id)
  WHERE omise_charge_id IS NOT NULL;

-- ── Payments ───────────────────────────────────────────────

CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  event_type  VARCHAR(64) NOT NULL,
  raw_data    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);

-- ── Webhook Events (deduplication) ─────────────────────────

CREATE TABLE webhook_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     VARCHAR(128) NOT NULL UNIQUE,
  event_type   VARCHAR(64) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Revenue Tracking ───────────────────────────────────────

CREATE TABLE revenue_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  gross_amount INTEGER NOT NULL CHECK (gross_amount > 0),
  fee          INTEGER NOT NULL DEFAULT 0,
  net_amount   INTEGER NOT NULL CHECK (net_amount >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Logs ─────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id   UUID REFERENCES servers(id),
  event_type  VARCHAR(64) NOT NULL,
  actor_id    VARCHAR(64),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_server ON audit_logs(server_id);
CREATE INDEX idx_audit_type ON audit_logs(event_type);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ── Failed Jobs ────────────────────────────────────────────

CREATE TABLE failed_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type    VARCHAR(64) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  error       TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_failed_jobs_status ON failed_jobs(status);

-- ── Updated-at trigger ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_failed_jobs_updated
  BEFORE UPDATE ON failed_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
