-- Add roles column as text array
ALTER TABLE brand_team_members ADD COLUMN roles text[] DEFAULT '{}';

-- Migrate existing role data to roles array
UPDATE brand_team_members SET roles = ARRAY[role] WHERE role IS NOT NULL;

-- Make roles column not null
ALTER TABLE brand_team_members ALTER COLUMN roles SET NOT NULL;

-- Drop the old role column
ALTER TABLE brand_team_members DROP COLUMN role;
