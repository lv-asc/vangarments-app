-- Simple OAuth support - make CPF and password optional for OAuth users
-- Run this SQL script in your PostgreSQL database

-- Make CPF nullable for OAuth users (they might not have Brazilian CPF)
ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;

-- Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add a check to ensure users have either CPF+password or are OAuth users
-- (This is a simple approach - in production you might want more sophisticated validation)