-- Beta Program Tables Migration
-- This migration creates tables for the beta program functionality

-- Beta participants table
CREATE TABLE IF NOT EXISTS beta_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN ('brand', 'influencer', 'stylist', 'model', 'designer', 'industry_leader')),
    joined_at TIMESTAMP DEFAULT NOW(),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'inactive')),
    privileges JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    graduation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Beta feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES beta_participants(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'improvement', 'general')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'in_progress', 'completed', 'rejected')),
    attachments JSONB,
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand badges table (if not exists)
CREATE TABLE IF NOT EXISTS brand_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('beta_pioneer', 'verified_brand', 'premium_partner', 'custom')),
    icon_url VARCHAR(500),
    color VARCHAR(7), -- Hex color code
    criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User badges table (if not exists)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES brand_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    
    UNIQUE(user_id, badge_id)
);

-- Referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('badge', 'feature_access', 'analytics_boost', 'priority_support')),
    reward_value VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awarded', 'expired')),
    created_at TIMESTAMP DEFAULT NOW(),
    awarded_at TIMESTAMP,
    
    UNIQUE(referrer_id, referee_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beta_participants_user_id ON beta_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_participants_referral_code ON beta_participants(referral_code);
CREATE INDEX IF NOT EXISTS idx_beta_participants_type ON beta_participants(participant_type);
CREATE INDEX IF NOT EXISTS idx_beta_participants_status ON beta_participants(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_participant_id ON beta_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);

-- Insert default beta pioneer badge
INSERT INTO brand_badges (name, description, badge_type, color, criteria, is_active)
VALUES (
    'Beta Pioneer',
    'Exclusive badge for early beta program participants',
    'beta_pioneer',
    '#FF6B35',
    '{"betaParticipant": true}',
    true
) ON CONFLICT DO NOTHING;

-- Insert referral champion badge
INSERT INTO brand_badges (name, description, badge_type, color, criteria, is_active)
VALUES (
    'Referral Champion',
    'Awarded for referring 5 or more beta participants',
    'custom',
    '#FFD700',
    '{"minReferrals": 5}',
    true
) ON CONFLICT DO NOTHING;

-- Insert industry leader badge
INSERT INTO brand_badges (name, description, badge_type, color, criteria, is_active)
VALUES (
    'Industry Leader',
    'Special recognition for fashion industry leaders',
    'custom',
    '#8A2BE2',
    '{"participantType": "industry_leader"}',
    true
) ON CONFLICT DO NOTHING;

-- Update trigger for beta_participants
CREATE OR REPLACE FUNCTION update_beta_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_beta_participants_updated_at
    BEFORE UPDATE ON beta_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_participants_updated_at();

-- Update trigger for beta_feedback
CREATE OR REPLACE FUNCTION update_beta_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_beta_feedback_updated_at
    BEFORE UPDATE ON beta_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_feedback_updated_at();