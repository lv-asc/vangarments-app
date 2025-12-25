-- Migration: Add unique constraint to vufs_attribute_values to prevent duplicate items
-- This ensures no two items can have the same name within the same type_slug

-- First, check for and remove any existing duplicates before adding the constraint
-- This removes duplicates keeping the one with the lowest sort_order (or first created)
DELETE FROM vufs_attribute_values a
USING vufs_attribute_values b
WHERE a.id > b.id
  AND a.type_slug = b.type_slug
  AND LOWER(a.name) = LOWER(b.name);

-- Now add the unique constraint (case-insensitive via function index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vufs_attr_values_unique_name_per_type 
ON vufs_attribute_values (type_slug, LOWER(name));

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_vufs_attr_values_unique_name_per_type IS 
  'Prevents duplicate item names within the same type_slug (e.g., no two "Baby Tee" in apparel)';
