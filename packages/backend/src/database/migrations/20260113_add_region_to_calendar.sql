DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'region') THEN
        ALTER TABLE calendar_events ADD COLUMN region VARCHAR(100) DEFAULT 'Global';
        CREATE INDEX idx_calendar_events_region ON calendar_events(region);
    END IF;
END $$;
