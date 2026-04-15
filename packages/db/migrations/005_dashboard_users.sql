-- Migration 005: Add profile columns to users and guilds_cache
-- We DO NOT store Discord access_token or refresh_token in the database.

-- Add profile details for the dashboard
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(128);

-- Add guilds_cache to speed up initial loads (stored as JSON array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS guilds_cache JSONB DEFAULT '[]';

-- Add timestamp for when the cache was last refreshed (to enforce 10-min TTL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS guilds_cache_updated_at TIMESTAMPTZ;

-- Add onboarded flag to enforce the setup flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- Add updated_at for general tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger function if it doesn't already exist to update updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_users_updated_at') THEN
    CREATE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Drop trigger if exists to recreate safely
DROP TRIGGER IF EXISTS trg_users_updated ON users;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();
