-- Create calendar_events table for tracking item launches, fashion events, awards, etc.
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'item_launch', 'collection_release', 'drop', 'fashion_event', 'award', 'media_release'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME, -- Optional time
  end_date DATE, -- For multi-day events
  
  -- Entity references (optional - for linking to items/collections/brands)
  sku_item_id UUID REFERENCES sku_items(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES brand_collections(id) ON DELETE SET NULL,
  
  -- Event details
  location VARCHAR(255),
  image_url TEXT,
  external_url TEXT,
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_brand ON calendar_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_year_month ON calendar_events(EXTRACT(YEAR FROM event_date), EXTRACT(MONTH FROM event_date));
CREATE INDEX IF NOT EXISTS idx_calendar_events_published ON calendar_events(is_published) WHERE is_published = true;
