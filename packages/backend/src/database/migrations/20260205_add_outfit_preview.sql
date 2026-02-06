-- Add preview_url column to outfits table
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS preview_url VARCHAR(500);
