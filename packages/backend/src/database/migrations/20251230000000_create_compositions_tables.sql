-- Create Composition Categories table
CREATE TABLE IF NOT EXISTS vufs_composition_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Compositions table
CREATE TABLE IF NOT EXISTS vufs_compositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category_id UUID REFERENCES vufs_composition_categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Material Compositions link table (Material <-> Composition)
CREATE TABLE IF NOT EXISTS vufs_material_compositions (
    material_id UUID REFERENCES vufs_materials(id) ON DELETE CASCADE,
    composition_id UUID REFERENCES vufs_compositions(id) ON DELETE CASCADE,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    PRIMARY KEY (material_id, composition_id)
);
