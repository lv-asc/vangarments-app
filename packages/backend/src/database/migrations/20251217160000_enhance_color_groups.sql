-- Add representative_color to vufs_color_groups
ALTER TABLE vufs_color_groups
ADD COLUMN IF NOT EXISTS representative_color VARCHAR(7);

-- Add sort_order to vufs_color_group_memberships
ALTER TABLE vufs_color_group_memberships
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

