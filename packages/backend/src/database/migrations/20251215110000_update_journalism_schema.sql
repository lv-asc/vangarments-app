-- Create pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Update journalism table
-- We drop old columns and add new ones. 
-- Note: 'author' data will be lost, but since it's a new feature and we want real user refs, that's acceptable (or empty).
-- 'image' data will be lost, but we're moving to 'images' array.
ALTER TABLE journalism
  DROP COLUMN author,
  DROP COLUMN image,
  ADD COLUMN author_ids UUID[],
  ADD COLUMN images JSONB DEFAULT '[]',
  ADD COLUMN videos JSONB DEFAULT '[]',
  ADD COLUMN attachments JSONB DEFAULT '[]',
  ADD COLUMN page_ids UUID[];

-- Add indexes for performance
CREATE INDEX idx_journalism_page_ids ON journalism USING GIN (page_ids);
CREATE INDEX idx_journalism_author_ids ON journalism USING GIN (author_ids);
