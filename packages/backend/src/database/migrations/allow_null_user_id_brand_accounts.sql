-- Allow NULL user_id in brand_accounts table
-- This enables unlinking brands from users via the admin panel

-- Drop the NOT NULL constraint on user_id
ALTER TABLE brand_accounts ALTER COLUMN user_id DROP NOT NULL;

-- Update foreign key to SET NULL on delete instead of CASCADE
-- First drop existing foreign key
ALTER TABLE brand_accounts DROP CONSTRAINT IF EXISTS brand_accounts_user_id_fkey;

-- Add new foreign key with SET NULL on delete
ALTER TABLE brand_accounts ADD CONSTRAINT brand_accounts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
