CREATE TABLE IF NOT EXISTS vufs_global_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups (though primary key handles unique constraint)
CREATE INDEX IF NOT EXISTS idx_vufs_global_settings_key ON vufs_global_settings(key);
