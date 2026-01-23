'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthWrapper';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { ProfileSettings } from '@/components/profile/AccountPreferences';
import { AppPreferences } from '@/components/profile/AppPreferences';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { EmailStatus } from '@/components/profile/EmailStatus';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SyncProfileModal } from '@/components/profile/SyncProfileModal';
import { ConnectAppleCalendarModal } from '@/components/profile/ConnectAppleCalendarModal';
import { apiClient } from '@/lib/api';
import { googleCalendarApi } from '@/lib/calendarApi';
import {
    CalendarIcon,
    UserIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    SparklesIcon,
    LockClosedIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
    const { user, isAuthenticated, logout, refreshAuth, disconnectOAuth, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [disconnectProvider, setDisconnectProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // Sync Modal State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncProvider, setSyncProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAppleCalendarModalOpen, setIsAppleCalendarModalOpen] = useState(false);
    const [appleCalendarConnected, setAppleCalendarConnected] = useState(false);
    const [appleCalendarEmail, setAppleCalendarEmail] = useState<string | null>(null);
    const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
    const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'google_connected') {
            toast.success('Google account connected successfully!');
            refreshAuth();
            router.replace('/settings');
        } else if (success === 'apple_connected') {
            toast.success('Apple account connected successfully!');
            refreshAuth();
            router.replace('/settings');
        } else if (success === 'facebook_connected') {
            toast.success('Facebook account connected successfully!');
            refreshAuth();
            router.replace('/settings');
        } else if (error === 'google_id_taken') {
            toast.error('This Google account is already linked to another user.');
            router.replace('/settings');
        } else if (error === 'apple_id_taken') {
            toast.error('This Apple account is already linked to another user.');
            router.replace('/settings');
        } else if (error === 'facebook_id_taken') {
            toast.error('This Facebook account is already linked to another user.');
            router.replace('/settings');
        } else if (error === 'config_missing') {
            toast.error('Connect failed: Server-side configuration is missing. Please check the backend .env file.');
            router.replace('/settings');
        } else if (error) {
            toast.error('Failed to connect account.');
            router.replace('/settings');
        }

        checkCalendarStatuses();
    }, [searchParams, refreshAuth, router]);

    const checkCalendarStatuses = async () => {
        await Promise.all([
            checkAppleCalendarStatus(),
            checkGoogleCalendarStatus()
        ]);
    };

    const checkGoogleCalendarStatus = async () => {
        try {
            const token = await apiClient.getToken();
            if (!token) return;
            const response = await googleCalendarApi.getStatus(token);
            if (response.connected) {
                setGoogleCalendarConnected(true);
                setGoogleCalendarEmail(response.email || null);
            } else {
                setGoogleCalendarConnected(false);
                setGoogleCalendarEmail(null);
            }
        } catch (error) {
            console.error('Failed to fetch Google Calendar status:', error);
        }
    };

    const checkAppleCalendarStatus = async () => {
        try {
            const response = await apiClient.getAppleCalendarStatus();
            if (response.success) {
                setAppleCalendarConnected(response.data.connected);
                setAppleCalendarEmail(response.data.email);
            }
        } catch (error) {
            console.error('Failed to fetch Apple Calendar status:', error);
        }
    };

    // Auto-sync if googleId exists but googleData is missing
    useEffect(() => {
        if (activeTab === 'account' && user?.googleId && !user?.googleData) {
            // Only auto-sync if we haven't tried in this session to avoid loops
            const hasAttemptedSync = sessionStorage.getItem('google_sync_attempted');
            if (!hasAttemptedSync) {
                sessionStorage.setItem('google_sync_attempted', 'true');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                window.location.href = `${apiUrl}/oauth/google/connect?userId=${user?.id}`;
            }
        }
    }, [activeTab, user]);

    // Refresh auth when switching tabs to ensure data is fresh
    useEffect(() => {
        if (isAuthenticated) {
            refreshAuth();
        }
    }, [activeTab, isAuthenticated, refreshAuth]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                        <p className="text-gray-600 mb-4">Please log in to manage your settings.</p>
                        <Button onClick={() => window.location.href = '/login'}>Log In</Button>
                    </div>
                </main>
            </div>
        );
    }

    const tabs = [
        { id: 'account', name: 'Account & Security', icon: LockClosedIcon },
        { id: 'preferences', name: 'Preferences', icon: SparklesIcon },
        { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            {/* @ts-ignore */}
                            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    </div>
                    <Button
                        onClick={logout}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400"
                    >
                        Sign Out
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <nav className="p-4 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-[#00132d] text-[#fff7d7]'
                                            : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {/* @ts-ignore */}
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content */}
                    <section className="flex-1 p-6 md:p-8">
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account & Security</h2>

                                <EmailStatus />

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Connected Accounts</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your linked social accounts for easier login.</p>

                                    <div className="space-y-4">
                                        {/* Google Account */}
                                        {user?.googleId ? (
                                            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                                            <path d="M12 4.36c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                        </svg>
                                                        <span className="text-base font-bold text-gray-900 dark:text-white">Google Account</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                            Connected
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30"
                                                            onClick={() => {
                                                                setDisconnectProvider('google');
                                                                setIsDisconnectModalOpen(true);
                                                            }}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-5">
                                                    <div className="relative">
                                                        {user.googleData?.picture ? (
                                                            <img src={user.googleData.picture} alt="" className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-700 shadow-md" />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
                                                                <UserIcon className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.googleData?.name || 'Google User'}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.googleData?.email}</p>

                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                            {user.googleData?.gender && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                    <span className="font-medium mr-1">Gender:</span>
                                                                    <span className="capitalize">{user.googleData.gender}</span>
                                                                </div>
                                                            )}
                                                            {user.googleData?.birthday && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                    <span className="font-medium mr-1">Birthday:</span>
                                                                    {user.googleData.birthday.day}/{user.googleData.birthday.month}/{user.googleData.birthday.year}
                                                                </div>
                                                            )}
                                                            {user.googleData?.phone && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                    <span className="font-medium mr-1">Phone:</span> {user.googleData.phone}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Log In with Google Account</p>
                                                                <p className="text-xs text-gray-500">Enable sign-in via Google.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => updateProfile({ googleSigninEnabled: !user.googleSigninEnabled })}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.googleSigninEnabled !== false ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.googleSigninEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                            window.location.href = `${apiUrl}/oauth/google/connect?userId=${user?.id}`;
                                                        }}
                                                        className="flex-1 max-w-[240px] text-gray-600 hover:text-gray-700 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        Update Account Info
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            setSyncProvider('google');
                                                            setIsSyncModalOpen(true);
                                                        }}
                                                        className="flex-1 max-w-[320px] text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-800"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        <span className="flex items-center gap-1.5">
                                                            Sync Info w/
                                                            <img
                                                                src="/assets/images/logo-header.svg"
                                                                alt="Vangarments"
                                                                className="h-3 w-auto object-contain opacity-80"
                                                                style={{ filter: 'brightness(0)' }}
                                                            />
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                                                    <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                                        <path d="M12 4.36c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                    <span>Google Account</span>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                    window.location.href = `${apiUrl}/oauth/google/connect?userId=${user?.id}`;
                                                }}>
                                                    Connect
                                                </Button>
                                            </div>
                                        )}

                                        {/* Facebook Account */}
                                        {user?.facebookId ? (
                                            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                        </svg>
                                                        <span className="text-base font-bold text-gray-900 dark:text-white">Facebook Account</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                            Connected
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30"
                                                            onClick={() => {
                                                                setDisconnectProvider('facebook');
                                                                setIsDisconnectModalOpen(true);
                                                            }}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-5">
                                                    <div className="relative">
                                                        {user.facebookData?.picture ? (
                                                            <img src={user.facebookData.picture} alt="" className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-700 shadow-md" />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
                                                                <UserIcon className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.facebookData?.name || 'Facebook User'}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.facebookData?.email}</p>

                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                            {user.facebookData?.gender && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                    <span className="font-medium mr-1">Gender:</span>
                                                                    <span className="capitalize">{user.facebookData.gender}</span>
                                                                </div>
                                                            )}
                                                            {user.facebookData?.birthday && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                    <span className="font-medium mr-1">Birthday:</span> {user.facebookData.birthday}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Log In with Facebook Account</p>
                                                                <p className="text-xs text-gray-500">Enable sign-in via Facebook.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => updateProfile({ facebookSigninEnabled: !user.facebookSigninEnabled })}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.facebookSigninEnabled !== false ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.facebookSigninEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                            window.location.href = `${apiUrl}/oauth/facebook/connect?userId=${user?.id}`;
                                                        }}
                                                        className="flex-1 max-w-[240px] text-gray-600 hover:text-gray-700 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        Update Account Info
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            setSyncProvider('facebook');
                                                            setIsSyncModalOpen(true);
                                                        }}
                                                        className="flex-1 max-w-[320px] text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-800"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        <span className="flex items-center gap-1.5">
                                                            Sync Info w/
                                                            <img
                                                                src="/assets/images/logo-header.svg"
                                                                alt="Vangarments"
                                                                className="h-3 w-auto object-contain opacity-80"
                                                                style={{ filter: 'brightness(0)' }}
                                                            />
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                                                    <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                    <span>Facebook Account</span>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                    window.location.href = `${apiUrl}/oauth/facebook/connect?userId=${user?.id}`;
                                                }}>
                                                    Connect
                                                </Button>
                                            </div>
                                        )}

                                        {/* Apple Account */}
                                        {(user as any)?.appleId ? (
                                            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.062 14.125a3.172 3.172 0 0 1 1.5-2.625 3.328 3.328 0 0 0-2.625-1.437c-1.125-.125-2.187.687-2.75.687-.563 0-1.438-.687-2.375-.687-1.25 0-2.375.687-3 1.813-1.313 2.25-.313 5.5.938 7.375.625.875 1.375 1.875 2.312 1.813.875-.063 1.25-.625 2.313-.625 1.062 0 1.375.625 2.312.563 1 .063 1.625-.875 2.25-1.813.75-1.063 1.062-2.063 1.062-2.125a.068.068 0 0 0-.062-.063h-.063c-.062 0-1.5-.563-1.5-2.875zM14.625 8.125a3.344 3.344 0 0 0 .75-2.3.1.1 0 0 0-.125-.125 3.25 3.25 0 0 0-2.375 1.188 3.12 3.12 0 0 0-.813 2.25.1.1 0 0 0 .125.125 3.12 3.12 0 0 0 2.438-1.138z" />
                                                        </svg>
                                                        <span className="text-base font-bold text-gray-900 dark:text-white">Apple Account</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                            Connected
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30"
                                                            onClick={() => {
                                                                setDisconnectProvider('apple');
                                                                setIsDisconnectModalOpen(true);
                                                            }}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-5">
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
                                                        <UserIcon className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{(user as any).appleData?.name || 'Apple User'}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{(user as any).appleData?.email}</p>

                                                        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Log In with Apple ID</p>
                                                                <p className="text-xs text-gray-500">Enable sign-in via Apple.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => updateProfile({ appleSigninEnabled: !(user as any).appleSigninEnabled })}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${(user as any).appleSigninEnabled !== false ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(user as any).appleSigninEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                            window.location.href = `${apiUrl}/oauth/apple/connect?userId=${user?.id}`;
                                                        }}
                                                        className="flex-1 max-w-[240px] text-gray-600 hover:text-gray-700 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        Update Account Info
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => {
                                                            setSyncProvider('apple');
                                                            setIsSyncModalOpen(true);
                                                        }}
                                                        className="flex-1 max-w-[320px] text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-800"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                                        <span className="flex items-center gap-1.5">
                                                            Sync Info w/
                                                            <img
                                                                src="/assets/images/logo-header.svg"
                                                                alt="Vangarments"
                                                                className="h-3 w-auto object-contain opacity-80"
                                                                style={{ filter: 'brightness(0)' }}
                                                            />
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                                                    <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.062 14.125a3.172 3.172 0 0 1 1.5-2.625 3.328 3.328 0 0 0-2.625-1.437c-1.125-.125-2.187.687-2.75.687-.563 0-1.438-.687-2.375-.687-1.25 0-2.375.687-3 1.813-1.313 2.25-.313 5.5.938 7.375.625.875 1.375 1.875 2.312 1.813.875-.063 1.25-.625 2.313-.625 1.062 0 1.375.625 2.312.563 1 .063 1.625-.875 2.25-1.813.75-1.063 1.062-2.063 1.062-2.125a.068.068 0 0 0-.062-.063h-.063c-.062 0-1.5-.563-1.5-2.875zM14.625 8.125a3.344 3.344 0 0 0 .75-2.3.1.1 0 0 0-.125-.125 3.25 3.25 0 0 0-2.375 1.188 3.12 3.12 0 0 0-.813 2.25.1.1 0 0 0 .125.125 3.12 3.12 0 0 0 2.438-1.138z" />
                                                    </svg>
                                                    <span>Apple Account</span>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                    window.location.href = `${apiUrl}/oauth/apple/connect?userId=${user?.id}`;
                                                }}>
                                                    Connect
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Calendar Integrations</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Connect your calendars to sync Vangarments events directly.</p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Google Calendar */}
                                        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                                                        <img src="/icons/google-calendar.png" alt="Google Calendar" className="h-5 w-5 object-contain" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-base font-bold text-gray-900 dark:text-white leading-none">Google Calendar</span>
                                                        <span className="text-xs text-gray-500 mt-1 block">Sync via Google OAuth</span>
                                                    </div>
                                                </div>
                                                {googleCalendarConnected ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50">
                                                        Not Connected
                                                    </span>
                                                )}
                                            </div>

                                            {googleCalendarConnected && (
                                                <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Linked Email</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{googleCalendarEmail}</p>
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                {!googleCalendarConnected ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-gray-200"
                                                        onClick={() => {
                                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                                            window.location.href = `${apiUrl}/oauth/google/connect?userId=${user?.id}`;
                                                        }}
                                                    >
                                                        Connect Google
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={async () => {
                                                                toast.promise(
                                                                    apiClient.syncSKUs(),
                                                                    {
                                                                        loading: 'Testing sync...',
                                                                        success: 'Google Calendar sync test successful!',
                                                                        error: 'Sync test failed. Check your connection.',
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            Sync Test
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                setDisconnectProvider('google');
                                                                setIsDisconnectModalOpen(true);
                                                            }}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Apple Calendar */}
                                        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-transparent rounded-full p-0 shadow-sm overflow-hidden">
                                                        <img src="/icons/apple-calendar-real.png" alt="Apple Calendar" className="h-8 w-8 object-contain" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-base font-bold text-gray-900 dark:text-white leading-none">Apple Calendar</span>
                                                        <span className="text-xs text-gray-500 mt-1 block">Sync via iCloud CalDAV</span>
                                                    </div>
                                                </div>
                                                {appleCalendarConnected ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50">
                                                        Not Connected
                                                    </span>
                                                )}
                                            </div>

                                            {appleCalendarConnected && (
                                                <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Linked iCloud Email</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{appleCalendarEmail}</p>
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                {!appleCalendarConnected ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-gray-200"
                                                        onClick={() => setIsAppleCalendarModalOpen(true)}
                                                    >
                                                        Connect Apple
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={async () => {
                                                                toast.promise(
                                                                    apiClient.syncSKUs(),
                                                                    {
                                                                        loading: 'Testing sync...',
                                                                        success: 'Apple Calendar sync test successful!',
                                                                        error: 'Sync test failed. Check your connection.',
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            Sync Test
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                // Use a different mechanism if needed, but for now we'll just open the disconnect modal
                                                                setDisconnectProvider('apple');
                                                                setIsDisconnectModalOpen(true);
                                                            }}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">App Preferences</h2>
                                <AppPreferences />
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Privacy Settings</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Control who can see your information and content.</p>
                                <PrivacySettings />
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <ConfirmationModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={async () => {
                    if (!disconnectProvider) return;
                    setIsDisconnecting(true);
                    try {
                        await disconnectOAuth(disconnectProvider);
                        setIsDisconnectModalOpen(false);
                    } catch (error) {
                        toast.error(`Failed to disconnect ${disconnectProvider} account`);
                    } finally {
                        setIsDisconnecting(false);
                    }
                }}
                title={`Disconnect ${disconnectProvider === 'google' ? 'Google' : disconnectProvider === 'apple' ? 'Apple' : 'Facebook'} Account`}
                message={`Are you sure you want to disconnect your ${disconnectProvider === 'google' ? 'Google' : disconnectProvider === 'apple' ? 'Apple' : 'Facebook'} account? You will no longer be able to sign in using ${disconnectProvider === 'google' ? 'Google' : disconnectProvider === 'apple' ? 'Apple' : 'Facebook'}, but your account data will remain intact.`}
                confirmText="Disconnect"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDisconnecting}
            />

            {user && (
                <SyncProfileModal
                    isOpen={isSyncModalOpen}
                    onClose={() => setIsSyncModalOpen(false)}
                    provider={syncProvider as 'google' | 'facebook' | 'apple'}
                    currentProfile={user as any}
                    providerData={syncProvider === 'google' ? user.googleData : syncProvider === 'apple' ? (user as any).appleData : user.facebookData}
                    isLoading={isSyncing}
                    onSync={async (updates) => {
                        setIsSyncing(true);
                        try {
                            await updateProfile(updates);
                            toast.success('Profile synced successfully!');
                            setIsSyncModalOpen(false);
                        } catch (error) {
                            console.error('Sync error:', error);
                            toast.error('Failed to sync profile');
                        } finally {
                            setIsSyncing(false);
                        }
                    }}
                />
            )}
            {user && (
                <ConnectAppleCalendarModal
                    isOpen={isAppleCalendarModalOpen}
                    onClose={() => setIsAppleCalendarModalOpen(false)}
                    onConnected={() => {
                        refreshAuth();
                        // Force a status check immediately after connection
                        setTimeout(() => checkCalendarStatuses(), 500);
                    }}
                />
            )}
        </div>
    );
}
