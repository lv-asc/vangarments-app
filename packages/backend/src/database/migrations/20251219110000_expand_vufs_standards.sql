ALTER TABLE vufs_standards
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS approach VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS measurement_unit VARCHAR(50);

-- Update existing records with defaults to match "General"
UPDATE vufs_standards
SET
    region = CASE
        WHEN name = 'BR' THEN 'Brazil'
        WHEN name = 'US' THEN 'United States'
        WHEN name = 'UK' THEN 'United Kingdom'
        WHEN name = 'EU' THEN 'Europe'
        ELSE 'International'
    END,
    category = 'General',
    approach = 'Standard',
    description = 'Standard sizing system'
WHERE region IS NULL;
