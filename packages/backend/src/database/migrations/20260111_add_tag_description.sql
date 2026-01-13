-- Migration to add description field to media_tags table
-- Allows adding optional descriptions to tags (e.g., "Designer", "Model", etc.)

ALTER TABLE media_tags ADD COLUMN IF NOT EXISTS description TEXT;
