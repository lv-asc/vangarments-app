-- Migration: Add parent_sku_id for variant grouping
-- This allows SKU variants (different sizes/colors) to be grouped under a main SKU

ALTER TABLE sku_items ADD COLUMN IF NOT EXISTS parent_sku_id UUID REFERENCES sku_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sku_items_parent_sku_id ON sku_items(parent_sku_id);
