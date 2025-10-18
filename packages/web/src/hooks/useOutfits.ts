'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api';

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

interface OutfitFilters {
  occasion?: string;
  season?: string;
  style?: string[];
  colors?: string[];
  hasItem?: string;
  isFavorite?: boolean;
  search?: string;
}

export function useOutfits() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load outfits from API
  const loadOutfits = async (filters?: OutfitFilters) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.occasion) queryParams.append('occasion', filters.occasion);
      if (filters?.season) queryParams.append('season', filters.season);
      if (filters?.style) filters.style.forEach(s => queryParams.append('style', s));
      if (filters?.colors) filters.colors.forEach(c => queryParams.append('colors', c));
      if (filters?.hasItem) queryParams.append('hasItem', filters.hasItem);
      if (filters?.isFavorite !== undefined) queryParams.append('isFavorite', filters.isFavorite.toString());
      if (filters?.search) queryParams.append('search', filters.search);

      const response = await apiClient.get<{ outfits: Outfit[] }>(`/outfits?${queryParams.toString()}`);

      setOutfits(response.outfits || []);
    } catch (err) {
      console.error('Load outfits error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load outfits');
      
      // For development, use mock data
      setOutfits(getMockOutfits());
    } finally {
      setLoading(false);
    }
  };

  // Create new outfit
  const createOutfit = async (outfitData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const data = await apiClient.post<{ outfit: Outfit }>('/outfits', outfitData);
      const newOutfit = data.outfit;
      
      setOutfits(prev => [newOutfit, ...prev]);
      return newOutfit;
    } catch (err) {
      console.error('Create outfit error:', err);
      
      // For development, create mock outfit
      const mockOutfit = createMockOutfit(outfitData);
      setOutfits(prev => [mockOutfit, ...prev]);
      return mockOutfit;
    }
  };

  // Update outfit
  const updateOutfit = async (outfitId: string, updateData: Partial<any>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const data = await apiClient.put<{ outfit: Outfit }>(`/outfits/${outfitId}`, updateData);
      const updatedOutfit = data.outfit;
      
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? updatedOutfit : outfit
      ));
      
      return updatedOutfit;
    } catch (err) {
      console.error('Update outfit error:', err);
      throw err;
    }
  };

  // Delete outfit
  const deleteOutfit = async (outfitId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await apiClient.delete(`/outfits/${outfitId}`);

      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
    } catch (err) {
      console.error('Delete outfit error:', err);
      
      // For development, remove from local state
      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (outfitId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const data = await apiClient.post<{ outfit: Outfit }>(`/outfits/${outfitId}/favorite`);
      const updatedOutfit = data.outfit;
      
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? updatedOutfit : outfit
      ));
    } catch (err) {
      console.error('Toggle favorite error:', err);
      
      // For development, update local state
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId 
          ? { ...outfit, isFavorite: !outfit.isFavorite }
          : outfit
      ));
    }
  };

  // Record outfit wear
  const recordWear = async (outfitId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const data = await apiClient.post<{ outfit: Outfit }>(`/outfits/${outfitId}/wear`);
      const updatedOutfit = data.outfit;
      
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? updatedOutfit : outfit
      ));
    } catch (err) {
      console.error('Record wear error:', err);
      
      // For development, update local state
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId 
          ? { 
              ...outfit, 
              wearCount: outfit.wearCount + 1,
              lastWorn: new Date()
            }
          : outfit
      ));
    }
  };

  // Get outfit suggestions
  const getOutfitSuggestions = async (baseItemId: string, preferences?: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const queryParams = new URLSearchParams();
      if (preferences?.occasion) queryParams.append('occasion', preferences.occasion);
      if (preferences?.season) queryParams.append('season', preferences.season);
      if (preferences?.style) preferences.style.forEach((s: string) => queryParams.append('style', s));

      const data = await apiClient.get<{ suggestions: any[] }>(`/outfits/suggestions/${baseItemId}?${queryParams.toString()}`);
      return data.suggestions || [];
    } catch (err) {
      console.error('Get suggestions error:', err);
      return [];
    }
  };

  // Load outfits on mount
  useEffect(() => {
    if (user) {
      loadOutfits();
    }
  }, [user]);

  return {
    outfits,
    loading,
    error,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    recordWear,
    loadOutfits,
    getOutfitSuggestions,
  };
}

// Mock data for development
function getMockOutfits(): Outfit[] {
  return [
    {
      id: '1',
      name: 'Look Casual de Verão',
      description: 'Perfeito para um passeio no parque',
      items: [
        { vufsItemId: '1', position: 'top_base', layerOrder: 0 },
        { vufsItemId: '2', position: 'bottom', layerOrder: 0 },
        { vufsItemId: '4', position: 'footwear', layerOrder: 0 },
      ],
      occasion: 'casual',
      season: 'summer',
      style: ['casual', 'comfortable'],
      colorPalette: ['White', 'Blue', 'Brown'],
      isPublic: true,
      isFavorite: true,
      wearCount: 3,
      lastWorn: new Date('2024-01-10'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      name: 'Look Trabalho Elegante',
      description: 'Para reuniões importantes',
      items: [
        { vufsItemId: '1', position: 'top_base', layerOrder: 0 },
        { vufsItemId: '2', position: 'bottom', layerOrder: 0 },
      ],
      occasion: 'work',
      season: 'all_season',
      style: ['professional', 'elegant'],
      colorPalette: ['Black', 'White'],
      isPublic: false,
      isFavorite: false,
      wearCount: 5,
      lastWorn: new Date('2024-01-08'),
      createdAt: new Date('2023-12-15'),
      updatedAt: new Date('2024-01-08'),
    },
  ];
}

function createMockOutfit(outfitData: any): Outfit {
  return {
    id: `mock_${Date.now()}`,
    name: outfitData.name || `Look ${new Date().toLocaleDateString()}`,
    description: outfitData.description,
    items: outfitData.items || [],
    occasion: outfitData.occasion || 'casual',
    season: outfitData.season || 'all_season',
    style: outfitData.style || [],
    colorPalette: ['Blue', 'White'], // Mock color palette
    isPublic: outfitData.isPublic || false,
    isFavorite: false,
    wearCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}