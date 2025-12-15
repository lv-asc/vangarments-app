-- Add new columns to brand_lines table
ALTER TABLE brand_lines
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS collab_brand_id UUID REFERENCES vufs_brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS designer_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[];
