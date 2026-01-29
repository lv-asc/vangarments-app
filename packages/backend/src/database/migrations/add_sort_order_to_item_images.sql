-- Add sort_order column to item_images for drag-and-drop reordering
ALTER TABLE item_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing images to have a sort order based on creation time
-- This sets primary images first, then orders by creation date
WITH ordered_images AS (
  SELECT id, 
         item_id,
         ROW_NUMBER() OVER (
           PARTITION BY item_id 
           ORDER BY is_primary DESC, created_at ASC
         ) * 10 as new_order
  FROM item_images
)
UPDATE item_images
SET sort_order = ordered_images.new_order
FROM ordered_images
WHERE item_images.id = ordered_images.id;
