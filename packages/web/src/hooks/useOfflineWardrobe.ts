import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/utils/offlineStorage';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  color: string;
  size: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  purchasePrice?: number;
  estimatedValue?: number;
  timesWorn: number;
  lastWorn?: Date;
  isFavorite: boolean;
  isForSale: boolean;
  tags: string[];
  needsSync?: boolean;
  localImageBlob?: Blob;
}

interface WardrobeFilters {
  category?: string;
  searchQuery?: string;
  onlyFavorites?: boolean;
}

export function useOfflineWardrobe() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (filters?: WardrobeFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      await offlineStorage.initialize();
      const offlineItems = await offlineStorage.getWardrobeItems(filters);
      
      // Convert offline items to wardrobe items format
      const wardrobeItems: WardrobeItem[] = offlineItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        color: item.color,
        size: item.size,
        condition: item.condition,
        images: item.imageUrl ? [item.imageUrl] : [],
        timesWorn: item.wearCount,
        lastWorn: item.lastWorn ? new Date(item.lastWorn) : undefined,
        isFavorite: item.isFavorite,
        isForSale: false, // Default value
        tags: item.tags,
        needsSync: item.needsSync,
        localImageBlob: item.localImageBlob,
        estimatedValue: 0, // Default value
      }));

      setItems(wardrobeItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wardrobe items');
      console.error('Error loading wardrobe items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (itemData: Partial<WardrobeItem>) => {
    try {
      const newItem = {
        id: Date.now().toString(),
        name: itemData.name || '',
        category: itemData.category || '',
        brand: itemData.brand,
        color: itemData.color || '',
        size: itemData.size || '',
        condition: (itemData.condition as 'new' | 'excellent' | 'good' | 'fair' | 'poor') || 'good',
        imageUrl: itemData.images?.[0],
        localImageBlob: itemData.localImageBlob,
        tags: itemData.tags || [],
        isFavorite: false,
        wearCount: 0,
        lastWorn: itemData.lastWorn ? new Date(itemData.lastWorn).toISOString() : undefined,
        vufsId: undefined,
        lastModified: new Date().toISOString(),
        needsSync: true,
        isDeleted: false,
      };

      await offlineStorage.saveWardrobeItem(newItem);
      
      // If there's a local image blob, save it
      if (itemData.localImageBlob) {
        await offlineStorage.saveImage(newItem.id, itemData.localImageBlob);
      }

      // Reload items to reflect changes
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      console.error('Error adding item:', err);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<WardrobeItem>) => {
    try {
      const existingItem = await offlineStorage.getWardrobeItem(id);
      if (!existingItem) {
        throw new Error('Item not found');
      }

      const updatedItem = {
        ...existingItem,
        ...updates,
        lastModified: new Date().toISOString(),
        needsSync: true,
      };

      await offlineStorage.saveWardrobeItem(updatedItem);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      console.error('Error updating item:', err);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await offlineStorage.deleteWardrobeItem(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  }, [loadItems]);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const item = await offlineStorage.getWardrobeItem(id);
      if (item) {
        await updateItem(id, { isFavorite: !item.isFavorite });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
      console.error('Error toggling favorite:', err);
    }
  }, [updateItem]);

  const toggleForSale = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      await updateItem(id, { isForSale: !item.isForSale });
    }
  }, [items, updateItem]);

  const getImageUrl = useCallback(async (item: WardrobeItem): Promise<string | null> => {
    if (item.images[0] && !item.images[0].startsWith('offline-image://')) {
      return item.images[0];
    }

    if (item.localImageBlob) {
      return URL.createObjectURL(item.localImageBlob);
    }

    // Try to get from offline storage
    try {
      const blob = await offlineStorage.getImage(item.id);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.error('Error loading offline image:', err);
    }

    return null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    toggleForSale,
    getImageUrl,
  };
}