-- Create VUFS Brand Attributes Table
CREATE TABLE IF NOT EXISTS vufs_brand_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES vufs_brands(id) ON DELETE CASCADE,
    attribute_slug VARCHAR(50) REFERENCES vufs_attribute_types(slug) ON DELETE CASCADE,
    value TEXT, -- The value entered in the cell
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, attribute_slug) -- One value per attribute per brand
);
