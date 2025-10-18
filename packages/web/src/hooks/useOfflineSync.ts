import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/utils/offlineStorage';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime?: Date;
  error?: string;
}

export function useOfflineSync() {
  // Disable sync in development mode
  const isDevMode = process.env.NODE_ENV === 'development';
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: isDevMode ? true : navigator.onLine,
    isSyncing: false,
    pendingItems: 0,
  });

  useEffect(() => {
    // Skip all sync functionality in development mode
    if (isDevMode) {
      return;
    }
    
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start periodic sync
    syncManager.startPeriodicSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncManager.stopPeriodicSync();
    };
  }, [isDevMode]);

  const forceSync = useCallback(async () => {
    // No-op in development mode
    if (isDevMode) {
      console.log('🔧 DEV: Sync disabled in development mode');
      return;
    }
    
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      await syncManager.syncNow();
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date(),
        error: undefined 
      }));
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [isDevMode, syncStatus.isOnline, syncStatus.isSyncing]);

  return {
    syncStatus,
    forcSync: forceSync,
  };
}