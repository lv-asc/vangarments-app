-- Add contact fields to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);

-- Add contact fields to suppliers table  
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);

-- Add email/phone to pages if not present
ALTER TABLE pages ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
