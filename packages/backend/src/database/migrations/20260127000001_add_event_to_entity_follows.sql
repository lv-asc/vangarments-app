-- Add event to entity_type and follower_type checks
ALTER TABLE entity_follows DROP CONSTRAINT IF EXISTS entity_follows_entity_type_check;
ALTER TABLE entity_follows ADD CONSTRAINT entity_follows_entity_type_check 
    CHECK (entity_type::text = ANY (ARRAY['brand', 'store', 'supplier', 'non_profit', 'page', 'user', 'sport_org', 'event']::text[]));

ALTER TABLE entity_follows DROP CONSTRAINT IF EXISTS entity_follows_follower_type_check;
ALTER TABLE entity_follows ADD CONSTRAINT entity_follows_follower_type_check 
    CHECK (follower_type::text = ANY (ARRAY['user', 'brand', 'store', 'supplier', 'non_profit', 'page', 'sport_org', 'event']::text[]));
