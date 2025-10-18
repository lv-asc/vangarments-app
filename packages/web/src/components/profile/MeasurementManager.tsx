'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/flags';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';

interface SizeChart {
  [key: string]: string | number;
}

interface Measurements {
  height: number; // cm
  weight: number; // kg
  chest: number; // cm
  waist: number; // cm
  hips: number; // cm
  inseam: number; // cm
  sizes: {
    BR: SizeChart;
    US: SizeChart;
    EU: SizeChart;
    UK: SizeChart;
  };
}

interface MeasurementManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MeasurementManager({ isOpen, onClose }: MeasurementManagerProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeStandard, setActiveStandard] = useState<'BR' | 'US' | 'EU' | 'UK'>('BR');
  
  const [measurements, setMeasurements] = useState<Measurements>({
    height: user?.measurements?.height || 0,
    weight: user?.measurements?.weight || 0,
    chest: user?.measurements?.chest || 0,
    waist: user?.measurements?.waist || 0,
    hips: user?.measurements?.hips || 0,
    inseam: user?.measurements?.inseam || 0,
    sizes: {
      BR: user?.measurements?.sizes?.BR || {},
      US: user?.measurements?.sizes?.US || {},
      EU: user?.measurements?.sizes?.EU || {},
      UK: user?.measurements?.sizes?.UK || {}
    }
  });

  // Size conversion functions (simplified - in real app would be more comprehensive)
  const convertSizes = (baseSizes: SizeChart, fromStandard: string, toStandard: string): SizeChart => {
    // This is a simplified conversion - real implementation would have comprehensive size charts
    const conversions: { [key: string]: { [key: string]: { [key: string]: string } } } = {
      BR: {
        US: { 'PP': 'XS', 'P': 'S', 'M': 'M', 'G': 'L', 'GG': 'XL', 'XGG': 'XXL' },
        EU: { 'PP': '32', 'P': '34', 'M': '36', 'G': '38', 'GG': '40', 'XGG': '42' },
        UK: { 'PP': '6', 'P': '8', 'M': '10', 'G': '12', 'GG': '14', 'XGG': '16' }
      }
    };

    const converted: SizeChart = {};
    Object.entries(baseSizes).forEach(([category, size]) => {
      if (conversions[fromStandard]?.[toStandard]?.[size as string]) {
        converted[category] = conversions[fromStandard][toStandard][size as string];
      } else {
        converted[category] = size;
      }
    });

    return converted;
  };

  const updateSizeForStandard = (category: string, size: string) => {
    const newSizes = {
      ...measurements.sizes,
      [activeStandard]: {
        ...measurements.sizes[activeStandard],
        [category]: size
      }
    };

    // Auto-convert to other standards if this is the primary standard (BR)
    if (activeStandard === 'BR') {
      newSizes.US = convertSizes(newSizes.BR, 'BR', 'US');
      newSizes.EU = convertSizes(newSizes.BR, 'BR', 'EU');
      newSizes.UK = convertSizes(newSizes.BR, 'BR', 'UK');
    }

    setMeasurements({
      ...measurements,
      sizes: newSizes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        measurements
      });
      onClose();
    } catch (error) {
      console.error('Failed to update measurements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeCategories = [
    { key: 'tops', label: 'Blusas/Camisetas', options: ['PP', 'P', 'M', 'G', 'GG', 'XGG'] },
    { key: 'bottoms', label: 'Calças/Saias', options: ['36', '38', '40', '42', '44', '46', '48'] },
    { key: 'dresses', label: 'Vestidos', options: ['PP', 'P', 'M', 'G', 'GG', 'XGG'] },
    { key: 'shoes', label: 'Sapatos', options: ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'] },
    { key: 'bras', label: 'Sutiãs', options: ['32A', '32B', '34A', '34B', '34C', '36A', '36B', '36C', '38A', '38B', '38C'] }
  ];

  const standards = [
    { key: 'BR' as const, label: 'Brasil', flag: 'BR' },
    { key: 'US' as const, label: 'Estados Unidos', flag: 'US' },
    { key: 'EU' as const, label: 'Europa', flag: 'EU' },
    { key: 'UK' as const, label: 'Reino Unido', flag: 'UK' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Medidas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Body Measurements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Medidas Corporais</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={measurements.height || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    height: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="170"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={measurements.weight || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    weight: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="65"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Busto (cm)
                </label>
                <input
                  type="number"
                  value={measurements.chest || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    chest: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cintura (cm)
                </label>
                <input
                  type="number"
                  value={measurements.waist || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    waist: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quadril (cm)
                </label>
                <input
                  type="number"
                  value={measurements.hips || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    hips: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="95"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entrepernas (cm)
                </label>
                <input
                  type="number"
                  value={measurements.inseam || ''}
                  onChange={(e) => setMeasurements({
                    ...measurements,
                    inseam: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="75"
                />
              </div>
            </div>
          </div>

          {/* Size Standards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tamanhos por Padrão</h3>
            
            {/* Standard Selector */}
            <div className="flex space-x-2 overflow-x-auto">
              {standards.map((standard) => (
                <button
                  key={standard.key}
                  type="button"
                  onClick={() => setActiveStandard(standard.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
                    activeStandard === standard.key
                      ? 'bg-pink-50 border-pink-200 text-pink-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CountryFlag country={standard.flag} size="sm" />
                  <span className="text-sm font-medium">{standard.label}</span>
                </button>
              ))}
            </div>

            {/* Size Categories */}
            <div className="space-y-6">
              {sizeCategories.map((category) => (
                <div key={category.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {category.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSizeForStandard(category.key, size)}
                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          measurements.sizes[activeStandard][category.key] === size
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {measurements.sizes[activeStandard][category.key] && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selecionado: {measurements.sizes[activeStandard][category.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Auto-conversion notice */}
            {activeStandard === 'BR' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Conversão Automática:</strong> Ao definir seus tamanhos no padrão brasileiro, 
                  os tamanhos equivalentes nos outros padrões serão calculados automaticamente.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Medidas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}