DROP INDEX IF EXISTS idx_conversations_slug;
ALTER TABLE conversations DROP COLUMN IF EXISTS slug;
