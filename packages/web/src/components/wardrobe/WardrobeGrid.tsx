'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  color: string;
  size: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  wearCount: number;
  lastWorn?: string;
  vufsId?: string;
}

interface WardrobeGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedCategory: string;
}

export function WardrobeGrid({ viewMode, searchQuery, selectedCategory }: WardrobeGridProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockItems: WardrobeItem[] = [
      {
        id: '1',
        name: 'Blusa Básica Branca',
        category: 'tops',
        brand: 'Zara',
        color: 'Branco',
        size: 'M',
        condition: 'excellent',
        imageUrl: '/api/placeholder/300/400',
        tags: ['básico', 'casual', 'trabalho'],
        isFavorite: true,
        wearCount: 15,
        lastWorn: '2024-01-15',
        vufsId: 'VUFS-001-BLU-WHT-M'
      },
      {
        id: '2',
        name: 'Calça Jeans Skinny',
        category: 'bottoms',
        brand: 'Levi\'s',
        color: 'Azul',
        size: '38',
        condition: 'good',
        imageUrl: '/api/placeholder/300/400',
        tags: ['jeans', 'casual', 'versátil'],
        isFavorite: false,
        wearCount: 8,
        lastWorn: '2024-01-10',
        vufsId: 'VUFS-002-CAL-BLU-38'
      },
      {
        id: '3',
        name: 'Vestido Floral Midi',
        category: 'dresses',
        brand: 'Farm',
        color: 'Estampado',
        size: 'P',
        condition: 'new',
        imageUrl: '/api/placeholder/300/500',
        tags: ['floral', 'feminino', 'verão'],
        isFavorite: true,
        wearCount: 3,
        lastWorn: '2024-01-08',
        vufsId: 'VUFS-003-VES-FLO-P'
      },
      {
        id: '4',
        name: 'Tênis Branco Couro',
        category: 'shoes',
        brand: 'Adidas',
        color: 'Branco',
        size: '37',
        condition: 'excellent',
        imageUrl: '/api/placeholder/300/300',
        tags: ['esportivo', 'casual', 'conforto'],
        isFavorite: false,
        wearCount: 12,
        lastWorn: '2024-01-12',
        vufsId: 'VUFS-004-TEN-WHT-37'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setItems(mockItems);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      new: 'condition-new',
      excellent: 'condition-excellent',
      good: 'condition-good',
      fair: 'condition-fair',
      poor: 'condition-poor'
    };
    return colors[condition as keyof typeof colors] || 'condition-good';
  };

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="fashion-card p-4">
            <div className="loading-skeleton h-48 mb-4"></div>
            <div className="loading-skeleton h-4 mb-2"></div>
            <div className="loading-skeleton h-3 w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <EyeIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma peça encontrada
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros ou adicionar novas peças ao seu guarda-roupa.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="fashion-card p-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.brand} • {item.color} • Tamanho {item.size}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                      <span className="text-xs text-gray-500">
                        Usado {item.wearCount}x
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                    >
                      {item.isFavorite ? (
                        <HeartSolidIcon className="h-5 w-5 text-pink-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <ShareIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="fashion-card group cursor-pointer"
        >
          <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  {item.isFavorite ? (
                    <HeartSolidIcon className="h-5 w-5 text-pink-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-gray-700" />
                  )}
                </button>
                <button className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                  <ShareIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Condition Badge */}
            <div className="absolute top-2 left-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                {item.condition}
              </span>
            </div>

            {/* VUFS Badge */}
            {item.vufsId && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  VUFS
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-medium text-gray-900 truncate mb-1">
              {item.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {item.brand} • {item.color}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Tamanho {item.size}</span>
              <span>Usado {item.wearCount}x</span>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}