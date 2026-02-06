-- Add slug column to outfits table
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique index on owner_id + slug to prevent duplicate slugs per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_outfits_owner_slug ON outfits(owner_id, slug);

-- Create unique index on owner_id + name to prevent duplicate names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_outfits_owner_name ON outfits(owner_id, name);

-- Update existing outfits to generate slugs from names
UPDATE outfits 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug not null after population
ALTER TABLE outfits ALTER COLUMN slug SET NOT NULL;
