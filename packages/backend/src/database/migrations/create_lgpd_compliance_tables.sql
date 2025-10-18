-- LGPD Compliance Tables Migration
-- Creates tables for managing user consents, data processing records, and data subject requests

-- User Consents Table (LGPD Article 8)
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('data_processing', 'marketing', 'analytics', 'cookies', 'third_party_sharing')),
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP DEFAULT NOW(),
    consent_version VARCHAR(10) DEFAULT '1.0',
    ip_address INET NOT NULL,
    user_agent TEXT,
    withdrawal_date TIMESTAMP NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    purpose TEXT NOT NULL,
    data_categories JSONB NOT NULL DEFAULT '[]',
    retention_period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Processing Records Table (LGPD Article 37)
CREATE TABLE IF NOT EXISTS data_processing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    processing_activity VARCHAR(100) NOT NULL,
    data_categories JSONB NOT NULL DEFAULT '[]',
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    data_source VARCHAR(100) NOT NULL,
    recipients JSONB NULL,
    international_transfers BOOLEAN DEFAULT FALSE,
    retention_period VARCHAR(50) NOT NULL,
    security_measures JSONB NOT NULL DEFAULT '[]',
    processed_at TIMESTAMP DEFAULT NOW(),
    processed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Data Subject Requests Table (LGPD Articles 18-22)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    request_date TIMESTAMP DEFAULT NOW(),
    completion_date TIMESTAMP NULL,
    request_details TEXT NOT NULL,
    response_data JSONB NULL,
    rejection_reason TEXT NULL,
    verification_method VARCHAR(100) NOT NULL,
    handled_by VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Security Audit Log Table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT NOW(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INTEGER,
    request_data JSONB NULL,
    response_data JSONB NULL,
    error_message TEXT NULL,
    security_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rate Limiting Tracking Table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) NOT NULL, -- IP address or user ID
    endpoint VARCHAR(200) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    window_end TIMESTAMP NOT NULL,
    blocked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Data Retention Tracking Table
CREATE TABLE IF NOT EXISTS data_retention_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_category VARCHAR(50) NOT NULL,
    retention_period VARCHAR(50) NOT NULL,
    created_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'archived', 'deleted')),
    last_accessed TIMESTAMP NULL,
    deletion_scheduled TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_given ON user_consents(consent_given);
CREATE INDEX IF NOT EXISTS idx_user_consents_date ON user_consents(consent_date);

CREATE INDEX IF NOT EXISTS idx_data_processing_user_id ON data_processing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_activity ON data_processing_records(processing_activity);
CREATE INDEX IF NOT EXISTS idx_data_processing_date ON data_processing_records(processed_at);

CREATE INDEX IF NOT EXISTS idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_date ON data_subject_requests(request_date);

CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_log(ip_address);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_tracking(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_tracking(window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_data_retention_user_id ON data_retention_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_expiry ON data_retention_tracking(expiry_date);
CREATE INDEX IF NOT EXISTS idx_data_retention_status ON data_retention_tracking(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON user_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON data_subject_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_limit_tracking_updated_at BEFORE UPDATE ON rate_limit_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_retention_tracking_updated_at BEFORE UPDATE ON data_retention_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_consents IS 'Stores user consent records for LGPD compliance (Article 8)';
COMMENT ON TABLE data_processing_records IS 'Audit trail of data processing activities (Article 37)';
COMMENT ON TABLE data_subject_requests IS 'Tracks data subject rights requests (Articles 18-22)';
COMMENT ON TABLE security_audit_log IS 'Security events and audit trail for monitoring';
COMMENT ON TABLE rate_limit_tracking IS 'Tracks rate limiting for DDoS protection';
COMMENT ON TABLE data_retention_tracking IS 'Manages data retention periods and cleanup';