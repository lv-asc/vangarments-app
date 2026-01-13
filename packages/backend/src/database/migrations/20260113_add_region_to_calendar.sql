-- Add region column to calendar_events
ALTER TABLE calendar_events ADD COLUMN region VARCHAR(100) DEFAULT 'Global';

-- Create index for faster filtering
CREATE INDEX idx_calendar_events_region ON calendar_events(region);
