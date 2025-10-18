# Simple OAuth Setup Guide

This guide will help you set up Google and Facebook OAuth authentication for your Vangarments platform using a simplified approach.

## Quick Setup

### 1. Database Migration

First, run this SQL command in your PostgreSQL database to allow OAuth users:

```sql
-- Make CPF and password optional for OAuth users
ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/oauth/facebook/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3001/api/oauth/google/callback`
7. Copy Client ID and Client Secret to your `.env` file

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add "Facebook Login" product
4. In Facebook Login settings, add redirect URI: `http://localhost:3001/api/oauth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

## Frontend Integration

Add these buttons to your login page:

```javascript
// Google Login
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3001/api/oauth/google';
};

// Facebook Login
const handleFacebookLogin = () => {
  window.location.href = 'http://localhost:3001/api/oauth/facebook';
};
```

## How It Works

1. User clicks OAuth login button
2. User is redirected to Google/Facebook
3. After authorization, user is redirected back with a code
4. Backend exchanges code for user info
5. Backend creates/finds user account
6. Backend generates JWT token
7. User is redirected to frontend with token

## OAuth URLs

- Google: `GET /api/oauth/google`
- Facebook: `GET /api/oauth/facebook`
- Callbacks are handled automatically

## Testing

1. Start your backend: `npm run dev`
2. Visit: `http://localhost:3001/api/oauth/google`
3. Complete OAuth flow
4. Check if you're redirected back with a token

## Notes

- OAuth users will need to complete onboarding (CPF, birth date, etc.)
- Users can have both OAuth and password authentication
- JWT tokens work the same for OAuth and regular users
- All existing authentication features remain unchanged