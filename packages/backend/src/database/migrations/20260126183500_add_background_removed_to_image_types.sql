-- Migration to add 'background_removed' to the check constraint for image_type
-- Created at: 2026-01-26 18:35:00

-- Using a transaction to ensure atomicity
BEGIN;

-- Drop the old constraint
ALTER TABLE item_images DROP CONSTRAINT IF EXISTS item_images_image_type_check;

-- Add the new constraint with 'background_removed' included
ALTER TABLE item_images ADD CONSTRAINT item_images_image_type_check 
CHECK (image_type IN ('front', 'back', 'detail', 'styled', 'background_removed'));

COMMIT;
