// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api';
import { WardrobeItemCard } from './WardrobeItemCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  color: string;
  size?: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: Array<{ url: string; type: string; isPrimary: boolean }>;
  purchasePrice?: number;
  estimatedValue?: number;
  timesWorn: number;
  lastWorn?: Date;
  isFavorite: boolean;
  isForSale: boolean;
  tags: string[];
  vufsCode: string;
  // Enriched fields
  brandInfo?: {
    name: string;
    logo?: string;
    slug?: string;
  };
  lineInfo?: {
    id: string;
    name: string;
    logo?: string;
  };
  collectionInfo?: {
    id: string;
    name: string;
    coverImage?: string;
  };
}

interface WardrobeGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedCategory: string;
  onItemClick?: (item: WardrobeItem) => void;
  gridColumns?: string;
  isCompact?: boolean;
  mode?: 'wardrobe' | 'sandbox';
}

export function WardrobeGrid({
  viewMode,
  searchQuery,
  selectedCategory,
  onItemClick,
  gridColumns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  isCompact = false,
  mode = 'wardrobe'
}: WardrobeGridProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [searchQuery, selectedCategory, mode]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedCategory && selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      let response;
      if (mode === 'sandbox') {
        response = await apiClient.getDiscoverItems(filters);
      } else {
        response = await apiClient.getWardrobeItems(filters);
      }

      // Transform API response to component format
      const resultItems = (mode === 'sandbox' ? (response as any).items : (response as any).items) || [];

      const transformedItems: WardrobeItem[] = resultItems.map((item: any) => {
        // SKUs usually have a top-level name and brand object, 
        // while WardrobeItems (VUFSItems) store them in metadata/specific fields.
        const isSKU = mode === 'sandbox';

        return {
          id: item.id,
          name: isSKU ? item.name : (item.metadata?.name || 'Unnamed Item'),
          category: item.category?.whiteSubcategory || item.category?.page || item.category?.genderName || 'unknown',
          brand: isSKU ? (item.brand?.name || item.brandInfo?.name) : item.brand?.brand,
          color: item.metadata?.colors?.[0]?.name || item.metadata?.colorName || 'Unknown',
          size: item.metadata?.size || item.metadata?.sizeName || 'N/A',
          condition: item.condition?.status || 'new', // SKUs are effectively new
          images: item.images || [],
          purchasePrice: item.metadata?.acquisitionInfo?.price || item.retailPriceUsd,
          estimatedValue: item.metadata?.estimatedValue || item.retailPriceUsd,
          timesWorn: item.metadata?.wearCount || 0,
          lastWorn: item.lastWorn ? new Date(item.lastWorn) : undefined,
          isFavorite: false,
          isForSale: false,
          tags: item.metadata?.tags || [],
          vufsCode: item.vufsCode || item.code,
          brandInfo: item.brand || item.brandInfo,
          lineInfo: item.lineInfo,
          collectionInfo: item.collectionInfo,
        };
      });

      setItems(transformedItems);
    } catch (err: any) {
      console.error('Failed to load wardrobe items:', err);
      setError(err.message || 'Failed to load wardrobe items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: WardrobeItem) => {
    // Navigate to edit page
    window.location.href = `/wardrobe/${item.vufsCode}/edit`;
  };

  const handleDeleteClick = (itemId: string) => {
    setDeleteConfirm({ isOpen: true, itemId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.itemId) return;

    setDeleting(true);
    try {
      await apiClient.deleteWardrobeItem(deleteConfirm.itemId);
      await loadItems();
    } catch (err: any) {
      toast.error('Failed to delete item: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, itemId: null });
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newStatus = !item.isFavorite;
      // Optimistic update
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isFavorite: newStatus } : i));

      await apiClient.updateWardrobeItem(itemId, { isFavorite: newStatus });
      toast.success(newStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (err: any) {
      // Revert on failure
      const item = items.find(i => i.id === itemId);
      if (item) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, isFavorite: !item.isFavorite } : i));
      }
      console.error('Failed to toggle favorite', err);
      toast.error('Failed to update favorite status');
    }
  };

  const handleToggleForSale = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newStatus = !item.isForSale;
      // Optimistic update
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isForSale: newStatus } : i));

      await apiClient.updateWardrobeItem(itemId, { isForSale: newStatus });
      toast.success(newStatus ? 'Item listed for sale' : 'Item removed from sale');
    } catch (err: any) {
      // Revert on failure
      const item = items.find(i => i.id === itemId);
      if (item) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, isForSale: !item.isForSale } : i));
      }
      console.error('Failed to toggle sale status', err);
      toast.error('Failed to update sale status');
    }
  };

  const handleView = (item: WardrobeItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      window.location.href = `/wardrobe/${item.vufsCode}`;
    }
  };

  if (loading) {
    return (
      <div className={`grid ${gridColumns} gap-6`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={loadItems}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600 mb-4">No items found in your wardrobe.</p>
        <button
          onClick={() => window.location.href = '/wardrobe/add'}
          className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90"
        >
          Add First Item
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <WardrobeItemCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleFavorite={handleToggleFavorite}
            onToggleForSale={handleToggleForSale}
            onView={handleView}
            isCompact={isCompact}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridColumns} gap-6`}>
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleFavorite={handleToggleFavorite}
          onToggleForSale={handleToggleForSale}
          onView={handleView}
          isCompact={isCompact}
        />
      ))}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item from your wardrobe? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
