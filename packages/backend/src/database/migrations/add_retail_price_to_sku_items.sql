-- Migration to add retail price columns to sku_items
ALTER TABLE sku_items 
ADD COLUMN IF NOT EXISTS retail_price_brl NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS retail_price_usd NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS retail_price_eur NUMERIC(10, 2);
