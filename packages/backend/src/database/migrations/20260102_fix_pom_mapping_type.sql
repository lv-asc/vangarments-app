-- Fix apparel_pom_mappings to match vufs_categories (SERIAL ID)
ALTER TABLE apparel_pom_mappings DROP CONSTRAINT IF EXISTS apparel_pom_mappings_apparel_id_fkey;
ALTER TABLE apparel_pom_mappings ALTER COLUMN apparel_id TYPE INTEGER USING apparel_id::text::integer;
ALTER TABLE apparel_pom_mappings ADD CONSTRAINT apparel_pom_mappings_apparel_id_fkey FOREIGN KEY (apparel_id) REFERENCES vufs_categories(id) ON DELETE CASCADE;
