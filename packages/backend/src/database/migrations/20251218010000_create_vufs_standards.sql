CREATE TABLE IF NOT EXISTS vufs_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'BR', 'US'
    label VARCHAR(100), -- Display name e.g. 'Brazil', 'United States'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO vufs_standards (name, label, sort_order) VALUES 
('BR', 'Brazil', 10),
('US', 'United States', 20),
('UK', 'United Kingdom', 30),
('EU', 'Europe', 40)
ON CONFLICT (name) DO NOTHING;
