# Beta Program Components

This directory contains all components related to the Vangarments Beta Program functionality.

## Components

### `BetaPioneerBadge.tsx`
Animated badge component that displays the Beta Pioneer status with special visual effects.

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `showLabel`: boolean (default: true)
- `animated`: boolean (default: true)
- `className`: string (optional)

### `BetaAnalyticsDashboard.tsx`
Comprehensive analytics dashboard for beta participants with industry insights, trend predictions, and engagement metrics.

**Props:**
- `analytics`: BetaAnalytics object
- `loading`: boolean (default: false)

### `ReferralSystem.tsx`
Referral management component with code sharing, leaderboard, and reward tracking.

**Props:**
- `referralData`: ReferralData object
- `onInviteFriend`: (email: string) => void
- `onShareCode`: (platform: string) => void
- `loading`: boolean (default: false)

### `ExclusiveContentHub.tsx`
Hub for exclusive beta content including early features, industry reports, and networking opportunities.

**Props:**
- `content`: ExclusiveContent object
- `onFeatureAccess`: (featureId: string) => void
- `onDownloadReport`: (reportId: string) => void
- `onRegisterEvent`: (eventId: string) => void
- `loading`: boolean (default: false)

### `NetworkVisibility.tsx`
Network visibility and industry influence tracking component.

**Props:**
- `networkData`: NetworkData object
- `onConnectUser`: (userId: string) => void
- `onApplyOpportunity`: (opportunityId: string) => void
- `loading`: boolean (default: false)

## Hooks

### `useBetaProgram.ts`
Custom hook for managing beta program state and API interactions.

**Returns:**
- `betaStatus`: Current beta participation status
- `analytics`: Beta analytics data
- `loading`: Loading state
- `error`: Error state
- `checkBetaStatus()`: Function to check beta status
- `joinBetaProgram()`: Function to join beta program
- `loadAnalytics()`: Function to load analytics
- `submitFeedback()`: Function to submit feedback
- And more...

## Mock Data

### `BetaProgramMock.ts`
Contains mock data for development and testing purposes when the backend API is not available.

## Usage

```tsx
import { useBetaProgram } from '@/hooks/useBetaProgram';
import BetaPioneerBadge from '@/components/beta/BetaPioneerBadge';

function MyComponent() {
  const { betaStatus } = useBetaProgram();
  
  return (
    <div>
      {betaStatus?.isBetaParticipant && (
        <BetaPioneerBadge size="small" />
      )}
    </div>
  );
}
```

## Features

- ✅ Beta Pioneer badges with special recognition
- ✅ Advanced analytics for industry professionals
- ✅ Referral system with rewards and leaderboard
- ✅ Exclusive content and early feature access
- ✅ Network visibility and industry influence tracking
- ✅ Comprehensive feedback system
- ✅ Mock data for development
- ✅ Error handling and graceful degradation
- ✅ Responsive design
- ✅ Animated UI components

## API Endpoints

The components interact with the following API endpoints:

- `GET /api/beta/status` - Check beta participation status
- `POST /api/beta/join` - Join the beta program
- `GET /api/beta/analytics` - Get advanced analytics
- `POST /api/beta/feedback` - Submit feedback
- `GET /api/beta/exclusive-content` - Get exclusive content
- `GET /api/beta/leaderboard` - Get beta leaderboard
- `GET /api/beta/network-visibility` - Get network data
- `GET /api/beta/referral/:code/validate` - Validate referral code

## Error Handling

All components include comprehensive error handling:

- Graceful degradation when API is unavailable
- Mock data fallbacks for development
- User-friendly error messages
- Loading states and skeleton screens
- Retry mechanisms where appropriate

## Testing

Unit tests are included for critical components:

- `BetaPioneerBadge.test.tsx` - Tests for the badge component
- Mock data available for testing other components

## Styling

Components use Tailwind CSS with the Vangarments design system:

- Primary color: `#00132d` (dark blue)
- Background: `#fff7d7` (cream)
- Accent colors: Orange/yellow gradient for beta elements
- Responsive design with mobile-first approach
- Smooth animations using Framer Motion