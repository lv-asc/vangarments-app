-- Add soft delete support to outfits table
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for efficient filtering of active vs deleted outfits
CREATE INDEX IF NOT EXISTS idx_outfits_deleted_at ON outfits(deleted_at);

-- Note: Existing outfits will have deleted_at = NULL, meaning they are active
