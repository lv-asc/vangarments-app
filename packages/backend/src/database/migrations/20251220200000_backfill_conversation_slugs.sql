-- Backfill slugs for existing group conversations

-- Create slugify function if not exists
CREATE OR REPLACE FUNCTION slugify(v TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Convert to lowercase
    result := LOWER(v);
    -- Replace spaces with hyphens
    result := REGEXP_REPLACE(result, '\s+', '-', 'g');
    -- Remove non-alphanumeric characters except hyphens
    result := REGEXP_REPLACE(result, '[^a-z0-9\-]', '', 'g');
    -- Replace multiple hyphens with single hyphen
    result := REGEXP_REPLACE(result, '\-+', '-', 'g');
    -- Remove leading/trailing hyphens
    result := TRIM(BOTH '-' FROM result);
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill slugs for group conversations that don't have one
UPDATE conversations
SET slug = slugify(COALESCE(name, 'group')) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5)
WHERE conversation_type = 'group' AND slug IS NULL AND name IS NOT NULL;

-- Update any remaining groups without names
UPDATE conversations
SET slug = 'group-' || SUBSTRING(MD5(id::TEXT) FROM 1 FOR 8)
WHERE conversation_type = 'group' AND slug IS NULL;
