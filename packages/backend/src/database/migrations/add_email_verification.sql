-- Add email verification columns to users table

ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Set existing users to verified to avoid locking them out
UPDATE users SET email_verified = TRUE;
