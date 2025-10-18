'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navigationService, NavigationState } from '@/lib/navigation';

interface NavigationContextType {
  navigationState: NavigationState;
  isNavigationReady: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>(
    navigationService.getCurrentState()
  );
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Initialize navigation service
  useEffect(() => {
    console.log('🔧 NavigationProvider: Initializing navigation service');
    
    // Set router in navigation service
    navigationService.setRouter(router);
    
    // Setup browser navigation handling
    const cleanup = navigationService.setupBrowserNavigation();
    
    // Subscribe to navigation state changes
    const unsubscribe = navigationService.subscribe((state) => {
      console.log('🔧 NavigationProvider: Navigation state updated', state);
      setNavigationState(state);
    });

    // Mark navigation as ready
    setIsNavigationReady(true);
    console.log('✅ NavigationProvider: Navigation service ready');

    return () => {
      unsubscribe();
      if (cleanup) cleanup();
    };
  }, [router]);

  // Update current path when pathname changes
  useEffect(() => {
    if (isNavigationReady) {
      console.log('🔧 NavigationProvider: Pathname changed', { pathname });
      navigationService.updateCurrentPath(pathname);
    }
  }, [pathname, isNavigationReady]);

  // Debug navigation in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isNavigationReady) {
      console.log('🔧 NavigationProvider: Debug info');
      navigationService.debugNavigation();
    }
  }, [isNavigationReady]);

  const contextValue: NavigationContextType = {
    navigationState,
    isNavigationReady
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}