-- Add missing columns to content_posts table
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- Update idx_content_posts_type_created to include archived filter
DROP INDEX IF EXISTS idx_content_posts_type_created;
CREATE INDEX IF NOT EXISTS idx_content_posts_type_created ON content_posts(content_type, created_at DESC) WHERE is_archived = FALSE;
