CREATE TABLE IF NOT EXISTS vufs_size_attributes (
  size_id UUID NOT NULL REFERENCES vufs_sizes(id) ON DELETE CASCADE,
  attribute_slug TEXT NOT NULL REFERENCES vufs_attribute_types(slug) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (size_id, attribute_slug)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vufs_size_attributes_size_id ON vufs_size_attributes(size_id);
