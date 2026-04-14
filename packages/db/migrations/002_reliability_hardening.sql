-- ============================================================
-- PayNoy — Migration 002: Reliability Hardening
-- Adds: role_assigned_at, omise_source_id to orders
-- ============================================================

-- ── Add columns to orders ──────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'omise_source_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN omise_source_id VARCHAR(64);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'role_assigned_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN role_assigned_at TIMESTAMPTZ;
  END IF;
END $$;
