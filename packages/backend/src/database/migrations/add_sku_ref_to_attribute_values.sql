
-- Add sku_ref to vufs_attribute_values
ALTER TABLE vufs_attribute_values ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_attribute_values_sku_ref ON vufs_attribute_values(sku_ref) WHERE sku_ref IS NOT NULL;
