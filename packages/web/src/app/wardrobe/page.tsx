// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api';

import { getImageUrl, resetImageCache } from '@/utils/imageUrl';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import { useMultiSelect } from '@/hooks/useMultiSelect';

interface WardrobeItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  category: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  brand: {
    brand: string;
    line?: string;
  };
  metadata: {
    name: string;
    composition: Array<{ name: string; percentage: number }>;
    colors: Array<{ name: string; hex?: string }>;
    careInstructions: string[];
    size?: string;
  };
  condition: {
    status: string;
    description?: string;
  };
  images?: Array<{ url: string; type: string; isPrimary: boolean }>;
  createdAt: string;
}

export default function WardrobePage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  /* REMOVED showAddModal */
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadKey, setLoadKey] = useState(Date.now()); // Force re-render on each data load

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'Todas as Peças' }
  ]);

  // Multi-select with keyboard shortcuts (Cmd/Ctrl+Click, Shift+Click, Cmd/Ctrl+A)
  const {
    selectedIds,
    handleItemClick: handleSelectItem,
    clearSelection,
    selectedCount,
  } = useMultiSelect({
    items,
    getItemId: (item) => item.id,
  });

  useEffect(() => {
    loadCategories();
    loadItems();
  }, [selectedCategory]);

  // Handle bfcache (back-forward cache) restoration and force data refresh
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted is true when page is restored from bfcache
      if (event.persisted) {
        console.log('[Wardrobe] Page restored from bfcache, reloading data...');
        resetImageCache();
        loadItems();
      }
    };

    // Handle visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, ensure images are fresh
        resetImageCache();
        setLoadKey(Date.now());
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Force router refresh on initial mount to bypass Next.js router cache
    router.refresh();

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const vufsCategories: any[] = await apiClient.getVUFSCategories();
      // Filter for Level 2 (Blue) categories which are the main ones (Tops, Bottoms, etc.)
      // Ideally we should use the API to get by level, but for now filter client side or use all
      // The seed script created Tops, Bottoms, etc as 'blue' level.
      const mainCategories = vufsCategories
        .filter((c: any) => c.level === 'blue')
        .map((c: any) => ({
          value: c.name, // The controller now supports fuzzy search on name/any field
          label: c.name
        }));

      setCategories([{ value: 'all', label: 'Todas as Peças' }, ...mainCategories]);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to basic list if API fails
      setCategories([
        { value: 'all', label: 'Todas as Peças' },
        { value: 'Tops', label: 'Tops' },
        { value: 'Bottoms', label: 'Bottoms' },
        { value: 'Dresses', label: 'Dresses' },
        { value: 'Outerwear', label: 'Outerwear' },
        { value: 'Shoes', label: 'Shoes' },
        { value: 'Accessories', label: 'Accessories' }
      ]);
    }
  };

  const loadItems = async () => {
    // Reset image cache to ensure fresh URLs are generated
    resetImageCache();
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = { page: selectedCategory }; // structure expected by backend
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await apiClient.getWardrobeItems(filters);
      setItems(response.items || []);
      setLoadKey(Date.now()); // Update key to force image re-render
    } catch (err: any) {
      console.error('Error loading wardrobe:', err);
      setError(err.message || 'Falha ao carregar itens do guarda-roupa');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const handleViewItem = (item: WardrobeItem) => {
    router.push(`/wardrobe/${item.id}`);
  };

  const handleSellItem = (item: WardrobeItem) => {
    router.push(`/marketplace/create?itemId=${item.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Selection Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">
                {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpar seleção
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { /* TODO: Bulk action */ }}>
                Criar Outfit
              </Button>
              <Button variant="outline" size="sm" onClick={() => { /* TODO: Bulk action */ }}>
                Adicionar Tags
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => { /* TODO: Bulk delete */ }}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Guarda-roupa</h1>
              <p className="text-gray-600">{items.length} peças catalogadas</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/wardrobe/trash')}
                className="flex items-center text-gray-500 hover:text-gray-700"
                title="Lixeira"
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
              <Button
                className="flex items-center space-x-2"
                onClick={() => router.push('/wardrobe/add')}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Adicionar Peça</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar peças..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadItems()}
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

                <Button variant="outline" onClick={loadItems}>
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {
          error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                onClick={loadItems}
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          )
        }

        {/* Items Grid */}
        {
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {items.map((item) => (
                <WardrobeItemCard
                  key={`${item.id}-${loadKey}`}
                  refreshKey={loadKey}
                  item={{
                    id: item.id,
                    name: item.metadata.name,
                    category: item.category.whiteSubcategory || item.category.page || 'unknown',
                    brand: item.brand.brand,
                    color: item.metadata.colors?.[0]?.name || 'Unknown',
                    size: item.metadata.size,
                    condition: item.condition.status as any,
                    images: item.images?.map(img => img.type === 'local' ? img.url : getImageUrl(img.url)) || [],
                    purchasePrice: undefined,
                    estimatedValue: undefined,
                    timesWorn: 0,
                    lastWorn: undefined,
                    isFavorite: favorites.has(item.id),
                    isForSale: false,
                    tags: []
                  }}
                  onView={handleViewItem}
                  onEdit={() => router.push(`/wardrobe/${item.id}/edit`)}
                  onDelete={() => { }}
                  onToggleFavorite={toggleFavorite}
                  onToggleForSale={() => { }}
                  isSelected={selectedIds.has(item.id)}
                  onSelect={handleSelectItem}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seu guarda-roupa está vazio
              </h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando suas primeiras peças para organizar e descobrir novas combinações.
              </p>
              <Button onClick={() => router.push('/wardrobe/add')}>
                Adicionar Primeira Peça
              </Button>
            </div>
          )
        }


      </main >
    </div >
  );
}
