-- Migration: Add 'trashed' to users status constraint
-- This fixes user deletion not persisting

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add updated constraint with 'trashed' status
ALTER TABLE users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('active', 'banned', 'deactivated', 'trashed'));
