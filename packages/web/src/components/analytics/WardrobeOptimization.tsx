'use client';

import React, { useState } from 'react';

interface OptimizationRecommendation {
  id: string;
  type: 'gap' | 'excess' | 'underutilized' | 'investment';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  potentialSavings?: number;
  estimatedCost?: number;
  items?: Array<{
    id: string;
    name: string;
    image: string;
    lastWorn?: string;
    wearCount: number;
  }>;
}

interface WardrobeStats {
  totalItems: number;
  totalValue: number;
  averageCostPerWear: number;
  underutilizedItems: number;
  gapCategories: string[];
  seasonalBalance: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
}

interface WardrobeOptimizationProps {
  recommendations: OptimizationRecommendation[];
  stats: WardrobeStats;
  loading?: boolean;
}

export default function WardrobeOptimization({ 
  recommendations, 
  stats, 
  loading = false 
}: WardrobeOptimizationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'gaps'>('overview');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Wardrobe Optimization</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'recommendations', label: 'Recommendations' },
          { key: 'gaps', label: 'Gaps Analysis' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-[#fff7d7] p-4 rounded-lg">
              <p className="text-sm text-[#00132d] font-medium">Avg Cost/Wear</p>
              <p className="text-2xl font-bold text-[#00132d]">${stats.averageCostPerWear.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Underutilized</p>
              <p className="text-2xl font-bold text-orange-900">{stats.underutilizedItems}</p>
            </div>
          </div>

          {/* Seasonal Balance */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seasonal Balance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.seasonalBalance).map(([season, count]) => (
                <div key={season} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-[#00132d] to-[#00132d]/80 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{season}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                  {rec.priority} priority
                </span>
              </div>

              {/* Action Items */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Action Items:</h4>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Impact */}
              {(rec.potentialSavings || rec.estimatedCost) && (
                <div className="flex space-x-4 text-sm">
                  {rec.potentialSavings && (
                    <span className="text-green-600 font-medium">
                      Potential savings: ${rec.potentialSavings}
                    </span>
                  )}
                  {rec.estimatedCost && (
                    <span className="text-blue-600 font-medium">
                      Estimated cost: ${rec.estimatedCost}
                    </span>
                  )}
                </div>
              )}

              {/* Related Items */}
              {rec.items && rec.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Related Items:</h4>
                  <div className="flex space-x-2 overflow-x-auto">
                    {rec.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-16 text-center">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg mb-1"
                        />
                        <p className="text-xs text-gray-600 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.wearCount} wears</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gaps Analysis Tab */}
      {activeTab === 'gaps' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Identified Gaps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.gapCategories.map((category, index) => (
                <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900">{category}</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Missing essential items in this category
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Additions</h3>
            <div className="space-y-3">
              {recommendations
                .filter(rec => rec.type === 'gap')
                .map((rec) => (
                  <div key={rec.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900">{rec.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                    {rec.estimatedCost && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        Budget: ${rec.estimatedCost}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}