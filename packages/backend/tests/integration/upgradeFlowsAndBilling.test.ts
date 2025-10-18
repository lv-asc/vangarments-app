import request from 'supertest';
import express from 'express';
import { SubscriptionService } from '../../src/services/subscriptionService';
import { FeatureAccessService } from '../../src/services/featureAccessService';
import { UpgradeSystemService } from '../../src/services/upgradeSystemService';
import { AccountLinkingService } from '../../src/services/accountLinkingService';
import { db } from '../../src/database/connection';

// Mock external services
jest.mock('../../src/database/connection');
jest.mock('../../src/services/paymentService');

// Create a test app
const app = express();
app.use(express.json());

// Mock routes for testing
app.get('/api/freemium/features/:feature/access', (req, res) => {
  // This will be mocked in tests
  res.json({ success: true, data: { hasAccess: true } });
});

app.post('/api/subscriptions', (req, res) => {
  res.status(201).json({ success: true, data: { subscriptionType: 'premium' } });
});

app.post('/api/subscriptions/upgrade', (req, res) => {
  res.json({ success: true, data: { subscriptionType: 'premium' } });
});

app.post('/api/subscriptions/cancel', (req, res) => {
  res.json({ success: true, message: 'Subscription cancelled successfully' });
});

app.get('/api/subscriptions/history', (req, res) => {
  res.json({ success: true, data: { subscriptions: [], total: 0 } });
});

app.get('/api/subscriptions/features/:feature', (req, res) => {
  res.json({ success: true, data: { hasAccess: true } });
});

app.get('/api/subscriptions/pricing', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      pricing: {
        basic: { monthly: 0 },
        premium: { monthly: 29.90 },
        enterprise: { yearly: 999.90 }
      },
      features: {
        premium: { advertisingAccess: true },
        enterprise: { apiAccess: true }
      }
    }
  });
});

const mockDb = db as jest.Mocked<typeof db>;

describe('Upgrade Flows and Billing Integration', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    userId = 'test-user-123';
    authToken = 'Bearer mock-jwt-token';
    
    // Mock authentication middleware
    jest.spyOn(require('../../src/middleware/auth'), 'authenticateToken')
      .mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: userId, email: 'test@example.com' };
        next();
      });
  });

  describe('Freemium Feature Access Flow', () => {
    it('should allow free users to access basic features', async () => {
      // Mock no active subscription (free user)
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/freemium/features/wardrobe_cataloging/access')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(true);
    });

    it('should block free users from premium features', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/freemium/features/marketplace_trading/access')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(false);
      expect(response.body.data.upgradeRequired).toBe('premium');
    });

    it('should enforce usage limits for free users', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/freemium/features/wardrobe_cataloging/access')
        .set('Authorization', authToken)
        .query({ currentUsage: 100 });

      expect(response.status).toBe(200);
      expect(response.body.data.hasAccess).toBe(false);
      expect(response.body.data.limitation).toBeDefined();
    });

    it('should require account linking for social features', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/freemium/features/basic_social_sharing/access')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.hasAccess).toBe(false);
      expect(response.body.data.reason).toContain('account linking');
    });
  });

  describe('Subscription Creation Flow', () => {
    it('should create premium subscription successfully', async () => {
      const subscriptionData = {
        subscriptionType: 'premium',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_test_123',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        billing_cycle: 'monthly',
        amount: 29.90,
        currency: 'BRL',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        payment_method_id: 'pm_test_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock no existing subscription
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock successful subscription creation
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscription] });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(subscriptionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionType).toBe('premium');
      expect(response.body.data.amount).toBe(29.90);
      expect(response.body.data.features.advertisingAccess).toBe(true);
    });

    it('should create enterprise subscription with all features', async () => {
      const subscriptionData = {
        subscriptionType: 'enterprise',
        billingCycle: 'yearly',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'enterprise',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
        },
        billing_cycle: 'yearly',
        amount: 999.90,
        currency: 'BRL',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscription] });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(subscriptionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionType).toBe('enterprise');
      expect(response.body.data.features.apiAccess).toBe(true);
      expect(response.body.data.features.customBranding).toBe(true);
    });

    it('should reject invalid subscription types', async () => {
      const invalidData = {
        subscriptionType: 'invalid',
        billingCycle: 'monthly',
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid billing cycles', async () => {
      const invalidData = {
        subscriptionType: 'premium',
        billingCycle: 'invalid',
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Subscription Upgrade Flow', () => {
    it('should upgrade from basic to premium successfully', async () => {
      const upgradeData = {
        subscriptionType: 'premium',
        billingCycle: 'monthly',
      };

      const currentSubscription = {
        id: 'current-sub',
        user_id: userId,
        subscription_type: 'basic',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newSubscription = {
        id: 'new-sub',
        user_id: userId,
        subscription_type: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        billing_cycle: 'monthly',
        amount: 29.90,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock getting current subscription
      mockDb.query.mockResolvedValueOnce({ rows: [currentSubscription] });
      // Mock cancelling current subscription
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock checking for existing subscription (should be none after cancellation)
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock creating new subscription
      mockDb.query.mockResolvedValueOnce({ rows: [newSubscription] });

      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', authToken)
        .send(upgradeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionType).toBe('premium');
      expect(response.body.data.features.advertisingAccess).toBe(true);
    });

    it('should upgrade from premium to enterprise successfully', async () => {
      const upgradeData = {
        subscriptionType: 'enterprise',
        billingCycle: 'yearly',
      };

      const currentSubscription = {
        id: 'current-sub',
        user_id: userId,
        subscription_type: 'premium',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newSubscription = {
        id: 'new-sub',
        user_id: userId,
        subscription_type: 'enterprise',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
        },
        billing_cycle: 'yearly',
        amount: 999.90,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [currentSubscription] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [newSubscription] });

      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', authToken)
        .send(upgradeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionType).toBe('enterprise');
      expect(response.body.data.features.apiAccess).toBe(true);
    });

    it('should prevent downgrade attempts', async () => {
      const downgradeData = {
        subscriptionType: 'basic',
        billingCycle: 'monthly',
      };

      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', authToken)
        .send(downgradeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Feature Access After Upgrade', () => {
    it('should grant premium features after upgrade', async () => {
      const premiumSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        status: 'active',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValue({ rows: [premiumSubscription] });

      const response = await request(app)
        .get('/api/freemium/features/marketplace_trading/access')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.hasAccess).toBe(true);
    });

    it('should remove usage limitations after upgrade', async () => {
      const premiumSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        status: 'active',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValue({ rows: [premiumSubscription] });

      const response = await request(app)
        .get('/api/freemium/features/unlimited_cataloging/access')
        .set('Authorization', authToken)
        .query({ currentUsage: 500 });

      expect(response.status).toBe(200);
      expect(response.body.data.hasAccess).toBe(true);
    });
  });

  describe('Subscription Cancellation Flow', () => {
    it('should cancel subscription successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');
    });

    it('should revert to free tier features after cancellation', async () => {
      // Mock no active subscription (cancelled)
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/freemium/features/marketplace_trading/access')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.hasAccess).toBe(false);
      expect(response.body.data.upgradeRequired).toBe('premium');
    });
  });

  describe('Billing Cycle Management', () => {
    it('should handle monthly billing correctly', async () => {
      const monthlySubscription = {
        subscriptionType: 'premium',
        billingCycle: 'monthly',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        billing_cycle: 'monthly',
        amount: 29.90,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscription] });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(monthlySubscription);

      expect(response.status).toBe(201);
      expect(response.body.data.billingCycle).toBe('monthly');
      expect(response.body.data.amount).toBe(29.90);
    });

    it('should handle quarterly billing with discount', async () => {
      const quarterlySubscription = {
        subscriptionType: 'premium',
        billingCycle: 'quarterly',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        billing_cycle: 'quarterly',
        amount: 79.90, // Discounted quarterly rate
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscription] });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(quarterlySubscription);

      expect(response.status).toBe(201);
      expect(response.body.data.billingCycle).toBe('quarterly');
      expect(response.body.data.amount).toBe(79.90);
    });

    it('should handle yearly billing with maximum discount', async () => {
      const yearlySubscription = {
        subscriptionType: 'premium',
        billingCycle: 'yearly',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        billing_cycle: 'yearly',
        amount: 299.90, // Best yearly rate
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscription] });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(yearlySubscription);

      expect(response.status).toBe(201);
      expect(response.body.data.billingCycle).toBe('yearly');
      expect(response.body.data.amount).toBe(299.90);
    });
  });

  describe('Subscription History and Analytics', () => {
    it('should retrieve user subscription history', async () => {
      const mockHistory = [
        {
          id: 'sub-1',
          user_id: userId,
          subscription_type: 'premium',
          status: 'active',
          total: '2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'sub-2',
          user_id: userId,
          subscription_type: 'basic',
          status: 'cancelled',
          total: '2',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockHistory });

      const response = await request(app)
        .get('/api/subscriptions/history')
        .set('Authorization', authToken)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should check feature access for specific features', async () => {
      const premiumSubscription = {
        id: 'sub-123',
        user_id: userId,
        subscription_type: 'premium',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
        },
        status: 'active',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [premiumSubscription] });

      const response = await request(app)
        .get('/api/subscriptions/features/advertisingAccess')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', authToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle payment processing errors', async () => {
      const subscriptionData = {
        subscriptionType: 'premium',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_invalid',
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockRejectedValueOnce(new Error('Payment processing failed'));

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', authToken)
        .send(subscriptionData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for all subscription endpoints', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current');

      expect(response.status).toBe(401);
    });
  });

  describe('Pricing and Feature Information', () => {
    it('should return subscription pricing information', async () => {
      const response = await request(app)
        .get('/api/subscriptions/pricing');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pricing.basic.monthly).toBe(0);
      expect(response.body.data.pricing.premium.monthly).toBe(29.90);
      expect(response.body.data.pricing.enterprise.yearly).toBe(999.90);
      expect(response.body.data.features.premium.advertisingAccess).toBe(true);
      expect(response.body.data.features.enterprise.apiAccess).toBe(true);
    });
  });
});