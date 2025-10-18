import { useState, useEffect } from 'react';
import { 
  mockBetaStatus, 
  mockAnalytics, 
  mockExclusiveContent, 
  mockNetworkData, 
  mockReferralData 
} from '../components/beta/BetaProgramMock';

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

export function useMockBetaProgram() {
  const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkBetaStatus = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user has beta access based on their email
      const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
      const isBetaUser = mockUser.email === 'lvicentini10@gmail.com';
      
      if (isBetaUser) {
        setBetaStatus(mockBetaStatus);
      } else {
        setBetaStatus({ isBetaParticipant: false });
      }
      
      return isBetaUser ? mockBetaStatus : { isBetaParticipant: false };
    } catch (err) {
      console.warn('Mock beta status check error:', err);
      setBetaStatus({ isBetaParticipant: false });
      return { isBetaParticipant: false };
    } finally {
      setLoading(false);
    }
  };

  const joinBetaProgram = async (participantType: string, referralCode?: string) => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock user to be a beta participant
      const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
      const updatedStatus = {
        ...mockBetaStatus,
        participant: {
          ...mockBetaStatus.participant!,
          participantType,
        }
      };
      
      setBetaStatus(updatedStatus);
      
      // Add beta badge to user
      if (mockUser.badges) {
        const hasBetaBadge = mockUser.badges.some((badge: any) => badge.type === 'beta_pioneer');
        if (!hasBetaBadge) {
          mockUser.badges.push({
            name: 'Beta Pioneer',
            type: 'beta_pioneer',
            description: 'Early beta program participant'
          });
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
        }
      }
      
      return updatedStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalytics(mockAnalytics);
      return mockAnalytics;
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update metrics
      if (betaStatus?.participant) {
        const updatedStatus = {
          ...betaStatus,
          participant: {
            ...betaStatus.participant,
            metrics: {
              ...betaStatus.participant.metrics,
              feedbackSubmitted: betaStatus.participant.metrics.feedbackSubmitted + 1,
            }
          }
        };
        setBetaStatus(updatedStatus);
      }
      
      return {
        id: 'feedback-' + Date.now(),
        ...feedbackData,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const getExclusiveContent = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockExclusiveContent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const getNetworkVisibility = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockNetworkData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const getLeaderboard = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockReferralData.leaderboard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const validateReferralCode = async (referralCode: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock validation - accept any code that looks like a referral code
      const isValid = /^[A-Z0-9]{4,8}$/.test(referralCode);
      
      if (isValid) {
        return {
          valid: true,
          referrer: {
            participantType: 'influencer',
            joinedAt: '2024-01-01T00:00:00Z',
          },
        };
      } else {
        return { valid: false, error: 'Invalid referral code format' };
      }
    } catch (err) {
      return { valid: false, error: 'Failed to validate referral code' };
    }
  };

  const getFeedbackHistory = async (status?: string, limit = 20, offset = 0) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock feedback history
      const mockFeedback = [
        {
          id: 'feedback-1',
          feedbackType: 'feature_request',
          title: 'Better AI Recommendations',
          description: 'The AI could be more accurate with style suggestions',
          priority: 'medium',
          status: 'reviewed',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'feedback-2',
          feedbackType: 'bug_report',
          title: 'Upload Issue',
          description: 'Sometimes images fail to upload',
          priority: 'high',
          status: 'in_progress',
          createdAt: '2024-01-10T14:30:00Z',
        },
      ];
      
      return {
        feedback: mockFeedback,
        total: mockFeedback.length,
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  // Auto-check beta status on hook initialization
  useEffect(() => {
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
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