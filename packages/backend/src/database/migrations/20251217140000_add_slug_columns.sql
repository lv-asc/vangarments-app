-- Add slug columns to tables
ALTER TABLE journalism ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique indexes (handling potential duplicates if any exists - though unique constraint might fail if duplicates exist. 
-- For now we just index it. We will enforce uniqueness in app logic or unique index if empty.)
-- Since tables might have data, adding UNIQUE constraint directly might fail if slug is null or duplicated.
-- But standard practice: ADD COLUMN ...; UPDATE ... SET slug = ...; ALTER COLUMN ... SET NOT NULL;
-- Here we just add the column and index. We'll rely on app to populate it.
-- Unique index allows multiple NULLs in Postgres, usually.

CREATE UNIQUE INDEX IF NOT EXISTS idx_journalism_slug ON journalism(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_slug ON social_posts(slug);
