
-- Drop existing constraints
ALTER TABLE entity_follows DROP CONSTRAINT IF EXISTS entity_follows_follower_id_fkey;
ALTER TABLE entity_follows DROP CONSTRAINT IF EXISTS entity_follows_follower_id_entity_type_entity_id_key;
ALTER TABLE entity_follows DROP CONSTRAINT IF EXISTS entity_follows_entity_type_check;

-- Add follower_type column
ALTER TABLE entity_follows ADD COLUMN IF NOT EXISTS follower_type VARCHAR(50) NOT NULL DEFAULT 'user';

-- Add new constraints
ALTER TABLE entity_follows ADD CONSTRAINT entity_follows_follower_unique UNIQUE (follower_id, follower_type, entity_id, entity_type);

-- Update entity_type check to include 'user' (soft check mostly, but good for data integrity if we want to enforce known types)
-- Note: We are allowing 'user' as a target entity type now.
ALTER TABLE entity_follows ADD CONSTRAINT entity_follows_entity_type_check 
    CHECK (entity_type::text = ANY (ARRAY['brand', 'store', 'supplier', 'non_profit', 'page', 'user']::text[]));

-- Add follower_type check
ALTER TABLE entity_follows ADD CONSTRAINT entity_follows_follower_type_check 
    CHECK (follower_type::text = ANY (ARRAY['user', 'brand', 'store', 'supplier', 'non_profit', 'page']::text[]));

-- Create index for the new follower_type
CREATE INDEX IF NOT EXISTS idx_entity_follows_follower_composite ON entity_follows (follower_id, follower_type);
