-- Migration: Add canvas_data column to moodboards table
-- This stores the serialized Fabric.js canvas JSON

ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '{}';

-- Add index for faster queries if needed
CREATE INDEX IF NOT EXISTS idx_moodboards_canvas_data ON moodboards USING gin(canvas_data);

COMMENT ON COLUMN moodboards.canvas_data IS 'Stores the serialized Fabric.js canvas state as JSON';
