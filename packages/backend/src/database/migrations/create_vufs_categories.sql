CREATE TABLE IF NOT EXISTS vufs_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL,
    parent_id INTEGER REFERENCES vufs_categories(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vufs_categories_parent_id ON vufs_categories(parent_id);
