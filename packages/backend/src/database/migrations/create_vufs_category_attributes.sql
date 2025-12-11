-- Create VUFS Category Attributes Table (The "Cells" in the matrix)
CREATE TABLE IF NOT EXISTS vufs_category_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id INTEGER REFERENCES vufs_categories(id) ON DELETE CASCADE,
    attribute_slug VARCHAR(50) REFERENCES vufs_attribute_types(slug) ON DELETE CASCADE,
    value TEXT, -- The value entered in the cell
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, attribute_slug) -- One value per attribute per category
);
