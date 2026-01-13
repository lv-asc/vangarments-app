-- Create calendar_event_types table for dynamic event type management
CREATE TABLE IF NOT EXISTS calendar_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial event types
INSERT INTO calendar_event_types (value, label, icon, color, is_system)
VALUES 
  ('item_launch', 'Item Launch', 'tag', 'bg-blue-500', true),
  ('collection_release', 'Collection Release', 'sparkles', 'bg-purple-500', true),
  ('drop', 'Drop', 'fire', 'bg-orange-500', true),
  ('fashion_event', 'Fashion Event', 'calendar', 'bg-pink-500', true),
  ('award', 'Award', 'trophy', 'bg-yellow-500', true),
  ('media_release', 'Media Release', 'film', 'bg-green-500', true)
ON CONFLICT (value) DO NOTHING;

-- Add index
CREATE INDEX IF NOT EXISTS idx_calendar_event_types_value ON calendar_event_types(value);
