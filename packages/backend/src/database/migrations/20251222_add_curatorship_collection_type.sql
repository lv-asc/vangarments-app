-- Migration: Add 'Curatorship' to brand_collections.collection_type check constraint
-- Run this migration to allow 'Curatorship' as a valid collection type

-- Drop the existing constraint
ALTER TABLE brand_collections DROP CONSTRAINT IF EXISTS brand_collections_collection_type_check;

-- Add the updated constraint with 'Curatorship' included
ALTER TABLE brand_collections ADD CONSTRAINT brand_collections_collection_type_check 
  CHECK (collection_type IN ('Seasonal', 'Capsule', 'Collaboration', 'Limited', 'Core', 'Curatorship', 'Other'));
