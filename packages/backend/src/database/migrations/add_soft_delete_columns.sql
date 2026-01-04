-- Migration: Add soft-delete columns to entity tables
-- Run this migration to enable trash functionality across all admin pages

DO $$
BEGIN
    -- Patterns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_patterns') THEN
        ALTER TABLE vufs_patterns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_patterns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Materials
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_materials') THEN
        ALTER TABLE vufs_materials ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Fits
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_fits') THEN
        ALTER TABLE vufs_fits ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_fits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Sizes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_sizes') THEN
        ALTER TABLE vufs_sizes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_sizes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Genders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_genders') THEN
        ALTER TABLE vufs_genders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_genders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Colors
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_colors') THEN
        ALTER TABLE vufs_colors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_colors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Brands
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_brands') THEN
        ALTER TABLE vufs_brands ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_brands ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Media Labels
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_media_labels') THEN
        ALTER TABLE vufs_media_labels ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_media_labels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Media Label Groups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_media_label_groups') THEN
        ALTER TABLE vufs_media_label_groups ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_media_label_groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Occasions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_occasions') THEN
        ALTER TABLE vufs_occasions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_occasions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Seasons
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_seasons') THEN
        ALTER TABLE vufs_seasons ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_seasons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Styles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_styles') THEN
        ALTER TABLE vufs_styles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_styles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Conditions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wardrobe_conditions') THEN
        ALTER TABLE wardrobe_conditions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE wardrobe_conditions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Standards
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_standards') THEN
        ALTER TABLE vufs_standards ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_standards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;

    -- Measurements
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vufs_measurements') THEN
        ALTER TABLE vufs_measurements ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        ALTER TABLE vufs_measurements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    END IF;
END $$;

