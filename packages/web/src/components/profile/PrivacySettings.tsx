'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { PrivacyVisibility, PrivacySettings as PrivacySettingsType } from '@vangarments/shared';
import {
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const VISIBILITY_OPTIONS: { value: PrivacyVisibility; label: string; icon: any; description: string }[] = [
  {
    value: 'public',
    label: 'Public',
    icon: EyeIcon,
    description: 'Anyone on Vangarments can see this.'
  },
  {
    value: 'friends',
    label: 'Friends Only',
    icon: UserGroupIcon,
    description: 'Only users you follow and who follow you back.'
  },
  {
    value: 'private',
    label: 'Private',
    icon: EyeSlashIcon,
    description: 'Only you can see this.'
  },
  {
    value: 'custom',
    label: 'Custom',
    icon: AdjustmentsHorizontalIcon,
    description: 'Specific people allowed or blocked.'
  }
];

interface PrivacyField {
  key: keyof PrivacySettingsType;
  label: string;
}

const PRIVACY_FIELDS: PrivacyField[] = [
  { key: 'wardrobe', label: 'Wardrobe' },
  { key: 'likedItems', label: 'Liked Items' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'posts', label: 'Posts' },
  { key: 'birthDate', label: 'Birth Date' },
  { key: 'gender', label: 'Gender' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'country', label: 'Country' },
  { key: 'state', label: 'State' },
  { key: 'city', label: 'City' },
  { key: 'telephone', label: 'Phone Number' },
];

export function PrivacySettings() {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<PrivacySettingsType>(user?.privacySettings || {
    height: 'private',
    weight: 'private',
    birthDate: 'private',
    gender: 'public',
    country: 'public',
    state: 'public',
    city: 'public',
    wardrobe: 'public',
    likedItems: 'public',
    wishlist: 'public',
    posts: 'public',
    telephone: 'private'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        privacySettings: settings
      });
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFieldVisibility = (field: keyof PrivacySettingsType, visibility: PrivacyVisibility) => {
    setSettings(prev => ({
      ...prev,
      [field]: visibility
    }));
    setExpandedField(null);
  };

  const updateAllVisibility = (visibility: PrivacyVisibility) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      PRIVACY_FIELDS.forEach(field => {
        newSettings[field.key as keyof PrivacySettingsType] = visibility as any;
      });
      return newSettings;
    });
    toast.success(`All fields set to ${visibility}`);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Update Section */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Bulk Privacy Update</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {VISIBILITY_OPTIONS.filter(opt => opt.value !== 'custom').map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateAllVisibility(opt.value)}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm"
            >
              <opt.icon className="w-3.5 h-3.5" />
              <span>Set all to {opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PRIVACY_FIELDS.map((field) => {
          const currentVisibility = settings[field.key as keyof PrivacySettingsType] as PrivacyVisibility;
          const option = VISIBILITY_OPTIONS.find(o => o.value === currentVisibility) || VISIBILITY_OPTIONS[2];
          const Icon = option.icon;

          return (
            <div key={field.key} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900/50">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">{field.label}</h4>
                  <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <Icon className="w-4 h-4 mr-1.5" />
                    <span>{option.label}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedField(expandedField === field.key ? null : (field.key as string))}
                  className="dark:border-gray-700"
                >
                  Change
                  <ChevronDownIcon className={`ml-2 w-4 h-4 transition-transform ${expandedField === field.key ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {expandedField === field.key && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const isActive = settings[field.key as keyof PrivacySettingsType] === opt.value;
                    const OptIcon = opt.icon;

                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateFieldVisibility(field.key as keyof PrivacySettingsType, opt.value)}
                        className={`flex items-start p-3 rounded-lg text-left transition-all border ${isActive
                          ? 'bg-[#00132d] border-[#00132d] text-white'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/10'
                          }`}
                      >
                        <div className={`p-2 rounded-md mr-3 ${isActive ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <OptIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
                          <p className={`text-xs mt-0.5 leading-tight ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <Button
          onClick={handleSave}
          loading={isLoading}
          className="bg-[#00132d] hover:bg-[#00132d]/90 text-white min-w-[120px]"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}