'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './AuthWrapper';

interface NotificationContextType {
    unreadNotificationCount: number;
    unreadMessageCount: number;
    notificationPreferences: {
        showNotificationBadge: boolean;
        showMessageBadge: boolean;
    };
    refreshCounts: () => Promise<void>;
    updatePreferences: (preferences: {
        showNotificationBadge?: boolean;
        showMessageBadge?: boolean;
    }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [notificationPreferences, setNotificationPreferences] = useState({
        showNotificationBadge: true,
        showMessageBadge: true
    });

    const refreshCounts = async () => {
        if (!isAuthenticated) {
            setUnreadNotificationCount(0);
            setUnreadMessageCount(0);
            return;
        }

        try {
            // Fetch notification count
            const notificationResponse = await apiClient.get('/notifications/unread-count');
            setUnreadNotificationCount(notificationResponse.count || 0);

            // Fetch message count
            const messageResponse = await apiClient.get('/api/messages/unread-count');
            setUnreadMessageCount(messageResponse.data?.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notification counts:', error);
        }
    };

    const updatePreferences = async (preferences: {
        showNotificationBadge?: boolean;
        showMessageBadge?: boolean;
    }) => {
        try {
            const response = await apiClient.put('/api/users/preferences/notifications', preferences);

            if (response.preferences) {
                setNotificationPreferences(response.preferences);
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    };

    // Load user preferences on mount
    useEffect(() => {
        if (user?.notificationPreferences) {
            setNotificationPreferences(user.notificationPreferences);
        }
    }, [user]);

    // Refresh counts on mount and every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        refreshCounts();

        const interval = setInterval(refreshCounts, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const value: NotificationContextType = {
        unreadNotificationCount,
        unreadMessageCount,
        notificationPreferences,
        refreshCounts,
        updatePreferences
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
