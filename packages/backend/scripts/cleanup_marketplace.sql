-- Drop marketplace tables to allow fresh migration
DROP TABLE IF EXISTS review_reports CASCADE;
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS marketplace_reviews CASCADE;
DROP TABLE IF EXISTS transaction_events CASCADE;
DROP TABLE IF EXISTS marketplace_transactions CASCADE;
DROP TABLE IF EXISTS marketplace_watchlist CASCADE;
DROP TABLE IF EXISTS listing_likes CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS marketplace_offers CASCADE; -- Drop this as it refs listings
DROP TABLE IF EXISTS marketplace_listings CASCADE;

-- Remove the failed/stale migration record
DELETE FROM schema_migrations WHERE migration_id = 'create_marketplace_tables';
