-- Add unique constraint on SKU code for parent SKUs only (where parent_sku_id IS NULL)
-- This prevents duplicate parent SKU codes while still allowing variants to have the same base code
CREATE UNIQUE INDEX IF NOT EXISTS idx_sku_items_unique_parent_code 
ON sku_items(code) 
WHERE parent_sku_id IS NULL AND deleted_at IS NULL;
