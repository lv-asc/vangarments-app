/*
  # Vangarments V3 - Initial Database Schema
  
  ## Core Tables Created
  
  1. **users** - User accounts with Brazilian CPF integration
     - id (uuid, primary key)
     - cpf (varchar, unique) - Brazilian personal ID
     - email (varchar, unique)
     - password_hash (varchar)
     - profile (jsonb) - Flexible profile data
     - measurements (jsonb) - Size information
     - preferences (jsonb) - User preferences
     - created_at, updated_at (timestamp)
  
  2. **user_roles** - Role-based access control
     - user_id (uuid, references users)
     - role (varchar) - consumer, influencer, brand_owner, etc.
     - granted_at (timestamp)
  
  3. **vufs_catalog** - VUFS fashion cataloging system
     - id (uuid, primary key)
     - vufs_code (varchar, unique) - Global SKU
     - domain (varchar) - APPAREL or FOOTWEAR
     - item_data (jsonb) - Complete item details
     - created_by, last_modified_by (uuid)
     - created_at, updated_at (timestamp)
  
  4. **vufs_items** - Individual wardrobe items (user-owned)
     - id (uuid, primary key)
     - owner_id (uuid, references users)
     - vufs_code (varchar)
     - item_data (jsonb)
     - visibility_settings (jsonb)
     - created_at, updated_at (timestamp)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Public visibility controlled through settings
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Brazilian market integration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}',
    measurements JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User roles and permissions
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

-- VUFS Catalog (global fashion items database)
CREATE TABLE IF NOT EXISTS vufs_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vufs_code VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(20) NOT NULL CHECK (domain IN ('APPAREL', 'FOOTWEAR')),
    item_data JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- VUFS Items (user wardrobe items)
CREATE TABLE IF NOT EXISTS vufs_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vufs_code VARCHAR(50),
    item_data JSONB NOT NULL DEFAULT '{}',
    visibility_settings JSONB DEFAULT '{"public": true}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Item images with processing status
CREATE TABLE IF NOT EXISTS item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'pending',
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anteroom for incomplete items (14-day completion period)
CREATE TABLE IF NOT EXISTS anteroom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_data JSONB NOT NULL DEFAULT '{}',
    completion_status JSONB NOT NULL DEFAULT '{}',
    reminders JSONB DEFAULT '{"lastSent": null, "count": 0}',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vufs_catalog_code ON vufs_catalog(vufs_code);
CREATE INDEX IF NOT EXISTS idx_vufs_catalog_domain ON vufs_catalog(domain);
CREATE INDEX IF NOT EXISTS idx_vufs_items_owner ON vufs_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_vufs_items_code ON vufs_items(vufs_code);
CREATE INDEX IF NOT EXISTS idx_item_images_item ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_anteroom_owner ON anteroom_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_anteroom_expires ON anteroom_items(expires_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vufs_catalog_updated_at BEFORE UPDATE ON vufs_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vufs_items_updated_at BEFORE UPDATE ON vufs_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anteroom_items_updated_at BEFORE UPDATE ON anteroom_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vufs_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE vufs_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE anteroom_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for vufs_items (wardrobe)
CREATE POLICY "Users can view own wardrobe items"
  ON vufs_items FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public wardrobe items"
  ON vufs_items FOR SELECT
  TO authenticated
  USING ((visibility_settings->>'public')::boolean = true);

CREATE POLICY "Users can insert own wardrobe items"
  ON vufs_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own wardrobe items"
  ON vufs_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own wardrobe items"
  ON vufs_items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for item_images
CREATE POLICY "Users can view images of their items"
  ON item_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vufs_items
      WHERE vufs_items.id = item_images.item_id
      AND vufs_items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for their items"
  ON item_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vufs_items
      WHERE vufs_items.id = item_images.item_id
      AND vufs_items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of their items"
  ON item_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vufs_items
      WHERE vufs_items.id = item_images.item_id
      AND vufs_items.owner_id = auth.uid()
    )
  );

-- RLS Policies for anteroom_items
CREATE POLICY "Users can view own anteroom items"
  ON anteroom_items FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own anteroom items"
  ON anteroom_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own anteroom items"
  ON anteroom_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own anteroom items"
  ON anteroom_items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for vufs_catalog (read-only for most users)
CREATE POLICY "Authenticated users can view catalog"
  ON vufs_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can insert catalog items"
  ON vufs_catalog FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their catalog items"
  ON vufs_catalog FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = last_modified_by)
  WITH CHECK (auth.uid() = last_modified_by);
