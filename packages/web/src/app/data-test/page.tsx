'use client';

import { useData } from '@/contexts/DataContext';
import { SimpleHeader } from '@/components/layout/SimpleHeader';

export default function DataTestPage() {
  const { userProfile, wardrobeItems, marketplaceItems, isLoading, updateUserProfile, addWardrobeItem } = useData();

  const testAddItem = () => {
    addWardrobeItem({
      name: 'Test Item',
      category: 'Tops',
      subcategory: 'T-Shirts',
      brand: 'Test Brand',
      color: 'Red',
      size: 'M',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
      description: 'Test item for debugging',
      condition: 'new',
      tags: ['test']
    });
  };

  const testUpdateProfile = () => {
    if (userProfile) {
      updateUserProfile({
        name: 'Updated Name',
        bio: 'Updated bio from test page'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d] mx-auto"></div>
            <p className="mt-4">Loading data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Data Context Test</h1>
          
          <div className="space-y-6">
            {/* User Profile Test */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-2">User Profile</h2>
              {userProfile ? (
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Name:</strong> {userProfile.name}</p>
                  <p><strong>Email:</strong> {userProfile.email}</p>
                  <p><strong>Bio:</strong> {userProfile.bio || 'No bio'}</p>
                  <p><strong>Wardrobe Items:</strong> {userProfile.stats.wardrobeItems}</p>
                  <p><strong>Profile Image:</strong> {userProfile.profileImage ? 'Set' : 'Not set'}</p>
                  <button 
                    onClick={testUpdateProfile}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Test Update Profile
                  </button>
                </div>
              ) : (
                <p className="text-red-500">No user profile found</p>
              )}
            </div>

            {/* Wardrobe Items Test */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-2">Wardrobe Items ({wardrobeItems.length})</h2>
              <button 
                onClick={testAddItem}
                className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Test Add Item
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wardrobeItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded">
                    <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />
                    <p><strong>{item.name}</strong></p>
                    <p>{item.brand} • {item.color}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplace Items Test */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Marketplace Items ({marketplaceItems.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded">
                    <img src={item.images[0]} alt={item.description} className="w-full h-32 object-cover rounded mb-2" />
                    <p><strong>{item.brand}</strong></p>
                    <p>${item.price} • {item.condition}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Storage Debug */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Local Storage Debug</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>User Profile in localStorage:</strong> {localStorage.getItem('vangarments_user_profile') ? 'Found' : 'Not found'}</p>
                <p><strong>Wardrobe Items in localStorage:</strong> {localStorage.getItem('vangarments_wardrobe_items') ? 'Found' : 'Not found'}</p>
                <p><strong>Marketplace Items in localStorage:</strong> {localStorage.getItem('vangarments_marketplace_items') ? 'Found' : 'Not found'}</p>
                
                <button 
                  onClick={() => {
                    console.log('User Profile:', localStorage.getItem('vangarments_user_profile'));
                    console.log('Wardrobe Items:', localStorage.getItem('vangarments_wardrobe_items'));
                    console.log('Marketplace Items:', localStorage.getItem('vangarments_marketplace_items'));
                  }}
                  className="mt-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Log localStorage to Console
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}