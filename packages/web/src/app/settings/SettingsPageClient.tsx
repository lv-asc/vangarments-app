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
        { id: 'entities', name: 'My Entities', icon: BuildingOffice2Icon },
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

                        {activeTab === 'entities' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-1">My Entities</h2>
                                    <p className="text-sm text-gray-500 mb-6">Manage your brands, stores, and other business entities.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user?.linkedEntities?.hasBrand && (
                                        <Link href="/admin?tab=brands" className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00132d] hover:shadow-sm transition-all group">
                                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                                <SparklesIcon className="w-6 h-6 text-purple-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">My Brands</h4>
                                                <p className="text-sm text-gray-500">Manage your fashion brands</p>
                                            </div>
                                        </Link>
                                    )}
                                    {user?.linkedEntities?.hasStore && (
                                        <Link href="/admin/stores" className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00132d] hover:shadow-sm transition-all group">
                                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                <BuildingStorefrontIcon className="w-6 h-6 text-blue-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">My Stores</h4>
                                                <p className="text-sm text-gray-500">Manage your retail locations</p>
                                            </div>
                                        </Link>
                                    )}
                                    {user?.linkedEntities?.hasPage && (
                                        <Link href="/admin/pages" className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00132d] hover:shadow-sm transition-all group">
                                            <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                                                <DocumentTextIcon className="w-6 h-6 text-pink-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">My Pages</h4>
                                                <p className="text-sm text-gray-500">Manage your content pages</p>
                                            </div>
                                        </Link>
                                    )}
                                    {user?.linkedEntities?.hasSupplier && (
                                        <Link href="/admin/suppliers" className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00132d] hover:shadow-sm transition-all group">
                                            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                                <TruckIcon className="w-6 h-6 text-orange-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">My Suppliers</h4>
                                                <p className="text-sm text-gray-500">Manage supply chain</p>
                                            </div>
                                        </Link>
                                    )}
                                    {user?.linkedEntities?.hasPost && (
                                        <Link href="/profile?tab=posts" className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00132d] hover:shadow-sm transition-all group">
                                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                                <NewspaperIcon className="w-6 h-6 text-green-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">My Posts</h4>
                                                <p className="text-sm text-gray-500">Manage your articles</p>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Admin Panel Link */}
                                    {user?.roles?.includes('admin') && (
                                        <Link href="/admin" className="flex items-center p-4 bg-gray-50 border border-gray-300 rounded-lg hover:border-gray-900 hover:shadow-sm transition-all group col-span-1 md:col-span-2">
                                            <div className="p-2 bg-gray-200 rounded-lg group-hover:bg-gray-300 transition-colors">
                                                <LockClosedIcon className="w-6 h-6 text-gray-700" />
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-gray-900">Admin Panel</h4>
                                                <p className="text-sm text-gray-500">Access system administration</p>
                                            </div>
                                        </Link>
                                    )}
                                </div>

                                {!user?.linkedEntities?.hasBrand && !user?.linkedEntities?.hasStore && !user?.linkedEntities?.hasPage && !user?.linkedEntities?.hasSupplier && !user?.linkedEntities?.hasPost && !user?.roles?.includes('admin') && (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                        <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">No Entities Yet</h3>
                                        <p className="text-gray-500 mt-2">You don't have any brands, stores, or other entities linked to your account.</p>
                                    </div>
                                )}
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
