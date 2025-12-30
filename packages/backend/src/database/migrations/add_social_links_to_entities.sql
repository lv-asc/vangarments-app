-- Add social_links column to stores, suppliers, and pages tables
-- This enables social links functionality similar to users and brands

-- Add to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Add to suppliers table  
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Add to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Create indexes for better query performance on social_links
CREATE INDEX IF NOT EXISTS idx_stores_social_links ON stores USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_suppliers_social_links ON suppliers USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_pages_social_links ON pages USING GIN (social_links);
