-- Migration: Add official_item_link to sku_items
-- Created at: 2026-01-16

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sku_items' AND column_name = 'official_item_link') THEN
        ALTER TABLE sku_items ADD COLUMN official_item_link TEXT;
    END IF;
END $$;
