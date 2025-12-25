-- Create Genders table
CREATE TABLE IF NOT EXISTS vufs_genders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vufs_genders_name ON vufs_genders(name);
CREATE INDEX idx_vufs_genders_active ON vufs_genders(is_active);
