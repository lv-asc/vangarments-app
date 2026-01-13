-- Migration to add sku_image to media_tags source_type constraint
-- Run this after the initial media_tags table creation

-- Drop the old constraint and add new one with sku_image
ALTER TABLE media_tags DROP CONSTRAINT IF EXISTS media_tags_source_type_check;
ALTER TABLE media_tags ADD CONSTRAINT media_tags_source_type_check 
  CHECK (source_type IN ('lookbook_image', 'post_image', 'wardrobe_image', 'sku_image'));
