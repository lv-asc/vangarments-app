CREATE TABLE IF NOT EXISTS journalism (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('News', 'Column', 'Article')),
  image TEXT,
  author VARCHAR(255),
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_journalism_type ON journalism(type);
CREATE INDEX idx_journalism_published ON journalism(published);
CREATE INDEX idx_journalism_created_at ON journalism(created_at);
