'use client';

import { useState } from 'react';
import { SimpleHeader } from '@/components/layout/SimpleHeader';
import { useAuth } from '@/contexts/AuthWrapper';
import { useData } from '@/contexts/DataContext';
import { 
  CameraIcon, 
  PencilIcon, 
  CogIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function SimpleProfilePage() {
  const { user } = useAuth();
  const { userProfile, wardrobeItems, updateUserProfile, isLoading } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profileImage: ''
  });

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        bio: userProfile.bio || '',
        profileImage: userProfile.profileImage || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => {
    if (userProfile) {
      console.log('💾 Saving profile:', editForm);
      updateUserProfile({
        name: editForm.name,
        bio: editForm.bio,
        profileImage: editForm.profileImage
      });
      setIsEditing(false);
      alert('Profile saved successfully!');
    }
  };

  const handleImageUpload = () => {
    // For demo purposes, cycle through some sample profile images
    const sampleImages = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    ];
    
    const currentIndex = sampleImages.findIndex(img => img === userProfile?.profileImage);
    const nextIndex = (currentIndex + 1) % sampleImages.length;
    const newImage = sampleImages[nextIndex];
    
    console.log('🖼️ Updating profile image:', { currentIndex, nextIndex, newImage });
    updateUserProfile({ profileImage: newImage });
    alert('Profile photo updated!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d]"></div>
          </div>
        </main>
      </div>
    );
  }

  // If no user profile, show login prompt
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-blue-900 mb-2">Access Your Profile</h1>
            <p className="text-blue-700 mb-4">Please log in to access and manage your profile.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Log In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
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
                  src={userProfile.profileImage}
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
              <button 
                onClick={handleImageUpload}
                className="absolute bottom-0 right-0 bg-[#00132d] text-[#fff7d7] p-2 rounded-full hover:bg-[#00132d]/90 transition-colors shadow-lg"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
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
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#00132d] resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
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
                  <p className="text-sm text-gray-500 mb-3">{userProfile.email}</p>
                  
                  {userProfile.bio && (
                    <p className="text-gray-700 mb-3">{userProfile.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Settings Button */}
            {!isEditing && (
              <button className="bg-[#fff7d7] text-[#00132d] px-4 py-2 rounded-lg hover:bg-[#fff7d7]/70 transition-colors flex items-center space-x-2">
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
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
                  <h3 className="text-lg font-semibold text-gray-900">Recent Items</h3>
                  <a href="/wardrobe-simple" className="text-[#00132d] hover:text-[#00132d]/70 text-sm font-medium">
                    View All →
                  </a>
                </div>
                {wardrobeItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {wardrobeItems.slice(0, 8).map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-600">{item.brand}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No wardrobe items yet. Start adding your favorite pieces!</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab !== 'overview' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p className="text-gray-600">This section is currently being developed.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}