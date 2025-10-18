# Vangarments Mobile App - iOS Simulator Setup

## 🚀 Quick Start

### Prerequisites
1. **Xcode** - Install from Mac App Store
2. **iOS Simulator** - Comes with Xcode
3. **Expo CLI** - Install globally

```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Or use the latest version
npm install -g @expo/cli@latest
```

### Setup Steps

1. **Navigate to mobile app directory:**
```bash
cd packages/mobile-expo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the Expo development server:**
```bash
npm start
```

4. **Open iOS Simulator:**
   - Press `i` in the terminal
   - Or scan QR code with Expo Go app on physical device

## 🔧 Troubleshooting

### Problem: "Could not load exp://127.0.0.1:8081"

**Solution 1: Clear Expo Cache**
```bash
npm start -- --clear
# or
expo start --clear
```

**Solution 2: Use Tunnel Mode**
```bash
npm run tunnel
# or
expo start --tunnel
```

**Solution 3: Restart Everything**
```bash
# Kill all Metro/Expo processes
pkill -f "expo\|metro"

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Start fresh
npm start
```

**Solution 4: Check iOS Simulator**
- Make sure iOS Simulator is running
- Try different iOS versions (Settings > Device > iOS Version)
- Reset simulator: Device > Erase All Content and Settings

**Solution 5: Use Physical Device**
- Install Expo Go from App Store
- Scan QR code from terminal
- Make sure phone and computer are on same WiFi

### Problem: Metro bundler issues

**Solution:**
```bash
# Reset Metro cache
npx react-native start --reset-cache

# Or use Expo's reset
expo start --clear
```

### Problem: Dependencies issues

**Solution:**
```bash
# Check Expo doctor
expo doctor

# Fix common issues
expo install --fix
```

## 📱 Testing the App

### Simple Test Version
If the full app doesn't work, try the simple version:

1. Rename `App.tsx` to `App-full.tsx`
2. Rename `App-simple.tsx` to `App.tsx`
3. Run `npm start`

This will load a basic test app to verify Expo is working.

### Full App Version
Once the simple version works:

1. Rename `App.tsx` to `App-simple.tsx`
2. Rename `App-full.tsx` to `App.tsx`
3. Run `npm start`

## 🎯 Expected Behavior

When working correctly, you should see:
- Expo development server starts
- QR code appears in terminal
- iOS Simulator opens automatically (when pressing 'i')
- App loads with Vangarments branding
- Navigation tabs at bottom
- Functional wardrobe, profile, and marketplace screens

## 📞 Still Having Issues?

1. **Check Expo Status**: https://status.expo.dev/
2. **Update Expo CLI**: `npm install -g @expo/cli@latest`
3. **Check Node Version**: Should be 18+ (`node --version`)
4. **Check iOS Simulator**: Try different device types
5. **Use Physical Device**: Often more reliable than simulator

## 🔄 Alternative: Web Version

If iOS simulator continues to have issues, you can run the mobile app in web browser:

```bash
npm run web
```

This will open the mobile app in your browser at http://localhost:8081