-- Add Apple OAuth columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_signin_enabled BOOLEAN DEFAULT TRUE;

-- Add index for apple_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;
