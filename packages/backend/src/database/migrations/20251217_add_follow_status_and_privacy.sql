-- Migration: Add status to user_follows and is_private to users privacy settings
-- Created: 2025-12-17

-- Add status to user_follows
ALTER TABLE user_follows ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted';
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON user_follows(status);

-- Update existing follows to 'accepted'
UPDATE user_follows SET status = 'accepted' WHERE status IS NULL;

-- Note: isPrivate will be stored as part of the JSONB privacy_settings column in the users table.
-- We don't need a schema change for that, but we'll ensure the column exists (it should).
