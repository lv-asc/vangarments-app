-- Create VUFS items table for social platform integration
-- This table is separate from vufs_catalog and represents user-owned wardrobe items

CREATE TABLE IF NOT EXISTS vufs_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vufs_code VARCHAR(50) UNIQUE NOT NULL, -- Global unique identifier
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_hierarchy JSONB NOT NULL, -- Page > Blue > White > Gray
    brand_hierarchy JSONB NOT NULL, -- Brand > Line > Collaboration
    metadata JSONB NOT NULL, -- Composition, colors, care, etc.
    condition_info JSONB NOT NULL,
    ownership_info JSONB DEFAULT '{"status": "owned", "visibility": "public"}',
    search_keywords TEXT[] DEFAULT '{}', -- For search optimization
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vufs_items_owner ON vufs_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_vufs_items_vufs_code ON vufs_items(vufs_code);
CREATE INDEX IF NOT EXISTS idx_vufs_items_category ON vufs_items USING GIN(category_hierarchy);
CREATE INDEX IF NOT EXISTS idx_vufs_items_brand ON vufs_items USING GIN(brand_hierarchy);
CREATE INDEX IF NOT EXISTS idx_vufs_items_search ON vufs_items USING GIN(search_keywords);
CREATE INDEX IF NOT EXISTS idx_vufs_items_visibility ON vufs_items USING GIN(ownership_info);
CREATE INDEX IF NOT EXISTS idx_vufs_items_created_at ON vufs_items(created_at DESC);

-- Update trigger
CREATE TRIGGER update_vufs_items_updated_at BEFORE UPDATE ON vufs_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();