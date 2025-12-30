CREATE TABLE IF NOT EXISTS page_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roles TEXT[],
  title TEXT,
  is_public BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id, user_id)
);

CREATE TRIGGER update_page_team_members_updated_at
BEFORE UPDATE ON page_team_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
