-- Migration: Add missing columns to sport_orgs table
-- Run this migration to enable saving all Sport ORG fields

ALTER TABLE sport_orgs 
ADD COLUMN IF NOT EXISTS logo_metadata JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner VARCHAR(500),
ADD COLUMN IF NOT EXISTS banners JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS founded_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN sport_orgs.logo_metadata IS 'Array of {url, name} objects for logo metadata';
COMMENT ON COLUMN sport_orgs.banner IS 'Primary banner image URL';
COMMENT ON COLUMN sport_orgs.banners IS 'Array of {url, positionY} objects for multiple banners';
COMMENT ON COLUMN sport_orgs.founded_by IS 'Names of founders';
COMMENT ON COLUMN sport_orgs.contact_info IS 'JSON object with email, phone, address';
