-- Add logo_metadata and banner_metadata columns to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS logo_metadata JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner_metadata JSONB DEFAULT '[]'::jsonb;

-- Backfill logo_metadata from logo_url if logo_metadata is empty
UPDATE pages 
SET logo_metadata = jsonb_build_array(jsonb_build_object('url', logo_url, 'name', ''))
WHERE logo_url IS NOT NULL AND (logo_metadata IS NULL OR jsonb_array_length(logo_metadata) = 0);

-- Backfill banner_metadata from banner_url if banner_metadata is empty
UPDATE pages 
SET banner_metadata = jsonb_build_array(jsonb_build_object('url', banner_url))
WHERE banner_url IS NOT NULL AND (banner_metadata IS NULL OR jsonb_array_length(banner_metadata) = 0);
