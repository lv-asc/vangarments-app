'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EnhancedAnalyticsDashboard from '@/components/analytics/EnhancedAnalyticsDashboard';

// Mock data - in real implementation, this would come from API calls
const mockStyleDNAData = {
  dominantStyles: [
    { style: 'Minimalist', percentage: 45, description: 'Clean lines, neutral colors, simple silhouettes' },
    { style: 'Casual Chic', percentage: 30, description: 'Effortless elegance with comfortable pieces' },
    { style: 'Classic', percentage: 15, description: 'Timeless pieces that never go out of style' },
    { style: 'Bohemian', percentage: 10, description: 'Free-spirited, artistic, and eclectic' }
  ],
  colorPalette: [
    { color: 'Black', frequency: 25, hex: '#000000' },
    { color: 'White', frequency: 20, hex: '#FFFFFF' },
    { color: 'Navy', frequency: 15, hex: '#1B263B' },
    { color: 'Beige', frequency: 12, hex: '#F5F5DC' }
  ],
  brandAffinity: [
    { brand: 'Zara', itemCount: 15, totalValue: 1200 },
    { brand: 'H&M', itemCount: 12, totalValue: 600 },
    { brand: 'Uniqlo', itemCount: 8, totalValue: 800 },
    { brand: 'COS', itemCount: 6, totalValue: 900 }
  ],
  styleEvolution: [
    { period: '2024 Q1', dominantStyle: 'Minimalist', confidence: 85 },
    { period: '2023 Q4', dominantStyle: 'Casual Chic', confidence: 78 },
    { period: '2023 Q3', dominantStyle: 'Classic', confidence: 72 }
  ]
};

const mockOptimizationData = {
  recommendations: [
    {
      id: '1',
      type: 'gap' as const,
      title: 'Missing Professional Blazers',
      description: 'Your wardrobe lacks structured blazers for professional occasions',
      priority: 'high' as const,
      actionItems: [
        'Invest in a navy blazer for versatility',
        'Consider a black blazer for formal events',
        'Look for structured shoulders and quality fabric'
      ],
      estimatedCost: 300
    },
    {
      id: '2',
      type: 'underutilized' as const,
      title: 'Underused Formal Dresses',
      description: 'You have 5 formal dresses worn less than twice each',
      priority: 'medium' as const,
      actionItems: [
        'Plan occasions to wear formal pieces',
        'Consider selling rarely worn items',
        'Repurpose for different occasions'
      ],
      potentialSavings: 200,
      items: [
        { id: '1', name: 'Black Evening Dress', image: '/api/placeholder/100/100', lastWorn: '2023-12-15', wearCount: 1 },
        { id: '2', name: 'Navy Cocktail Dress', image: '/api/placeholder/100/100', lastWorn: '2023-10-20', wearCount: 2 }
      ]
    }
  ],
  stats: {
    totalItems: 120,
    totalValue: 8500,
    averageCostPerWear: 12.50,
    underutilizedItems: 25,
    gapCategories: ['Professional Blazers', 'Winter Coats', 'Athletic Wear'],
    seasonalBalance: {
      spring: 28,
      summer: 35,
      fall: 32,
      winter: 25
    }
  }
};

const mockTrendData = {
  trends: [
    {
      id: '1',
      name: 'Oversized Blazers',
      description: 'Structured yet relaxed blazers are trending for professional and casual wear',
      confidence: 85,
      timeframe: 'Next 3 months',
      category: 'Outerwear',
      personalRelevance: 92,
      suggestedItems: [
        { id: '1', name: 'Oversized Navy Blazer', image: '/api/placeholder/100/100', price: 120, brand: 'Zara' },
        { id: '2', name: 'Linen Blazer', image: '/api/placeholder/100/100', price: 89, brand: 'H&M' }
      ],
      marketData: {
        growthRate: 25,
        popularityScore: 78,
        priceRange: { min: 60, max: 200 }
      }
    },
    {
      id: '2',
      name: 'Earth Tones',
      description: 'Warm, natural colors are dominating fashion palettes',
      confidence: 78,
      timeframe: 'Next 6 months',
      category: 'Colors',
      personalRelevance: 75,
      suggestedItems: [
        { id: '3', name: 'Terracotta Sweater', image: '/api/placeholder/100/100', price: 65, brand: 'Uniqlo' }
      ],
      marketData: {
        growthRate: 18,
        popularityScore: 82,
        priceRange: { min: 30, max: 150 }
      }
    }
  ],
  personalInsights: [
    {
      type: 'style_match' as const,
      title: 'Perfect Style Match',
      description: 'Oversized blazers align perfectly with your minimalist aesthetic',
      actionable: true
    },
    {
      type: 'budget_fit' as const,
      title: 'Budget-Friendly Trends',
      description: 'Current trends match your typical spending range of $50-120',
      actionable: false
    }
  ]
};

const mockValuationData = {
  items: [
    {
      id: '1',
      name: 'Designer Wool Coat',
      image: '/api/placeholder/100/100',
      brand: 'Max Mara',
      category: 'Outerwear',
      purchasePrice: 800,
      currentValue: 650,
      marketValue: 700,
      depreciation: 150,
      wearCount: 25,
      costPerWear: 32.00,
      lastWorn: '2024-02-15',
      condition: 'excellent' as const,
      investmentScore: 85,
      resaleability: 90
    },
    {
      id: '2',
      name: 'Fast Fashion Dress',
      image: '/api/placeholder/100/100',
      brand: 'H&M',
      category: 'Dresses',
      purchasePrice: 40,
      currentValue: 10,
      marketValue: 15,
      depreciation: 30,
      wearCount: 3,
      costPerWear: 13.33,
      lastWorn: '2023-08-10',
      condition: 'good' as const,
      investmentScore: 25,
      resaleability: 20
    }
  ],
  usageAnalytics: {
    totalWears: 450,
    averageWearFrequency: 3.75,
    mostWornItems: [
      {
        id: '3',
        name: 'Basic White Tee',
        image: '/api/placeholder/100/100',
        brand: 'Uniqlo',
        category: 'Tops',
        purchasePrice: 15,
        currentValue: 8,
        marketValue: 10,
        depreciation: 7,
        wearCount: 45,
        costPerWear: 0.33,
        lastWorn: '2024-03-01',
        condition: 'good' as const,
        investmentScore: 95,
        resaleability: 30
      }
    ],
    leastWornItems: [
      {
        id: '4',
        name: 'Formal Gown',
        image: '/api/placeholder/100/100',
        brand: 'BCBG',
        category: 'Dresses',
        purchasePrice: 300,
        currentValue: 150,
        marketValue: 180,
        depreciation: 150,
        wearCount: 1,
        costPerWear: 300.00,
        lastWorn: '2023-06-15',
        condition: 'new' as const,
        investmentScore: 15,
        resaleability: 60
      }
    ],
    seasonalUsage: {
      spring: 120,
      summer: 140,
      fall: 110,
      winter: 80
    },
    categoryUsage: [
      { category: 'Tops', wearCount: 180, percentage: 40 },
      { category: 'Bottoms', wearCount: 135, percentage: 30 },
      { category: 'Dresses', wearCount: 90, percentage: 20 },
      { category: 'Outerwear', wearCount: 45, percentage: 10 }
    ]
  },
  wardrobeMetrics: {
    totalInvestment: 8500,
    currentValue: 6200,
    totalDepreciation: 2300,
    averageCostPerWear: 12.50,
    bestInvestments: [
      {
        id: '5',
        name: 'Leather Jacket',
        image: '/api/placeholder/100/100',
        brand: 'AllSaints',
        category: 'Outerwear',
        purchasePrice: 400,
        currentValue: 380,
        marketValue: 350,
        depreciation: 20,
        wearCount: 30,
        costPerWear: 13.33,
        lastWorn: '2024-02-28',
        condition: 'excellent' as const,
        investmentScore: 92,
        resaleability: 85
      }
    ],
    worstInvestments: [
      {
        id: '6',
        name: 'Trendy Crop Top',
        image: '/api/placeholder/100/100',
        brand: 'Shein',
        category: 'Tops',
        purchasePrice: 25,
        currentValue: 3,
        marketValue: 5,
        depreciation: 22,
        wearCount: 2,
        costPerWear: 12.50,
        lastWorn: '2023-07-20',
        condition: 'fair' as const,
        investmentScore: 10,
        resaleability: 5
      }
    ],
    underutilizedValue: 1200
  }
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading with more realistic timing
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <EnhancedAnalyticsDashboard
      styleDNAData={mockStyleDNAData}
      optimizationData={mockOptimizationData}
      trendData={mockTrendData}
      valuationData={mockValuationData}
      loading={loading}
    />
  );
}