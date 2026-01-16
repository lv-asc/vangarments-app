-- Migration: Add official_item_link to sku_items
-- Created at: 2026-01-16

ALTER TABLE sku_items ADD COLUMN official_item_link TEXT;
