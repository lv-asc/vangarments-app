-- Add verification status to vufs_brands table
ALTER TABLE vufs_brands 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add verification status to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add verification status to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vufs_brands_verification_status ON vufs_brands(verification_status);
CREATE INDEX IF NOT EXISTS idx_stores_verification_status ON stores(verification_status);
CREATE INDEX IF NOT EXISTS idx_pages_verification_status ON pages(verification_status);

-- Update existing Vangarments and Vivid Asc. to verified
UPDATE vufs_brands 
SET verification_status = 'verified' 
WHERE brand_name IN ('Vangarments', 'Vivid Asc.');

UPDATE stores 
SET verification_status = 'verified' 
WHERE name IN ('Vangarments', 'Vivid Asc.');

UPDATE pages 
SET verification_status = 'verified' 
WHERE name IN ('Vangarments', 'Vivid Asc.');

COMMENT ON COLUMN vufs_brands.verification_status IS 'Verification status of the brand: unverified, pending, verified, or rejected';
COMMENT ON COLUMN stores.verification_status IS 'Verification status of the store: unverified, pending, verified, or rejected';
COMMENT ON COLUMN pages.verification_status IS 'Verification status of the page: unverified, pending, verified, or rejected';

