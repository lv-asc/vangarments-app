-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for efficient querying of unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add notification preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "showNotificationBadge": true,
    "showMessageBadge": true
}'::jsonb;

-- Update existing users to have default notification preferences
UPDATE users 
SET notification_preferences = '{
    "showNotificationBadge": true,
    "showMessageBadge": true
}'::jsonb
WHERE notification_preferences IS NULL;
