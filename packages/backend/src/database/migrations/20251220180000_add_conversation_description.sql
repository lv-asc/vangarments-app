-- Add description to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description TEXT;
