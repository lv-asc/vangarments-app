
-- Migration: Add support for complex colors (mixes/gradients)
ALTER TABLE vufs_colors
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS hex_secondary VARCHAR(7),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Validate type check (optional but good practice)
-- ALTER TABLE vufs_colors ADD CONSTRAINT chk_color_type CHECK (type IN ('solid', 'linear', 'radial', 'checkered'));
