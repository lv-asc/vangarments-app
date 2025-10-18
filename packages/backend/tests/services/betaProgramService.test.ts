import { BetaProgramService } from '../../src/services/betaProgramService';
import { BetaProgramModel } from '../../src/models/BetaProgram';
import { BusinessBadgeModel } from '../../src/models/BusinessBadge';

// Mock the models
jest.mock('../../src/models/BetaProgram');
jest.mock('../../src/models/BusinessBadge');

const mockBetaProgramModel = BetaProgramModel as jest.Mocked<typeof BetaProgramModel>;
const mockBusinessBadgeModel = BusinessBadgeModel as jest.Mocked<typeof BusinessBadgeModel>;

describe('BetaProgramService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('joinBetaProgram', () => {
    it('should successfully join beta program and award badge', async () => {
      const userId = 'user-123';
      const participantType = 'influencer';
      
      const mockParticipant = {
        id: 'participant-123',
        userId,
        participantType,
        referralCode: 'ABC123',
        status: 'active',
        privileges: {
          earlyAccess: true,
          advancedAnalytics: false,
          directFeedback: true,
          customBadges: true,
          prioritySupport: false,
        },
        metrics: {
          referralsCount: 0,
          feedbackSubmitted: 0,
          featuresUsed: [],
          engagementScore: 0,
        },
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockBetaBadge = {
        id: 'badge-123',
        name: 'Beta Pioneer',
        badgeType: 'beta_pioneer',
        description: 'Early beta participant',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      mockBetaProgramModel.create.mockResolvedValue(mockParticipant as any);
      mockBusinessBadgeModel.findByType.mockResolvedValue([mockBetaBadge as any]);
      mockBusinessBadgeModel.awardBadgeToUser.mockResolvedValue({} as any);

      const result = await BetaProgramService.joinBetaProgram(userId, participantType);

      expect(mockBetaProgramModel.create).toHaveBeenCalledWith({
        userId,
        participantType,
        invitedBy: undefined,
      });
      expect(mockBusinessBadgeModel.findByType).toHaveBeenCalledWith('beta_pioneer');
      expect(mockBusinessBadgeModel.awardBadgeToUser).toHaveBeenCalledWith(
        userId,
        'badge-123',
        'system',
        'Joined Beta Program'
      );
      expect(result).toEqual(mockParticipant);
    });

    it('should handle referral when invited by another user', async () => {
      const userId = 'user-123';
      const inviterId = 'inviter-456';
      const participantType = 'brand';

      const mockParticipant = {
        id: 'participant-123',
        userId,
        participantType,
        referralCode: 'XYZ789',
        status: 'active',
        privileges: {},
        metrics: { referralsCount: 0, feedbackSubmitted: 0, featuresUsed: [], engagementScore: 0 },
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockInviter = {
        id: 'inviter-participant-123',
        userId: inviterId,
        metrics: { referralsCount: 2, feedbackSubmitted: 5, featuresUsed: [], engagementScore: 10 },
      };

      mockBetaProgramModel.create.mockResolvedValue(mockParticipant as any);
      mockBusinessBadgeModel.findByType.mockResolvedValue([]);
      mockBetaProgramModel.findByUserId.mockResolvedValue(mockInviter as any);
      mockBetaProgramModel.updateMetrics.mockResolvedValue(mockInviter as any);

      const result = await BetaProgramService.joinBetaProgram(userId, participantType, inviterId);

      expect(mockBetaProgramModel.create).toHaveBeenCalledWith({
        userId,
        participantType,
        invitedBy: inviterId,
      });
      expect(mockBetaProgramModel.updateMetrics).toHaveBeenCalledWith(
        'inviter-participant-123',
        { referralsCount: 3 }
      );
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('getBetaAnalytics', () => {
    it('should return analytics for beta participant', async () => {
      const userId = 'user-123';
      const mockParticipant = {
        id: 'participant-123',
        userId,
        participantType: 'industry_leader',
        privileges: {
          earlyAccess: true,
          advancedAnalytics: true,
          directFeedback: true,
          customBadges: true,
          prioritySupport: true,
        },
        metrics: {
          referralsCount: 5,
          feedbackSubmitted: 3,
          featuresUsed: ['ai_styling', 'marketplace_pro'],
          engagementScore: 85,
        },
      };

      mockBetaProgramModel.findByUserId.mockResolvedValue(mockParticipant as any);

      const result = await BetaProgramService.getBetaAnalytics(userId);

      expect(result).toHaveProperty('wardrobeInsights');
      expect(result).toHaveProperty('engagementMetrics');
      expect(result).toHaveProperty('industryInsights');
      expect(result).toHaveProperty('exclusiveData');
      expect(result.engagementMetrics.featuresUsed).toEqual(['ai_styling', 'marketplace_pro']);
      expect(result.engagementMetrics.referralsGenerated).toBe(5);
      expect(result.exclusiveData.earlyTrendAccess).toBe(true);
    });

    it('should throw error for non-beta participant', async () => {
      const userId = 'user-123';
      mockBetaProgramModel.findByUserId.mockResolvedValue(null);

      await expect(BetaProgramService.getBetaAnalytics(userId)).rejects.toThrow(
        'User is not a beta participant'
      );
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback and update metrics', async () => {
      const userId = 'user-123';
      const feedbackData = {
        feedbackType: 'feature_request' as const,
        title: 'New AI Feature',
        description: 'Would love to see better AI recommendations',
        priority: 'medium' as const,
      };

      const mockParticipant = {
        id: 'participant-123',
        userId,
        metrics: { feedbackSubmitted: 2, engagementScore: 10 },
      };

      const mockFeedback = {
        id: 'feedback-123',
        participantId: 'participant-123',
        ...feedbackData,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };

      mockBetaProgramModel.findByUserId.mockResolvedValue(mockParticipant as any);
      mockBetaProgramModel.submitFeedback.mockResolvedValue(mockFeedback as any);
      mockBetaProgramModel.updateMetrics.mockResolvedValue(mockParticipant as any);

      const result = await BetaProgramService.submitFeedback(userId, feedbackData);

      expect(mockBetaProgramModel.submitFeedback).toHaveBeenCalledWith({
        ...feedbackData,
        participantId: 'participant-123',
      });
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('getExclusiveContent', () => {
    it('should return exclusive content for beta participant', async () => {
      const userId = 'user-123';
      const mockParticipant = {
        id: 'participant-123',
        userId,
        participantType: 'industry_leader',
        privileges: {
          earlyAccess: true,
          advancedAnalytics: true,
        },
      };

      mockBetaProgramModel.findByUserId.mockResolvedValue(mockParticipant as any);

      const result = await BetaProgramService.getExclusiveContent(userId);

      expect(result).toHaveProperty('earlyFeatures');
      expect(result).toHaveProperty('industryReports');
      expect(result).toHaveProperty('trendPreviews');
      expect(result).toHaveProperty('networkingOpportunities');
      expect(result.earlyFeatures).toBeInstanceOf(Array);
      expect(result.industryReports).toBeInstanceOf(Array);
    });
  });

  describe('getBetaLeaderboard', () => {
    it('should return sorted leaderboard', async () => {
      const mockParticipants = [
        {
          userId: 'user-1',
          participantType: 'influencer',
          metrics: { engagementScore: 50, referralsCount: 3, feedbackSubmitted: 2 },
        },
        {
          userId: 'user-2',
          participantType: 'brand',
          metrics: { engagementScore: 80, referralsCount: 5, feedbackSubmitted: 1 },
        },
      ];

      mockBetaProgramModel.findMany.mockResolvedValue({
        participants: mockParticipants as any,
        total: 2,
      });

      const result = await BetaProgramService.getBetaLeaderboard();

      expect(result).toHaveLength(2);
      // Should be sorted by calculated score (engagementScore + referrals*5 + feedback*2)
      // user-2: 80 + 5*5 + 1*2 = 107
      // user-1: 50 + 3*5 + 2*2 = 69
      expect(result[0].userId).toBe('user-2');
      expect(result[1].userId).toBe('user-1');
    });
  });
});