-- Add care_instructions column to sku_items table
-- This stores care instructions for each SKU, with option to inherit from material

ALTER TABLE sku_items 
ADD COLUMN IF NOT EXISTS care_instructions TEXT;

COMMENT ON COLUMN sku_items.care_instructions IS 'Care instructions for washing, drying, and maintaining this item';
