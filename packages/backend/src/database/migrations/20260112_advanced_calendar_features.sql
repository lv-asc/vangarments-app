-- Add release_date to sku_items for automatic calendar integration
ALTER TABLE sku_items ADD COLUMN IF NOT EXISTS release_date DATE;

-- Create calendar_event_subscriptions table for user notifications
CREATE TABLE IF NOT EXISTS calendar_event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  remind_at_1h BOOLEAN DEFAULT true,
  remind_at_24h BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Index for notification service to query upcoming reminders
CREATE INDEX IF NOT EXISTS idx_calendar_event_subscriptions_user ON calendar_event_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_subscriptions_event ON calendar_event_subscriptions(event_id);
