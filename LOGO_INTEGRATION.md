# Vangarments Logo Integration

This document outlines the integration of the official Vangarments logo across all platforms.

## Logo Design

The Vangarments logo features:
- **Symbol**: A stylized "U" letter in cream/beige color (#f5f1e8)
- **Background**: Navy blue (#1e3a5f)
- **Style**: Slightly tilted (-5 degrees) for a dynamic, modern look
- **Shape**: Circular for app icons, rectangular for headers

## Platform Integration

### Web Application (`packages/web/`)

**Files Created:**
- `public/assets/images/logo.svg` - Main logo (200x200)
- `public/assets/images/logo-header.svg` - Header logo with text (120x40)
- `public/favicon.svg` - SVG favicon (32x32)
- `public/favicon.ico` - Fallback ICO favicon

**Integration Points:**
- Header component (`src/components/layout/Header.tsx`)
- Browser favicon and app icons
- Meta tags with navy blue theme color

### iOS Application (`packages/mobile-ios/`)

**Files Created:**
- `Assets.xcassets/AppIcon.appiconset/` - Complete iOS app icon set
- `Contents.json` - iOS app icon configuration
- Multiple SVG sizes for different iOS icon requirements

**Features:**
- Rounded corners following iOS design guidelines
- Multiple resolutions (20pt to 1024pt)
- Optimized for iOS app icon standards

### Android Application (`packages/mobile-android/`)

**Files Created:**
- `app/src/main/res/mipmap-*/ic_launcher.xml` - Vector drawable icons
- Multiple density versions (mdpi, hdpi, xhdpi)
- Adaptive icon support

**Features:**
- Vector-based for crisp rendering at any size
- Follows Android Material Design guidelines
- Adaptive icon compatibility

### React Native/Expo App (`vangarments-mobile/`)

**Files Created:**
- `assets/images/logo.svg` - Main logo (1024x1024)
- `assets/images/splash-logo.svg` - Splash screen logo (200x200)
- `components/ui/Logo.tsx` - Reusable logo component

**Configuration Updates:**
- `app.json` - Updated theme colors and adaptive icon background
- Splash screen background colors updated to match brand

**React Component:**
```tsx
import { Logo, LogoWithText } from '@/components/ui/Logo';

// Usage
<Logo size={40} />
<LogoWithText size={40} />
```

## Brand Colors

- **Primary Navy**: `#1e3a5f`
- **Cream/Beige**: `#f5f1e8`

## Usage Guidelines

1. **Minimum Size**: 16px for digital applications
2. **Clear Space**: Maintain at least 1/2 the logo height as clear space around the logo
3. **Backgrounds**: Logo works best on light backgrounds; use navy version on dark backgrounds
4. **Rotation**: The -5 degree tilt is part of the brand identity and should be maintained

## File Formats

- **SVG**: Primary format for web and scalable applications
- **PNG**: For platforms requiring raster images (generated from SVG)
- **Vector Drawable**: For Android applications
- **ICO**: Fallback for older browsers

## Next Steps

To complete the logo integration:

1. **Convert SVG to PNG**: Use a tool like Inkscape or online converters to create PNG versions at required sizes
2. **Test on Devices**: Verify logo appearance on actual iOS and Android devices
3. **Update Brand Guidelines**: Document logo usage across all marketing materials
4. **Social Media**: Update profile pictures and cover images across social platforms

## Technical Notes

- All SVG files use the same color palette and rotation
- Vector formats ensure crisp rendering at any resolution
- Theme colors updated across all platform configurations
- Logo component in React Native uses react-native-svg for optimal performance