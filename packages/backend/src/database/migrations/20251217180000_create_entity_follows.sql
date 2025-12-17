-- Create entity_follows table for following brands, stores, suppliers, pages
CREATE TABLE IF NOT EXISTS entity_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('brand', 'store', 'supplier', 'page')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, entity_type, entity_id)
);

-- Index for finding all entities a user follows
CREATE INDEX IF NOT EXISTS idx_entity_follows_follower ON entity_follows(follower_id);

-- Index for finding all followers of an entity
CREATE INDEX IF NOT EXISTS idx_entity_follows_entity ON entity_follows(entity_type, entity_id);

-- Index for counting followers by entity
CREATE INDEX IF NOT EXISTS idx_entity_follows_entity_id ON entity_follows(entity_id);
