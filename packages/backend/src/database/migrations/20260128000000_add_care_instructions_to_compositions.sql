-- Add care_instructions to vufs_compositions
ALTER TABLE vufs_compositions ADD COLUMN IF NOT EXISTS care_instructions TEXT;
