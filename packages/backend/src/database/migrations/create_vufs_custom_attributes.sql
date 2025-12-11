-- Create VUFS Attribute Types table (The "Columns")
CREATE TABLE IF NOT EXISTS vufs_attribute_types (
    slug VARCHAR(50) PRIMARY KEY, -- e.g. 'season', 'occasion'
    name VARCHAR(255) NOT NULL,    -- Display name e.g. 'Season', 'Occasion'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create VUFS Attribute Values table (The "Items" in the columns)
CREATE TABLE IF NOT EXISTS vufs_attribute_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_slug VARCHAR(50) REFERENCES vufs_attribute_types(slug) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type_slug, name)
);
