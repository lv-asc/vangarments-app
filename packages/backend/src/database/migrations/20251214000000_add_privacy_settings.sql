-- Add privacy_settings column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"height": false, "weight": false, "birthDate": false}'::jsonb;

-- Update existing records to have default privacy settings if null
UPDATE users 
SET privacy_settings = '{"height": false, "weight": false, "birthDate": false}'::jsonb 
WHERE privacy_settings IS NULL;
