'use client';

import React, { createContext, useContext } from 'react';
import { AuthProvider, useAuth as useRealAuth, ActiveAccount } from './AuthContext';

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

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UnifiedAuthProvider>
        {children}
      </UnifiedAuthProvider>
    </AuthProvider>
  );
}