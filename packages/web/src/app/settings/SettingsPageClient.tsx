'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthWrapper';
import { Button } from '@/components/ui/Button';
import {
    UserIcon,
    BellIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    BuildingOffice2Icon,
    SparklesIcon,
    BuildingStorefrontIcon,
    DocumentTextIcon,
    TruckIcon,
    NewspaperIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProfileSettings } from '@/components/profile/AccountPreferences';
import { AppPreferences } from '@/components/profile/AppPreferences';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { useEffect } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuth as useGlobalAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user, isAuthenticated, logout, refreshAuth, disconnectOAuth, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [disconnectProvider, setDisconnectProvider] = useState<'google' | 'facebook' | null>(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'google_connected') {
            toast.success('Google account connected successfully!');
            refreshAuth();
            router.replace('/settings');
        } else if (success === 'facebook_connected') {
            toast.success('Facebook account connected successfully!');
            refreshAuth();
            router.replace('/settings');
        } else if (error === 'google_id_taken') {
            toast.error('This Google account is already linked to another user.');
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
    }, [searchParams]);

    // Auto-sync if googleId exists but googleData is missing
    useEffect(() => {
        if (activeTab === 'connections' && user?.googleId && !user?.googleData) {
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
    }, [activeTab]);

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
        { id: 'profile', name: 'Profile', icon: UserIcon },
        { id: 'preferences', name: 'Preferences', icon: SparklesIcon },
        { id: 'connections', name: 'Connected Accounts', icon: LockClosedIcon },
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
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
                                <ProfileSettings />
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">App Preferences</h2>
                                <AppPreferences />
                            </div>
                        )}

                        {activeTab === 'connections' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Connected Accounts</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your linked social accounts for easier login.</p>

                                <div className="space-y-4">
                                    {/* Google Account */}
                                    {user?.googleId ? (
                                        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                                        <path d="M12 4.36c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Google Account</span>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    Connected
                                                </span>
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
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => {
                                                        setDisconnectProvider('google');
                                                        setIsDisconnectModalOpen(true);
                                                    }}
                                                >
                                                    Disconnect
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
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Facebook Account</span>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    Connected
                                                </span>
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
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => {
                                                        setDisconnectProvider('facebook');
                                                        setIsDisconnectModalOpen(true);
                                                    }}
                                                >
                                                    Disconnect
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
                                </div>
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
                title={`Disconnect ${disconnectProvider === 'google' ? 'Google' : 'Facebook'} Account`}
                message={`Are you sure you want to disconnect your ${disconnectProvider === 'google' ? 'Google' : 'Facebook'} account? You will no longer be able to sign in using ${disconnectProvider === 'google' ? 'Google' : 'Facebook'}, but your account data will remain intact.`}
                confirmText="Disconnect"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDisconnecting}
            />
        </div>
    );
}
