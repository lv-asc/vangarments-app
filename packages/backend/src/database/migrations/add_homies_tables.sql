-- Migration to add Homies feature tables

-- Ensure authenticated role exists (for RLS policies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- Homies lists table
CREATE TABLE IF NOT EXISTS homies_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#000080', -- Navy blue by default
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Homies list members table
CREATE TABLE IF NOT EXISTS homies_list_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES homies_lists(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(list_id, member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_homies_lists_user_id ON homies_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_homies_list_members_list_id ON homies_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_homies_list_members_member_id ON homies_list_members(member_id);

-- Trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_homies_lists_updated_at') THEN
        CREATE TRIGGER update_homies_lists_updated_at
        BEFORE UPDATE ON homies_lists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE homies_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE homies_list_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homies_lists
CREATE POLICY "Users can view own homies lists"
  ON homies_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create homies lists"
  ON homies_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own homies lists"
  ON homies_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own homies lists"
  ON homies_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can see if they are in a list if they visit the creator's profile
-- However, we might want a specific query for this to avoid leaking all lists.
-- For now, let's allow users to see lists they are members of.
CREATE POLICY "Users can view lists they are members of"
  ON homies_lists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homies_list_members
      WHERE homies_list_members.list_id = homies_lists.id
      AND homies_list_members.member_id = auth.uid()
    )
  );

-- RLS Policies for homies_list_members
CREATE POLICY "Users can view members of own lists"
  ON homies_list_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homies_lists
      WHERE homies_lists.id = homies_list_members.list_id
      AND homies_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lists they are in"
  ON homies_list_members FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Users can add members to own lists"
  ON homies_list_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM homies_lists
      WHERE homies_lists.id = homies_list_members.list_id
      AND homies_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove members from own lists"
  ON homies_list_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homies_lists
      WHERE homies_lists.id = homies_list_members.list_id
      AND homies_lists.user_id = auth.uid()
    )
  );
