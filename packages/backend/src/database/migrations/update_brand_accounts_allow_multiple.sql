-- Remove UNIQUE constraint on user_id in brand_accounts table
-- This allows users to own multiple brand accounts

ALTER TABLE brand_accounts DROP CONSTRAINT IF EXISTS brand_accounts_user_id_key;
