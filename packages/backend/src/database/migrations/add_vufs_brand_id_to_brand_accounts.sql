-- Add vufs_brand_id column to brand_accounts to link with VUFS brand registry
ALTER TABLE brand_accounts 
ADD COLUMN IF NOT EXISTS vufs_brand_id UUID REFERENCES vufs_brands(id) ON DELETE SET NULL;

-- Index for faster lookups by VUFS brand ID
CREATE INDEX IF NOT EXISTS idx_brand_accounts_vufs_brand_id ON brand_accounts(vufs_brand_id);

-- Auto-populate vufs_brand_id for existing records by matching brand names
UPDATE brand_accounts ba
SET vufs_brand_id = vb.id
FROM vufs_brands vb
WHERE ba.brand_info->>'name' ILIKE vb.name
  AND ba.vufs_brand_id IS NULL
  AND vb.is_active = true;
