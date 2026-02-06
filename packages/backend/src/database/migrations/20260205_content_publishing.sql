-- Create content_publishing system tables

-- 1. Main Content Posts Table
CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('daily', 'motion', 'feed')),
  media_urls TEXT[] NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'mixed')),
  caption TEXT,
  aspect_ratio VARCHAR(10) DEFAULT '1:1', -- '9:16', '1:1', '4:5'
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Metadata
  location_name VARCHAR(100),
  location_lat FLOAT,
  location_lng FLOAT,
  
  -- Audio/Music (optional, for Motion/Daily)
  audio_url VARCHAR(500),
  audio_name VARCHAR(100),
  audio_artist VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE -- For Daily stories (24h)
);

-- Index for feed retrieval
CREATE INDEX IF NOT EXISTS idx_content_posts_user_created ON content_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_type_created ON content_posts(content_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_expires_at ON content_posts(expires_at) WHERE expires_at IS NOT NULL;

-- 2. Content Views (for Stories/Daily)
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, viewer_id) -- One view per user per story
);

-- 3. Content Likes
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, user_id)
);

-- 4. Content Comments
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES content_comments(id) ON DELETE CASCADE, -- For nested replies
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Content Drafts
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('daily', 'motion', 'feed')),
  media_urls TEXT[], -- Can be empty if not uploaded yet
  draft_data JSONB DEFAULT '{}', -- Flexible storage for partial edits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS)
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;

-- Helper for RLS
CREATE OR REPLACE FUNCTION auth_uid() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::UUID;
END;
$$ LANGUAGE plpgsql;

-- Policies

-- Content Posts:
-- Public can read public posts
CREATE POLICY content_posts_public_select ON content_posts
  FOR SELECT
  USING (visibility = 'public');

-- Users can CRUD their own posts
CREATE POLICY content_posts_owner_all ON content_posts
  FOR ALL
  USING (auth_uid() = user_id);

-- Drafts: Only owner can access
CREATE POLICY content_drafts_owner_all ON content_drafts
  FOR ALL
  USING (auth_uid() = user_id);

-- Trigger to update likes count on content_posts
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE content_posts SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE content_posts SET likes_count = likes_count - 1 WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_likes
AFTER INSERT OR DELETE ON content_likes
FOR EACH ROW
EXECUTE FUNCTION update_content_likes_count();

-- Trigger to update comments count on content_posts
CREATE OR REPLACE FUNCTION update_content_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE content_posts SET comments_count = comments_count + 1 WHERE id = NEW.content_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE content_posts SET comments_count = comments_count - 1 WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_comments
AFTER INSERT OR DELETE ON content_comments
FOR EACH ROW
EXECUTE FUNCTION update_content_comments_count();

-- Trigger to update views count on content_posts
CREATE OR REPLACE FUNCTION update_content_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE content_posts SET views_count = views_count + 1 WHERE id = NEW.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_views
AFTER INSERT ON content_views
FOR EACH ROW
EXECUTE FUNCTION update_content_views_count();
