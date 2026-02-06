-- Add audio_id column to content_posts table
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS audio_id VARCHAR(100);

-- Also ensure is_archived and other columns are present with correct defaults
ALTER TABLE content_posts ALTER COLUMN is_archived SET DEFAULT FALSE;
UPDATE content_posts SET is_archived = FALSE WHERE is_archived IS NULL;
