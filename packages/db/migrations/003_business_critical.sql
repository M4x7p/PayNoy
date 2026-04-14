-- ============================================================
-- PayNoy — Migration 003: Business Critical Features & UX Trust
-- ============================================================

DO $$
BEGIN
  -- 1. Trust: Add PromptPay name/account fields to servers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'servers' AND column_name = 'promptpay_name'
  ) THEN
    ALTER TABLE servers ADD COLUMN promptpay_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'servers' AND column_name = 'promptpay_account'
  ) THEN
    ALTER TABLE servers ADD COLUMN promptpay_account VARCHAR(32);
  END IF;
END $$;

-- 2. Finance: Create revenue_logs table
CREATE TABLE IF NOT EXISTS revenue_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  gross_amount INTEGER NOT NULL CHECK (gross_amount > 0),
  fee          INTEGER NOT NULL DEFAULT 0,
  net_amount   INTEGER NOT NULL CHECK (net_amount >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
