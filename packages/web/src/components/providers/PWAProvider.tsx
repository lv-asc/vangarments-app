'use client';

import { useEffect } from 'react';
import { registerServiceWorker, monitorNetworkStatus, requestNotificationPermission } from '@/lib/pwa';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Monitor network status
    monitorNetworkStatus();
    
    // Request notification permission after user interaction
    const requestPermissionOnInteraction = () => {
      requestNotificationPermission();
      // Remove listener after first interaction
      document.removeEventListener('click', requestPermissionOnInteraction);
      document.removeEventListener('touchstart', requestPermissionOnInteraction);
    };
    
    // Wait for user interaction before requesting permissions
    document.addEventListener('click', requestPermissionOnInteraction);
    document.addEventListener('touchstart', requestPermissionOnInteraction);
    
    return () => {
      document.removeEventListener('click', requestPermissionOnInteraction);
      document.removeEventListener('touchstart', requestPermissionOnInteraction);
    };
  }, []);

  return <>{children}</>;
}