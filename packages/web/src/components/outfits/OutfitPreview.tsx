// @ts-nocheck
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface OutfitPreviewProps {
  items: any[];
  pinnedItem?: any;
}

export function OutfitPreview({ items, pinnedItem }: OutfitPreviewProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Organize items by position for better display
  const organizeItemsByPosition = () => {
    const positions = {
      headwear: [],
      eyewear: [],
      jewelry: [],
      tops: [],
      bottoms: [],
      footwear: [],
      accessories: [],
      bags: [],
    };

    items.forEach(item => {
      switch (item.category) {
        case 'tops':
        case 'dresses':
          positions.tops.push(item);
          break;
        case 'bottoms':
          positions.bottoms.push(item);
          break;
        case 'shoes':
          positions.footwear.push(item);
          break;
        case 'accessories':
          positions.accessories.push(item);
          break;
        case 'outerwear':
          positions.tops.push(item);
          break;
        default:
          positions.accessories.push(item);
      }
    });

    return positions;
  };

  const organizedItems = organizeItemsByPosition();

  // Calculate outfit analysis
  const analyzeOutfit = () => {
    if (items.length < 2) return null;

    const colors = [...new Set(items.map(item => item.color))];
    const brands = [...new Set(items.map(item => item.brand).filter(Boolean))];
    const styles = [...new Set(items.flatMap(item => item.tags || []))];

    // Simple color harmony analysis
    const neutrals = ['Black', 'White', 'Gray', 'Grey', 'Beige', 'Cream'];
    const hasNeutrals = colors.some(color => neutrals.includes(color));
    const colorCount = colors.length;

    let colorHarmony = 70; // Base score
    if (hasNeutrals) colorHarmony += 15;
    if (colorCount <= 3) colorHarmony += 10;
    if (colorCount === 1) colorHarmony += 5;

    // Style coherence
    let styleCoherence = 75;
    if (brands.length <= 2) styleCoherence += 10;

    // Overall score
    const overallScore = Math.round((colorHarmony + styleCoherence) / 2);

    return {
      colorHarmony,
      styleCoherence,
      overallScore,
      colors,
      brands,
      styles: styles.slice(0, 3),
      insights: generateInsights(colors, brands, items),
    };
  };

  const generateInsights = (colors: string[], brands: string[], items: any[]) => {
    const insights = [];

    if (colors.length <= 2) {
      insights.push('Paleta de cores harmoniosa');
    }

    if (brands.length === 1) {
      insights.push('Look monocromático da marca');
    }

    const hasBasics = items.some(item =>
      item.tags?.includes('básico') ||
      ['Black', 'White', 'Gray'].includes(item.color)
    );

    if (hasBasics) {
      insights.push('Inclui peças básicas versáteis');
    }

    if (items.length >= 4) {
      insights.push('Look completo e bem estruturado');
    }

    return insights;
  };

  const analysis = analyzeOutfit();

  // Generate outfit preview image (simplified version)
  const generatePreviewLayout = () => {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Items arranged in outfit layout */}
        <div className="relative p-6 h-full flex flex-col items-center justify-center space-y-4">
          {/* Top items */}
          {organizedItems.tops.length > 0 && (
            <div className="flex space-x-2">
              {organizedItems.tops.map((item, index) => (
                <div
                  key={item.id}
                  className={`w-16 h-20 rounded-lg overflow-hidden shadow-sm ${item.id === pinnedItem?.id ? 'ring-2 ring-pink-400' : ''
                    }`}
                  style={{ zIndex: organizedItems.tops.length - index }}
                >
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bottom items */}
          {organizedItems.bottoms.length > 0 && (
            <div className="flex space-x-2">
              {organizedItems.bottoms.map((item, index) => (
                <div
                  key={item.id}
                  className={`w-16 h-20 rounded-lg overflow-hidden shadow-sm ${item.id === pinnedItem?.id ? 'ring-2 ring-pink-400' : ''
                    }`}
                >
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footwear */}
          {organizedItems.footwear.length > 0 && (
            <div className="flex space-x-2">
              {organizedItems.footwear.map((item) => (
                <div
                  key={item.id}
                  className={`w-14 h-14 rounded-lg overflow-hidden shadow-sm ${item.id === pinnedItem?.id ? 'ring-2 ring-pink-400' : ''
                    }`}
                >
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/300'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Accessories */}
          {organizedItems.accessories.length > 0 && (
            <div className="flex space-x-1 mt-2">
              {organizedItems.accessories.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`w-8 h-8 rounded-full overflow-hidden shadow-sm ${item.id === pinnedItem?.id ? 'ring-2 ring-pink-400' : ''
                    }`}
                >
                  <img
                    src={item.images?.[0] || '/api/placeholder/200/200'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {organizedItems.accessories.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    +{organizedItems.accessories.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Preview do Look
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {items.length} peças
            </span>
            {analysis && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="flex items-center space-x-1 text-sm text-pink-600 hover:text-pink-700"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Análise</span>
              </button>
            )}
          </div>
        </div>

        {/* Preview Display */}
        <div className="aspect-[3/4] bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
          {items.length > 0 ? (
            generatePreviewLayout()
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <EyeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Adicione peças para ver o preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Peças do Look
          </h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${item.id === pinnedItem?.id
                    ? 'border-pink-200 bg-pink-50'
                    : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate">
                    {item.name}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {item.brand} • {item.color}
                  </p>
                </div>
                {item.id === pinnedItem?.id && (
                  <div className="text-pink-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outfit Analysis */}
      {analysis && showAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#fff7d7] to-[#fff7d7]/50 rounded-lg p-4 border border-[#00132d]/20"
        >
          <div className="flex items-center space-x-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-pink-600" />
            <h4 className="font-medium text-gray-900">
              Análise do Look
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Harmonia das Cores</span>
                <span className="text-sm font-medium text-gray-900">
                  {analysis.colorHarmony}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.colorHarmony}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Coerência do Estilo</span>
                <span className="text-sm font-medium text-gray-900">
                  {analysis.styleCoherence}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.styleCoherence}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Score Geral</span>
              <span className="text-lg font-bold text-gray-900">
                {analysis.overallScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#00132d] to-[#00132d]/80 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysis.overallScore}%` }}
              />
            </div>
          </div>

          {analysis.insights.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">
                Insights
              </h5>
              <div className="space-y-1">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}