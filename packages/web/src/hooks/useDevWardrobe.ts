// Development-only wardrobe hook that bypasses all API calls
'use client';

import { useState, useEffect, useCallback } from 'react';

// Simple mock wardrobe items for development
const DEV_WARDROBE_ITEMS = [
  {
    id: 'dev-1',
    vufsCode: 'VG-APP-TOP-WHT-BAS-ZAR-001',
    ownerId: 'dev-master-lve',
    category: {
      page: 'Apparel',
      blueSubcategory: 'Tops',
      whiteSubcategory: 'Basic Tee',
      graySubcategory: 'Short Sleeve',
    },
    brand: {
      brand: 'Zara',
    },
    metadata: {
      composition: [],
      colors: [{ primary: 'White', undertones: [] }],
      careInstructions: [],
    },
    condition: {
      status: 'Excellent Used' as const,
      defects: [],
    },
    ownership: {
      status: 'owned' as const,
      visibility: 'public' as const,
    },
    images: [{
      id: 'img-1',
      imageUrl: '/api/placeholder/300/400',
      imageType: 'front' as const,
      isPrimary: true,
    }],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dev-2',
    vufsCode: 'VG-APP-BOT-BLU-JEA-LEV-002',
    ownerId: 'dev-master-lve',
    category: {
      page: 'Apparel',
      blueSubcategory: 'Bottoms',
      whiteSubcategory: 'Jeans',
      graySubcategory: 'Skinny',
    },
    brand: {
      brand: "Levi's",
    },
    metadata: {
      composition: [],
      colors: [{ primary: 'Blue', undertones: [] }],
      careInstructions: [],
    },
    condition: {
      status: 'Good' as const,
      defects: [],
    },
    ownership: {
      status: 'owned' as const,
      visibility: 'public' as const,
    },
    images: [{
      id: 'img-2',
      imageUrl: '/api/placeholder/300/500',
      imageType: 'front' as const,
      isPrimary: true,
    }],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'dev-3',
    vufsCode: 'VG-APP-DRE-PNK-FLO-FAR-003',
    ownerId: 'dev-master-lve',
    category: {
      page: 'Apparel',
      blueSubcategory: 'Dresses',
      whiteSubcategory: 'Midi Dress',
      graySubcategory: 'Floral Print',
    },
    brand: {
      brand: 'Farm',
    },
    metadata: {
      composition: [],
      colors: [{ primary: 'Pink', undertones: [] }],
      careInstructions: [],
    },
    condition: {
      status: 'New' as const,
      defects: [],
    },
    ownership: {
      status: 'owned' as const,
      visibility: 'public' as const,
    },
    images: [{
      id: 'img-3',
      imageUrl: '/api/placeholder/300/600',
      imageType: 'front' as const,
      isPrimary: true,
    }],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'dev-4',
    vufsCode: 'VG-FOO-SNE-WHT-SPO-NIK-004',
    ownerId: 'dev-master-lve',
    category: {
      page: 'Footwear',
      blueSubcategory: 'Sneakers',
      whiteSubcategory: 'Sports',
      graySubcategory: 'Low Top',
    },
    brand: {
      brand: 'Nike',
    },
    metadata: {
      composition: [],
      colors: [{ primary: 'White', undertones: [] }],
      careInstructions: [],
    },
    condition: {
      status: 'Excellent Used' as const,
      defects: [],
    },
    ownership: {
      status: 'owned' as const,
      visibility: 'public' as const,
    },
    images: [{
      id: 'img-4',
      imageUrl: '/api/placeholder/400/300',
      imageType: 'front' as const,
      isPrimary: true,
    }],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
];

export function useDevWardrobe() {
  const [items, setItems] = useState(DEV_WARDROBE_ITEMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (filters?: any) => {
    console.log('🔧 DEV: Loading wardrobe items', filters);
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredItems = [...DEV_WARDROBE_ITEMS];
    
    if (filters?.category && filters.category !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.category.blueSubcategory.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.brand.brand.toLowerCase().includes(query) ||
        item.category.whiteSubcategory.toLowerCase().includes(query) ||
        item.metadata.colors.some(color => color.primary.toLowerCase().includes(query))
      );
    }
    
    setItems(filteredItems);
    setLoading(false);
    setError(null);
  }, []);

  const createItem = useCallback(async (images: File[], itemData: any) => {
    console.log('🔧 DEV: Creating wardrobe item', itemData);
    
    const newItem = {
      id: `dev-${Date.now()}`,
      vufsCode: `VG-DEV-${Date.now()}`,
      ownerId: 'dev-master-lve',
      category: {
        page: 'Apparel',
        blueSubcategory: 'Tops',
        whiteSubcategory: 'Basic',
        graySubcategory: 'Standard',
      },
      brand: {
        brand: 'New Brand',
      },
      metadata: {
        composition: [],
        colors: [{ primary: 'Unknown', undertones: [] }],
        careInstructions: [],
      },
      condition: {
        status: 'Good' as const,
        defects: [],
      },
      ownership: {
        status: 'owned' as const,
        visibility: 'public' as const,
      },
      images: [{
        id: `img-${Date.now()}`,
        imageUrl: '/api/placeholder/300/400',
        imageType: 'front' as const,
        isPrimary: true,
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setItems(prev => [...prev, newItem]);
    
    return {
      item: newItem,
      aiAnalysis: {
        confidence: { overall: 0.95 },
        suggestions: { category: 'Detected automatically' },
        backgroundRemoved: true,
      },
    };
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: any) => {
    console.log('🔧 DEV: Updating wardrobe item', itemId, updates);
    
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, updatedAt: new Date() }
        : item
    ));
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    console.log('🔧 DEV: Deleting wardrobe item', itemId);
    
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const getStats = useCallback(async () => {
    console.log('🔧 DEV: Getting wardrobe stats');
    
    const stats = {
      totalItems: items.length,
      itemsByCategory: {} as Record<string, number>,
      itemsByBrand: {} as Record<string, number>,
      itemsByCondition: {} as Record<string, number>,
    };

    items.forEach(item => {
      // Count by category
      const category = item.category.page;
      stats.itemsByCategory[category] = (stats.itemsByCategory[category] || 0) + 1;

      // Count by brand
      const brand = item.brand.brand;
      if (brand) {
        stats.itemsByBrand[brand] = (stats.itemsByBrand[brand] || 0) + 1;
      }

      // Count by condition
      const condition = item.condition.status;
      stats.itemsByCondition[condition] = (stats.itemsByCondition[condition] || 0) + 1;
    });

    return { stats };
  }, [items]);

  const syncOfflineItems = useCallback(async () => {
    console.log('🔧 DEV: Sync offline items (no-op in dev mode)');
    return { synced: 0, failed: 0, errors: [] };
  }, []);

  // Initialize items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    syncing: false,
    lastSync: null,
    isOnline: true,
    syncStatus: { isOnline: true, isSyncing: false, pendingItems: 0 },
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    syncOfflineItems,
    getStats,
  };
}