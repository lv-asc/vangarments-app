-- Migration to add collection_id and images to brand_lookbooks

ALTER TABLE brand_lookbooks 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES brand_collections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_brand_lookbooks_collection ON brand_lookbooks(collection_id);
