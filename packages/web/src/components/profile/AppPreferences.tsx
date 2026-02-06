'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import {
    GlobeAltIcon,
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    CurrencyDollarIcon,
    QueueListIcon
} from '@heroicons/react/24/outline';

export function AppPreferences() {
    const { user, updateProfile } = useAuth();
    const { setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const [prefs, setPrefs] = useState({
        language: user?.preferences?.language ?? 'en-US',
        currency: user?.preferences?.currency ?? 'USD',
        theme: user?.preferences?.theme ?? 'auto',
        display: {
            itemsPerPage: user?.preferences?.display?.itemsPerPage ?? 20,
            defaultView: user?.preferences?.display?.defaultView ?? 'grid'
        }
    });

    // Sync local state when user data loads or changes
    useEffect(() => {
        if (user?.preferences) {
            setPrefs({
                language: user.preferences.language ?? 'en-US',
                currency: user.preferences.currency ?? 'USD',
                theme: user.preferences.theme ?? 'auto',
                display: {
                    itemsPerPage: user.preferences.display?.itemsPerPage ?? 20,
                    defaultView: user.preferences.display?.defaultView ?? 'grid'
                }
            });
        }
    }, [user]);

    const languages = [
        { code: 'en-US', name: 'English (US)' },
    ];

    const currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
        { code: 'EUR', name: 'Euro', symbol: '€' }
    ];

    const themes = [
        { value: 'light', name: 'Light', icon: SunIcon },
        { value: 'dark', name: 'Dark', icon: MoonIcon },
        { value: 'auto', name: 'System', icon: ComputerDesktopIcon }
    ];

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateProfile({
                preferences: {
                    ...user?.preferences,
                    ...prefs
                }
            });
            toast.success('Preferences saved successfully');
        } catch (error) {
            toast.error('Failed to save preferences');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Theme Section */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <SunIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = prefs.theme === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setPrefs({ ...prefs, theme: t.value });
                                    setTheme(t.value as any); // Instant preview
                                }}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isActive
                                    ? t.value === 'dark'
                                        ? 'bg-[#00132d] border-[#00132d] text-white shadow-md'
                                        : 'bg-[#fff7d7] border-[#00132d] text-[#00132d] shadow-md'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00132d]'
                                    }`}
                            >
                                <Icon className={`h-6 w-6 mb-2 ${isActive ? t.value === 'dark' ? 'text-white' : 'text-[#00132d]' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium">{t.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Language & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <GlobeAltIcon className="h-4 w-4 mr-2" />
                        Language
                    </label>
                    <select
                        value={prefs.language}
                        onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        Currency
                    </label>
                    <select
                        value={prefs.currency}
                        onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                    </select>
                </div>
            </div>

            {/* Display */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <QueueListIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Display</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items per page</label>
                        <select
                            value={prefs.display.itemsPerPage}
                            onChange={(e) => setPrefs({ ...prefs, display: { ...prefs.display, itemsPerPage: parseInt(e.target.value) } })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} items</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default View</label>
                        <select
                            value={prefs.display.defaultView}
                            onChange={(e) => setPrefs({ ...prefs, display: { ...prefs.display, defaultView: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                            <option value="masonry">Masonry</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <Button onClick={handleSave} loading={isLoading} className="bg-[#00132d] hover:bg-[#00132d]/90 text-white min-w-[120px]">
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
