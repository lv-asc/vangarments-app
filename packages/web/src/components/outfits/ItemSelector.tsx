// @ts-nocheck
'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ItemSelectorProps {
  items: any[];
  onSelectItem: (item: any) => void;
  selectedItem?: any;
}

// Helper functions to extract data from VUFS format
const getItemName = (item: any): string => {
  if (item.name) return item.name;
  const brand = item.brand?.brand || '';
  const category = item.category?.whiteSubcategory || item.category?.blueSubcategory || '';
  const color = item.metadata?.colors?.[0]?.primary || '';
  return [brand, category, color].filter(Boolean).join(' ') || 'Unnamed Item';
};

const getItemBrand = (item: any): string => {
  if (!item.brand) return '';
  if (typeof item.brand === 'string') return item.brand;
  return item.brand.brand || item.brand.name || '';
};

const getItemColor = (item: any): string => {
  const metaColor = item.metadata?.colors?.[0]?.primary;
  if (metaColor) return metaColor;

  if (item.color) {
    if (typeof item.color === 'string') return item.color;
    return item.color.name || item.color.primary || '';
  }
  return '';
};

const getItemCategory = (item: any): string => {
  if (typeof item.category === 'string') return item.category;
  return item.category?.blueSubcategory || item.category?.page || '';
};

import { getImageUrl } from '@/utils/imageUrl';

const getItemImage = (item: any): string => {
  let rawUrl = '';
  // Handle array of image objects (VUFS format)
  if (item.images?.length > 0) {
    const firstImage = item.images[0];
    rawUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || firstImage?.imageUrl || '');
  } else {
    rawUrl = item.imageUrl || '';
  }

  if (!rawUrl) return '/api/placeholder/300/400';
  return getImageUrl(rawUrl);
};

export function ItemSelector({ items, onSelectItem, selectedItem }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'tops', label: 'Blusas' },
    { value: 'bottoms', label: 'Calças' },
    { value: 'dresses', label: 'Vestidos' },
    { value: 'shoes', label: 'Calçados' },
    { value: 'Footwear', label: 'Calçados' },
    { value: 'Apparel', label: 'Vestuário' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'outerwear', label: 'Casacos' },
  ];

  // Get unique colors from items
  const colors = ['all', ...new Set(items.map(item => getItemColor(item)).filter(Boolean))].map(color => ({
    value: color,
    label: color === 'all' ? 'Todas as Cores' : color,
  }));

  const filteredItems = items.filter(item => {
    const name = getItemName(item).toLowerCase();
    const brand = getItemBrand(item).toLowerCase();
    const itemCategory = getItemCategory(item);
    const itemColor = getItemColor(item);

    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      brand.includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory || itemCategory.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesColor = selectedColor === 'all' || itemColor === selectedColor;

    return matchesSearch && matchesCategory && matchesColor;
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Escolha uma peça para começar seu look
        </h3>
        <p className="text-gray-600">
          Selecione uma peça base e nós ajudaremos você a criar combinações incríveis
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar peças..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {colors.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedItem?.id === item.id
                ? 'border-pink-500 ring-2 ring-pink-200'
                : 'border-gray-200 hover:border-pink-300'
                }`}
              onClick={() => onSelectItem(item)}
            >
              <div className="aspect-[3/4] bg-gray-100">
                <img
                  src={getItemImage(item)}
                  alt={getItemName(item)}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Selection Indicator */}
              {selectedItem?.id === item.id && (
                <div className="absolute inset-0 bg-pink-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {getItemName(item)}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">
                    {getItemBrand(item)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getItemColor(item)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma peça encontrada
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou adicionar mais peças ao seu guarda-roupa.
          </p>
        </div>
      )}

      {selectedItem && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={getItemImage(selectedItem)}
                alt={getItemName(selectedItem)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                Peça base selecionada: {getItemName(selectedItem)}
              </h4>
              <p className="text-sm text-gray-600">
                {getItemBrand(selectedItem)} • {getItemColor(selectedItem)}
              </p>
            </div>
            <div className="text-pink-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}