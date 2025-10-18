-- Create system_configurations table for in-app configuration management
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    is_editable BOOLEAN DEFAULT true,
    requires_restart BOOLEAN DEFAULT false,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(section, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_configurations_section ON system_configurations(section);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);
CREATE INDEX IF NOT EXISTS idx_system_configurations_editable ON system_configurations(is_editable);

-- Insert some default configuration values
INSERT INTO system_configurations (section, key, value, is_editable, requires_restart) VALUES
('vufs', 'categories', '{"categories": []}', true, false),
('system', 'max_image_size', '10485760', true, false),
('system', 'allowed_image_types', '["jpg", "jpeg", "png", "webp"]', true, false),
('features', 'enable_marketplace', 'true', true, false),
('features', 'enable_social', 'true', true, false),
('business', 'marketplace_fee_percentage', '5.0', true, false),
('business', 'minimum_item_price', '10.00', true, false)
ON CONFLICT (section, key) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configurations_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_system_configurations_updated_at();