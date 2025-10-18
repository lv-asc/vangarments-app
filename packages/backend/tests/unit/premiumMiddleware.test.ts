import { Request, Response, NextFunction } from 'express';
import { 
  requirePremiumFeature, 
  requireAdvertisingAccess, 
  requireDataIntelligenceAccess,
  requireAdvancedAnalyticsAccess,
  requireApiAccess,
  addSubscriptionInfo 
} from '../../src/middleware/premium';
import { SubscriptionService } from '../../src/services/subscriptionService';

// Mock the subscription service
jest.mock('../../src/services/subscriptionService');

const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>;

describe('Premium Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requirePremiumFeature', () => {
    it('should allow access when user has required feature', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.hasFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'advertisingAccess'
      );
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required feature', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Premium feature 'advertisingAccess' requires subscription upgrade",
        code: 'PREMIUM_FEATURE_REQUIRED',
        feature: 'advertisingAccess',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockRejectedValue(
        new Error('Database connection failed')
      );

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error checking premium feature access',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Specific Feature Middlewares', () => {
    it('should check advertising access correctly', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      await requireAdvertisingAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.hasFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'advertisingAccess'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should check data intelligence access correctly', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      await requireDataIntelligenceAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.hasFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'dataIntelligence'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should check advanced analytics access correctly', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      await requireAdvancedAnalyticsAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.hasFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'advancedAnalytics'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should check API access correctly', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      await requireApiAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.hasFeatureAccess).toHaveBeenCalledWith(
        'user-123',
        'apiAccess'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for specific features when user lacks subscription', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      await requireApiAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Premium feature 'apiAccess' requires subscription upgrade",
        code: 'PREMIUM_FEATURE_REQUIRED',
        feature: 'apiAccess',
      });
    });
  });

  describe('addSubscriptionInfo', () => {
    it('should add subscription info to authenticated user', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        subscriptionType: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        status: 'active',
      };

      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(mockSubscription as any);

      await addSubscriptionInfo(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.getUserActiveSubscription).toHaveBeenCalledWith('user-123');
      expect(mockRequest.user!.subscription).toEqual(mockSubscription);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without subscription info when user not authenticated', async () => {
      mockRequest.user = undefined;

      await addSubscriptionInfo(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSubscriptionService.prototype.getUserActiveSubscription).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue when subscription service fails', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockRejectedValue(
        new Error('Service unavailable')
      );

      await addSubscriptionInfo(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user!.subscription).toBeUndefined();
    });

    it('should handle null subscription gracefully', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);

      await addSubscriptionInfo(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user!.subscription).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Feature Access Scenarios', () => {
    it('should allow premium user to access premium features', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(true);

      const middleware = requirePremiumFeature('advancedAnalytics');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny basic user access to premium features', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      const middleware = requirePremiumFeature('advancedAnalytics');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny premium user access to enterprise features', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      const middleware = requirePremiumFeature('apiAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'apiAccess',
          code: 'PREMIUM_FEATURE_REQUIRED',
        })
      );
    });
  });

  describe('Multiple Feature Checks', () => {
    it('should handle multiple middleware calls correctly', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess
        .mockResolvedValueOnce(true)  // First feature check passes
        .mockResolvedValueOnce(false); // Second feature check fails

      // First middleware should pass
      const firstMiddleware = requirePremiumFeature('advertisingAccess');
      await firstMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mocks for second call
      jest.clearAllMocks();
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      // Second middleware should fail
      const secondMiddleware = requirePremiumFeature('apiAccess');
      await secondMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user ID gracefully', async () => {
      mockRequest.user = { email: 'test@example.com' } as any; // Missing ID

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle empty feature name', async () => {
      mockSubscriptionService.prototype.hasFeatureAccess.mockResolvedValue(false);

      const middleware = requirePremiumFeature('');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: '',
        })
      );
    });

    it('should handle subscription service timeout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockSubscriptionService.prototype.hasFeatureAccess.mockRejectedValue(timeoutError);

      const middleware = requirePremiumFeature('advertisingAccess');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error checking premium feature access',
      });
    });
  });
});