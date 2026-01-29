-- Create content reports table for content moderation
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_content_id UUID NOT NULL,
    reported_content_type VARCHAR(20) NOT NULL CHECK (reported_content_type IN ('post', 'comment', 'user')),
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'inappropriate_content',
        'harassment',
        'spam',
        'fake_account',
        'copyright',
        'violence',
        'hate_speech',
        'nudity',
        'misinformation',
        'other'
    )),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    resolution VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_content ON content_reports(reported_content_id, reported_content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);

-- Create unique constraint to prevent duplicate reports from same user for same content
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_report 
ON content_reports(reported_by, reported_content_id, reported_content_type);

-- Create content flags table for automated flagging
CREATE TABLE IF NOT EXISTS content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
    flag_type VARCHAR(30) NOT NULL CHECK (flag_type IN ('ai_detected', 'user_reported', 'system_flagged')),
    flagged_by UUID REFERENCES users(id),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    details JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for content flags
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON content_flags(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_flag_type ON content_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_content_flags_confidence ON content_flags(confidence);

-- Create user feed preferences table
CREATE TABLE IF NOT EXISTS user_feed_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    show_following BOOLEAN DEFAULT true,
    show_recommended BOOLEAN DEFAULT true,
    show_trending BOOLEAN DEFAULT true,
    preferred_styles TEXT[] DEFAULT '{}',
    preferred_occasions TEXT[] DEFAULT '{}',
    content_types TEXT[] DEFAULT '{item,inspiration}',
    blocked_users UUID[] DEFAULT '{}',
    blocked_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_reports_updated_at 
    BEFORE UPDATE ON content_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_flags_updated_at 
    BEFORE UPDATE ON content_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feed_preferences_updated_at 
    BEFORE UPDATE ON user_feed_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();