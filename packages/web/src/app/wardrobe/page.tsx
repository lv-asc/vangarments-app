'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
// Removed ProtectedRoute for development accessibility
import { useAuth } from '@/contexts/AuthWrapper';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { useWardrobeSync } from '@/hooks/useWardrobeSync';
import { useDevWardrobe } from '@/hooks/useDevWardrobe';
import { WardrobeItemSkeleton } from '@/components/ui/LoadingSkeleton';
import { debounce } from '@/lib/utils';

// Lazy load heavy components
const AddItemModal = dynamic(() => import('@/components/wardrobe/AddItemModal').then(mod => ({ default: mod.AddItemModal })), {
  ssr: false,
});

// Temporarily disabled due to rendering issues
// const WardrobeItemCard = dynamic(() => import('@/components/wardrobe/WardrobeItemCard').then(mod => ({ default: mod.WardrobeItemCard })), {
//   loading: () => <WardrobeItemSkeleton />,
//   ssr: false,
// });

const WardrobeDataManager = dynamic(() => import('@/components/dev/WardrobeDataManager'), {
  ssr: false,
});

// Removed DevModeBypass - using direct access for development

// No mock data - all data comes from real user interactions and API calls

export default function WardrobePage() {
  const { user } = useAuth();
  
  // Show wardrobe even without user in development mode
  const canAccessWardrobe = user || (process.env.NODE_ENV === 'development');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Always use dev wardrobe in development mode
  const isDevMode = process.env.NODE_ENV === 'development';
  
  const prodWardrobe = useWardrobeSync();
  const devWardrobe = useDevWardrobe();
  
  const wardrobeHook = isDevMode ? devWardrobe : prodWardrobe;

  // Debug info for development
  if (isDevMode) {
    console.log('🔧 Wardrobe Debug:', {
      isDevMode,
      usingDevHook: isDevMode,
      itemsCount: wardrobeHook.items.length,
      loading: wardrobeHook.loading,
      error: wardrobeHook.error
    });
  }
  
  const {
    items: wardrobeItems,
    loading,
    error,
    syncing,
    isOnline,
    createItem,
    updateItem,
    deleteItem,
    loadItems,
    syncOfflineItems,
  } = wardrobeHook;

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'tops', label: 'Blusas' },
    { value: 'bottoms', label: 'Calças' },
    { value: 'dresses', label: 'Vestidos' },
    { value: 'shoes', label: 'Calçados' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'outerwear', label: 'Casacos' },
  ];

  const handleAddItem = async (images: File[], itemData: any) => {
    try {
      await createItem(images, itemData);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleEditItem = (item: any) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    try {
      // This would need to be implemented in the API
      console.log('Toggle favorite:', itemId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleToggleForSale = async (itemId: string) => {
    try {
      // This would need to be implemented in the API
      console.log('Toggle for sale:', itemId);
    } catch (error) {
      console.error('Failed to toggle for sale:', error);
    }
  };

  const handleSyncOffline = async () => {
    try {
      const result = await syncOfflineItems();
      console.log('Sync result:', result);
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  const handleViewItem = (item: any) => {
    // TODO: Implement item detail view
    console.log('View item:', item);
  };

  // Filter items and reload when filters change
  const handleFilterChange = async () => {
    const filters = {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      searchQuery: searchQuery || undefined,
    };
    await loadItems(filters);
  };

  // Debounced search to improve performance
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        searchQuery: query || undefined,
      };
      loadItems(filters);
    }, 300),
    [selectedCategory, loadItems]
  );

  // Apply filters when search or category changes
  React.useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  React.useEffect(() => {
    handleFilterChange();
  }, [selectedCategory]);

  // Memoize filtered items to prevent unnecessary re-renders
  const filteredItems = useMemo(() => wardrobeItems, [wardrobeItems]);



  // Show login prompt if no access
  if (!canAccessWardrobe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-blue-900 mb-2">Acesse seu Guarda-roupa</h1>
            <p className="text-blue-700 mb-4">Faça login para acessar e gerenciar seu guarda-roupa digital.</p>
            <Button 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fazer Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        <SyncStatus />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Meu Guarda-roupa
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-gray-600">
                  {wardrobeItems.length} peças catalogadas
                </p>
                {!isOnline && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Offline
                  </span>
                )}
                {syncing && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Sincronizando...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isOnline && (
                <Button 
                  variant="outline"
                  onClick={handleSyncOffline}
                  disabled={syncing}
                  className="flex items-center space-x-2"
                >
                  <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </Button>
              )}
              <Button 
                className="flex items-center space-x-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Adicionar Peça</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <WardrobeDataManager onDataChange={() => loadItems()} />
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar peças..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00132d]"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-[#00132d] transition-colors">
                <FunnelIcon className="h-5 w-5" />
                <span>Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(8)].map((_, i) => (
              <WardrobeItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => loadItems()}>
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Items Grid */}
        {!loading && !error && filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="aspect-[3/4] bg-[#fff7d7] rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-[#00132d] text-sm">Item Preview</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {item.name || 'Wardrobe Item'}
                </h3>
                <p className="text-sm text-gray-600">
                  {typeof item.category === 'string' ? item.category : (item.category?.page || 'Category')}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 text-xs bg-[#00132d] text-[#fff7d7] py-1 px-2 rounded hover:bg-[#00132d]/90 transition-colors">
                    View
                  </button>
                  <button className="flex-1 text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#00132d] rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-[#fff7d7]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {wardrobeItems.length === 0 ? 'Comece seu guarda-roupa digital' : 'Nenhuma peça encontrada'}
              </h3>
              <p className="text-gray-600 mb-6">
                {wardrobeItems.length === 0 
                  ? 'Adicione suas primeiras peças para começar a organizar e descobrir novas combinações.'
                  : 'Tente ajustar os filtros ou buscar por outros termos.'
                }
              </p>
              {wardrobeItems.length === 0 && (
                <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Primeira Peça
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </main>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
}