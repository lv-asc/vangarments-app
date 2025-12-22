'use client';

import { useState } from 'react';

import { useAuth } from '@/contexts/AuthWrapper';
import { Button } from '@/components/ui/Button';
import {
    UserIcon,
    BellIcon,
    ShieldCheckIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { AccountPreferences } from '@/components/profile/AccountPreferences';

export default function SettingsPage() {
    const { user, isAuthenticated, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('account');

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
        { id: 'account', name: 'Account', icon: UserIcon },
        { id: 'notifications', name: 'Notifications', icon: BellIcon },
        { id: 'privacy', name: 'Privacy & Security', icon: ShieldCheckIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            {/* @ts-ignore */}
                            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    </div>
                    <Button
                        onClick={logout}
                        className="bg-white border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                        Sign Out
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                        <nav className="p-4 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-[#00132d] text-[#fff7d7]'
                                            : 'text-gray-700 hover:bg-gray-100'
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
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Preferences</h2>
                                    <p className="text-sm text-gray-500 mb-6">Manage your personal information and app preferences.</p>
                                    <AccountPreferences />
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="text-center py-12">
                                {/* @ts-ignore */}
                                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                                <p className="text-gray-500 mt-2">Notification settings coming soon.</p>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="text-center py-12">
                                {/* @ts-ignore */}
                                <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Privacy & Security</h3>
                                <p className="text-gray-500 mt-2">Privacy settings coming soon.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
