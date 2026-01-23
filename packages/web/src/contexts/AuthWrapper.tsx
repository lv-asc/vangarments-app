'use client';

import React, { createContext, useContext } from 'react';
import { AuthProvider, useAuth as useRealAuth, ActiveAccount } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AlertProvider } from './AlertContext';

export type { ActiveAccount };

// Create a context for the unified auth (now just mirrors real auth)
const UnifiedAuthContext = createContext<any>(null);

function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const realAuth = useRealAuth();
  return (
    <UnifiedAuthContext.Provider value={realAuth}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthWrapper');
  }
  return context;
}

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <ThemeProvider initialTheme={user?.preferences?.theme || 'auto'}>
      {children}
    </ThemeProvider>
  );
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AlertProvider>
        <UnifiedAuthProvider>
          <ThemeLoader>
            {children}
          </ThemeLoader>
        </UnifiedAuthProvider>
      </AlertProvider>
    </AuthProvider>
  );
}