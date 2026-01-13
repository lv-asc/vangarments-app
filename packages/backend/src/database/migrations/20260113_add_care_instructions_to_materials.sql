-- Add care_instructions column to vufs_materials table
-- This stores default/custom care instructions for each fabric/material

ALTER TABLE vufs_materials 
ADD COLUMN IF NOT EXISTS care_instructions TEXT;

-- Add comment to document the column
COMMENT ON COLUMN vufs_materials.care_instructions IS 'Default or custom care instructions for washing, drying, and maintaining this material';
