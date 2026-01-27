-- Rollback migration for events system
DROP INDEX IF EXISTS idx_events_deleted_at;
DROP INDEX IF EXISTS idx_events_organizer_id;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_venue_country;
DROP INDEX IF EXISTS idx_events_venue_city;
DROP INDEX IF EXISTS idx_events_event_type;
DROP INDEX IF EXISTS idx_events_slug;
DROP TABLE IF EXISTS events;
