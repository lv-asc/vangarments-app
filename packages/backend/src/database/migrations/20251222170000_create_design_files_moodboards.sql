-- Phase 1: Creative & Design Database Migration
-- Creates tables for design file storage and moodboard system

-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Design Files Table
-- Stores metadata for CAD assets (vector sketches, 3D files)
-- =====================================================
CREATE TABLE IF NOT EXISTS design_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'vector', '3d_model', 'raster', 'sketch'
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    
    -- GCS storage paths
    gcs_path TEXT NOT NULL,
    thumbnail_path TEXT,
    
    -- Extended metadata
    metadata JSONB DEFAULT '{}', -- dimensions, layers, software version, etc.
    tags TEXT[] DEFAULT '{}',
    
    -- Visibility and status
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'team', 'public'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Moodboards Table
-- Creative boards for inspiration and concept development
-- =====================================================
CREATE TABLE IF NOT EXISTS moodboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    cover_image TEXT,
    
    -- Visibility settings
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'team', 'public'
    
    -- Canvas data (stores layout configuration)
    canvas_width INTEGER DEFAULT 1920,
    canvas_height INTEGER DEFAULT 1080,
    background_color VARCHAR(20) DEFAULT '#FFFFFF',
    grid_enabled BOOLEAN DEFAULT true,
    snap_to_grid BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique slug per owner
    UNIQUE(owner_id, slug)
);

-- =====================================================
-- Moodboard Elements Table
-- Individual elements within a moodboard (images, colors, text, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS moodboard_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
    
    -- Element type and content
    element_type VARCHAR(50) NOT NULL, -- 'image', 'color', 'text', 'fabric', 'link', 'design_file', 'shape'
    
    -- Position and size on canvas
    position_x DECIMAL(10,2) DEFAULT 0,
    position_y DECIMAL(10,2) DEFAULT 0,
    width DECIMAL(10,2) DEFAULT 100,
    height DECIMAL(10,2) DEFAULT 100,
    rotation DECIMAL(5,2) DEFAULT 0,
    z_index INTEGER DEFAULT 0,
    
    -- Content data (varies by element type)
    content JSONB NOT NULL DEFAULT '{}',
    -- For 'image': {url, gcsPath, caption}
    -- For 'color': {hex, name, pantone}
    -- For 'text': {text, fontFamily, fontSize, fontWeight, color}
    -- For 'fabric': {name, composition, swatch_url, supplier}
    -- For 'link': {url, title, thumbnail}
    -- For 'design_file': {designFileId, thumbnailUrl}
    -- For 'shape': {shapeType, fill, stroke, strokeWidth}
    
    -- Styling
    opacity DECIMAL(3,2) DEFAULT 1.00,
    border_radius INTEGER DEFAULT 0,
    shadow JSONB, -- {offsetX, offsetY, blur, color}
    
    -- Lock element from editing
    locked BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Design files indexes
CREATE INDEX IF NOT EXISTS idx_design_files_owner_id ON design_files(owner_id);
CREATE INDEX IF NOT EXISTS idx_design_files_brand_id ON design_files(brand_id);
CREATE INDEX IF NOT EXISTS idx_design_files_file_type ON design_files(file_type);
CREATE INDEX IF NOT EXISTS idx_design_files_deleted_at ON design_files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_design_files_tags ON design_files USING GIN(tags);

-- Moodboards indexes
CREATE INDEX IF NOT EXISTS idx_moodboards_owner_id ON moodboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_brand_id ON moodboards(brand_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_slug ON moodboards(slug);
CREATE INDEX IF NOT EXISTS idx_moodboards_deleted_at ON moodboards(deleted_at);

-- Moodboard elements indexes
CREATE INDEX IF NOT EXISTS idx_moodboard_elements_moodboard_id ON moodboard_elements(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_elements_type ON moodboard_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_moodboard_elements_z_index ON moodboard_elements(z_index);
