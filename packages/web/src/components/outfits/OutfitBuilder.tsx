// @ts-nocheck
'use client';

import { useState } from 'react';
import {
  PlusIcon,
  MinusIcon,
  SparklesIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/utils/imageUrl';

const resolveImage = (item: any) => {
  if (!item) return '/api/placeholder/300/400';
  let raw = '';
  if (item.images?.length) {
    const first = item.images[0];
    raw = typeof first === 'string' ? first : (first.url || first.imageUrl);
  }
  return getImageUrl(raw) || '/api/placeholder/300/400';
};

const getItemBrand = (item: any) => {
  if (!item) return '';
  if (item.brand && typeof item.brand === 'object') {
    return item.brand.brand || item.brand.name || ''; // Fallback to name if brand property missing
  }
  return item.brand || '';
};

const getItemColor = (item: any) => {
  return item?.metadata?.colors?.[0]?.primary || item?.color || '';
};

interface OutfitBuilderProps {
  pinnedItem: any;
  selectedItems: any[];
  availableItems: any[];
  suggestions: any[];
  loading: boolean;
  onAddItem: (item: any) => void;
  onRemoveItem: (itemId: string) => void;
}

export function OutfitBuilder({
  pinnedItem,
  selectedItems,
  availableItems,
  suggestions,
  loading,
  onAddItem,
  onRemoveItem,
}: OutfitBuilderProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'tops', label: 'Blusas' },
    { value: 'bottoms', label: 'Calças' },
    { value: 'dresses', label: 'Vestidos' },
    { value: 'shoes', label: 'Calçados' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'outerwear', label: 'Casacos' },
  ];

  // Filter available items (exclude already selected ones)
  const filteredItems = availableItems.filter(item => {
    const isNotSelected = !selectedItems.find(selected => selected.id === item.id);
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const itemName = item.name || '';
    const itemBrand = getItemBrand(item);
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemBrand.toLowerCase().includes(searchQuery.toLowerCase());

    return isNotSelected && matchesCategory && matchesSearch;
  });

  // Get complementary items based on pinned item
  const getComplementaryItems = () => {
    if (!pinnedItem) return filteredItems;

    // Simple logic to suggest complementary items
    const pinnedCategory = pinnedItem.category;

    if (pinnedCategory === 'tops') {
      return filteredItems.filter(item =>
        ['bottoms', 'shoes', 'accessories', 'outerwear'].includes(item.category)
      );
    }

    if (pinnedCategory === 'bottoms') {
      return filteredItems.filter(item =>
        ['tops', 'shoes', 'accessories', 'outerwear'].includes(item.category)
      );
    }

    if (pinnedCategory === 'dresses') {
      return filteredItems.filter(item =>
        ['shoes', 'accessories', 'outerwear'].includes(item.category)
      );
    }

    return filteredItems;
  };

  const complementaryItems = getComplementaryItems();

  // Generate smart suggestions based on color and style compatibility
  const getSmartSuggestions = () => {
    if (!pinnedItem) return [];

    return complementaryItems
      .filter(item => {
        // Color compatibility logic
        const pinnedColor = pinnedItem.color?.toLowerCase();
        const itemColor = item.color?.toLowerCase();

        // Neutral colors go with everything
        const neutrals = ['black', 'white', 'gray', 'grey', 'beige', 'cream'];
        if (neutrals.includes(pinnedColor) || neutrals.includes(itemColor)) {
          return true;
        }

        // Same color family
        if (pinnedColor === itemColor) return true;

        // Basic complementary colors
        const complementaryPairs = [
          ['blue', 'white'],
          ['black', 'white'],
          ['navy', 'white'],
          ['brown', 'cream'],
        ];

        return complementaryPairs.some(pair =>
          (pair.includes(pinnedColor) && pair.includes(itemColor))
        );
      })
      .slice(0, 6); // Limit to 6 suggestions
  };

  const smartSuggestions = getSmartSuggestions();

  return (
    <div className="space-y-6">
      {/* Pinned Item Display */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={resolveImage(pinnedItem)}
              alt={pinnedItem?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              Peça base: {pinnedItem?.name}
            </h4>
            <p className="text-sm text-gray-600">
              {getItemBrand(pinnedItem)} • {getItemColor(pinnedItem)}
            </p>
          </div>
          <div className="text-pink-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Items */}
      {selectedItems.length > 1 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Peças selecionadas ({selectedItems.length})
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="relative group"
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={resolveImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove button (except for pinned item) */}
                {item.id !== pinnedItem?.id && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                )}

                {/* Pinned indicator */}
                {item.id === pinnedItem?.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}

                <p className="text-xs text-gray-600 mt-1 truncate">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && showSuggestions && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-pink-500" />
              <h4 className="font-medium text-gray-900">
                Sugestões inteligentes
              </h4>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {smartSuggestions.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative cursor-pointer group"
                onClick={() => onAddItem(item)}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-pink-300 transition-colors">
                  <img
                    src={resolveImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Add button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-1 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {getItemBrand(item)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Adicionar mais peças
          </h4>
          {!showSuggestions && smartSuggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(true)}
              className="text-sm text-pink-600 hover:text-pink-700 flex items-center space-x-1"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Ver sugestões</span>
            </button>
          )}
        </div>

        <div className="flex space-x-1 mb-4 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === category.value
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar peças..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {complementaryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="relative cursor-pointer group"
                onClick={() => onAddItem(item)}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-pink-300 transition-colors">
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Add button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-1 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {getItemColor(item)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {complementaryItems.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm">
              Nenhuma peça encontrada para esta categoria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}