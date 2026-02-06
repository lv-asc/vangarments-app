-- Migration to support SKUs in outfits
-- Remove foreign key constraint from item_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outfit_items_item_id_fkey') THEN
        ALTER TABLE outfit_items DROP CONSTRAINT outfit_items_item_id_fkey;
    END IF;
END $$;

-- Add item_type column to distinguish between 'vufs' (wardrobe items) and 'sku' (global catalog)
ALTER TABLE outfit_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) NOT NULL DEFAULT 'vufs';

-- Create index for item_id (since we lost the FK index usually created, though PG doesn't auto-index FKs, good to have)
CREATE INDEX IF NOT EXISTS idx_outfit_items_item_id ON outfit_items(item_id);
