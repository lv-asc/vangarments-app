# Development Mode

This directory contains development tools and utilities for testing the Vangarments platform without a backend server.

## Features

### 🔧 **DevModeToggle Component**
A floating development panel that appears in the bottom-right corner during development.

**Features:**
- Toggle development mode on/off
- Quick login as different user types
- Persistent state across page reloads
- Only visible in development environment

### 🔐 **Mock Authentication System**
Complete authentication system that works without a backend server.

**Mock Users Available:**

1. **Ana Silva (Beta User)**
   - Email: `beta@example.com`
   - Password: `password` (any password works)
   - Features: ✅ Beta Pioneer access, full analytics, exclusive content

2. **Maria Oliveira (Influencer)**
   - Email: `influencer@example.com`
   - Password: `password` (any password works)
   - Features: ✅ Beta Pioneer + Influencer badges, network visibility

3. **João Santos (Regular User)**
   - Email: `regular@example.com`
   - Password: `password` (any password works)
   - Features: ❌ No beta access, standard user experience

### 📊 **Mock Beta Program**
Complete beta program functionality with realistic mock data.

**Features:**
- Beta status checking
- Analytics dashboard with charts
- Referral system with leaderboard
- Exclusive content hub
- Network visibility tracking
- Feedback submission system

## How to Use

### 1. **Enable Development Mode**
- Look for the "DEV" button in the bottom-right corner
- Click it to open the development panel
- Toggle the switch to enable development mode
- The button will turn green when active

### 2. **Quick Login**
- With dev mode enabled, click on any user in the panel
- Or go to `/login` and use the quick login buttons
- Or manually enter any of the mock user emails

### 3. **Test Beta Features**
- Login as `beta@example.com` or `influencer@example.com`
- Navigate to `/beta` to see the full beta program
- All features work with realistic mock data
- No backend server required!

### 4. **Test Regular User Experience**
- Login as `regular@example.com`
- See how the app behaves for non-beta users
- Beta features will be hidden/disabled

## Technical Details

### **AuthWrapper System**
The `AuthWrapper` automatically switches between:
- **Real Auth**: When dev mode is OFF (production-ready)
- **Mock Auth**: When dev mode is ON (development testing)

### **Persistent State**
- Development mode setting persists across page reloads
- Mock user sessions are maintained in localStorage
- Seamless switching between real and mock auth

### **Mock Data**
All mock data is defined in:
- `MockAuthContext.tsx` - User authentication data
- `BetaProgramMock.ts` - Beta program features data
- `useMockBetaProgram.ts` - Beta program API simulation

### **API Simulation**
Mock APIs include realistic:
- Network delays (200-1000ms)
- Success/error responses
- Data persistence in localStorage
- State updates and callbacks

## Development Workflow

```bash
# 1. Start the development server
npm run dev

# 2. Open the app in your browser
# Look for the "DEV" button in bottom-right

# 3. Enable development mode
# Click DEV button → Toggle switch ON

# 4. Quick login as beta user
# Click "Ana Silva (Beta User)" in the panel

# 5. Test beta features
# Navigate to /beta and explore all features

# 6. Switch users to test different scenarios
# Use the dev panel to login as different users
```

## Production Safety

- **DevModeToggle**: Only renders in development (`NODE_ENV !== 'production'`)
- **Mock Auth**: Automatically disabled in production builds
- **Real Auth**: Takes precedence when dev mode is disabled
- **No Performance Impact**: Mock code is tree-shaken in production

## Troubleshooting

### **Dev button not showing?**
- Make sure you're running in development mode (`npm run dev`)
- Check that `NODE_ENV` is not set to `'production'`

### **Login not working?**
- Enable development mode first (toggle the switch)
- Use any password with the mock email addresses
- Check browser console for error messages

### **Beta features not showing?**
- Make sure you're logged in as `beta@example.com` or `influencer@example.com`
- Regular users (`regular@example.com`) don't have beta access
- Check that development mode is enabled

### **Data not persisting?**
- Mock data is stored in localStorage
- Clear browser storage if you need to reset
- Switching between users will update the stored data

## Files Structure

```
packages/web/src/
├── contexts/
│   ├── AuthWrapper.tsx          # Switches between real/mock auth
│   └── MockAuthContext.tsx     # Mock authentication system
├── components/dev/
│   ├── DevModeToggle.tsx       # Development mode panel
│   └── README.md               # This file
├── hooks/
│   ├── useMockBetaProgram.ts   # Mock beta program API
│   └── useBetaProgram.ts       # Auto-switches to mock in dev mode
└── app/
    └── login/
        └── page.tsx            # Login page with quick login buttons
```

This development system allows you to test all beta program features without needing a backend server! 🎉