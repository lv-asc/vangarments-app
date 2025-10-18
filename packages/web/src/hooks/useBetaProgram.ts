import { useState, useEffect } from 'react';
import { useMockBetaProgram } from './useMockBetaProgram';

interface BetaParticipant {
  id: string;
  participantType: string;
  joinedAt: string;
  referralCode: string;
  status: string;
  privileges: {
    earlyAccess: boolean;
    advancedAnalytics: boolean;
    directFeedback: boolean;
    customBadges: boolean;
    prioritySupport: boolean;
  };
  metrics: {
    referralsCount: number;
    feedbackSubmitted: number;
    featuresUsed: string[];
    engagementScore: number;
  };
}

interface BetaStatus {
  isBetaParticipant: boolean;
  participant?: BetaParticipant;
}

interface BetaAnalytics {
  wardrobeInsights: {
    totalItems: number;
    categoriesUsed: number;
    averageItemValue: number;
    styleConsistency: number;
  };
  engagementMetrics: {
    dailyActiveTime: number;
    featuresUsed: string[];
    feedbackSubmitted: number;
    referralsGenerated: number;
  };
  industryInsights: {
    trendPredictions: Array<{
      category: string;
      trend: string;
      confidence: number;
      timeframe: string;
    }>;
    marketAnalysis: {
      priceRanges: Record<string, number>;
      popularBrands: Array<{ brand: string; usage: number }>;
      seasonalTrends: Record<string, number>;
    };
  };
  exclusiveData: {
    earlyTrendAccess: boolean;
    advancedFilters: boolean;
    customReports: boolean;
    directFeedbackChannel: boolean;
  };
}

export function useBetaProgram() {
  const [devMode, setDevMode] = useState(false);
  const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(null);
  const [analytics, setAnalytics] = useState<BetaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get mock beta program hook
  const mockBetaProgram = useMockBetaProgram();

  // Check if we're in dev mode
  useEffect(() => {
    const isDev = localStorage.getItem('devMode') === 'true';
    setDevMode(isDev);

    const handleStorageChange = () => {
      const isDev = localStorage.getItem('devMode') === 'true';
      setDevMode(isDev);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // If in dev mode, return mock beta program
  if (devMode) {
    return mockBetaProgram;
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const checkBetaStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setBetaStatus({ isBetaParticipant: false });
        return { isBetaParticipant: false };
      }

      const response = await fetch('/api/beta/status', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setBetaStatus(data);
        return data;
      } else if (response.status === 404 || response.status === 403) {
        setBetaStatus({ isBetaParticipant: false });
        return { isBetaParticipant: false };
      } else {
        console.warn('Beta status check failed:', response.status);
        setBetaStatus({ isBetaParticipant: false });
        return { isBetaParticipant: false };
      }
    } catch (err) {
      console.warn('Beta status check error:', err);
      setBetaStatus({ isBetaParticipant: false });
      return { isBetaParticipant: false };
    } finally {
      setLoading(false);
    }
  };

  const joinBetaProgram = async (participantType: string, referralCode?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/beta/join', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantType, referralCode })
      });

      if (response.ok) {
        const data = await response.json();
        await checkBetaStatus(); // Refresh status
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join beta program');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/beta/analytics', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        return data.analytics;
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const submitFeedback = async (feedbackData: {
    feedbackType: 'bug_report' | 'feature_request' | 'improvement' | 'general';
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    attachments?: string[];
  }) => {
    try {
      const response = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh beta status to update metrics
        await checkBetaStatus();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const getExclusiveContent = async () => {
    try {
      const response = await fetch('/api/beta/exclusive-content', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.content;
      } else {
        throw new Error('Failed to load exclusive content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const getNetworkVisibility = async () => {
    try {
      const response = await fetch('/api/beta/network-visibility', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.networkData;
      } else {
        throw new Error('Failed to load network data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const getLeaderboard = async () => {
    try {
      const response = await fetch('/api/beta/leaderboard', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.leaderboard;
      } else {
        throw new Error('Failed to load leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const validateReferralCode = async (referralCode: string) => {
    try {
      const response = await fetch(`/api/beta/referral/${referralCode}/validate`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        return { valid: false, error: errorData.error };
      }
    } catch (err) {
      return { valid: false, error: 'Failed to validate referral code' };
    }
  };

  const getFeedbackHistory = async (status?: string, limit = 20, offset = 0) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/beta/feedback?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to load feedback history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  // Auto-check beta status on hook initialization
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkBetaStatus();
    } else {
      setBetaStatus({ isBetaParticipant: false });
      setLoading(false);
    }
  }, []);

  return {
    betaStatus,
    analytics,
    loading,
    error,
    checkBetaStatus,
    joinBetaProgram,
    loadAnalytics,
    submitFeedback,
    getExclusiveContent,
    getNetworkVisibility,
    getLeaderboard,
    validateReferralCode,
    getFeedbackHistory,
    clearError: () => setError(null)
  };
}