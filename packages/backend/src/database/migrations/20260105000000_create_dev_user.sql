-- Ensure dev user exists for development routes
INSERT INTO users (id, profile, email, username)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '{"name": "Dev User", "bio": "Development purpose user"}'::jsonb,
    'dev@vangarments.com',
    'devuser'
) ON CONFLICT (id) DO NOTHING;
