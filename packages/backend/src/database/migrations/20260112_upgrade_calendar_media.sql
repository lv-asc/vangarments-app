-- Add multi-media and tagging support to calendar_events
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tagged_entities JSONB DEFAULT '[]'::jsonb;

-- Add index for tagged entities search
CREATE INDEX IF NOT EXISTS idx_calendar_events_tagged_entities ON calendar_events USING gin (tagged_entities);
