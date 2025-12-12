-- Add status column with check constraint
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deactivated'));

-- Add ban expiration and reason columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Index for status for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
