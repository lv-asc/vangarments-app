-- Create VUFS Items table
DROP TABLE IF EXISTS vufs_items CASCADE;
CREATE TABLE IF NOT EXISTS vufs_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vufs_code VARCHAR(50) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    category_hierarchy JSONB NOT NULL,
    brand_hierarchy JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    condition_info JSONB NOT NULL DEFAULT '{}',
    ownership_info JSONB NOT NULL DEFAULT '{}',
    search_keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vufs_items_owner ON vufs_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_vufs_items_vufs_code ON vufs_items(vufs_code);
CREATE INDEX IF NOT EXISTS idx_vufs_items_search ON vufs_items USING GIN (search_keywords);
CREATE INDEX IF NOT EXISTS idx_vufs_items_category ON vufs_items USING GIN (category_hierarchy);
CREATE INDEX IF NOT EXISTS idx_vufs_items_brand ON vufs_items USING GIN (brand_hierarchy);
