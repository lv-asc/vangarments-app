-- Add sku_ref column to entity tables

-- Brands
ALTER TABLE vufs_brands ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_brands_sku_ref ON vufs_brands(sku_ref) WHERE sku_ref IS NOT NULL;

-- Categories
ALTER TABLE vufs_categories ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_categories_sku_ref ON vufs_categories(sku_ref) WHERE sku_ref IS NOT NULL;

-- Sizes
ALTER TABLE vufs_sizes ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_sizes_sku_ref ON vufs_sizes(sku_ref) WHERE sku_ref IS NOT NULL;

-- Colors
ALTER TABLE vufs_colors ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_colors_sku_ref ON vufs_colors(sku_ref) WHERE sku_ref IS NOT NULL;

-- Materials
ALTER TABLE vufs_materials ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_materials_sku_ref ON vufs_materials(sku_ref) WHERE sku_ref IS NOT NULL;

-- Patterns
ALTER TABLE vufs_patterns ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_patterns_sku_ref ON vufs_patterns(sku_ref) WHERE sku_ref IS NOT NULL;

-- Fits
ALTER TABLE vufs_fits ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_fits_sku_ref ON vufs_fits(sku_ref) WHERE sku_ref IS NOT NULL;

-- Genders
ALTER TABLE vufs_genders ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_genders_sku_ref ON vufs_genders(sku_ref) WHERE sku_ref IS NOT NULL;

-- Conditions
ALTER TABLE wardrobe_conditions ADD COLUMN IF NOT EXISTS sku_ref VARCHAR(10);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wardrobe_conditions_sku_ref ON wardrobe_conditions(sku_ref) WHERE sku_ref IS NOT NULL;
