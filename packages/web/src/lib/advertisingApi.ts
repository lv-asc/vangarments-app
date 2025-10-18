import { apiClient } from './api';

// Types for advertising data
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  startDate: string;
  endDate: string;
  targetAudience: {
    demographics: string[];
    interests: string[];
    behaviors: string[];
  };
}

export interface AdvertisingMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  averageROAS: number;
  activeCampaigns: number;
}

export interface TrendReport {
  id: string;
  title: string;
  category: string;
  period: string;
  generatedDate: string;
  insights: Array<{
    type: 'growth' | 'decline' | 'stable' | 'emerging';
    title: string;
    description: string;
    percentage: number;
    confidence: number;
  }>;
  marketData: {
    totalMarketSize: number;
    growthRate: number;
    topBrands: Array<{
      name: string;
      marketShare: number;
      growth: number;
    }>;
    priceRanges: Array<{
      range: string;
      volume: number;
      growth: number;
    }>;
  };
  demographics: {
    ageGroups: Array<{
      range: string;
      engagement: number;
      spending: number;
    }>;
    genderSplit: {
      male: number;
      female: number;
      nonBinary: number;
    };
    geographicData: Array<{
      region: string;
      engagement: number;
      topTrends: string[];
    }>;
  };
}

export interface Partnership {
  id: string;
  partnerName: string;
  partnerType: 'brand' | 'influencer' | 'retailer' | 'affiliate';
  status: 'active' | 'pending' | 'paused' | 'terminated';
  commissionRate: number;
  totalRevenue: number;
  partnerRevenue: number;
  platformRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  startDate: string;
  lastPayment: string;
  nextPayment: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  platformRevenue: number;
  partnerRevenue: number;
  pendingPayments: number;
  activePartnerships: number;
  monthlyGrowth: number;
  topPerformingPartners: Partnership[];
}

export interface Transaction {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  commission: number;
  platformFee: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  orderDetails: {
    itemCount: number;
    category: string;
    customerType: string;
  };
}

// Advertising API functions
export const advertisingApi = {
  // Campaign Management
  async getCampaigns(): Promise<{
    campaigns: Campaign[];
    metrics: AdvertisingMetrics;
  }> {
    return await apiClient.get('/advertising/campaigns');
  },

  async createCampaign(campaignData: {
    name: string;
    budget: number;
    startDate: string;
    endDate: string;
    targetAudience: {
      demographics: string[];
      interests: string[];
      behaviors: string[];
    };
    adCreatives: Array<{
      type: 'image' | 'video';
      url: string;
      title: string;
      description: string;
    }>;
  }): Promise<Campaign> {
    return await apiClient.post('/advertising/campaigns', campaignData);
  },

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    return await apiClient.put(`/advertising/campaigns/${campaignId}`, updates);
  },

  async pauseCampaign(campaignId: string): Promise<void> {
    await apiClient.post(`/advertising/campaigns/${campaignId}/pause`);
  },

  async resumeCampaign(campaignId: string): Promise<void> {
    await apiClient.post(`/advertising/campaigns/${campaignId}/resume`);
  },

  async deleteCampaign(campaignId: string): Promise<void> {
    await apiClient.delete(`/advertising/campaigns/${campaignId}`);
  },

  // Campaign Analytics
  async getCampaignAnalytics(campaignId: string, dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    performance: {
      impressions: number[];
      clicks: number[];
      conversions: number[];
      dates: string[];
    };
    demographics: {
      ageGroups: Array<{ range: string; percentage: number }>;
      genders: Array<{ gender: string; percentage: number }>;
      locations: Array<{ location: string; percentage: number }>;
    };
    topPerformingAds: Array<{
      id: string;
      title: string;
      ctr: number;
      conversions: number;
    }>;
  }> {
    const params = dateRange ? { params: dateRange } : undefined;
    return await apiClient.get(`/advertising/campaigns/${campaignId}/analytics`, params);
  },

  // Audience Management
  async getAudienceInsights(): Promise<{
    demographics: Array<{
      segment: string;
      size: number;
      engagement: number;
      conversionRate: number;
    }>;
    interests: Array<{
      interest: string;
      popularity: number;
      growth: number;
    }>;
    behaviors: Array<{
      behavior: string;
      frequency: number;
      value: number;
    }>;
  }> {
    return await apiClient.get('/advertising/audience-insights');
  },

  async createCustomAudience(audienceData: {
    name: string;
    description: string;
    criteria: {
      demographics?: string[];
      interests?: string[];
      behaviors?: string[];
      wardrobeData?: {
        categories?: string[];
        brands?: string[];
        priceRanges?: string[];
      };
    };
  }): Promise<{
    id: string;
    name: string;
    size: number;
    estimatedReach: number;
  }> {
    return await apiClient.post('/advertising/audiences', audienceData);
  },

  // Trend Reports
  async getTrendReports(): Promise<TrendReport[]> {
    return await apiClient.get('/advertising/trend-reports');
  },

  async generateTrendReport(reportConfig: {
    category: string;
    period: string;
    regions?: string[];
    demographics?: string[];
  }): Promise<{
    reportId: string;
    estimatedCompletionTime: string;
  }> {
    return await apiClient.post('/advertising/trend-reports/generate', reportConfig);
  },

  async getTrendReport(reportId: string): Promise<TrendReport> {
    return await apiClient.get(`/advertising/trend-reports/${reportId}`);
  },

  async downloadTrendReport(reportId: string): Promise<{
    downloadUrl: string;
  }> {
    return await apiClient.get(`/advertising/trend-reports/${reportId}/download`);
  },

  // Market Intelligence
  async getMarketIntelligence(filters?: {
    category?: string;
    region?: string;
    timeframe?: string;
  }): Promise<{
    marketSize: number;
    growthRate: number;
    competitorAnalysis: Array<{
      brand: string;
      marketShare: number;
      growth: number;
      strengths: string[];
      weaknesses: string[];
    }>;
    opportunities: Array<{
      title: string;
      description: string;
      potential: number;
      difficulty: number;
    }>;
    threats: Array<{
      title: string;
      description: string;
      impact: number;
      probability: number;
    }>;
  }> {
    const params = filters ? { params: filters } : undefined;
    return await apiClient.get('/advertising/market-intelligence', params);
  },

  // Revenue Sharing & Partnerships
  async getPartnerships(): Promise<{
    partnerships: Partnership[];
    metrics: RevenueMetrics;
  }> {
    return await apiClient.get('/advertising/partnerships');
  },

  async createPartnership(partnershipData: {
    partnerName: string;
    partnerType: 'brand' | 'influencer' | 'retailer' | 'affiliate';
    commissionRate: number;
    terms: {
      paymentSchedule: 'weekly' | 'monthly' | 'quarterly';
      minimumPayout: number;
      exclusivity?: boolean;
    };
    contactInfo: {
      email: string;
      phone?: string;
      address?: string;
    };
  }): Promise<Partnership> {
    return await apiClient.post('/advertising/partnerships', partnershipData);
  },

  async updatePartnership(partnershipId: string, updates: Partial<Partnership>): Promise<Partnership> {
    return await apiClient.put(`/advertising/partnerships/${partnershipId}`, updates);
  },

  async getTransactions(filters?: {
    partnerId?: string;
    status?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = filters ? { params: filters } : undefined;
    return await apiClient.get('/advertising/transactions', params);
  },

  async processPayments(partnershipIds: string[]): Promise<{
    processedPayments: Array<{
      partnershipId: string;
      amount: number;
      status: 'success' | 'failed';
      transactionId?: string;
      error?: string;
    }>;
  }> {
    return await apiClient.post('/advertising/payments/process', { partnershipIds });
  },

  async getPaymentHistory(partnershipId: string): Promise<{
    payments: Array<{
      id: string;
      amount: number;
      date: string;
      status: 'completed' | 'pending' | 'failed';
      transactionId: string;
    }>;
  }> {
    return await apiClient.get(`/advertising/partnerships/${partnershipId}/payments`);
  },

  // Performance Tracking
  async getAdvertisingPerformance(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    overview: {
      totalSpend: number;
      totalRevenue: number;
      roas: number;
      conversionRate: number;
    };
    trends: {
      dates: string[];
      spend: number[];
      revenue: number[];
      conversions: number[];
    };
    topPerformingCampaigns: Array<{
      id: string;
      name: string;
      roas: number;
      conversions: number;
    }>;
    audiencePerformance: Array<{
      segment: string;
      ctr: number;
      conversionRate: number;
      roas: number;
    }>;
  }> {
    const params = dateRange ? { params: dateRange } : undefined;
    return await apiClient.get('/advertising/performance', params);
  },

  // Budget Management
  async getBudgetAnalysis(): Promise<{
    totalBudget: number;
    allocatedBudget: number;
    remainingBudget: number;
    budgetUtilization: number;
    campaignAllocations: Array<{
      campaignId: string;
      campaignName: string;
      allocatedBudget: number;
      spentBudget: number;
      utilization: number;
    }>;
    recommendations: Array<{
      type: 'increase' | 'decrease' | 'reallocate';
      campaignId: string;
      currentBudget: number;
      recommendedBudget: number;
      reason: string;
      expectedImpact: string;
    }>;
  }> {
    return await apiClient.get('/advertising/budget-analysis');
  },

  async updateBudgetAllocation(allocations: Array<{
    campaignId: string;
    newBudget: number;
  }>): Promise<void> {
    await apiClient.put('/advertising/budget-allocation', { allocations });
  },

  // A/B Testing
  async createABTest(testData: {
    campaignId: string;
    name: string;
    variants: Array<{
      name: string;
      adCreative: {
        type: 'image' | 'video';
        url: string;
        title: string;
        description: string;
      };
      targetAudience?: {
        demographics?: string[];
        interests?: string[];
        behaviors?: string[];
      };
    }>;
    trafficSplit: number[]; // e.g., [50, 50] for 50/50 split
    duration: number; // in days
    successMetric: 'ctr' | 'conversions' | 'roas';
  }): Promise<{
    testId: string;
    status: string;
    estimatedResults: string;
  }> {
    return await apiClient.post('/advertising/ab-tests', testData);
  },

  async getABTestResults(testId: string): Promise<{
    test: {
      id: string;
      name: string;
      status: 'running' | 'completed' | 'paused';
      duration: number;
      successMetric: string;
    };
    results: Array<{
      variantName: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      conversionRate: number;
      roas: number;
      confidence: number;
    }>;
    winner?: {
      variantName: string;
      improvement: number;
      confidence: number;
    };
    recommendations: string[];
  }> {
    return await apiClient.get(`/advertising/ab-tests/${testId}/results`);
  }
};

// Utility functions for advertising calculations
export const advertisingUtils = {
  // Calculate CTR (Click-Through Rate)
  calculateCTR(clicks: number, impressions: number): number {
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
  },

  // Calculate CPC (Cost Per Click)
  calculateCPC(spend: number, clicks: number): number {
    return clicks > 0 ? spend / clicks : 0;
  },

  // Calculate ROAS (Return on Ad Spend)
  calculateROAS(revenue: number, spend: number): number {
    return spend > 0 ? revenue / spend : 0;
  },

  // Calculate conversion rate
  calculateConversionRate(conversions: number, clicks: number): number {
    return clicks > 0 ? (conversions / clicks) * 100 : 0;
  },

  // Calculate commission amount
  calculateCommission(revenue: number, commissionRate: number): number {
    return revenue * (commissionRate / 100);
  },

  // Format advertising metrics
  formatMetric(value: number, type: 'currency' | 'percentage' | 'number'): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  },

  // Determine campaign performance status
  getCampaignPerformanceStatus(roas: number, ctr: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (roas >= 4 && ctr >= 2) return 'excellent';
    if (roas >= 3 && ctr >= 1.5) return 'good';
    if (roas >= 2 && ctr >= 1) return 'average';
    return 'poor';
  },

  // Calculate budget recommendations
  calculateBudgetRecommendation(currentBudget: number, roas: number, targetROAS: number): {
    recommendedBudget: number;
    change: number;
    changePercentage: number;
  } {
    const recommendedBudget = roas > targetROAS 
      ? currentBudget * 1.2 // Increase budget for high-performing campaigns
      : currentBudget * 0.8; // Decrease budget for underperforming campaigns
    
    const change = recommendedBudget - currentBudget;
    const changePercentage = (change / currentBudget) * 100;

    return {
      recommendedBudget,
      change,
      changePercentage
    };
  }
};