import { apiClient } from './api';

// Types for analytics data
export interface StyleDNAData {
  dominantStyles: Array<{
    style: string;
    percentage: number;
    description: string;
  }>;
  colorPalette: Array<{
    color: string;
    frequency: number;
    hex: string;
  }>;
  brandAffinity: Array<{
    brand: string;
    itemCount: number;
    totalValue: number;
  }>;
  styleEvolution: Array<{
    period: string;
    dominantStyle: string;
    confidence: number;
  }>;
}

export interface OptimizationRecommendation {
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

export interface WardrobeStats {
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

export interface TrendPrediction {
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

export interface PersonalizedInsight {
  type: 'style_match' | 'color_harmony' | 'budget_fit' | 'occasion_need';
  title: string;
  description: string;
  actionable: boolean;
}

export interface ItemValuation {
  id: string;
  name: string;
  image: string;
  brand: string;
  category: string;
  purchasePrice: number;
  currentValue: number;
  marketValue: number;
  depreciation: number;
  wearCount: number;
  costPerWear: number;
  lastWorn: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  investmentScore: number;
  resaleability: number;
}

export interface UsageAnalytics {
  totalWears: number;
  averageWearFrequency: number;
  mostWornItems: ItemValuation[];
  leastWornItems: ItemValuation[];
  seasonalUsage: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  categoryUsage: Array<{
    category: string;
    wearCount: number;
    percentage: number;
  }>;
}

export interface WardrobeMetrics {
  totalInvestment: number;
  currentValue: number;
  totalDepreciation: number;
  averageCostPerWear: number;
  bestInvestments: ItemValuation[];
  worstInvestments: ItemValuation[];
  underutilizedValue: number;
}

// Analytics API functions
export const analyticsApi = {
  // Style DNA Analysis
  async getStyleDNA(): Promise<StyleDNAData> {
    return await apiClient.get('/analytics/style-dna');
  },

  // Wardrobe Optimization
  async getWardrobeOptimization(): Promise<{
    recommendations: OptimizationRecommendation[];
    stats: WardrobeStats;
  }> {
    return await apiClient.get('/analytics/wardrobe-optimization');
  },

  // Trend Predictions
  async getTrendPredictions(): Promise<{
    trends: TrendPrediction[];
    personalInsights: PersonalizedInsight[];
  }> {
    return await apiClient.get('/analytics/trend-predictions');
  },

  // Item Valuation and Usage Analytics
  async getItemAnalytics(): Promise<{
    items: ItemValuation[];
    usageAnalytics: UsageAnalytics;
    wardrobeMetrics: WardrobeMetrics;
  }> {
    return await apiClient.get('/analytics/item-analytics');
  },

  // Update item wear count (for tracking usage)
  async recordItemWear(itemId: string, wearDate: string): Promise<void> {
    await apiClient.post(`/analytics/items/${itemId}/wear`, { wearDate });
  },

  // Get personalized recommendations based on current wardrobe
  async getPersonalizedRecommendations(filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    occasion?: string;
  }): Promise<{
    recommendations: Array<{
      id: string;
      name: string;
      brand: string;
      price: number;
      image: string;
      reason: string;
      confidence: number;
    }>;
  }> {
    const params = filters ? { params: filters } : undefined;
    return await apiClient.get('/analytics/recommendations', params);
  },

  // Generate wardrobe report
  async generateWardrobeReport(reportType: 'monthly' | 'quarterly' | 'yearly'): Promise<{
    reportId: string;
    downloadUrl: string;
  }> {
    return await apiClient.post('/analytics/reports/generate', { reportType });
  },

  // Get market insights for specific items
  async getMarketInsights(itemIds: string[]): Promise<{
    insights: Array<{
      itemId: string;
      marketValue: number;
      priceHistory: Array<{ date: string; price: number }>;
      demandScore: number;
      resaleability: number;
    }>;
  }> {
    return await apiClient.post('/analytics/market-insights', { itemIds });
  },

  // Update user preferences for better recommendations
  async updateAnalyticsPreferences(preferences: {
    stylePreferences?: string[];
    budgetRange?: { min: number; max: number };
    occasionTypes?: string[];
    brandPreferences?: string[];
  }): Promise<void> {
    await apiClient.put('/analytics/preferences', preferences);
  },

  // Get analytics dashboard summary
  async getDashboardSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    monthlyWears: number;
    topCategories: Array<{ category: string; count: number }>;
    recentTrends: Array<{ name: string; relevance: number }>;
    optimizationScore: number;
  }> {
    return await apiClient.get('/analytics/dashboard-summary');
  }
};

// Utility functions for analytics calculations
export const analyticsUtils = {
  // Calculate cost per wear
  calculateCostPerWear(purchasePrice: number, wearCount: number): number {
    return wearCount > 0 ? purchasePrice / wearCount : purchasePrice;
  },

  // Calculate depreciation percentage
  calculateDepreciationPercentage(purchasePrice: number, currentValue: number): number {
    return ((purchasePrice - currentValue) / purchasePrice) * 100;
  },

  // Calculate investment score based on multiple factors
  calculateInvestmentScore(item: {
    costPerWear: number;
    depreciation: number;
    wearCount: number;
    resaleability: number;
  }): number {
    const costPerWearScore = Math.max(0, 100 - (item.costPerWear * 2));
    const depreciationScore = Math.max(0, 100 - item.depreciation);
    const usageScore = Math.min(100, item.wearCount * 5);
    const resaleScore = item.resaleability;

    return Math.round((costPerWearScore + depreciationScore + usageScore + resaleScore) / 4);
  },

  // Determine if an item is underutilized
  isUnderutilized(item: {
    wearCount: number;
    purchaseDate: string;
    costPerWear: number;
  }): boolean {
    const monthsSincePurchase = Math.floor(
      (Date.now() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const expectedWears = Math.max(1, monthsSincePurchase * 0.5); // Expected 0.5 wears per month minimum
    
    return item.wearCount < expectedWears || item.costPerWear > 50;
  },

  // Format currency values
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format percentage values
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
};