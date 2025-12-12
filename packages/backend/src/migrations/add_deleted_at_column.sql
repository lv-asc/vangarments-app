-- Migration: Add deleted_at column for soft-delete functionality
-- Date: 2025-12-11

-- Add deleted_at column to vufs_items table
ALTER TABLE vufs_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Create index for efficient querying of non-deleted and deleted items
CREATE INDEX IF NOT EXISTS idx_vufs_items_deleted_at ON vufs_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_vufs_items_owner_deleted ON vufs_items(owner_id, deleted_at);

-- Comment explaining the column
COMMENT ON COLUMN vufs_items.deleted_at IS 'When set, indicates the item is soft-deleted and will be permanently deleted 14 days after this timestamp';
