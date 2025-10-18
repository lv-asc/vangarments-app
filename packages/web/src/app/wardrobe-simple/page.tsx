'use client';

import { useState } from 'react';
import { SimpleHeader } from '@/components/layout/SimpleHeader';
import { useData } from '@/contexts/DataContext';
import { PlusIcon, HeartIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function SimpleWardrobePage() {
  const { wardrobeItems, addWardrobeItem, updateWardrobeItem, deleteWardrobeItem, isLoading } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const handleAddItem = () => {
    // For demo purposes, add a sample item
    const sampleItems = [
      {
        name: 'Striped Cotton T-Shirt',
        category: 'Tops',
        subcategory: 'T-Shirts',
        brand: 'Uniqlo',
        color: 'Navy/White',
        size: 'M',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
        description: 'Comfortable striped cotton t-shirt perfect for casual wear',
        price: 19.99,
        condition: 'new' as const,
        tags: ['casual', 'comfortable', 'everyday']
      },
      {
        name: 'Denim Jacket',
        category: 'Outerwear',
        subcategory: 'Jackets',
        brand: 'Levi\'s',
        color: 'Blue',
        size: 'M',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop',
        description: 'Classic denim jacket for layering',
        price: 79.99,
        condition: 'excellent' as const,
        tags: ['classic', 'versatile', 'denim']
      },
      {
        name: 'Summer Floral Dress',
        category: 'Dresses',
        subcategory: 'Summer Dresses',
        brand: 'Zara',
        color: 'Pink Floral',
        size: 'S',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop',
        description: 'Light and airy summer dress with beautiful floral pattern',
        price: 45.99,
        condition: 'good' as const,
        tags: ['summer', 'feminine', 'floral']
      }
    ];
    
    const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    console.log('➕ Adding wardrobe item:', randomItem);
    addWardrobeItem(randomItem);
    alert(`Added "${randomItem.name}" to your wardrobe!`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Wardrobe
              </h1>
              <p className="text-gray-600 mt-1">
                {wardrobeItems.length} items in your collection
              </p>
            </div>
            <button 
              onClick={handleAddItem}
              className="flex items-center space-x-2 bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {wardrobeItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#00132d] rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-[#fff7d7]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Your Digital Wardrobe
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first items to begin organizing and discovering new combinations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-[#fff7d7] p-4 rounded-lg">
                  <h4 className="font-semibold text-[#00132d] mb-2">Smart Cataloging</h4>
                  <p className="text-sm text-gray-600">AI-powered item recognition and categorization</p>
                </div>
                <div className="bg-[#fff7d7] p-4 rounded-lg">
                  <h4 className="font-semibold text-[#00132d] mb-2">Style Suggestions</h4>
                  <p className="text-sm text-gray-600">Get personalized outfit recommendations</p>
                </div>
                <div className="bg-[#fff7d7] p-4 rounded-lg">
                  <h4 className="font-semibold text-[#00132d] mb-2">Social Sharing</h4>
                  <p className="text-sm text-gray-600">Share your looks with the community</p>
                </div>
              </div>
              
              <button 
                onClick={handleAddItem}
                className="mt-6 bg-[#00132d] text-[#fff7d7] px-6 py-3 rounded-lg hover:bg-[#00132d]/90 transition-colors"
              >
                Add Your First Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wardrobeItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      {favorites.has(item.id) ? (
                        <HeartSolidIcon className="h-4 w-4 text-red-500" />
                      ) : (
                        <HeartIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.condition === 'new' ? 'bg-green-100 text-green-800' :
                      item.condition === 'excellent' ? 'bg-blue-100 text-blue-800' :
                      item.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                      item.condition === 'fair' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.condition}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        className="p-1 text-gray-400 hover:text-[#00132d] transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteWardrobeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">{item.brand}</span></p>
                    <p>{item.category} • {item.size}</p>
                    <p className="text-[#00132d] font-medium">{item.color}</p>
                    {item.price && (
                      <p className="text-green-600 font-medium">${item.price}</p>
                    )}
                  </div>
                  
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-[#fff7d7] text-[#00132d] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {selectedItem === item.id && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{item.description}</p>
                      {item.purchaseDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}