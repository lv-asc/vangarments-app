import { useState, useEffect, useCallback } from 'react';
import { 
  analyticsApi, 
  StyleDNAData, 
  OptimizationRecommendation, 
  WardrobeStats,
  TrendPrediction,
  PersonalizedInsight,
  ItemValuation,
  UsageAnalytics,
  WardrobeMetrics
} from '@/lib/analyticsApi';

// Hook for Style DNA analysis
export function useStyleDNA() {
  const [data, setData] = useState<StyleDNAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStyleDNA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const styleDNA = await analyticsApi.getStyleDNA();
      setData(styleDNA);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch style DNA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStyleDNA();
  }, [fetchStyleDNA]);

  return { data, loading, error, refetch: fetchStyleDNA };
}

// Hook for wardrobe optimization
export function useWardrobeOptimization() {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getWardrobeOptimization();
      setRecommendations(data.recommendations);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch optimization data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptimization();
  }, [fetchOptimization]);

  return { recommendations, stats, loading, error, refetch: fetchOptimization };
}

// Hook for trend predictions
export function useTrendPredictions() {
  const [trends, setTrends] = useState<TrendPrediction[]>([]);
  const [personalInsights, setPersonalInsights] = useState<PersonalizedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getTrendPredictions();
      setTrends(data.trends);
      setPersonalInsights(data.personalInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trend predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { trends, personalInsights, loading, error, refetch: fetchTrends };
}

// Hook for item analytics
export function useItemAnalytics() {
  const [items, setItems] = useState<ItemValuation[]>([]);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [wardrobeMetrics, setWardrobeMetrics] = useState<WardrobeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItemAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getItemAnalytics();
      setItems(data.items);
      setUsageAnalytics(data.usageAnalytics);
      setWardrobeMetrics(data.wardrobeMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch item analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordWear = useCallback(async (itemId: string, wearDate: string = new Date().toISOString()) => {
    try {
      await analyticsApi.recordItemWear(itemId, wearDate);
      // Refresh analytics after recording wear
      await fetchItemAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record item wear');
    }
  }, [fetchItemAnalytics]);

  useEffect(() => {
    fetchItemAnalytics();
  }, [fetchItemAnalytics]);

  return { 
    items, 
    usageAnalytics, 
    wardrobeMetrics, 
    loading, 
    error, 
    refetch: fetchItemAnalytics,
    recordWear
  };
}

// Hook for personalized recommendations
export function usePersonalizedRecommendations(filters?: {
  category?: string;
  priceRange?: { min: number; max: number };
  occasion?: string;
}) {
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
    reason: string;
    confidence: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getPersonalizedRecommendations(filters);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch: fetchRecommendations };
}

// Hook for dashboard summary
export function useAnalyticsDashboard() {
  const [summary, setSummary] = useState<{
    totalItems: number;
    totalValue: number;
    monthlyWears: number;
    topCategories: Array<{ category: string; count: number }>;
    recentTrends: Array<{ name: string; relevance: number }>;
    optimizationScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { summary, loading, error, refetch: fetchDashboard };
}

// Hook for generating reports
export function useReportGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (reportType: 'monthly' | 'quarterly' | 'yearly') => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.generateWardrobeReport(reportType);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `wardrobe-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateReport, loading, error };
}

// Hook for market insights
export function useMarketInsights(itemIds: string[]) {
  const [insights, setInsights] = useState<Array<{
    itemId: string;
    marketValue: number;
    priceHistory: Array<{ date: string; price: number }>;
    demandScore: number;
    resaleability: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (itemIds.length === 0) {
      setInsights([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getMarketInsights(itemIds);
      setInsights(data.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market insights');
    } finally {
      setLoading(false);
    }
  }, [itemIds]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, error, refetch: fetchInsights };
}

// Hook for updating analytics preferences
export function useAnalyticsPreferences() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = useCallback(async (preferences: {
    stylePreferences?: string[];
    budgetRange?: { min: number; max: number };
    occasionTypes?: string[];
    brandPreferences?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      await analyticsApi.updateAnalyticsPreferences(preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePreferences, loading, error };
}