import { useState, useEffect, useCallback } from 'react';
import { WardrobeAPI, WardrobeItem, CreateWardrobeItemRequest, WardrobeFilters } from '@/lib/wardrobeApi';
import { offlineStorage } from '@/utils/offlineStorage';
import { useOfflineSync } from './useOfflineSync';

// Helper functions
const extractItemName = (item: WardrobeItem): string => {
  const brand = item.brand.brand;
  const category = item.category.whiteSubcategory || item.category.blueSubcategory;
  const color = item.metadata.colors?.[0]?.primary;

  return [brand, category, color].filter(Boolean).join(' ') || 'Unnamed Item';
};

const extractNameFromItemData = (itemData: CreateWardrobeItemRequest): string => {
  const brand = itemData.brand?.brand;
  const category = itemData.category?.whiteSubcategory || itemData.category?.blueSubcategory;
  const color = itemData.metadata?.colors?.[0]?.primary;

  return [brand, category, color].filter(Boolean).join(' ') || 'Unnamed Item';
};

const mapCategoryFromVUFS = (category: any): string => {
  if (!category) return 'other';

  const categoryMap: Record<string, string> = {
    'Apparel': 'tops', // Default for apparel
    'Footwear': 'shoes',
  };

  return categoryMap[category.page] || 'other';
};

const mapCategoryToPage = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'tops': 'Apparel',
    'bottoms': 'Apparel',
    'dresses': 'Apparel',
    'shoes': 'Footwear',
    'accessories': 'Apparel',
    'outerwear': 'Apparel',
  };
  return categoryMap[category] || 'Apparel';
};

const mapConditionFromVUFS = (condition: string): 'new' | 'excellent' | 'good' | 'fair' | 'poor' => {
  const conditionMap: Record<string, 'new' | 'excellent' | 'good' | 'fair' | 'poor'> = {
    'New': 'new',
    'Excellent Used': 'excellent',
    'Good': 'good',
    'Fair': 'fair',
    'Poor': 'poor',
  };
  return conditionMap[condition] || 'good';
};

const mapConditionToVUFS = (condition: string): 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor' => {
  const conditionMap: Record<string, 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor'> = {
    'new': 'New',
    'excellent': 'Excellent Used',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor',
  };
  return conditionMap[condition] || 'Good';
};

interface WardrobeSyncState {
  items: WardrobeItem[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  lastSync: Date | null;
}

export function useWardrobeSync() {
  const [state, setState] = useState<WardrobeSyncState>({
    items: [],
    loading: true,
    error: null,
    syncing: false,
    lastSync: null,
  });

  const { syncStatus } = useOfflineSync();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  /**
   * Load items from API or offline storage
   */
  const loadItems = useCallback(async (filters?: WardrobeFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (isOnline) {
        try {
          // Load from real API (production mode only)
          const response = await WardrobeAPI.getItems(filters);
          setState(prev => ({
            ...prev,
            items: response.items,
            loading: false,
          }));

          // Cache items offline for future use
          await offlineStorage.initialize();
          for (const item of response.items) {
            await offlineStorage.saveWardrobeItem({
              id: item.id,
              name: extractItemName(item),
              category: mapCategoryFromVUFS(item.category),
              brand: item.brand.brand,
              color: item.metadata.colors?.[0]?.primary || '',
              size: '', // Would need to be extracted from metadata
              condition: mapConditionFromVUFS(item.condition.status),
              imageUrl: item.images.find(img => img.isPrimary)?.imageUrl,
              tags: [],
              isFavorite: false,
              wearCount: 0,
              vufsId: item.vufsCode,
              lastModified: item.updatedAt.toISOString(),
              needsSync: false,
              isDeleted: false,
            });
          }
        } catch (apiError) {
          console.warn('API call failed, falling back to offline storage:', apiError);
          // Fall back to offline storage if API fails
          await loadOfflineItems(filters);
        }
      } else {
        // Load from offline storage (offline mode)
        await loadOfflineItems(filters);
      }
    } catch (error) {
      console.warn('Load items error:', error);
      setState(prev => ({
        ...prev,
        error: null, // Don't show error in dev mode
        loading: false,
        items: [], // Show empty state instead of error
      }));
    }
  }, [isOnline]);

  const loadOfflineItems = async (filters?: WardrobeFilters) => {
    await offlineStorage.initialize();
    const offlineItems = await offlineStorage.getWardrobeItems(filters);

    // Convert offline items to WardrobeItem format (simplified)
    const convertedItems: WardrobeItem[] = offlineItems.map(item => ({
      id: item.id,
      vufsCode: item.vufsId || '',
      ownerId: item.id.includes('dev-master') ? 'dev-master-lve' : '',
      category: {
        page: mapCategoryToPage(item.category),
        blueSubcategory: item.category,
        whiteSubcategory: item.name.split(' ')[1] || '',
        graySubcategory: item.tags[0] || '',
      },
      brand: {
        brand: item.brand || '',
      },
      metadata: {
        composition: [],
        colors: item.color ? [{ primary: item.color, undertones: [] }] : [],
        careInstructions: [],
      },
      condition: {
        status: mapConditionToVUFS(item.condition),
        defects: [],
      },
      ownership: {
        status: 'owned',
        visibility: 'public',
      },
      images: item.imageUrl ? [{
        id: '',
        imageUrl: item.imageUrl,
        imageType: 'front',
        isPrimary: true,
      }] : [],
      createdAt: new Date(),
      updatedAt: new Date(item.lastModified),
    }));

    setState(prev => ({
      ...prev,
      items: convertedItems,
      loading: false,
    }));
  };

  /**
   * Create a new wardrobe item
   */
  const createItem = useCallback(async (
    images: File[],
    itemData: CreateWardrobeItemRequest
  ) => {
    try {
      if (isOnline) {
        try {
          // Create via real API (production mode only)
          const response = await WardrobeAPI.createItem(images, itemData);
          await loadItems();
          return response;
        } catch (apiError) {
          console.warn('API create failed, saving offline:', apiError);
          return await createOfflineItem(images, itemData);
        }
      } else {
        // Store offline (offline mode)
        return await createOfflineItem(images, itemData);
      }
    } catch (error) {
      console.warn('Create item error:', error);
      return await createOfflineItem(images, itemData);
    }
  }, [isOnline, loadItems]);

  const createOfflineItem = async (images: File[], itemData: CreateWardrobeItemRequest) => {
    await offlineStorage.initialize();

    const offlineItem = {
      id: 'dev-' + Date.now().toString(),
      name: extractNameFromItemData(itemData),
      category: mapCategoryFromVUFS(itemData.category),
      brand: itemData.brand?.brand || 'Unknown Brand',
      color: itemData.metadata?.colors?.[0]?.primary || 'Unknown Color',
      size: '', // Would need to be extracted
      condition: mapConditionFromVUFS(itemData.condition?.status || 'Good'),
      imageUrl: undefined,
      localImageBlob: images[0], // Store first image as blob
      tags: [],
      isFavorite: false,
      wearCount: 0,
      vufsId: `VG-DEV-${Date.now()}`,
      lastModified: new Date().toISOString(),
      needsSync: true, // Mark for sync when online
      isDeleted: false,
    };

    await offlineStorage.saveWardrobeItem(offlineItem);

    if (images[0]) {
      await offlineStorage.saveImage(offlineItem.id, images[0]);
    }

    await loadItems();

    return { item: null, aiAnalysis: null };
  };

  /**
   * Update a wardrobe item
   */
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<CreateWardrobeItemRequest>
  ) => {
    try {
      if (isOnline) {
        try {
          await WardrobeAPI.updateItem(itemId, updates);
          await loadItems();
        } catch (apiError) {
          console.warn('API update failed, updating offline:', apiError);
          await updateOfflineItem(itemId, updates);
        }
      } else {
        await updateOfflineItem(itemId, updates);
      }
    } catch (error) {
      console.warn('Update item error:', error);
      await updateOfflineItem(itemId, updates);
    }
  }, [isOnline, loadItems]);

  const updateOfflineItem = async (itemId: string, updates: Partial<CreateWardrobeItemRequest>) => {
    await offlineStorage.initialize();
    const existingItem = await offlineStorage.getWardrobeItem(itemId);

    if (existingItem) {
      const updatedItem = {
        ...existingItem,
        // Map updates to offline format
        lastModified: new Date().toISOString(),
        needsSync: true, // Mark for sync when online
      };

      await offlineStorage.saveWardrobeItem(updatedItem);
      await loadItems();
    }
  };

  /**
   * Delete a wardrobe item
   */
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      if (isOnline) {
        try {
          await WardrobeAPI.deleteItem(itemId);
          await loadItems();
        } catch (apiError) {
          console.warn('API delete failed, deleting offline:', apiError);
          await offlineStorage.deleteWardrobeItem(itemId);
          await loadItems();
        }
      } else {
        await offlineStorage.deleteWardrobeItem(itemId);
        await loadItems();
      }
    } catch (error) {
      console.warn('Delete item error:', error);
      try {
        await offlineStorage.deleteWardrobeItem(itemId);
        await loadItems();
      } catch (offlineError) {
        console.error('Offline delete also failed:', offlineError);
      }
    }
  }, [isOnline, loadItems]);

  /**
   * Sync offline items with server
   */
  const syncOfflineItems = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));

      await offlineStorage.initialize();
      const offlineItems = await offlineStorage.getWardrobeItems();
      const itemsToSync = offlineItems.filter(item => item.needsSync);

      if (itemsToSync.length === 0) {
        setState(prev => ({
          ...prev,
          syncing: false,
          lastSync: new Date(),
        }));
        return { synced: 0, failed: 0, errors: [] };
      }

      const result = await WardrobeAPI.syncOfflineItems(itemsToSync);

      // Mark successfully synced items
      for (const item of itemsToSync) {
        if (!result.errors.some(e => e.itemId === item.id)) {
          await offlineStorage.saveWardrobeItem({
            ...item,
            needsSync: false,
          });
        }
      }

      setState(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date(),
      }));

      // Reload items after sync
      await loadItems();

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    }
  }, [isOnline, loadItems]);

  /**
   * Get wardrobe statistics
   */
  const getStats = useCallback(async () => {
    if (isOnline) {
      try {
        return await WardrobeAPI.getStats();
      } catch (apiError) {
        console.warn('API stats failed, calculating offline:', apiError);
        return calculateOfflineStats();
      }
    } else {
      return calculateOfflineStats();
    }
  }, [isOnline, state.items]);

  const calculateOfflineStats = () => {
    // Calculate stats from offline items
    const items = state.items;
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
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncOfflineItems().catch(console.error);
    }
  }, [isOnline, syncOfflineItems]);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);





  return {
    ...state,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    syncOfflineItems,
    getStats,
    isOnline,
    syncStatus,
  };
}