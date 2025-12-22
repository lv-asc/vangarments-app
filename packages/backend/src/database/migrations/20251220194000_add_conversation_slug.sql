ALTER TABLE conversations ADD COLUMN slug VARCHAR(255) UNIQUE;
CREATE INDEX idx_conversations_slug ON conversations(slug);
