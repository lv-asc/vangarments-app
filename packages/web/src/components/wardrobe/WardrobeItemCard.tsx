'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  EyeIcon, 
  ShoppingBagIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
}

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onToggleForSale: (itemId: string) => void;
  onView: (item: WardrobeItem) => void;
}

export function WardrobeItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onToggleForSale, 
  onView 
}: WardrobeItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const conditionColors = {
    new: 'bg-green-100 text-green-800',
    excellent: 'bg-emerald-100 text-emerald-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800',
    poor: 'bg-red-100 text-red-800',
  };

  const conditionLabels = {
    new: 'Novo',
    excellent: 'Excelente',
    good: 'Bom',
    fair: 'Regular',
    poor: 'Desgastado',
  };

  const categoryColors = {
    tops: 'bg-[#fff7d7] text-[#00132d]',
    bottoms: 'bg-[#00132d]/10 text-[#00132d]',
    dresses: 'bg-[#fff7d7]/70 text-[#00132d]',
    shoes: 'bg-[#00132d]/20 text-[#00132d]',
    accessories: 'bg-[#fff7d7]/50 text-[#00132d]',
    outerwear: 'bg-slate-100 text-slate-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fashion-card group cursor-pointer"
      onClick={() => onView(item)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={item.images[0] || '/api/placeholder/300/400'}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
        
        {/* Top Actions */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            {item.isForSale && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                À venda
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${conditionColors[item.condition]}`}>
              {conditionLabels[item.condition]}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              className="p-2 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
            >
              {item.isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
              >
                <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-3" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleForSale(item.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ShoppingBagIcon className="h-4 w-4 mr-3" />
                    {item.isForSale ? 'Remover da venda' : 'Colocar à venda'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-3" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions (visible on hover) */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Ver Detalhes</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
            {item.name}
          </h3>
          {item.estimatedValue && (
            <span className="text-sm font-medium text-green-600">
              R$ {item.estimatedValue.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[typeof item.category === 'string' ? item.category as keyof typeof categoryColors : 'tops'] || 'bg-gray-100 text-gray-800'}`}>
            {typeof item.category === 'string' ? item.category : (item.category?.page || 'Unknown')}
          </span>
          {item.brand && (
            <span className="text-xs text-gray-600">
              {typeof item.brand === 'string' ? item.brand : (item.brand?.brand || 'Unknown Brand')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <span>Cor: {typeof item.color === 'string' ? item.color : (item.color?.name || 'Unknown')}</span>
            {item.size && <span>Tam: {item.size}</span>}
          </div>
          <span>{item.timesWorn}x usado</span>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}