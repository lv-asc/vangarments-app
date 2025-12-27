// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/flags';
import { XIcon } from '@/components/ui/icons';
import { useAuth } from '@/contexts/AuthWrapper';

interface RingSizes {
  thumb?: string;
  indexFinger?: string;
  middleFinger?: string;
  ringFinger?: string;
  pinky?: string;
}

interface SizeRange {
  min?: string;
  max?: string;
}

interface CategorySizes {
  shoes?: SizeRange;
  tops?: string;
  bottoms?: string;
  dresses?: string;
  waist?: SizeRange;
  rings?: RingSizes;
}

interface Measurements {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  inseam?: number;
  shoulders?: number;
  armLength?: number;
  sizes?: {
    [standard: string]: CategorySizes;
  };
  preferredStandard?: 'BR' | 'US' | 'EU' | 'UK';
}

interface MeasurementManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeasurements?: Measurements;
  onSave?: (measurements: Measurements) => Promise<void>;
}

// Size conversion tables
const SHOE_SIZES_BR = ['33', '34', '34.5', '35', '35.5', '36', '36.5', '37', '37.5', '38', '38.5', '39', '39.5', '40', '40.5', '41', '41.5', '42', '42.5', '43', '43.5', '44', '44.5', '45', '46'];
const WAIST_SIZES_BR = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];
const CLOTHING_SIZES_BR = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'XXGG'];
const RING_SIZES_BR = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'];

// Conversion maps for automatic conversion when entering in BR standard
const SHOE_CONVERSIONS: Record<string, { US: string; EU: string; UK: string }> = {
  '33': { US: '3', EU: '33', UK: '1' },
  '34': { US: '4', EU: '34', UK: '2' },
  '34.5': { US: '4.5', EU: '34.5', UK: '2.5' },
  '35': { US: '5', EU: '35', UK: '3' },
  '35.5': { US: '5.5', EU: '35.5', UK: '3.5' },
  '36': { US: '6', EU: '36', UK: '4' },
  '36.5': { US: '6.5', EU: '36.5', UK: '4.5' },
  '37': { US: '7', EU: '37', UK: '5' },
  '37.5': { US: '7.5', EU: '37.5', UK: '5.5' },
  '38': { US: '8', EU: '38', UK: '6' },
  '38.5': { US: '8.5', EU: '38.5', UK: '6.5' },
  '39': { US: '9', EU: '39', UK: '7' },
  '39.5': { US: '9.5', EU: '39.5', UK: '7.5' },
  '40': { US: '10', EU: '40', UK: '8' },
  '40.5': { US: '10.5', EU: '40.5', UK: '8.5' },
  '41': { US: '11', EU: '41', UK: '9' },
  '41.5': { US: '11.5', EU: '41.5', UK: '9.5' },
  '42': { US: '12', EU: '42', UK: '10' },
  '42.5': { US: '12.5', EU: '42.5', UK: '10.5' },
  '43': { US: '13', EU: '43', UK: '11' },
  '43.5': { US: '13.5', EU: '43.5', UK: '11.5' },
  '44': { US: '14', EU: '44', UK: '12' },
  '44.5': { US: '14.5', EU: '44.5', UK: '12.5' },
  '45': { US: '15', EU: '45', UK: '13' },
  '46': { US: '16', EU: '46', UK: '14' },
};

const WAIST_CONVERSIONS: Record<string, { US: string; EU: string; UK: string }> = {
  '36': { US: '28', EU: '44', UK: '28' },
  '38': { US: '30', EU: '46', UK: '30' },
  '40': { US: '32', EU: '48', UK: '32' },
  '42': { US: '34', EU: '50', UK: '34' },
  '44': { US: '36', EU: '52', UK: '36' },
  '46': { US: '38', EU: '54', UK: '38' },
  '48': { US: '40', EU: '56', UK: '40' },
  '50': { US: '42', EU: '58', UK: '42' },
  '52': { US: '44', EU: '60', UK: '44' },
  '54': { US: '46', EU: '62', UK: '46' },
  '56': { US: '48', EU: '64', UK: '48' },
};

const CLOTHING_CONVERSIONS: Record<string, { US: string; EU: string; UK: string }> = {
  'PP': { US: 'XS', EU: '32', UK: '4' },
  'P': { US: 'S', EU: '34', UK: '6' },
  'M': { US: 'M', EU: '36', UK: '8' },
  'G': { US: 'L', EU: '38', UK: '10' },
  'GG': { US: 'XL', EU: '40', UK: '12' },
  'XGG': { US: 'XXL', EU: '42', UK: '14' },
  'XXGG': { US: 'XXXL', EU: '44', UK: '16' },
};

const RING_CONVERSIONS: Record<string, { US: string; EU: string; UK: string }> = {
  '10': { US: '5', EU: '49', UK: 'J' },
  '11': { US: '5.5', EU: '50', UK: 'K' },
  '12': { US: '6', EU: '51', UK: 'L' },
  '13': { US: '6.5', EU: '52', UK: 'L.5' },
  '14': { US: '7', EU: '54', UK: 'N' },
  '15': { US: '7.5', EU: '55', UK: 'O' },
  '16': { US: '8', EU: '57', UK: 'P' },
  '17': { US: '8.5', EU: '58', UK: 'Q' },
  '18': { US: '9', EU: '59', UK: 'R' },
  '19': { US: '9.5', EU: '60', UK: 'S' },
  '20': { US: '10', EU: '62', UK: 'T' },
  '21': { US: '10.5', EU: '63', UK: 'U' },
  '22': { US: '11', EU: '64', UK: 'V' },
  '23': { US: '11.5', EU: '65', UK: 'W' },
  '24': { US: '12', EU: '67', UK: 'X' },
  '25': { US: '12.5', EU: '68', UK: 'Y' },
  '26': { US: '13', EU: '69', UK: 'Z' },
};

const STANDARDS = [
  { key: 'BR' as const, label: 'Brasil', flag: 'BR' },
  { key: 'US' as const, label: 'Estados Unidos', flag: 'US' },
  { key: 'EU' as const, label: 'Europa', flag: 'EU' },
  { key: 'UK' as const, label: 'Reino Unido', flag: 'UK' }
];

const FINGERS = [
  { key: 'thumb', label: 'Polegar' },
  { key: 'indexFinger', label: 'Indicador' },
  { key: 'middleFinger', label: 'Médio' },
  { key: 'ringFinger', label: 'Anelar' },
  { key: 'pinky', label: 'Mindinho' }
];

export function MeasurementManager({ isOpen, onClose, initialMeasurements, onSave }: MeasurementManagerProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'body' | 'sizes' | 'rings'>('body');

  const [measurements, setMeasurements] = useState<Measurements>(() => {
    const initial = initialMeasurements || user?.measurements || {};
    return {
      height: initial.height || undefined,
      weight: initial.weight || undefined,
      chest: initial.chest || undefined,
      waist: initial.waist || undefined,
      hips: initial.hips || undefined,
      inseam: initial.inseam || undefined,
      shoulders: initial.shoulders || undefined,
      armLength: initial.armLength || undefined,
      preferredStandard: initial.preferredStandard || 'BR',
      sizes: initial.sizes || {
        BR: {},
        US: {},
        EU: {},
        UK: {}
      }
    };
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      const initial = initialMeasurements || user?.measurements || {};
      setMeasurements({
        height: initial.height || undefined,
        weight: initial.weight || undefined,
        chest: initial.chest || undefined,
        waist: initial.waist || undefined,
        hips: initial.hips || undefined,
        inseam: initial.inseam || undefined,
        shoulders: initial.shoulders || undefined,
        armLength: initial.armLength || undefined,
        preferredStandard: initial.preferredStandard || 'BR',
        sizes: initial.sizes || {
          BR: {},
          US: {},
          EU: {},
          UK: {}
        }
      });
    }
  }, [isOpen, initialMeasurements, user?.measurements]);

  // Auto-convert sizes to other standards when BR values change
  const convertAndSetSizes = (
    category: 'shoes' | 'waist',
    field: 'min' | 'max',
    brValue: string,
    conversionMap: Record<string, { US: string; EU: string; UK: string }>
  ) => {
    const conversion = conversionMap[brValue];
    if (!conversion) return;

    setMeasurements(prev => {
      const newSizes = { ...prev.sizes };

      // Update BR
      newSizes.BR = { ...newSizes.BR, [category]: { ...newSizes.BR?.[category], [field]: brValue } };

      // Update other standards with conversions
      newSizes.US = { ...newSizes.US, [category]: { ...newSizes.US?.[category], [field]: conversion.US } };
      newSizes.EU = { ...newSizes.EU, [category]: { ...newSizes.EU?.[category], [field]: conversion.EU } };
      newSizes.UK = { ...newSizes.UK, [category]: { ...newSizes.UK?.[category], [field]: conversion.UK } };

      return { ...prev, sizes: newSizes };
    });
  };

  const convertAndSetClothingSize = (
    category: 'tops' | 'bottoms' | 'dresses',
    brValue: string
  ) => {
    const conversionMap = category === 'bottoms' ? WAIST_CONVERSIONS : CLOTHING_CONVERSIONS;
    const conversion = conversionMap[brValue];

    setMeasurements(prev => {
      const newSizes = { ...prev.sizes };

      // Get current array for this category (or initialize as empty array)
      const currentBR = Array.isArray(prev.sizes?.BR?.[category])
        ? [...prev.sizes.BR[category]]
        : (prev.sizes?.BR?.[category] ? [prev.sizes.BR[category]] : []); // Backward compatibility

      // Toggle: if size exists, remove it; otherwise add it
      const newBR = currentBR.includes(brValue)
        ? currentBR.filter(s => s !== brValue)
        : [...currentBR, brValue];

      // Update BR with new array
      newSizes.BR = { ...newSizes.BR, [category]: newBR };

      // Convert and update all other standards
      if (conversion) {
        const currentUS = Array.isArray(prev.sizes?.US?.[category])
          ? [...prev.sizes.US[category]]
          : (prev.sizes?.US?.[category] ? [prev.sizes.US[category]] : []);
        const currentEU = Array.isArray(prev.sizes?.EU?.[category])
          ? [...prev.sizes.EU[category]]
          : (prev.sizes?.EU?.[category] ? [prev.sizes.EU[category]] : []);
        const currentUK = Array.isArray(prev.sizes?.UK?.[category])
          ? [...prev.sizes.UK[category]]
          : (prev.sizes?.UK?.[category] ? [prev.sizes.UK[category]] : []);

        // Toggle in other standards
        const newUS = currentUS.includes(conversion.US)
          ? currentUS.filter(s => s !== conversion.US)
          : [...currentUS, conversion.US];
        const newEU = currentEU.includes(conversion.EU)
          ? currentEU.filter(s => s !== conversion.EU)
          : [...currentEU, conversion.EU];
        const newUK = currentUK.includes(conversion.UK)
          ? currentUK.filter(s => s !== conversion.UK)
          : [...currentUK, conversion.UK];

        newSizes.US = { ...newSizes.US, [category]: newUS };
        newSizes.EU = { ...newSizes.EU, [category]: newEU };
        newSizes.UK = { ...newSizes.UK, [category]: newUK };
      }

      return { ...prev, sizes: newSizes };
    });
  };

  const convertAndSetRingSize = (finger: keyof RingSizes, brValue: string) => {
    const conversion = RING_CONVERSIONS[brValue];

    setMeasurements(prev => {
      const newSizes = { ...prev.sizes };

      // Update BR
      newSizes.BR = {
        ...newSizes.BR,
        rings: { ...newSizes.BR?.rings, [finger]: brValue }
      };

      if (conversion) {
        // Update other standards with conversions
        newSizes.US = { ...newSizes.US, rings: { ...newSizes.US?.rings, [finger]: conversion.US } };
        newSizes.EU = { ...newSizes.EU, rings: { ...newSizes.EU?.rings, [finger]: conversion.EU } };
        newSizes.UK = { ...newSizes.UK, rings: { ...newSizes.UK?.rings, [finger]: conversion.UK } };
      }

      return { ...prev, sizes: newSizes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (onSave) {
        await onSave(measurements);
      } else {
        await updateProfile({ measurements });
      }
      onClose();
    } catch (error) {
      console.error('Failed to update measurements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerenciar Medidas</h2>
            <p className="text-sm text-gray-500 mt-1">Configure seus tamanhos e medidas corporais</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <XIcon size="sm" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('body')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'body'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Medidas Corporais
          </button>
          <button
            onClick={() => setActiveTab('sizes')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sizes'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Tamanhos de Roupas
          </button>
          <button
            onClick={() => setActiveTab('rings')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rings'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Anéis
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preferred Standard Selector */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-600">Padrão preferido:</span>
            {STANDARDS.map((standard) => (
              <button
                key={standard.key}
                type="button"
                onClick={() => setMeasurements(prev => ({ ...prev, preferredStandard: standard.key }))}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${measurements.preferredStandard === standard.key
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <CountryFlag country={standard.flag} size="sm" />
                <span>{standard.key}</span>
              </button>
            ))}
          </div>

          {/* Body Measurements Tab */}
          {activeTab === 'body' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Medidas Corporais</h3>
              <p className="text-sm text-gray-500">Insira suas medidas em centímetros (cm) e quilogramas (kg).</p>

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
                      height: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="170"
                    min="50"
                    max="300"
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
                      weight: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="65"
                    min="20"
                    max="300"
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
                      chest: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="90"
                    min="40"
                    max="200"
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
                      waist: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="70"
                    min="40"
                    max="200"
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
                      hips: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="95"
                    min="40"
                    max="200"
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
                      inseam: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="75"
                    min="40"
                    max="120"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clothing Sizes Tab */}
          {activeTab === 'sizes' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Dica:</strong> Ao selecionar tamanhos no padrão brasileiro (BR), os tamanhos equivalentes nos outros padrões serão calculados automaticamente.
                </p>
              </div>

              {/* Shoe Sizes */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Calçados</h4>
                <p className="text-sm text-gray-500">Selecione a faixa de tamanhos que você geralmente usa.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho mínimo</label>
                    <select
                      value={measurements.sizes?.BR?.shoes?.min || ''}
                      onChange={(e) => convertAndSetSizes('shoes', 'min', e.target.value, SHOE_CONVERSIONS)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {SHOE_SIZES_BR.map(size => (
                        <option key={size} value={size}>{size} BR</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho máximo</label>
                    <select
                      value={measurements.sizes?.BR?.shoes?.max || ''}
                      onChange={(e) => convertAndSetSizes('shoes', 'max', e.target.value, SHOE_CONVERSIONS)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {SHOE_SIZES_BR.map(size => (
                        <option key={size} value={size}>{size} BR</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Waist/Pants Sizes */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Cintura (Calças)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho mínimo</label>
                    <select
                      value={measurements.sizes?.BR?.waist?.min || ''}
                      onChange={(e) => convertAndSetSizes('waist', 'min', e.target.value, WAIST_CONVERSIONS)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {WAIST_SIZES_BR.map(size => (
                        <option key={size} value={size}>{size} BR</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho máximo</label>
                    <select
                      value={measurements.sizes?.BR?.waist?.max || ''}
                      onChange={(e) => convertAndSetSizes('waist', 'max', e.target.value, WAIST_CONVERSIONS)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {WAIST_SIZES_BR.map(size => (
                        <option key={size} value={size}>{size} BR</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tops */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Blusas/Camisetas</h4>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_SIZES_BR.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => convertAndSetClothingSize('tops', size)}
                      className={`px-4 py-2 text-sm border rounded-lg transition-colors ${Array.isArray(measurements.sizes?.BR?.tops) && measurements.sizes.BR.tops.includes(size)
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottoms */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Calças/Saias</h4>
                <div className="flex flex-wrap gap-2">
                  {WAIST_SIZES_BR.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => convertAndSetClothingSize('bottoms', size)}
                      className={`px-4 py-2 text-sm border rounded-lg transition-colors ${Array.isArray(measurements.sizes?.BR?.bottoms) && measurements.sizes.BR.bottoms.includes(size)
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dresses */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Vestidos</h4>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_SIZES_BR.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => convertAndSetClothingSize('dresses', size)}
                      className={`px-4 py-2 text-sm border rounded-lg transition-colors ${Array.isArray(measurements.sizes?.BR?.dresses) && measurements.sizes.BR.dresses.includes(size)
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rings Tab */}
          {activeTab === 'rings' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Dica:</strong> Para medir seu tamanho de anel, enrole um fio ao redor do dedo e meça o comprimento em milímetros. Divida por π (3.14) para obter o diâmetro interno.
                </p>
              </div>

              <h4 className="font-medium text-gray-900">Tamanhos de Anéis por Dedo</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FINGERS.map((finger) => (
                  <div key={finger.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {finger.label}
                    </label>
                    <select
                      value={measurements.sizes?.BR?.rings?.[finger.key as keyof RingSizes] || ''}
                      onChange={(e) => convertAndSetRingSize(finger.key as keyof RingSizes, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">—</option>
                      {RING_SIZES_BR.map(size => (
                        <option key={size} value={size}>{size} BR</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

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
      </div >
    </div >
  );
}