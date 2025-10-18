# Vangarments Demo Setup Guide

## 🎯 What You Now Have

Your Vangarments platform now has:

1. **✅ Persistent Data Storage** - All your wardrobe items, profile info, and marketplace data saves between sessions
2. **✅ Working Mock Data** - Real images and clickable items that you can interact with
3. **✅ iOS App Simulation** - A React Native Expo app you can run on iOS simulator
4. **✅ Fixed Headers** - Simple, working navigation that doesn't break
5. **✅ Debug Features** - Console logging and alerts to show when things work

## 🚀 Quick Start

### 1. Web Application (Recommended to start here)

```bash
# Start the web app
npm run dev:web

# Or if that doesn't work:
cd packages/web
npm run dev
```

Visit: http://localhost:3000

**What you can do:**
- Go to `/wardrobe-simple` - See your wardrobe with real images, add/remove items
- Go to `/profile-simple` - Edit your profile, upload photos, see stats
- Go to `/marketplace-simple` - Browse marketplace items with filters
- Go to `/data-test` - Debug page to test data persistence
- All data persists between page refreshes!

## 🔧 **FIXES APPLIED:**

### ✅ **Fixed ItemSelector Error**
- Added null checks for undefined item properties
- Fixed the "Cannot read properties of undefined" error when creating looks

### ✅ **Fixed Header Navigation**
- Created SimpleHeader component that doesn't rely on complex dependencies
- All navigation links now work properly
- Mobile menu works correctly

### ✅ **Added Debug Features**
- Profile photo changes now show alerts
- Adding wardrobe items shows confirmation alerts
- Console logging for debugging data persistence
- Created `/data-test` page to verify everything works

### ✅ **Enhanced Data Persistence**
- All changes are immediately saved to localStorage
- Data survives page refreshes and browser restarts
- Profile stats update automatically when you add items

### 2. Backend API (Optional)

```bash
# Start the backend
npm run dev:backend

# Or:
cd packages/backend
npm run dev
```

Visit: http://localhost:3001/api/health

### 3. iOS App Simulation

```bash
# Install Expo CLI globally (if you don't have it)
npm install -g @expo/cli

# Navigate to mobile app
cd packages/mobile-expo

# Install dependencies
npm install

# Start the app
npm start
```

Then:
- Press `i` to open iOS simulator
- Or scan QR code with Expo Go app on your phone

## 🎮 Demo Features

### Web App Features:
- **Add Items**: Click "Add Item" buttons to add random sample items
- **Edit Profile**: Click the pencil icon to edit your name and bio
- **Change Profile Photo**: Click the camera icon to cycle through sample photos
- **Marketplace**: Browse, filter, and "buy" items
- **Persistent Storage**: Everything saves automatically to localStorage

### Mobile App Features:
- **Native Navigation**: Bottom tabs with smooth animations
- **Camera Integration**: Take photos or select from gallery
- **Persistent Data**: Uses AsyncStorage for data persistence
- **Quick Demo Login**: Skip authentication with demo button

## 🔧 Troubleshooting

### Web App Issues:
```bash
# If you get dependency errors:
cd packages/web
npm install

# If pages don't load:
# Check that you're visiting the correct URLs:
# - http://localhost:3000/wardrobe-simple
# - http://localhost:3000/profile-simple  
# - http://localhost:3000/marketplace-simple
```

### Mobile App Issues:
```bash
# If Expo doesn't start:
npm install -g @expo/cli@latest

# If iOS simulator doesn't open:
# Make sure you have Xcode installed
# Or use your physical device with Expo Go app
```

### Backend Issues:
```bash
# If backend won't start:
cd packages/backend
npm install
npm run dev
```

## 📱 Testing the Features

### 1. Test Data Persistence:
1. Add items to your wardrobe
2. Edit your profile
3. Refresh the page
4. ✅ Everything should still be there!

### 2. Test Mobile App:
1. Start the mobile app
2. Use "Quick Demo Login"
3. Navigate between tabs
4. Add items using the camera tab
5. ✅ Data persists between app restarts!

### 3. Test Marketplace:
1. Go to `/marketplace-simple`
2. Use search and filters
3. Click heart icons to favorite items
4. ✅ See real product images and details!

## 🎨 Customization

### Add Your Own Images:
- Replace URLs in `packages/web/src/lib/storage.ts`
- Update mock data in `packages/mobile-expo/src/context/DataContext.tsx`

### Change Colors:
- Web: Update colors in `packages/web/src/app/globals.css`
- Mobile: Update colors in screen stylesheets

### Add More Features:
- Both apps use the same data structure
- Add new fields to interfaces in storage/context files
- Update UI components to display new data

## 🎯 Next Steps

1. **Start with the web app** - It's the most complete
2. **Try the mobile app** - Great for testing mobile UX
3. **Customize the data** - Add your own items and images
4. **Explore the code** - Everything is well-organized and commented

## 🆘 Need Help?

If something doesn't work:
1. Check the console for errors
2. Make sure all dependencies are installed
3. Try restarting the development servers
4. Check that you're using the correct URLs

**Happy coding! 🎉**