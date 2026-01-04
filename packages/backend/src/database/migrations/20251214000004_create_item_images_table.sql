-- Create item_images table for storing wardrobe item images
CREATE TABLE IF NOT EXISTS item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES vufs_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('front', 'back', 'detail', 'styled')),
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_analysis JSONB,
    is_processed BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_primary ON item_images(item_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_item_images_type ON item_images(item_id, image_type);

-- Ensure only one primary image per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_images_unique_primary 
ON item_images(item_id) WHERE is_primary = TRUE;