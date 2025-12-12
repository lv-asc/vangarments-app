// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import { useToast } from '@/components/ui/Toast';
import {
  CameraIcon,
  PencilIcon,
  CogIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  usernameLastChanged?: string;
  email: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  cpf?: string;
  birthDate?: string;
  socialLinks?: { platform: string; url: string }[];
  roles?: string[];
  createdAt: string;
  stats: {
    wardrobeItems: number;
    outfitsCreated: number;
    followers: number;
    following: number;
  };
  preferences?: {
    style: string[];
    brands: string[];
    colors: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

const SOCIAL_PLATFORMS = [
  'Instagram', 'YouTube', 'Snapchat', 'Pinterest', 'TikTok',
  'Facebook', 'Spotify', 'Apple Music', 'YouTube Music'
];

const AVAILABLE_ROLES = [
  { id: 'common_user', label: 'Common User' },
  { id: 'influencer', label: 'Influencer' },
  { id: 'model', label: 'Model' },
  { id: 'journalist', label: 'Journalist' },
  { id: 'brand_owner', label: 'Brand Owner' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'stylist', label: 'Stylist' },
  { id: 'independent_reseller', label: 'Independent Reseller' },
  { id: 'store_owner', label: 'Store Owner' },
  { id: 'fashion_designer', label: 'Fashion Designer' },
  { id: 'sewer', label: 'Sewer' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Username state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    profileImage: '',
    socialLinks: [] as { platform: string; url: string }[],
    roles: [] as string[]
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getUserProfile(user.id);
      setUserProfile(response.profile);
      if (response.profile) {
        setEditForm({
          name: response.profile.name || '',
          username: response.profile.username || '',
          bio: response.profile.bio || '',
          profileImage: response.profile.profileImage || '',
          socialLinks: response.profile.socialLinks || [],
          roles: response.profile.roles || ['common_user']
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Falha ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Check username availability with debounce
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 1) {
      setUsernameStatus('invalid');
      setUsernameError('Username is required');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{1,30}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Only letters, numbers, and underscore allowed');
      return;
    }

    // Don't check if same as current username
    if (username === userProfile?.username) {
      setUsernameStatus('available');
      setUsernameError(null);
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    try {
      const result = await apiClient.checkUsernameAvailability(username);
      if (result.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(result.error || 'Username is already taken');
      }
    } catch (err) {
      setUsernameStatus('idle');
      setUsernameError('Failed to check username');
    }
  }, [userProfile?.username]);

  // Debounced username change handler
  const handleUsernameChange = (value: string) => {
    setEditForm({ ...editForm, username: value });

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Set new timeout for debounced check
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsername(value);
    }, 500);
  };

  // Calculate days until username can be changed
  const getUsernameChangeCooldown = () => {
    if (!userProfile?.usernameLastChanged) return null;
    const lastChanged = new Date(userProfile.usernameLastChanged);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return null;
    return Math.ceil(7 - daysSince);
  };

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        profileImage: userProfile.profileImage || '',
        socialLinks: userProfile.socialLinks || [],
        roles: userProfile.roles || ['common_user']
      });
      setUsernameStatus('idle');
      setUsernameError(null);
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    // Check if username is valid before saving
    const usernameChanged = editForm.username !== userProfile.username;
    if (usernameChanged && usernameStatus !== 'available') {
      toast.error('Please choose a valid, available username before saving');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateProfile({
        name: editForm.name,
        username: usernameChanged ? editForm.username : undefined,
        bio: editForm.bio,
        socialLinks: editForm.socialLinks.filter(link => link.url && link.url.trim() !== ''),
        roles: editForm.roles
      });
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      if (err.daysRemaining) {
        toast.error(`Cannot change username: ${err.daysRemaining} days remaining in cooldown`);
      } else {
        toast.error('Failed to save profile: ' + errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    try {
      await apiClient.uploadAvatar(file);
      await loadProfile();
      await refreshAuth();
      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error('Failed to upload image: ' + (err.message || 'Unknown error'));
    }
  };


  // ... (Authentication and Loading checks remain same)
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-50"><Header /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="bg-blue-50 border border-blue-200 rounded-lg p-6"><h1 className="text-xl font-bold text-blue-900 mb-2">Acesse seu Perfil</h1><p className="text-blue-700 mb-4">Faça login para acessar e gerenciar seu perfil.</p><Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700 text-white">Fazer Login</Button></div></main></div>;
  if (loading) return <div className="min-h-screen bg-gray-50"><Header /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d]"></div></div></main></div>;
  if (error && !userProfile) return <div className="min-h-screen bg-gray-50"><Header /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="bg-red-50 border border-red-200 rounded-lg p-6"><h1 className="text-xl font-bold text-red-900 mb-2">Erro ao carregar perfil</h1><p className="text-red-700 mb-4">{error}</p><Button onClick={loadProfile}>Tentar Novamente</Button></div></main></div>;
  if (!userProfile) return <div className="min-h-screen bg-gray-50"><Header /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="bg-blue-50 border border-blue-200 rounded-lg p-6"><h1 className="text-xl font-bold text-blue-900 mb-2">Perfil não encontrado</h1><p className="text-blue-700 mb-4">Não foi possível carregar seu perfil.</p><Button onClick={loadProfile}>Tentar Novamente</Button></div></main></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {userProfile.bannerImage && (
            <div className="relative -m-6 mb-6 h-32 bg-gradient-to-r from-[#00132d] to-[#1e3a5f] rounded-t-lg overflow-hidden">
              <img
                src={userProfile.bannerImage}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              {userProfile.profileImage ? (
                <img
                  src={getImageUrl(userProfile.profileImage)}
                  alt={userProfile.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-[#00132d] rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-[#fff7d7] text-2xl font-bold">
                    {userProfile.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#00132d] text-[#fff7d7] p-2 rounded-full hover:bg-[#00132d]/90 transition-colors shadow-lg cursor-pointer">
                <CameraIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-[#00132d] focus:outline-none focus:border-[#00132d]/70"
                    placeholder="Your name"
                  />

                  {/* Username Field */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    {(() => {
                      const cooldownDays = getUsernameChangeCooldown();
                      if (cooldownDays) {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              ⏳ Username can only be changed once every 7 days.
                              <strong> {cooldownDays} day{cooldownDays > 1 ? 's' : ''} remaining.</strong>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Current: @{userProfile.username}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="relative">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">@</span>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => handleUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${usernameStatus === 'available' ? 'border-green-300 focus:ring-green-200' :
                                usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-300 focus:ring-red-200' :
                                  'border-gray-300 focus:ring-[#00132d]/20'
                                }`}
                              placeholder="username"
                              maxLength={30}
                            />
                            <div className="ml-2 w-6">
                              {usernameStatus === 'checking' && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00132d]"></div>
                              )}
                              {usernameStatus === 'available' && (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              )}
                              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                                <XCircleIcon className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>
                          {usernameError && (
                            <p className="text-sm text-red-600 mt-1">{usernameError}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">1-30 characters, letters, numbers, and underscore only</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Roles Selection */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Experiences (Roles)</h4>
                    <p className="text-sm text-gray-500 mb-2">Select the experiences you want to have access to:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => {
                        const isSelected = editForm.roles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              const newRoles = isSelected
                                ? editForm.roles.filter(r => r !== role.id)
                                : [...editForm.roles, role.id];
                              setEditForm({ ...editForm, roles: newRoles });
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${isSelected
                              ? 'bg-[#00132d] text-[#fff7d7] border-[#00132d]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#00132d]'
                              }`}
                          >
                            {role.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#00132d] resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />

                  <div className="space-y-3 mt-4">
                    <h4 className="font-medium text-gray-700">Social Links</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {SOCIAL_PLATFORMS.map((platform) => {
                        const existingLink = editForm.socialLinks.find(l => l.platform === platform);
                        return (
                          <div key={platform} className="flex items-center space-x-2">
                            <span className="w-28 text-sm text-gray-600">{platform}</span>
                            <input
                              type="text"
                              value={existingLink ? existingLink.url : ''}
                              onChange={(e) => {
                                const newLinks = [...editForm.socialLinks];
                                const idx = newLinks.findIndex(l => l.platform === platform);
                                if (idx >= 0) {
                                  if (e.target.value) {
                                    newLinks[idx].url = e.target.value;
                                  } else {
                                    newLinks.splice(idx, 1);
                                  }
                                } else if (e.target.value) {
                                  newLinks.push({ platform, url: e.target.value });
                                }
                                setEditForm({ ...editForm, socialLinks: newLinks });
                              }}
                              className="flex-1 text-sm border-gray-200 rounded-md focus:border-[#00132d] focus:ring-[#00132d]"
                              placeholder={`Your ${platform} URL or handle`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || (editForm.username !== userProfile.username && usernameStatus !== 'available')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center ${isSaving || (editForm.username !== userProfile.username && usernameStatus !== 'available')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00132d] text-[#fff7d7] hover:bg-[#00132d]/90'
                        }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {userProfile.name}
                    </h1>
                    <button
                      onClick={handleEditProfile}
                      className="text-gray-500 hover:text-[#00132d] transition-colors"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-1">@{userProfile.username}</p>

                  {/* Roles Display */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {userProfile.roles && userProfile.roles.map((roleId) => {
                      const role = AVAILABLE_ROLES.find(r => r.id === roleId) || { label: roleId };
                      return (
                        <span key={roleId} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 font-medium">
                          {role.label}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{userProfile.email}</p>

                  {userProfile.bio && (
                    <p className="text-gray-700 mb-3">{userProfile.bio}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
                      </div>
                      {userProfile.birthDate && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">|</span>
                          <span>Born {new Date(userProfile.birthDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {userProfile.cpf && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">|</span>
                          <span>CPF: {userProfile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')}</span>
                        </div>
                      )}
                    </div>

                    {userProfile.socialLinks && userProfile.socialLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {userProfile.socialLinks.map((link) => (
                          <a
                            key={link.platform}
                            href={link.url.startsWith('http') ? link.url : `https://${link.platform.toLowerCase()}.com/${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors"
                          >
                            {link.platform}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Settings Button */}
            {!isEditing && (
              <button
                onClick={() => window.location.href = '/settings'}
                className="bg-[#fff7d7] text-[#00132d] px-4 py-2 rounded-lg hover:bg-[#fff7d7]/70 transition-colors flex items-center space-x-2"
              >
                <CogIcon className="h-5 w-5" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.wardrobeItems}</div>
            <div className="text-sm text-gray-600">Wardrobe Items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.outfitsCreated}</div>
            <div className="text-sm text-gray-600">Outfits Created</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.followers}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.following}</div>
            <div className="text-sm text-gray-600">Following</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'wardrobe', name: 'Wardrobe' },
                { id: 'outfits', name: 'Outfits' },
                { id: 'activity', name: 'Activity' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-[#00132d] text-[#00132d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                {userProfile.preferences && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Favorite Styles</h4>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.preferences.style.map((style) => (
                            <span key={style} className="px-3 py-1 bg-[#fff7d7] text-[#00132d] rounded-full text-sm">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Preferred Brands</h4>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.preferences.brands.map((brand) => (
                            <span key={brand} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {brand}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Favorite Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.preferences.colors.map((color) => (
                            <span key={color} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          ${userProfile.preferences.priceRange.min} - ${userProfile.preferences.priceRange.max}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Fashion Journey</h3>
                  <p className="text-gray-600 mb-6">
                    Continue building your digital wardrobe and connect with the fashion community.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#fff7d7] p-4 rounded-lg">
                      <h4 className="font-semibold text-[#00132d] mb-2">Add Items</h4>
                      <p className="text-sm text-gray-600">You have {userProfile.stats.wardrobeItems} items cataloged</p>
                    </div>
                    <div className="bg-[#fff7d7] p-4 rounded-lg">
                      <h4 className="font-semibold text-[#00132d] mb-2">Create Outfits</h4>
                      <p className="text-sm text-gray-600">Mix and match your items</p>
                    </div>
                    <div className="bg-[#fff7d7] p-4 rounded-lg">
                      <h4 className="font-semibold text-[#00132d] mb-2">Share Style</h4>
                      <p className="text-sm text-gray-600">{userProfile.stats.followers} followers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wardrobe' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Wardrobe Items</h3>
                  <a href="/wardrobe" className="text-[#00132d] hover:text-[#00132d]/70 text-sm font-medium">
                    View All →
                  </a>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-600">Wardrobe items will be displayed here.</p>
                  <Button onClick={() => window.location.href = '/wardrobe'} className="mt-4">
                    Go to Wardrobe
                  </Button>
                </div>
              </div>
            )}

            {activeTab !== 'overview' && activeTab !== 'wardrobe' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p className="text-gray-600">This section is currently being developed.</p>
              </div>
            )}
          </div>
        </div>
      </main >
      <toast.ToastComponent />
    </div >
  );
}
