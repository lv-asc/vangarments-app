-- Migration: Add Pattern Groups and Subcategories
-- Date: 2026-01-02
-- Description: Adds hierarchical structure for organizing patterns into 5 industry-standard groups

-- ============================================
-- 1. Create Pattern Groups Table
-- ============================================
CREATE TABLE IF NOT EXISTS vufs_pattern_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  slug VARCHAR(50) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Create Pattern Subcategories Table
-- ============================================
CREATE TABLE IF NOT EXISTS vufs_pattern_subcategories (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES vufs_pattern_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Modify existing vufs_patterns table
-- ============================================
ALTER TABLE vufs_patterns 
  ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES vufs_pattern_groups(id),
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES vufs_pattern_subcategories(id),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_vufs_patterns_group_id ON vufs_patterns(group_id);
CREATE INDEX IF NOT EXISTS idx_vufs_patterns_subcategory_id ON vufs_patterns(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_vufs_pattern_subcategories_group_id ON vufs_pattern_subcategories(group_id);

-- ============================================
-- 4. Seed the 5 Pattern Groups
-- ============================================
INSERT INTO vufs_pattern_groups (name, description, emoji, slug, sort_order) VALUES
  ('Geometric & Structural', 'Patterns characterized by mathematical precision, featuring repeating shapes, lines, and angles. Foundation of formal menswear and professional attire.', '🏛️', 'geometric', 1),
  ('Organic & Nature-Inspired', 'Designs inspired by the natural world, featuring fluid lines and motifs found in flora and fauna. Often used to convey femininity, luxury, or connection to outdoors.', '🌿', 'organic', 2),
  ('Abstract & Artistic', 'Non-objective designs that do not represent recognizable forms. Often artistic and open to interpretation, ideal for bold statement pieces.', '🎨', 'abstract', 3),
  ('Technical & Process-Based', 'Patterns resulting from physical or chemical treatment of garment or fabric, adding depth and unique surface interest.', '⚙️', 'technical', 4),
  ('Novelty & Conversational', 'Features recognizable everyday objects or whimsical images often used out of context.', '🎭', 'novelty', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. Seed Subcategories for groups that have them
-- ============================================

-- Group 1: Geometric & Structural subcategories
INSERT INTO vufs_pattern_subcategories (group_id, name, sort_order)
SELECT g.id, subcat.name, subcat.sort_order
FROM vufs_pattern_groups g
CROSS JOIN (VALUES 
  ('Checks & Plaids', 1),
  ('Stripes', 2),
  ('Motifs', 3)
) AS subcat(name, sort_order)
WHERE g.slug = 'geometric'
ON CONFLICT DO NOTHING;

-- Group 4: Technical & Process-Based subcategories
INSERT INTO vufs_pattern_subcategories (group_id, name, sort_order)
SELECT g.id, subcat.name, subcat.sort_order
FROM vufs_pattern_groups g
CROSS JOIN (VALUES 
  ('Washes', 1),
  ('Construction Textures', 2)
) AS subcat(name, sort_order)
WHERE g.slug = 'technical'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE vufs_pattern_groups IS 'Groups for organizing apparel patterns according to industry taxonomy (5 main categories)';
COMMENT ON TABLE vufs_pattern_subcategories IS 'Optional subcategories within pattern groups for finer organization';
COMMENT ON COLUMN vufs_patterns.group_id IS 'Foreign key to the pattern group this pattern belongs to';
COMMENT ON COLUMN vufs_patterns.subcategory_id IS 'Optional foreign key to subcategory within the group';
COMMENT ON COLUMN vufs_patterns.description IS 'Definition/description of the pattern type';
