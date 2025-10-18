'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthProvider, useAuth as useRealAuth } from './AuthContext';
import { MockAuthProvider, useMockAuth } from './MockAuthContext';

// Create a context for the unified auth
const UnifiedAuthContext = createContext<any>(null);

// Component that provides the unified auth context
function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevMode] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Get both auth contexts
  const mockAuth = useMockAuth();
  const realAuth = useRealAuth();

  useEffect(() => {
    const isDev = localStorage.getItem('devMode') === 'true';
    setDevMode(isDev);
    
    // Initialize auth after setting dev mode
    setTimeout(() => {
      setAuthReady(true);
    }, 100);

    // Listen for dev mode changes
    const handleStorageChange = () => {
      const isDev = localStorage.getItem('devMode') === 'true';
      setDevMode(isDev);
    };

    // Custom event listener for dev mode changes
    const handleDevModeChange = (event: CustomEvent) => {
      setDevMode(event.detail.enabled);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('devModeChange' as any, handleDevModeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('devModeChange' as any, handleDevModeChange);
    };
  }, []);

  // Auto-enable dev mode in development environment
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !devMode) {
      localStorage.setItem('devMode', 'true');
      setDevMode(true);
    }
  }, [devMode]);

  // Choose the appropriate auth based on dev mode
  const currentAuth = devMode ? mockAuth : realAuth;

  if (!authReady) {
    return (
      <UnifiedAuthContext.Provider value={{
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
        updateProfile: async () => {},
        refreshAuth: async () => {},
      }}>
        {children}
      </UnifiedAuthContext.Provider>
    );
  }

  return (
    <UnifiedAuthContext.Provider value={currentAuth}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

// Hook to use the unified auth
export function useAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthWrapper');
  }
  return context;
}

// Wrapper component that provides both auth contexts
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MockAuthProvider>
        <UnifiedAuthProvider>
          {children}
        </UnifiedAuthProvider>
      </MockAuthProvider>
    </AuthProvider>
  );
}