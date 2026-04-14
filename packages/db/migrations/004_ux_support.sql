-- ============================================================
-- PayNoy — Migration 004: UX Fallbacks & Support Systems
-- ============================================================

DO $$
BEGIN
  -- 1. Order Extensions: Add channel ID and interaction token
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discord_channel_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN discord_channel_id VARCHAR(32);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'interaction_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN interaction_token VARCHAR(255);
  END IF;

  -- 2. Server Extensions: Add support channel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'servers' AND column_name = 'support_channel_id'
  ) THEN
    ALTER TABLE servers ADD COLUMN support_channel_id VARCHAR(32);
  END IF;
END $$;
