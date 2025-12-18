-- Enhance pages table with branding and social fields
ALTER TABLE pages
  ADD COLUMN logo_url TEXT,
  ADD COLUMN banner_url TEXT,
  ADD COLUMN website_url TEXT,
  ADD COLUMN instagram_url TEXT,
  ADD COLUMN twitter_url TEXT,
  ADD COLUMN facebook_url TEXT,
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
