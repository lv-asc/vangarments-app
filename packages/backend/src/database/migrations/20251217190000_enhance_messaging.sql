-- Enhanced DM System: Reactions, Status, Groups

-- Add edited_at column for message editing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add group fields to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add admin role to conversation participants
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member'));

-- Add last_seen_at to users for online status
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Index for fetching reactions by message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- Create message attachments table for media
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    attachment_type VARCHAR(50) NOT NULL CHECK (attachment_type IN ('image', 'video', 'audio', 'file')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    duration INTEGER, -- for audio/video in seconds
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for attachments by message
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Create message mentions/tags table
CREATE TABLE IF NOT EXISTS message_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    mention_type VARCHAR(50) NOT NULL CHECK (mention_type IN ('user', 'item', 'brand', 'store', 'supplier', 'page', 'article')),
    mention_id UUID NOT NULL,
    mention_text VARCHAR(255), -- The text that was used for the mention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for mentions by message
CREATE INDEX IF NOT EXISTS idx_message_mentions_message ON message_mentions(message_id);
