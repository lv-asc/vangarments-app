-- POM (Point of Measurement) System Migration
-- Creates tables for managing apparel measurements across the application

-- POM Categories (Tops, Bottoms, One-Pieces, Footwear, Accessories)
CREATE TABLE IF NOT EXISTS pom_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POM Definitions (industry-standard measurement points)
CREATE TABLE IF NOT EXISTS pom_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES pom_categories(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,           -- e.g., "HPS", "CB", "CH"
    name VARCHAR(100) NOT NULL,          -- e.g., "Body Length"
    description TEXT,                     -- Point of reference
    measurement_unit VARCHAR(10) DEFAULT 'cm',
    is_half_measurement BOOLEAN DEFAULT false,  -- If true, UI can double for circumference
    default_tolerance DECIMAL(5,2) DEFAULT 0.5, -- +/- tolerance in cm
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, code)
);

-- Link Apparels to POMs (which measurements apply to which apparel type)
-- apparel_id references vufs_attribute_values where type_slug = 'apparel'
CREATE TABLE IF NOT EXISTS apparel_pom_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apparel_id UUID REFERENCES vufs_attribute_values(id) ON DELETE CASCADE,
    pom_id UUID REFERENCES pom_definitions(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(apparel_id, pom_id)
);

-- SKU Size-Specific Measurements
CREATE TABLE IF NOT EXISTS sku_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID REFERENCES sku_items(id) ON DELETE CASCADE,
    pom_id UUID REFERENCES pom_definitions(id) ON DELETE CASCADE,
    size_id UUID REFERENCES vufs_sizes(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,         -- Flat measurement value
    tolerance DECIMAL(5,2),               -- Override tolerance if different
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sku_id, pom_id, size_id)
);

-- Package Measurements (for shipping)
CREATE TABLE IF NOT EXISTS package_measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(10) DEFAULT 'cm',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Body Measurement Types
CREATE TABLE IF NOT EXISTS user_measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,    -- e.g., "Chest", "Waist"
    description TEXT,
    unit VARCHAR(10) DEFAULT 'cm',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Body Measurements (actual values per user)
CREATE TABLE IF NOT EXISTS user_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES user_measurement_types(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, measurement_type_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pom_definitions_category ON pom_definitions(category_id);
CREATE INDEX IF NOT EXISTS idx_apparel_pom_mappings_apparel ON apparel_pom_mappings(apparel_id);
CREATE INDEX IF NOT EXISTS idx_apparel_pom_mappings_pom ON apparel_pom_mappings(pom_id);
CREATE INDEX IF NOT EXISTS idx_sku_measurements_sku ON sku_measurements(sku_id);
CREATE INDEX IF NOT EXISTS idx_sku_measurements_pom ON sku_measurements(pom_id);
CREATE INDEX IF NOT EXISTS idx_sku_measurements_size ON sku_measurements(size_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_user ON user_measurements(user_id);

-- ================================
-- SEED DATA: POM Categories
-- ================================

INSERT INTO pom_categories (name, description, sort_order) VALUES
    ('Tops', 'Measurements for shirts, t-shirts, jackets, coats, etc.', 1),
    ('Bottoms', 'Measurements for pants, shorts, skirts, etc.', 2),
    ('One-Pieces', 'Measurements for dresses, jumpsuits, overalls, etc.', 3),
    ('Footwear', 'Measurements for shoes, boots, sandals, etc.', 4),
    ('Accessories', 'Measurements for bags, hats, belts, etc.', 5)
ON CONFLICT (name) DO NOTHING;

-- ================================
-- SEED DATA: POM Definitions - Tops
-- ================================

INSERT INTO pom_definitions (category_id, code, name, description, is_half_measurement, sort_order)
SELECT c.id, v.code, v.name, v.description, v.is_half_measurement, v.sort_order
FROM pom_categories c,
(VALUES
    ('HPS', 'Body Length', 'From High Point Shoulder (where neck meets shoulder) to hem.', false, 1),
    ('CB', 'Center Back Length', 'From the back neck seam down to the bottom hem.', false, 2),
    ('CH', 'Across Chest', 'Measured 1" (2.5cm) below the armhole, edge to edge.', true, 3),
    ('WA', 'Waist Width', 'Measured at the narrowest part of the torso.', true, 4),
    ('SW', 'Sweep (Bottom)', 'The width of the garment at the very bottom edge.', true, 5),
    ('SH', 'Across Shoulders', 'From shoulder seam to shoulder seam.', false, 6),
    ('SL', 'Sleeve Length', 'From the shoulder seam to the bottom of the cuff.', false, 7),
    ('BC', 'Bicep', '1" below the armhole, perpendicular to the sleeve length.', true, 8),
    ('AH', 'Armhole (Curved)', 'Along the seam where the sleeve meets the body.', false, 9),
    ('NW', 'Neck Opening', 'From neck seam to neck seam at the HPS.', false, 10),
    ('FD', 'Front Neck Drop', 'Vertical distance from HPS to the front center neck.', false, 11),
    ('BD', 'Back Neck Drop', 'Vertical distance from HPS to the back center neck.', false, 12),
    ('CO', 'Cuff Opening', 'The width of the sleeve edge.', true, 13)
) AS v(code, name, description, is_half_measurement, sort_order)
WHERE c.name = 'Tops'
ON CONFLICT (category_id, code) DO NOTHING;

-- ================================
-- SEED DATA: POM Definitions - Bottoms
-- ================================

INSERT INTO pom_definitions (category_id, code, name, description, is_half_measurement, sort_order)
SELECT c.id, v.code, v.name, v.description, v.is_half_measurement, v.sort_order
FROM pom_categories c,
(VALUES
    ('WB', 'Waistband', 'Straight across the top edge of the waistband.', true, 1),
    ('HP', 'Hip', 'Typically measured 7" to 9" below the top of the waistband.', true, 2),
    ('FR', 'Front Rise', 'From the crotch seam up to the top of the front waistband.', false, 3),
    ('BR', 'Back Rise', 'From the crotch seam up to the top of the back waistband.', false, 4),
    ('IN', 'Inseam', 'From the crotch seam down the inner leg to the hem.', false, 5),
    ('OS', 'Outseam', 'From the top of the waistband down the side to the hem.', false, 6),
    ('TH', 'Thigh', '1" below the crotch seam, edge to edge.', true, 7),
    ('KN', 'Knee Opening', 'Measured 12" (standard) below the crotch seam.', true, 8),
    ('LO', 'Leg Opening', 'The width of the very bottom of the leg (the "Cuff").', true, 9)
) AS v(code, name, description, is_half_measurement, sort_order)
WHERE c.name = 'Bottoms'
ON CONFLICT (category_id, code) DO NOTHING;

-- ================================
-- SEED DATA: POM Definitions - One-Pieces
-- ================================

INSERT INTO pom_definitions (category_id, code, name, description, is_half_measurement, sort_order)
SELECT c.id, v.code, v.name, v.description, v.is_half_measurement, v.sort_order
FROM pom_categories c,
(VALUES
    ('TL', 'Total Length', 'HPS to the bottom leg/skirt hem.', false, 1),
    ('BH', 'Bib Height', '(For Overalls) From the top of the bib to the waist seam.', false, 2),
    ('BW', 'Bib Width', 'Across the top of the bib.', true, 3),
    ('TR', 'Total Rise', 'From front waistband, through crotch, to back waistband.', false, 4)
) AS v(code, name, description, is_half_measurement, sort_order)
WHERE c.name = 'One-Pieces'
ON CONFLICT (category_id, code) DO NOTHING;

-- ================================
-- SEED DATA: POM Definitions - Footwear
-- ================================

INSERT INTO pom_definitions (category_id, code, name, description, is_half_measurement, sort_order)
SELECT c.id, v.code, v.name, v.description, v.is_half_measurement, v.sort_order
FROM pom_categories c,
(VALUES
    ('FL', 'Footbed Length', 'Total interior length from heel to toe.', false, 1),
    ('FW', 'Ball Width', 'The widest part of the foot (under the toes).', false, 2),
    ('HL', 'Heel Height', 'From the ground to the point where the heel meets the upper.', false, 3),
    ('SHF', 'Shaft Height', '(For Boots) From the footbed up to the top of the boot.', false, 4),
    ('SC', 'Shaft Circumference', 'The measurement around the top opening of a boot.', false, 5)
) AS v(code, name, description, is_half_measurement, sort_order)
WHERE c.name = 'Footwear'
ON CONFLICT (category_id, code) DO NOTHING;

-- ================================
-- SEED DATA: POM Definitions - Accessories
-- ================================

INSERT INTO pom_definitions (category_id, code, name, description, is_half_measurement, sort_order)
SELECT c.id, v.code, v.name, v.description, v.is_half_measurement, v.sort_order
FROM pom_categories c,
(VALUES
    ('WI', 'Width', 'Across the widest part of the item.', false, 1),
    ('HT', 'Height', 'From bottom to top.', false, 2),
    ('DP', 'Depth', 'The thickness/gusset of a bag or wallet.', false, 3),
    ('SD', 'Strap Drop', 'Vertical distance from the top of the strap to the bag opening.', false, 4),
    ('BL', 'Belt Length', 'From the buckle pin to the middle (3rd) hole.', false, 5),
    ('HC', 'Head Circumference', 'For hats, measured around the interior sweatband.', false, 6)
) AS v(code, name, description, is_half_measurement, sort_order)
WHERE c.name = 'Accessories'
ON CONFLICT (category_id, code) DO NOTHING;

-- ================================
-- SEED DATA: Package Measurement Types
-- ================================

INSERT INTO package_measurement_types (name, description, unit, sort_order) VALUES
    ('Length', 'The longest side of the package', 'cm', 1),
    ('Width', 'The second longest side of the package', 'cm', 2),
    ('Height', 'The shortest side of the package', 'cm', 3),
    ('Weight', 'Total weight including packaging', 'kg', 4)
ON CONFLICT (name) DO NOTHING;

-- ================================
-- SEED DATA: User Measurement Types
-- ================================

INSERT INTO user_measurement_types (name, description, unit, sort_order) VALUES
    ('Height', 'Total body height', 'cm', 1),
    ('Weight', 'Body weight', 'kg', 2),
    ('Chest', 'Circumference at the fullest part of chest', 'cm', 3),
    ('Waist', 'Circumference at the natural waistline', 'cm', 4),
    ('Hips', 'Circumference at the widest part of hips', 'cm', 5),
    ('Inseam', 'From crotch to floor', 'cm', 6),
    ('Arm Length', 'From shoulder to wrist', 'cm', 7),
    ('Shoulder Width', 'From shoulder to shoulder', 'cm', 8),
    ('Neck', 'Circumference around the base of the neck', 'cm', 9),
    ('Foot Length', 'From heel to toe', 'cm', 10)
ON CONFLICT (name) DO NOTHING;
