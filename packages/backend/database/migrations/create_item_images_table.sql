-- Create item_images table for storing wardrobe item images
-- This table stores image metadata and references to local storage

CREATE TABLE IF NOT EXISTS item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL, -- Local storage URL path
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('front', 'back', 'detail', 'styled')),
    processing_status VARCHAR(20) DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_analysis JSONB, -- AI analysis results
    is_processed BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER, -- File size in bytes
    mime_type VARCHAR(50), -- MIME type of the image
    width INTEGER, -- Image width in pixels
    height INTEGER, -- Image height in pixels
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_primary ON item_images(item_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_item_images_type ON item_images(image_type);
CREATE INDEX IF NOT EXISTS idx_item_images_status ON item_images(processing_status);
CREATE INDEX IF NOT EXISTS idx_item_images_created_at ON item_images(created_at DESC);

-- Ensure only one primary image per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_images_unique_primary 
ON item_images(item_id) WHERE is_primary = true;

-- Update trigger
CREATE TRIGGER update_item_images_updated_at BEFORE UPDATE ON item_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();