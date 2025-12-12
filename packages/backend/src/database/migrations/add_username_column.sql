-- Add username column and change tracking for 7-day cooldown
-- Migration for profile username feature

-- Add username column (unique, case-insensitive)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_last_changed TIMESTAMP;

-- Create unique index (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

-- Initialize usernames from email (before @) for existing users
UPDATE users 
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
WHERE username IS NULL;

-- Handle potential duplicates by appending random suffix
DO $$
DECLARE
    dup RECORD;
    counter INTEGER;
BEGIN
    FOR dup IN 
        SELECT username, array_agg(id ORDER BY created_at) as ids
        FROM users
        WHERE username IS NOT NULL
        GROUP BY LOWER(username)
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        -- Skip the first (oldest) user, update the rest
        FOR i IN 2..array_length(dup.ids, 1) LOOP
            UPDATE users 
            SET username = dup.username || counter::text
            WHERE id = dup.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Now make username NOT NULL after initialization
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
