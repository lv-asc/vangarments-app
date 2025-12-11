// @ts-nocheck
'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, WarningIcon, InfoIcon, MegaphoneIcon } from '@/components/ui/icons';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-500 to-emerald-600',
          icon: <CheckIcon className="text-white" size="md" />,
          border: 'border-green-200'
        };
      case 'error':
        return {
          bg: 'from-red-500 to-rose-600',
          icon: <XIcon className="text-white" size="md" />,
          border: 'border-red-200'
        };
      case 'warning':
        return {
          bg: 'from-yellow-500 to-orange-500',
          icon: <WarningIcon className="text-white" size="md" />,
          border: 'border-yellow-200'
        };
      case 'info':
        return {
          bg: 'from-blue-500 to-cyan-600',
          icon: <InfoIcon className="text-white" size="md" />,
          border: 'border-blue-200'
        };
      default:
        return {
          bg: 'from-gray-500 to-gray-600',
          icon: <MegaphoneIcon className="text-white" size="md" />,
          border: 'border-gray-200'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const styles = getNotificationStyles(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`bg-white rounded-xl shadow-lg border-2 ${styles.border} overflow-hidden relative`}
            >
              {/* Gradient header */}
              <div className={`h-1 bg-gradient-to-r ${styles.bg}`} />

              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{styles.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {notification.message}
                    </p>

                    {notification.action && (
                      <button
                        onClick={notification.action.onClick}
                        className={`mt-2 text-sm font-medium bg-gradient-to-r ${styles.bg} text-white px-3 py-1 rounded-lg hover:shadow-md transition-all duration-200`}
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar for auto-dismiss */}
              {notification.duration !== 0 && (
                <motion.div
                  className={`h-1 bg-gradient-to-r ${styles.bg} opacity-30`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Utility hook for common notification patterns
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ type: 'success', title, message, action });
    },
    error: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ type: 'error', title, message, action, duration: 0 });
    },
    warning: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ type: 'warning', title, message, action });
    },
    info: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ type: 'info', title, message, action });
    }
  };
};