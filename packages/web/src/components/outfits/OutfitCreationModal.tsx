// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ItemSelector } from './ItemSelector';
import { OutfitBuilder } from './OutfitBuilder';
import { OutfitPreview } from './OutfitPreview';
import { SizeRecommendations } from './SizeRecommendations';
import { apiClient } from '@/lib/api';

interface OutfitCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (outfitData: any) => void;
}

type CreationStep = 'select_base' | 'build_outfit' | 'review' | 'save';

export function OutfitCreationModal({ isOpen, onClose, onSubmit }: OutfitCreationModalProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('select_base');
  const [pinnedItem, setPinnedItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [outfitDescription, setOutfitDescription] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [season, setSeason] = useState('all_season');
  const [style, setStyle] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);

  // Load wardrobe items using apiClient directly (same as wardrobe page)
  const loadWardrobeItems = async () => {
    setWardrobeLoading(true);
    try {
      const response = await apiClient.getWardrobeItems({});
      console.log('[OutfitCreationModal] API response:', response);
      setWardrobeItems(response.items || []);
    } catch (error) {
      console.error('[OutfitCreationModal] Error loading wardrobe:', error);
      setWardrobeItems([]);
    } finally {
      setWardrobeLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWardrobeItems();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep('select_base');
    setPinnedItem(null);
    setSelectedItems([]);
    setOutfitName('');
    setOutfitDescription('');
    setOccasion('casual');
    setSeason('all_season');
    setStyle([]);
    setIsPublic(false);
    setSuggestions([]);
  };

  const handlePinItem = async (item: any) => {
    setPinnedItem(item);
    setSelectedItems([item]);
    setCurrentStep('build_outfit');

    // Generate suggestions based on pinned item
    setLoading(true);
    try {
      // TODO: Call API to get outfit suggestions
      // const suggestions = await getOutfitSuggestions(item.id, { occasion, season });
      // setSuggestions(suggestions);

      // Mock suggestions for now
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: any) => {
    if (!selectedItems.find(selected => selected.id === item.id)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (pinnedItem?.id === itemId) {
      // Can't remove pinned item, go back to selection
      setCurrentStep('select_base');
      setPinnedItem(null);
      setSelectedItems([]);
    } else {
      setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'select_base':
        // Need to select a base item first
        break;
      case 'build_outfit':
        setCurrentStep('review');
        break;
      case 'review':
        setCurrentStep('save');
        break;
      case 'save':
        handleSubmit();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'build_outfit':
        setCurrentStep('select_base');
        break;
      case 'review':
        setCurrentStep('build_outfit');
        break;
      case 'save':
        setCurrentStep('review');
        break;
    }
  };

  const handleSubmit = () => {
    const outfitData = {
      name: outfitName || `Look ${new Date().toLocaleDateString()}`,
      description: outfitDescription,
      items: selectedItems.map(item => ({
        vufsItemId: item.id,
        position: determineItemPosition(item),
        layerOrder: 0, // TODO: Implement layering logic
      })),
      occasion,
      season,
      style,
      isPublic,
    };

    onSubmit(outfitData);
  };

  const determineItemPosition = (item: any) => {
    // Simple position mapping based on category
    const categoryPositions: Record<string, string> = {
      tops: 'top_base',
      bottoms: 'bottom',
      dresses: 'top_base',
      shoes: 'footwear',
      accessories: 'accessories',
      outerwear: 'top_outer',
    };

    return categoryPositions[item.category] || 'accessories';
  };

  const occasions = [
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
    { value: 'spring', label: 'Primavera' },
    { value: 'summer', label: 'Verão' },
    { value: 'fall', label: 'Outono' },
    { value: 'winter', label: 'Inverno' },
    { value: 'all_season', label: 'Todas as Estações' },
  ];

  const stepTitles = {
    select_base: 'Escolha uma peça base',
    build_outfit: 'Monte seu look',
    review: 'Revise seu look',
    save: 'Salve seu look',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {stepTitles[currentStep]}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                {(['select_base', 'build_outfit', 'review', 'save'] as CreationStep[]).map((step, index) => (
                  <div
                    key={step}
                    className={`w-8 h-2 rounded-full ${step === currentStep
                      ? 'bg-pink-500'
                      : index < (['select_base', 'build_outfit', 'review', 'save'] as CreationStep[]).indexOf(currentStep)
                        ? 'bg-pink-300'
                        : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {currentStep === 'select_base' && (
              <ItemSelector
                items={wardrobeItems}
                onSelectItem={handlePinItem}
                selectedItem={pinnedItem}
              />
            )}

            {currentStep === 'build_outfit' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OutfitBuilder
                  pinnedItem={pinnedItem}
                  selectedItems={selectedItems}
                  availableItems={wardrobeItems}
                  suggestions={suggestions}
                  loading={loading}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                />
                <OutfitPreview
                  items={selectedItems}
                  pinnedItem={pinnedItem}
                />
              </div>
            )}

            {currentStep === 'review' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <OutfitPreview
                    items={selectedItems}
                    pinnedItem={pinnedItem}
                  />
                  <SizeRecommendations
                    items={selectedItems}
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Look
                    </label>
                    <input
                      type="text"
                      value={outfitName}
                      onChange={(e) => setOutfitName(e.target.value)}
                      placeholder={`Look ${new Date().toLocaleDateString()}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={outfitDescription}
                      onChange={(e) => setOutfitDescription(e.target.value)}
                      placeholder="Descreva seu look..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ocasião
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        {occasions.map(occ => (
                          <option key={occ.value} value={occ.value}>
                            {occ.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estação
                      </label>
                      <select
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        {seasons.map(s => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                      Tornar público (outros usuários poderão ver)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={currentStep === 'select_base' ? onClose : handleBack}
            >
              {currentStep === 'select_base' ? 'Cancelar' : 'Voltar'}
            </Button>

            <div className="flex items-center space-x-3">
              {currentStep !== 'select_base' && (
                <span className="text-sm text-gray-600">
                  {selectedItems.length} peças selecionadas
                </span>
              )}
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 'select_base' && !pinnedItem) ||
                  (currentStep === 'build_outfit' && selectedItems.length < 2)
                }
              >
                {currentStep === 'review' ? 'Salvar Look' : 'Continuar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}