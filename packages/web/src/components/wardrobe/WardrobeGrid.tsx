// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api';
import { WardrobeItemCard } from './WardrobeItemCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  color: string;
  size?: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
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
}

export function WardrobeGrid({ viewMode, searchQuery, selectedCategory, onItemClick }: WardrobeGridProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [searchQuery, selectedCategory]);

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

      const response = await apiClient.getWardrobeItems(filters);

      // Transform API response to component format
      const transformedItems: WardrobeItem[] = (response.items || []).map((item: any) => ({
        id: item.id,
        name: item.metadata?.name || 'Unnamed Item',
        category: item.category?.whiteSubcategory || item.category?.page || 'unknown',
        brand: item.brand?.brand,
        color: item.metadata?.colors?.[0]?.name || 'Unknown',
        size: item.metadata?.size || 'N/A',
        condition: item.condition?.status || 'good',
        images: item.images?.map((img: any) => img.url) || [],
        purchasePrice: item.metadata?.acquisitionInfo?.price,
        estimatedValue: item.metadata?.estimatedValue,
        timesWorn: item.metadata?.wearCount || 0,
        lastWorn: item.lastWorn ? new Date(item.lastWorn) : undefined,
        isFavorite: false, // Would need to fetch from API
        isForSale: false, // Would need to fetch from API
        tags: item.metadata?.tags || [],
        vufsCode: item.vufsCode,
        brandInfo: item.brandInfo,
        lineInfo: item.lineInfo,
        collectionInfo: item.collectionInfo,
      }));

      setItems(transformedItems);
    } catch (err: any) {
      console.error('Failed to load wardrobe items:', err);
      setError(err.message || 'Falha ao carregar itens do guarda-roupa');
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
      alert('Falha ao excluir item: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, itemId: null });
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    // This would need to be implemented in the API
    console.log('Toggle favorite:', itemId);
  };

  const handleToggleForSale = async (itemId: string) => {
    // This would need to be implemented in the API
    console.log('Toggle for sale:', itemId);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600 mb-4">Nenhum item encontrado no seu guarda-roupa.</p>
        <button
          onClick={() => window.location.href = '/wardrobe/add'}
          className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90"
        >
          Adicionar Primeiro Item
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
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleFavorite={handleToggleFavorite}
          onToggleForSale={handleToggleForSale}
          onView={handleView}
        />
      ))}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleDeleteConfirm}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item do seu guarda-roupa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
