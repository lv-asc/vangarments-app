-- Migration: Create anteroom_items table
-- Description: Staging area for wardrobe items pending quality completion
-- Author: Antigravity
-- Date: 2026-01-16

-- Create anteroom_items table
DROP TABLE IF EXISTS anteroom_items;
CREATE TABLE IF NOT EXISTS anteroom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Partial VUFS item data stored as JSONB
    item_data JSONB NOT NULL DEFAULT '{}',
    
    -- Completion tracking
    completion_status JSONB NOT NULL DEFAULT '{
        "hasRequiredPhotos": false,
        "hasCategory": false,
        "hasBrand": false,
        "hasCondition": false,
        "hasColor": false,
        "hasMaterial": false,
        "completionPercentage": 0
    }',
    
    -- Reminder system for incomplete items
    reminders JSONB NOT NULL DEFAULT '{
        "lastSent": null,
        "count": 0
    }',
    
    -- Item images stored separately for efficient querying
    images JSONB NOT NULL DEFAULT '[]',
    
    -- 14-day expiry from creation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_anteroom_items_owner_id ON anteroom_items(owner_id);

-- Index for expiry cleanup jobs
CREATE INDEX IF NOT EXISTS idx_anteroom_items_expires_at ON anteroom_items(expires_at);

-- Index for finding items needing reminders
CREATE INDEX IF NOT EXISTS idx_anteroom_items_reminders ON anteroom_items USING GIN (reminders);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_anteroom_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_anteroom_items_updated_at ON anteroom_items;
CREATE TRIGGER trigger_anteroom_items_updated_at
    BEFORE UPDATE ON anteroom_items
    FOR EACH ROW
    EXECUTE FUNCTION update_anteroom_items_updated_at();

-- Comment on table
COMMENT ON TABLE anteroom_items IS 'Staging area for wardrobe items pending quality completion. Items expire after 14 days of inactivity.';
COMMENT ON COLUMN anteroom_items.item_data IS 'Partial VUFS item data (category, brand, metadata, condition, ownership)';
COMMENT ON COLUMN anteroom_items.completion_status IS 'Tracks which required fields have been filled';
COMMENT ON COLUMN anteroom_items.reminders IS 'Tracks reminder notifications sent to user';
COMMENT ON COLUMN anteroom_items.images IS 'Array of image objects with url, type, and metadata';
COMMENT ON COLUMN anteroom_items.expires_at IS 'Items are deleted after this timestamp (14 days from creation by default)';
