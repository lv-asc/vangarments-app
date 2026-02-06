// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/flags';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/contexts/AuthWrapper';
import VerificationRequestModal from '@/components/verification/VerificationRequestModal';
import {
  BellIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CheckBadgeIcon,
  ClockIcon,
  TicketIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

export function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    birthDate: user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
    gender: user?.gender ?? '',
    location: user?.location ?? { country: '', state: '', city: '' }
  });

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { setTheme } = useTheme();

  // No need for theme effect here anymore

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      await updateProfile({
        preferences: {
          ...user?.preferences,
          ...preferences
        }
      });
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: 'en-US', name: 'English (US)', flag: 'US' },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const themes = [
    { value: 'light', name: 'Light', icon: <SunIcon className="h-5 w-5" /> },
    { value: 'dark', name: 'Dark', icon: <MoonIcon className="h-5 w-5" /> },
    { value: 'auto', name: 'System', icon: <ComputerDesktopIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg">
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">@</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birth Date</label>
            <input
              type="date"
              value={profile.birthDate}
              onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
            <textarea
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others about your style..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <VerificationRequestModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        requestType="user"
      />
    </div>
  );
}