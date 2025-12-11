// @ts-nocheck
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function SyncStatus() {
  const { syncStatus, forcSync } = useOfflineSync();

  // Hide sync status in development mode to avoid annoying overlays
  const isDevMode = typeof window !== 'undefined' &&
    (localStorage.getItem('devMode') === 'true' || process.env.NODE_ENV === 'development');

  if (isDevMode) {
    return null;
  }

  const getStatusInfo = () => {
    if (!syncStatus.isOnline) {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Offline',
        subtext: `${syncStatus.pendingItems} alterações pendentes`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      };
    }

    if (syncStatus.isSyncing) {
      return {
        icon: ArrowPathIcon,
        text: 'Sincronizando...',
        subtext: 'Enviando alterações',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        animate: true,
      };
    }

    if (syncStatus.pendingItems > 0) {
      return {
        icon: CloudArrowUpIcon,
        text: 'Pendente',
        subtext: `${syncStatus.pendingItems} alterações para sincronizar`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      };
    }

    return {
      icon: CheckCircleIcon,
      text: 'Sincronizado',
      subtext: syncStatus.lastSyncTime
        ? `Última sync: ${syncStatus.lastSyncTime.toLocaleTimeString()}`
        : 'Tudo em dia',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-20 right-4 z-40 ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg shadow-lg p-3 max-w-xs`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <IconComponent
              className={`h-5 w-5 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </div>
            <div className="text-xs text-gray-600">
              {statusInfo.subtext}
            </div>
          </div>
          {!syncStatus.isOnline && (
            <div className="flex-shrink-0">
              <WifiIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {syncStatus.pendingItems > 0 && syncStatus.isOnline && !syncStatus.isSyncing && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={forcSync}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Sincronizar agora
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}