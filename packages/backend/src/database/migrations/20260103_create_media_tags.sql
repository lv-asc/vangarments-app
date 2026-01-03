-- Migration to create media_tags table for tagging items, users, entities and locations on images
-- Used in Lookbook images, Social Posts, and Wardrobe Items

CREATE TABLE IF NOT EXISTS media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source context (which image is being tagged)
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('lookbook_image', 'post_image', 'wardrobe_image')),
  source_id UUID NOT NULL,  -- lookbook_id, post_id, or wardrobe_item_id
  image_url TEXT NOT NULL,  -- The specific image URL being tagged
  
  -- Tag positioning (percentage-based for responsiveness, 0-100)
  position_x DECIMAL(5,2) NOT NULL CHECK (position_x >= 0 AND position_x <= 100),
  position_y DECIMAL(5,2) NOT NULL CHECK (position_y >= 0 AND position_y <= 100),
  
  -- Tagged entity type (polymorphic reference)
  tag_type VARCHAR(50) NOT NULL CHECK (tag_type IN ('user', 'brand', 'store', 'page', 'supplier', 'item', 'location')),
  tagged_entity_id UUID,  -- References user, brand, store, page, or supplier depending on tag_type
  tagged_item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,  -- For 'item' tag_type
  
  -- Location data (for 'location' tag_type)
  location_name VARCHAR(255),
  location_address TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT true,  -- For future tag approval feature
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding all tags on a specific source (lookbook, post, etc.)
CREATE INDEX IF NOT EXISTS idx_media_tags_source ON media_tags(source_type, source_id);

-- Index for finding all content where an entity is tagged
CREATE INDEX IF NOT EXISTS idx_media_tags_tagged_entity ON media_tags(tag_type, tagged_entity_id) WHERE tagged_entity_id IS NOT NULL;

-- Index for finding all content where an item is tagged
CREATE INDEX IF NOT EXISTS idx_media_tags_tagged_item ON media_tags(tagged_item_id) WHERE tagged_item_id IS NOT NULL;

-- Index for finding tags created by a user
CREATE INDEX IF NOT EXISTS idx_media_tags_created_by ON media_tags(created_by);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_media_tags_location ON media_tags(tag_type) WHERE tag_type = 'location';

-- Composite index for efficient entity-type lookups
CREATE INDEX IF NOT EXISTS idx_media_tags_entity_lookup ON media_tags(tag_type, tagged_entity_id, created_at DESC);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_media_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_tags_updated_at ON media_tags;
CREATE TRIGGER trigger_media_tags_updated_at
  BEFORE UPDATE ON media_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_media_tags_updated_at();
