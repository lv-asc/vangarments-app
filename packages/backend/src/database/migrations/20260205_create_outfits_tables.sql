-- Drop existing tables if they exist (to clean up legacy schema)
DROP TABLE IF EXISTS outfit_items CASCADE;
DROP TABLE IF EXISTS outfits CASCADE;

-- Create outfits table
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outfit_items table
CREATE TABLE outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES vufs_items(id) ON DELETE CASCADE,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  rotation FLOAT NOT NULL DEFAULT 0,
  scale FLOAT NOT NULL DEFAULT 1,
  z_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_outfits_owner_id ON outfits(owner_id);
CREATE INDEX idx_outfit_items_outfit_id ON outfit_items(outfit_id);
