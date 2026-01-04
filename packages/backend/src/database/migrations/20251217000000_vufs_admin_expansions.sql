-- Color Groups
CREATE TABLE IF NOT EXISTS vufs_color_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Color Group Memberships (Many-to-Many)
CREATE TABLE IF NOT EXISTS vufs_color_group_memberships (
    color_id UUID REFERENCES vufs_colors(id) ON DELETE CASCADE,
    group_id UUID REFERENCES vufs_color_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (color_id, group_id)
);

-- Size Conversions
CREATE TABLE IF NOT EXISTS vufs_size_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    size_id UUID REFERENCES vufs_sizes(id) ON DELETE CASCADE,
    standard VARCHAR(50) NOT NULL, -- e.g., 'BR', 'US', 'EU', 'UK'
    value VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(size_id, standard)
);

-- Category valid sizes (Many-to-Many)
-- Defines which sizes are valid for a given category (e.g. T-Shirts can be S, M, L; Sunglasses cannot)
CREATE TABLE IF NOT EXISTS vufs_category_sizes (
    category_id INTEGER REFERENCES vufs_categories(id) ON DELETE CASCADE,
    size_id UUID REFERENCES vufs_sizes(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, size_id)
);
