// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthWrapper';
import { OutfitGrid } from '@/components/outfits/OutfitGrid';
import { OutfitCreationModal } from '@/components/outfits/OutfitCreationModal';
import { useOutfits } from '@/hooks/useOutfits';

export default function OutfitsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');

  const {
    outfits,
    loading,
    error,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    recordWear,
    loadOutfits,
  } = useOutfits();

  const occasions = [
    { value: 'all', label: 'Todas as Ocasiões' },
    { value: 'casual', label: 'Casual' },
    { value: 'work', label: 'Trabalho' },
    { value: 'formal', label: 'Formal' },
    { value: 'party', label: 'Festa' },
    { value: 'date', label: 'Encontro' },
    { value: 'workout', label: 'Exercício' },
    { value: 'travel', label: 'Viagem' },
    { value: 'special_event', label: 'Evento Especial' },
    { value: 'everyday', label: 'Dia a Dia' },
  ];

  const seasons = [
    { value: 'all', label: 'Todas as Estações' },
    { value: 'spring', label: 'Primavera' },
    { value: 'summer', label: 'Verão' },
    { value: 'fall', label: 'Outono' },
    { value: 'winter', label: 'Inverno' },
    { value: 'all_season', label: 'Todas as Estações' },
  ];

  const handleCreateOutfit = async (outfitData: any) => {
    try {
      await createOutfit(outfitData);
      setIsCreationModalOpen(false);
    } catch (error) {
      console.error('Failed to create outfit:', error);
    }
  };

  const handleEditOutfit = (outfit: any) => {
    // TODO: Implement edit functionality
    console.log('Edit outfit:', outfit);
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      await deleteOutfit(outfitId);
    } catch (error) {
      console.error('Failed to delete outfit:', error);
    }
  };

  const handleToggleFavorite = async (outfitId: string) => {
    try {
      await toggleFavorite(outfitId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRecordWear = async (outfitId: string) => {
    try {
      await recordWear(outfitId);
    } catch (error) {
      console.error('Failed to record wear:', error);
    }
  };

  const handleViewOutfit = (outfit: any) => {
    // TODO: Implement outfit detail view
    console.log('View outfit:', outfit);
  };

  // Filter outfits and reload when filters change
  const handleFilterChange = async () => {
    const filters: any = {};
    if (selectedOccasion !== 'all') filters.occasion = selectedOccasion;
    if (selectedSeason !== 'all') filters.season = selectedSeason;
    if (searchQuery) filters.search = searchQuery;

    await loadOutfits(filters);
  };

  // Apply filters when search or filters change
  React.useEffect(() => {
    handleFilterChange();
  }, [searchQuery, selectedOccasion, selectedSeason]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Meus Looks
                </h1>
                <p className="text-gray-600 mt-1">
                  {outfits.length} looks criados
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="flex items-center space-x-2"
                  onClick={() => setIsCreationModalOpen(true)}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Criar Look</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar looks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {occasions.map(occasion => (
                    <option key={occasion.value} value={occasion.value}>
                      {occasion.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {seasons.map(season => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>

                <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-pink-600 transition-colors">
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filtros</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => loadOutfits()}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Outfits Grid */}
          {!loading && !error && outfits.length > 0 ? (
            <OutfitGrid
              outfits={outfits}
              onEdit={handleEditOutfit}
              onDelete={handleDeleteOutfit}
              onToggleFavorite={handleToggleFavorite}
              onRecordWear={handleRecordWear}
              onView={handleViewOutfit}
            />
          ) : !loading && !error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#00132d] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {outfits.length === 0 ? 'Crie seu primeiro look' : 'Nenhum look encontrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {outfits.length === 0
                    ? 'Combine suas peças favoritas e crie looks incríveis para diferentes ocasiões.'
                    : 'Tente ajustar os filtros ou buscar por outros termos.'
                  }
                </p>
                {outfits.length === 0 && (
                  <Button size="lg" onClick={() => setIsCreationModalOpen(true)}>
                    Criar Primeiro Look
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </main>

        <OutfitCreationModal
          isOpen={isCreationModalOpen}
          onClose={() => setIsCreationModalOpen(false)}
          onSubmit={handleCreateOutfit}
        />
      </div>
    </ProtectedRoute>
  );
}