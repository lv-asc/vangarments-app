# Authentication Integration Setup

This document outlines the authentication system integration completed for the Vangarments platform.

## ✅ What's Been Implemented

### 1. API Client (`/src/lib/api.ts`)
- Centralized API client with authentication headers
- JWT token management (localStorage)
- Comprehensive error handling
- Request/response interceptors
- Methods for auth, wardrobe, marketplace, and social features

### 2. Authentication Hook (`/src/hooks/useAuth.ts`)
- Login/logout functionality
- User registration with CPF validation
- Profile management
- Avatar upload
- Brazilian CPF validation

### 3. UI Components
- **CPF Input** (`/src/components/ui/CPFInput.tsx`): Brazilian CPF input with validation
- **Protected Route** (`/src/components/auth/ProtectedRoute.tsx`): Route protection
- **Error Boundary** (`/src/components/ui/ErrorBoundary.tsx`): Error handling
- **Loading Components** (`/src/components/ui/LoadingSpinner.tsx`): Loading states

### 4. Updated Pages
- **Login Page**: Connected to authentication API
- **Register Page**: Added CPF input and validation
- **Wardrobe Page**: Protected route implementation
- **Header**: User menu with authentication status

### 5. Infrastructure
- **Toast Notifications**: User feedback system
- **API Status Checker**: Development debugging tool
- **Offline Sync**: Enhanced sync status monitoring

## 🔧 Configuration Required

### Environment Variables
Create `.env.local` file with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend API Endpoints Expected
The frontend expects these API endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

#### User Management
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar

#### Health Check
- `GET /api/health` - API status check

## 🚀 Next Steps

### Immediate (Task 13.1)
1. **Set up backend API endpoints** matching the expected interface
2. **Test authentication flow** end-to-end
3. **Configure CORS** for frontend-backend communication
4. **Add request logging** for debugging

### Phase 2 (Task 14)
1. **Connect wardrobe management** to VUFS backend
2. **Implement image upload** with AI processing
3. **Add real-time sync** between offline and online storage

## 🔍 Testing the Integration

### Manual Testing Steps
1. **Registration Flow**:
   - Go to `/register`
   - Fill form with valid CPF
   - Submit and verify redirect to `/wardrobe`

2. **Login Flow**:
   - Go to `/login`
   - Enter credentials
   - Verify authentication and redirect

3. **Protected Routes**:
   - Try accessing `/wardrobe` without login
   - Verify redirect to `/login`

4. **User Menu**:
   - Login and check header user menu
   - Test logout functionality

### Development Tools
- **API Status**: Check sync status indicator
- **Browser DevTools**: Monitor network requests
- **Console Logs**: Authentication state changes

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors**: Configure backend CORS for frontend domain
2. **Token Storage**: Check localStorage for `auth_token`
3. **API Connection**: Verify `NEXT_PUBLIC_API_URL` environment variable
4. **CPF Validation**: Ensure proper Brazilian CPF format

### Debug Commands
```bash
# Check environment variables
echo $NEXT_PUBLIC_API_URL

# Clear localStorage (browser console)
localStorage.clear()

# Check API status
curl http://localhost:3001/api/health
```

## 📝 Code Examples

### Using Authentication in Components
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

### Making Authenticated API Calls
```tsx
import { apiClient } from '@/lib/api';

// The API client automatically includes auth headers
const items = await apiClient.getWardrobeItems();
```

### Protecting Routes
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PrivatePage() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
}
```

This authentication integration provides a solid foundation for the Vangarments platform, with proper error handling, user feedback, and Brazilian market considerations (CPF validation).