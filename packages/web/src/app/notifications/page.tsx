'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getImageUrl } from '@/utils/imageUrl';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { NotificationPreferences } from '@/components/profile/NotificationPreferences';

interface Notification {
    id: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    actor?: {
        id: string;
        name: string;
        username: string;
        avatarUrl?: string;
    };
    entity?: {
        id: string;
        name: string;
        logo?: string;
        slug?: string;
    };
}

export default function NotificationsPage() {
    const { isAuthenticated } = useAuth();
    const { refreshCounts } = useNotifications();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

    const fetchNotifications = async () => {
        try {
            const response: any = await apiClient.get('/notifications', {
                params: { unreadOnly: filter === 'unread' }
            });
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated, filter]);

    const markAsRead = async (id: string) => {
        try {
            await apiClient.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await refreshCounts();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            await refreshCounts();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiClient.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
                    <p className="text-gray-600">You need to be logged in to view notifications</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
                        <p className="text-gray-600">Stay updated with your latest activity</p>
                    </div>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'notifications'
                                ? 'bg-[#00132d] text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <BellIcon className="w-4 h-4" />
                            <span>Notifications</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings'
                                ? 'bg-[#00132d] text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'notifications' ? (
                    <>

                        {/* Filter and Actions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Unread
                                    </button>
                                </div>
                                <Button onClick={markAllAsRead} variant="secondary" size="sm">
                                    <CheckIcon className="w-4 h-4 mr-2" />
                                    Mark all as read
                                </Button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">Loading notifications...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                                    <p className="text-gray-500">
                                        {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet"}
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:border-blue-300 ${!notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4 flex-1 min-w-0">
                                                {/* Actor Avatar / Entity Logo */}
                                                <div className="flex-shrink-0">
                                                    {notification.actor ? (
                                                        <UserAvatar
                                                            user={{
                                                                name: notification.actor.name,
                                                                avatar: notification.actor.avatarUrl
                                                            }}
                                                            size="md"
                                                        />
                                                    ) : notification.entity ? (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                            {notification.entity.logo ? (
                                                                <img
                                                                    src={getImageUrl(notification.entity.logo)}
                                                                    alt={notification.entity.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 font-bold">{notification.entity.name[0]}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <BellIcon className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        {notification.actor ? (
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-semibold text-gray-900">{notification.actor.name}</span>
                                                                <span className="text-sm text-gray-500">@{notification.actor.username}</span>
                                                            </div>
                                                        ) : notification.entity ? (
                                                            <span className="font-semibold text-gray-900">{notification.entity.name}</span>
                                                        ) : (
                                                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                                        )}

                                                        {!notification.isRead && (
                                                            <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0"></span>
                                                        )}
                                                    </div>

                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {notification.actor || notification.entity ? (
                                                            <span>{notification.title}: {notification.message}</span>
                                                        ) : (
                                                            notification.message
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span>{getTimeAgo(notification.createdAt)}</span>
                                                        {notification.link && (
                                                            <Link href={notification.link} className="text-blue-600 font-medium hover:underline">
                                                                View Details
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
                        <p className="text-sm text-gray-500 mb-8">Manage how and when you receive notifications.</p>
                        <NotificationPreferences />
                    </div>
                )}
            </div>
        </div>
    );
}
