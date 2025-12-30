-- Migration: Add soft-delete columns to entity tables
-- Run this migration to enable trash functionality across all admin pages

-- Patterns
ALTER TABLE vufs_patterns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_patterns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Materials
ALTER TABLE vufs_materials ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Fits
ALTER TABLE vufs_fits ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_fits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Sizes
ALTER TABLE vufs_sizes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_sizes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Genders
ALTER TABLE vufs_genders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_genders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Colors
ALTER TABLE vufs_colors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_colors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Brands
ALTER TABLE vufs_brands ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_brands ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Media Labels
ALTER TABLE media_labels ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE media_labels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Media Label Groups
ALTER TABLE media_label_groups ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE media_label_groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Occasions
ALTER TABLE vufs_occasions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_occasions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Seasons
ALTER TABLE vufs_seasons ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_seasons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Styles
ALTER TABLE vufs_styles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_styles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Conditions
ALTER TABLE wardrobe_conditions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE wardrobe_conditions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Standards
ALTER TABLE vufs_standards ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_standards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Measurements
ALTER TABLE vufs_measurements ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vufs_measurements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
