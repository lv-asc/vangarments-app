-- Create events table for fashion-related events
-- (Runway Shows, Fashion Weeks, Brand Sales, Conferences, Pop-ups, Exhibitions)

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core identifiers
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('runway_show', 'fashion_week', 'brand_sale', 'conference', 'pop_up', 'exhibition')),
    
    -- Branding
    master_logo TEXT,
    logo_metadata JSONB DEFAULT '[]',
    banner TEXT,
    banners JSONB DEFAULT '[]',
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    
    -- Venue/Location
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_country VARCHAR(100),
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    -- Organizer
    organizer_name VARCHAR(255),
    organizer_id UUID,
    
    -- Details
    website TEXT,
    description TEXT,
    contact_info JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '[]',
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50) CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('yearly', 'biannual', 'quarterly')),
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_venue_city ON events(venue_city);
CREATE INDEX idx_events_venue_country ON events(venue_country);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_deleted_at ON events(deleted_at);
