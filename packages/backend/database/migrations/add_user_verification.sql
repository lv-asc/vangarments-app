-- Migration: Add User Verification Support
-- Created: 2025-12-30
-- Description: Adds verification_status to users table and creates verification_requests table

-- Add verification_status to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' 
CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('user', 'entity')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    supporting_documents JSONB DEFAULT '[]',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK ((user_id IS NOT NULL AND entity_id IS NULL) OR (user_id IS NULL AND entity_id IS NOT NULL))
);

-- Create indexes for verification_requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_entity ON verification_requests(entity_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON verification_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created ON verification_requests(created_at DESC);

-- Add update trigger for verification_requests
CREATE TRIGGER IF NOT EXISTS update_verification_requests_updated_at 
BEFORE UPDATE ON verification_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE verification_requests IS 'Stores verification requests from users and entities';
COMMENT ON COLUMN users.verification_status IS 'User verification status: unverified, pending, verified, or rejected';
