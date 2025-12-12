-- Brand Profiles Migration
-- Extends brand_accounts and creates supporting tables for team, lookbooks, and collections

-- 1. Add profile_data JSONB column to brand_accounts
-- Contains: bio, founded_date, instagram, tiktok, youtube, additional_logos[]
ALTER TABLE brand_accounts ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';

-- 2. Brand Team Members - linking users to brands with roles
CREATE TABLE IF NOT EXISTS brand_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('CEO', 'CFO', 'Founder', 'CD', 'Marketing', 'Seller', 'Designer', 'Model', 'Ambassador', 'Other')),
  title VARCHAR(100), -- Custom title override
  is_public BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_team_brand ON brand_team_members(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_team_user ON brand_team_members(user_id);

-- 3. Brand Lookbooks
CREATE TABLE IF NOT EXISTS brand_lookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  season VARCHAR(50), -- e.g., "Spring/Summer 2024"
  year INTEGER,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_lookbooks_brand ON brand_lookbooks(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_lookbooks_published ON brand_lookbooks(is_published) WHERE is_published = true;

-- Lookbook Items Junction Table
CREATE TABLE IF NOT EXISTS brand_lookbook_items (
  lookbook_id UUID NOT NULL REFERENCES brand_lookbooks(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES vufs_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (lookbook_id, item_id)
);

-- 4. Brand Collections
CREATE TABLE IF NOT EXISTS brand_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  collection_type VARCHAR(50) CHECK (collection_type IN ('Seasonal', 'Capsule', 'Collaboration', 'Limited', 'Core', 'Other')),
  season VARCHAR(50),
  year INTEGER,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_collections_brand ON brand_collections(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_collections_published ON brand_collections(is_published) WHERE is_published = true;

-- Collection Items Junction Table
CREATE TABLE IF NOT EXISTS brand_collection_items (
  collection_id UUID NOT NULL REFERENCES brand_collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES vufs_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (collection_id, item_id)
);
