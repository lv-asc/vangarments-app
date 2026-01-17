-- Create wardrobe_conditions table for rating wardrobe items
-- Ratings from 6/10 to 10/10, grouped as 'new' or 'used'

CREATE TABLE IF NOT EXISTS wardrobe_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 6.0 AND rating <= 10.0),
    "group" VARCHAR(10) NOT NULL CHECK ("group" IN ('new', 'used')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_conditions_active ON wardrobe_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_wardrobe_conditions_group ON wardrobe_conditions("group");
CREATE INDEX IF NOT EXISTS idx_wardrobe_conditions_rating ON wardrobe_conditions(rating DESC);

-- Insert default conditions as specified
INSERT INTO wardrobe_conditions (name, rating, "group") VALUES
    ('New w/ Tag (10/10)', 10.0, 'new'),
    ('New (10/10)', 10.0, 'new'),
    ('Used (9.5/10)', 9.5, 'used'),
    ('Used (9/10)', 9.0, 'used'),
    ('Used (8.5/10)', 8.5, 'used'),
    ('Used (8/10)', 8.0, 'used'),
    ('Used (7.5/10)', 7.5, 'used'),
    ('Used (7/10)', 7.0, 'used'),
    ('Used (6.5/10)', 6.5, 'used'),
    ('Used (6/10)', 6.0, 'used')
ON CONFLICT DO NOTHING;

-- Add condition_id to wardrobe_items table (if not exists)
DO $$
BEGIN
    -- Only try to alter wardrobe_items if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wardrobe_items') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wardrobe_items' AND column_name = 'condition_id'
        ) THEN
            ALTER TABLE wardrobe_items ADD COLUMN condition_id UUID REFERENCES wardrobe_conditions(id);
            CREATE INDEX IF NOT EXISTS idx_wardrobe_items_condition ON wardrobe_items(condition_id);
        END IF;
    END IF;
END $$;
