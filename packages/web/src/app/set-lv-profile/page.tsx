'use client';

import { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { SimpleHeader } from '@/components/layout/SimpleHeader';
import { toast } from 'react-hot-toast';

export default function SetLVProfilePage() {
  const { userProfile, updateUserProfile } = useData();

  const setLVProfile = () => {
    // You'll need to save the uploaded image to your public folder first
    // For now, I'll create a placeholder that you can replace with the actual image URL
    const lvImageUrl = '/assets/images/lv-profile.jpg'; // You'll need to save the image here

    updateUserProfile({
      name: 'LV',
      username: 'lv_fashion',
      email: 'lv@vangarments.com',
      bio: 'Fashion enthusiast and style creator. Always exploring new trends and combinations.',
      profileImage: lvImageUrl
    });

    toast.success('LV profile updated! (Note: You need to save the image to /public/assets/images/lv-profile.jpg)');
  };

  const setLVProfileWithPlaceholder = () => {
    // Using a similar style image from Unsplash as placeholder
    const placeholderUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';

    updateUserProfile({
      name: 'LV',
      username: 'lv_fashion',
      email: 'lv@vangarments.com',
      bio: 'Fashion enthusiast and style creator. Always exploring new trends and combinations. Green cap lover 🧢',
      profileImage: placeholderUrl
    });

    toast.success('LV profile updated with placeholder image!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Set LV Profile Picture</h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                To use your uploaded image:
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Save your uploaded image to: <code className="bg-blue-100 px-2 py-1 rounded">/public/assets/images/lv-profile.jpg</code></li>
                <li>Click "Set LV Profile with Uploaded Image" below</li>
                <li>The profile will update with your image</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Profile:</h3>
              {userProfile ? (
                <div className="flex items-center space-x-4">
                  {userProfile.profileImage ? (
                    <img
                      src={userProfile.profileImage}
                      alt="Current profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#00132d] rounded-full flex items-center justify-center">
                      <span className="text-[#fff7d7] text-xl font-bold">
                        {userProfile.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p><strong>Name:</strong> {userProfile.name}</p>
                    <p><strong>Username:</strong> @{userProfile.username}</p>
                    <p><strong>Bio:</strong> {userProfile.bio || 'No bio set'}</p>
                  </div>
                </div>
              ) : (
                <p>No profile found</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={setLVProfile}
                className="bg-[#00132d] text-[#fff7d7] px-6 py-3 rounded-lg hover:bg-[#00132d]/90 transition-colors"
              >
                Set LV Profile with Uploaded Image
              </button>

              <button
                onClick={setLVProfileWithPlaceholder}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Set LV Profile with Placeholder
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Manual Steps to Add Your Image:
              </h3>
              <div className="text-yellow-800 space-y-2">
                <p>1. <strong>Save the image:</strong> Right-click your uploaded image and save it</p>
                <p>2. <strong>Create folder:</strong> Create <code className="bg-yellow-100 px-2 py-1 rounded">public/assets/images/</code> if it doesn't exist</p>
                <p>3. <strong>Name the file:</strong> Save as <code className="bg-yellow-100 px-2 py-1 rounded">lv-profile.jpg</code></p>
                <p>4. <strong>Click the button:</strong> Use "Set LV Profile with Uploaded Image"</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Alternative: Base64 Method
              </h3>
              <p className="text-green-800 mb-4">
                You can also convert your image to base64 and paste it directly into the code.
              </p>
              <div className="bg-green-100 p-4 rounded">
                <p className="text-sm text-green-700">
                  Use an online base64 converter, then replace the <code>lvImageUrl</code> in the code with:
                  <br />
                  <code>data:image/jpeg;base64,YOUR_BASE64_STRING</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}