-- ============================================================
-- PayNoy — Migration 001: Production Upgrade
-- Adds: audit_logs, failed_jobs, webhook_events tables
-- Adds: idempotency_key column to orders
-- ============================================================

-- This migration is idempotent (IF NOT EXISTS / IF EXISTS checks)

-- ── Webhook Events table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     VARCHAR(128) NOT NULL UNIQUE,
  event_type   VARCHAR(64) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Logs table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id   UUID REFERENCES servers(id),
  event_type  VARCHAR(64) NOT NULL,
  actor_id    VARCHAR(64),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_server ON audit_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ── Failed Jobs table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS failed_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type    VARCHAR(64) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  error       TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_status ON failed_jobs(status);

-- ── Add idempotency_key to orders ──────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(128) UNIQUE;
  END IF;
END $$;

-- ── Partial index for pending orders expiry ────────────────

CREATE INDEX IF NOT EXISTS idx_orders_pending_expiry
  ON orders(status, expires_at) WHERE status = 'pending';

-- ── Index on omise_charge_id for reconciliation ────────────

CREATE INDEX IF NOT EXISTS idx_orders_charge
  ON orders(omise_charge_id) WHERE omise_charge_id IS NOT NULL;

-- ── Updated-at trigger for failed_jobs ─────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_failed_jobs_updated ON failed_jobs;
CREATE TRIGGER trg_failed_jobs_updated
  BEFORE UPDATE ON failed_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
