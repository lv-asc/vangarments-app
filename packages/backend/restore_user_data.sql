-- Restore profile data for lvicentini10@gmail.com
UPDATE users 
SET profile = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(profile::jsonb, '{}'::jsonb),
      '{name}',
      '"vvd boy 17"'
    ),
    '{avatarUrl}',
    '"/storage/images/profiles/manual_upload.jpg"'
  ),
  '{socialLinks}',
  '[
    {"platform": "Instagram", "url": "https://www.instagram.com/lv.asc"},
    {"platform": "YouTube", "url": "https://www.youtube.com/@lv.mvicentini"},
    {"platform": "Snapchat", "url": "xlvicentinix"},
    {"platform": "Pinterest", "url": "https://pin.it/5udi6yDD4"},
    {"platform": "TikTok", "url": "https://www.tiktok.com/@lv.asc"},
    {"platform": "Facebook", "url": "https://web.facebook.com/profile.php?id=100094744442313"},
    {"platform": "YouTube Music", "url": "https://music.youtube.com/@lv.mvicentini"}
  ]'::jsonb
)::text
WHERE email = 'lvicentini10@gmail.com';

-- Restore roles
DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'lvicentini10@gmail.com');
INSERT INTO user_roles (user_id, role)
SELECT id, unnest(ARRAY['common_user', 'influencer', 'brand_owner', 'stylist', 'independent_reseller', 'store_owner', 'fashion_designer'])
FROM users WHERE email = 'lvicentini10@gmail.com';
