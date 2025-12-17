-- Add slug columns to entity tables for human-readable URLs
-- Slugs are unique per brand for lookbooks/collections/lines, globally unique for stores/suppliers

-- Brand Lookbooks
ALTER TABLE brand_lookbooks ADD COLUMN IF NOT EXISTS slug TEXT;

-- Brand Collections  
ALTER TABLE brand_collections ADD COLUMN IF NOT EXISTS slug TEXT;

-- Brand Lines
ALTER TABLE brand_lines ADD COLUMN IF NOT EXISTS slug TEXT;

-- Stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug TEXT;

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique indexes
-- Lookbook/Collection/Line slugs are unique within a brand (composite index with brand_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_lookbooks_brand_slug ON brand_lookbooks(brand_id, slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_collections_brand_slug ON brand_collections(brand_id, slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_lines_brand_slug ON brand_lines(brand_id, slug) WHERE slug IS NOT NULL;

-- Store/Supplier slugs are globally unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_slug ON suppliers(slug) WHERE slug IS NOT NULL;
