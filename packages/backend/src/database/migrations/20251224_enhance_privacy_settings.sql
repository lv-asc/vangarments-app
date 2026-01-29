-- Migration: Enhance Privacy Settings Schema
-- Created: 2025-12-24
-- Description: Add support for private profiles and feature-specific visibility controls

-- Update privacy_settings column to support new structure
-- The new schema supports:
-- - isPrivate: boolean - whether profile requires follow requests
-- - wardrobe/activity/outfits/marketplace: visibility settings with exception lists
-- - Legacy fields: height, weight, birthDate, gender (boolean toggles)

-- Update existing records to have the new privacy structure while preserving existing settings
UPDATE users 
SET privacy_settings = jsonb_build_object(
    'isPrivate', COALESCE((privacy_settings->>'isPrivate')::boolean, false),
    'wardrobe', jsonb_build_object(
        'visibility', COALESCE(privacy_settings->'wardrobe'->>'visibility', 'public'),
        'exceptUsers', COALESCE(privacy_settings->'wardrobe'->'exceptUsers', '[]'::jsonb)
    ),
    'activity', jsonb_build_object(
        'visibility', COALESCE(privacy_settings->'activity'->>'visibility', 'public'),
        'exceptUsers', COALESCE(privacy_settings->'activity'->'exceptUsers', '[]'::jsonb)
    ),
    'marketplace', jsonb_build_object(
        'visibility', COALESCE(privacy_settings->'marketplace'->>'visibility', 'public'),
        'exceptUsers', COALESCE(privacy_settings->'marketplace'->'exceptUsers', '[]'::jsonb)
    ),
    'height', COALESCE((privacy_settings->>'height')::boolean, false),
    'weight', COALESCE((privacy_settings->>'weight')::boolean, false),
    'birthDate', COALESCE((privacy_settings->>'birthDate')::boolean, false),
    'gender', COALESCE((privacy_settings->>'gender')::boolean, false),
    'telephone', COALESCE((privacy_settings->>'telephone')::boolean, false)
)
WHERE privacy_settings IS NOT NULL;

-- Set default privacy settings for users without any
UPDATE users 
SET privacy_settings = '{
    "isPrivate": false,
    "wardrobe": {"visibility": "public", "exceptUsers": []},
    "activity": {"visibility": "public", "exceptUsers": []},
    "marketplace": {"visibility": "public", "exceptUsers": []},
    "height": false,
    "weight": false,
    "birthDate": false,
    "gender": false,
    "telephone": false
}'::jsonb
WHERE privacy_settings IS NULL;

-- Add index for faster privacy setting queries
CREATE INDEX IF NOT EXISTS idx_users_privacy_is_private ON users ((privacy_settings->>'isPrivate'));

-- Add updated_at column to user_follows if it doesn't exist
ALTER TABLE user_follows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
