-- Create brand_lines table
CREATE TABLE IF NOT EXISTS brand_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(1024), -- URL to line logo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add index on brand_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_lines_brand_id ON brand_lines(brand_id);

-- Alter sku_items table to link to brand_lines
ALTER TABLE sku_items 
ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES brand_lines(id) ON DELETE SET NULL;

-- Create index for line_id on sku_items
CREATE INDEX IF NOT EXISTS idx_sku_items_line_id ON sku_items(line_id);
