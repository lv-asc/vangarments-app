// @ts-nocheck
'use client';

import { useState } from 'react';
import {
  HeartIcon,
  EyeIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Outfit {
  id: string;
  name: string;
  description?: string;
  items: any[];
  occasion: string;
  season: string;
  style: string[];
  colorPalette: string[];
  isPublic: boolean;
  isFavorite: boolean;
  wearCount: number;
  lastWorn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface OutfitCardProps {
  outfit: Outfit;
  onEdit: (outfit: Outfit) => void;
  onDelete: (outfitId: string) => void;
  onToggleFavorite: (outfitId: string) => void;
  onRecordWear: (outfitId: string) => void;
  onView: (outfit: Outfit) => void;
}

export function OutfitCard({
  outfit,
  onEdit,
  onDelete,
  onToggleFavorite,
  onRecordWear,
  onView
}: OutfitCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const occasionLabels: Record<string, string> = {
    casual: 'Casual',
    work: 'Trabalho',
    formal: 'Formal',
    party: 'Festa',
    date: 'Encontro',
    workout: 'Exercício',
    travel: 'Viagem',
    special_event: 'Evento Especial',
    everyday: 'Dia a Dia',
  };

  const seasonLabels: Record<string, string> = {
    spring: 'Primavera',
    summer: 'Verão',
    fall: 'Outono',
    winter: 'Inverno',
    all_season: 'Todas as Estações',
  };

  const occasionColors: Record<string, string> = {
    casual: 'bg-blue-100 text-blue-800',
    work: 'bg-gray-100 text-gray-800',
    formal: 'bg-purple-100 text-purple-800',
    party: 'bg-pink-100 text-pink-800',
    date: 'bg-red-100 text-red-800',
    workout: 'bg-green-100 text-green-800',
    travel: 'bg-yellow-100 text-yellow-800',
    special_event: 'bg-indigo-100 text-indigo-800',
    everyday: 'bg-emerald-100 text-emerald-800',
  };

  // Generate a preview image from the outfit items
  const generateOutfitPreview = () => {
    // For now, we'll use a placeholder. In a real implementation,
    // this would combine the item images or use a generated preview
    return '/api/placeholder/400/400';
  };

  const formatLastWorn = (date?: Date) => {
    if (!date) return 'Nunca usado';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Usado ontem';
    if (diffDays < 7) return `Usado há ${diffDays} dias`;
    if (diffDays < 30) return `Usado há ${Math.ceil(diffDays / 7)} semanas`;
    return `Usado há ${Math.ceil(diffDays / 30)} meses`;
  };

  return (
    <div className="fashion-card group cursor-pointer" onClick={() => onView(outfit)}>
      {/* Preview Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={generateOutfitPreview()}
          alt={outfit.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />

        {/* Top Actions */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${occasionColors[outfit.occasion] || 'bg-gray-100 text-gray-800'}`}>
              {occasionLabels[outfit.occasion] || outfit.occasion}
            </span>
            {outfit.isPublic && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                Público
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(outfit.id);
              }}
              className="p-2 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
            >
              {outfit.isFavorite ? (
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
                      onEdit(outfit);
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
                      onRecordWear(outfit.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <PlayIcon className="h-4 w-4 mr-3" />
                    Marcar como Usado
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement share functionality
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ShareIcon className="h-4 w-4 mr-3" />
                    Compartilhar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(outfit.id);
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
              onView(outfit);
            }}
            className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Ver Detalhes</span>
          </button>
        </div>

        {/* Item Count Badge */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-70 text-white">
            {outfit.items.length} peças
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
            {outfit.name}
          </h3>
          <span className="text-sm font-medium text-gray-600">
            {outfit.wearCount}x usado
          </span>
        </div>

        {outfit.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {outfit.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{seasonLabels[outfit.season] || outfit.season}</span>
          <span>{formatLastWorn(outfit.lastWorn)}</span>
        </div>

        {/* Style Tags */}
        {outfit.style.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {outfit.style.slice(0, 2).map((style) => (
              <span
                key={style}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                {style}
              </span>
            ))}
            {outfit.style.length > 2 && (
              <span className="text-xs text-gray-500">
                +{outfit.style.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Color Palette */}
        {outfit.colorPalette.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 mr-2">Cores:</span>
            <div className="flex space-x-1">
              {outfit.colorPalette.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {outfit.colorPalette.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{outfit.colorPalette.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}