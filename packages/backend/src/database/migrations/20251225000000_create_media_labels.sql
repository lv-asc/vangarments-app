-- Create Media Labels table
CREATE TABLE IF NOT EXISTS vufs_media_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Media Label Groups table
CREATE TABLE IF NOT EXISTS vufs_media_label_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    representative_color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Media Label Group Memberships (junction table)
CREATE TABLE IF NOT EXISTS vufs_media_label_group_memberships (
    group_id UUID REFERENCES vufs_media_label_groups(id) ON DELETE CASCADE,
    label_id UUID REFERENCES vufs_media_labels(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, label_id)
);

-- Seed predefined groups
INSERT INTO vufs_media_label_groups (name, representative_color) VALUES
('Mockup', '#8B5CF6'),
('Still', '#3B82F6'),
('Close-Up', '#10B981'),
('On-Body', '#F59E0B')
ON CONFLICT (name) DO NOTHING;
