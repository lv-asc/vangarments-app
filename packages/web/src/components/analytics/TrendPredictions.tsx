'use client';

import React, { useState } from 'react';

interface TrendPrediction {
  id: string;
  name: string;
  description: string;
  confidence: number;
  timeframe: string;
  category: string;
  personalRelevance: number;
  suggestedItems: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
    brand: string;
  }>;
  marketData: {
    growthRate: number;
    popularityScore: number;
    priceRange: {
      min: number;
      max: number;
    };
  };
}

interface PersonalizedInsight {
  type: 'style_match' | 'color_harmony' | 'budget_fit' | 'occasion_need';
  title: string;
  description: string;
  actionable: boolean;
}

interface TrendPredictionsProps {
  trends: TrendPrediction[];
  personalInsights: PersonalizedInsight[];
  loading?: boolean;
}

export default function TrendPredictions({ 
  trends, 
  personalInsights, 
  loading = false 
}: TrendPredictionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'confidence' | 'timeframe'>('relevance');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(trends.map(t => t.category)))];
  
  const filteredTrends = trends
    .filter(trend => selectedCategory === 'all' || trend.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.personalRelevance - a.personalRelevance;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'timeframe':
          return a.timeframe.localeCompare(b.timeframe);
        default:
          return 0;
      }
    });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return 'bg-purple-500';
    if (relevance >= 60) return 'bg-blue-500';
    if (relevance >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getInsightIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personalized Trend Predictions</h2>
      
      {/* Personal Insights */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Style Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalInsights.map((insight, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-[#fff7d7] to-[#fff7d7]/50 border border-[#00132d]/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  {insight.actionable && (
                    <button className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="timeframe">Sort by Timeframe</option>
          </select>
        </div>
        <p className="text-sm text-gray-600">
          Showing {filteredTrends.length} trend{filteredTrends.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrends.map((trend) => (
          <div key={trend.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#fff7d7] to-[#fff7d7]/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{trend.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(trend.confidence)}`}>
                  {trend.confidence}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{trend.description}</p>
              
              {/* Relevance Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Personal Relevance</span>
                  <span>{trend.personalRelevance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getRelevanceColor(trend.personalRelevance)}`}
                    style={{ width: `${trend.personalRelevance}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span className="bg-white px-2 py-1 rounded">{trend.category}</span>
                <span className="bg-white px-2 py-1 rounded">{trend.timeframe}</span>
              </div>
            </div>

            {/* Market Data */}
            <div className="p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Market Insights</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Growth Rate:</span>
                  <span className="ml-1 font-medium text-green-600">+{trend.marketData.growthRate}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Popularity:</span>
                  <span className="ml-1 font-medium">{trend.marketData.popularityScore}/100</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Price Range:</span>
                  <span className="ml-1 font-medium">
                    ${trend.marketData.priceRange.min} - ${trend.marketData.priceRange.max}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested Items */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Suggested Items</h4>
              <div className="space-y-2">
                {trend.suggestedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.brand}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">${item.price}</span>
                  </div>
                ))}
              </div>
              
              {trend.suggestedItems.length > 3 && (
                <button className="mt-3 w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View {trend.suggestedItems.length - 3} more items
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTrends.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No trends found for the selected category.</p>
        </div>
      )}
    </div>
  );
}