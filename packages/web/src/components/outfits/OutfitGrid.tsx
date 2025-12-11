// @ts-nocheck
'use client';

import { motion } from 'framer-motion';
import { OutfitCard } from './OutfitCard';

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

interface OutfitGridProps {
  outfits: Outfit[];
  onEdit: (outfit: Outfit) => void;
  onDelete: (outfitId: string) => void;
  onToggleFavorite: (outfitId: string) => void;
  onRecordWear: (outfitId: string) => void;
  onView: (outfit: Outfit) => void;
}

export function OutfitGrid({
  outfits,
  onEdit,
  onDelete,
  onToggleFavorite,
  onRecordWear,
  onView
}: OutfitGridProps) {
  if (outfits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum look encontrado
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros ou criar um novo look.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {outfits.map((outfit, index) => (
        <motion.div
          key={outfit.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <OutfitCard
            outfit={outfit}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onRecordWear={onRecordWear}
            onView={onView}
          />
        </motion.div>
      ))}
    </div>
  );
}