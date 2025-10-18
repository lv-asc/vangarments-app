import { SubscriptionService, CreateSubscriptionData } from '../../src/services/subscriptionService';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');

const mockDb = db as jest.Mocked<typeof db>;

describe('Subscription Management', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  describe('Subscription Creation', () => {
    it('should create a basic subscription successfully', async () => {
      const subscriptionData: CreateSubscriptionData = {
        userId: 'user-123',
        subscriptionType: 'basic',
        billingCycle: 'monthly',
      };

      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_type: 'basic',
        features: {
          advertisingAccess: false,
          dataIntelligence: false,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false,
        },
        billing_cycle: 'monthly',
        amount: 0,
        currency: 'BRL',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: null,
        auto_renew: true,
        payment_method_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock no existing subscription
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock successful creation
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.subscriptionType).toBe('basic');
      expect(result.amount).toBe(0);
      expect(result.features.advertisingAccess).toBe(false);
      expect(result.endDate).toBeNull();
    });

    it('should create a premium subscription with correct pricing', async () => {
      const subscriptionData: CreateSubscriptionData = {
        userId: 'user-123',
        subscriptionType: 'premium',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_123',
      };

      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
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
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        auto_renew: true,
        payment_method_id: 'pm_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.subscriptionType).toBe('premium');
      expect(result.amount).toBe(29.90);
      expect(result.features.advertisingAccess).toBe(true);
      expect(result.features.dataIntelligence).toBe(true);
      expect(result.features.advancedAnalytics).toBe(true);
      expect(result.paymentMethodId).toBe('pm_123');
      expect(result.endDate).toBeTruthy();
    });

    it('should create an enterprise subscription with all features', async () => {
      const subscriptionData: CreateSubscriptionData = {
        userId: 'user-123',
        subscriptionType: 'enterprise',
        billingCycle: 'yearly',
      };

      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
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
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        auto_renew: true,
        payment_method_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.subscriptionType).toBe('enterprise');
      expect(result.amount).toBe(999.90);
      expect(result.features.customBranding).toBe(true);
      expect(result.features.apiAccess).toBe(true);
      expect(result.billingCycle).toBe('yearly');
    });

    it('should throw error when user already has active subscription', async () => {
      const subscriptionData: CreateSubscriptionData = {
        userId: 'user-123',
        subscriptionType: 'premium',
        billingCycle: 'monthly',
      };

      const existingSubscription = {
        id: 'existing-sub',
        user_id: 'user-123',
        subscription_type: 'basic',
        status: 'active',
      };

      mockDb.query.mockResolvedValueOnce({ rows: [existingSubscription] });

      await expect(subscriptionService.createSubscription(subscriptionData))
        .rejects.toThrow('User already has an active subscription');
    });

    it('should calculate correct end dates for different billing cycles', async () => {
      const testCases = [
        { cycle: 'monthly', expectedDays: 30 },
        { cycle: 'quarterly', expectedDays: 90 },
        { cycle: 'yearly', expectedDays: 365 },
      ];

      for (const testCase of testCases) {
        const subscriptionData: CreateSubscriptionData = {
          userId: 'user-123',
          subscriptionType: 'premium',
          billingCycle: testCase.cycle as any,
        };

        const startDate = new Date();
        const expectedEndDate = new Date(startDate);
        
        if (testCase.cycle === 'monthly') {
          expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
        } else if (testCase.cycle === 'quarterly') {
          expectedEndDate.setMonth(expectedEndDate.getMonth() + 3);
        } else if (testCase.cycle === 'yearly') {
          expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);
        }

        const mockSubscriptionRow = {
          id: 'sub-123',
          user_id: 'user-123',
          subscription_type: 'premium',
          features: {},
          billing_cycle: testCase.cycle,
          amount: 29.90,
          start_date: startDate.toISOString(),
          end_date: expectedEndDate.toISOString(),
          status: 'active',
          auto_renew: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockDb.query.mockResolvedValueOnce({ rows: [] }); // No existing subscription
        mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

        const result = await subscriptionService.createSubscription(subscriptionData);
        
        expect(result.billingCycle).toBe(testCase.cycle);
        expect(new Date(result.endDate!).getTime()).toBeCloseTo(expectedEndDate.getTime(), -10000); // Within 10 seconds
      }
    });
  });

  describe('Subscription Retrieval', () => {
    it('should get active subscription for user', async () => {
      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_type: 'premium',
        features: { advertisingAccess: true },
        billing_cycle: 'monthly',
        amount: 29.90,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const result = await subscriptionService.getUserActiveSubscription('user-123');

      expect(result).toBeTruthy();
      expect(result!.subscriptionType).toBe('premium');
      expect(result!.status).toBe('active');
    });

    it('should return null when user has no active subscription', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await subscriptionService.getUserActiveSubscription('user-123');

      expect(result).toBeNull();
    });

    it('should get subscription by ID', async () => {
      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_type: 'enterprise',
        features: { apiAccess: true },
        billing_cycle: 'yearly',
        amount: 999.90,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const result = await subscriptionService.getSubscriptionById('sub-123');

      expect(result).toBeTruthy();
      expect(result!.id).toBe('sub-123');
      expect(result!.subscriptionType).toBe('enterprise');
    });
  });

  describe('Feature Access Checking', () => {
    it('should return true for basic features when user has no subscription', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await subscriptionService.hasFeatureAccess('user-123', 'advertisingAccess');

      expect(result).toBe(false); // advertisingAccess is not a basic feature
    });

    it('should return correct feature access for premium subscription', async () => {
      const mockSubscriptionRow = {
        id: 'sub-123',
        user_id: 'user-123',
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

      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });

      const hasAdvertising = await subscriptionService.hasFeatureAccess('user-123', 'advertisingAccess');
      expect(hasAdvertising).toBe(true);

      mockDb.query.mockResolvedValueOnce({ rows: [mockSubscriptionRow] });
      const hasCustomBranding = await subscriptionService.hasFeatureAccess('user-123', 'customBranding');
      expect(hasCustomBranding).toBe(false);
    });
  });

  describe('Subscription Upgrades', () => {
    it('should upgrade from basic to premium', async () => {
      const currentSubscription = {
        id: 'current-sub',
        user_id: 'user-123',
        subscription_type: 'basic',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newSubscription = {
        id: 'new-sub',
        user_id: 'user-123',
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

      const result = await subscriptionService.upgradeSubscription('user-123', 'premium', 'monthly');

      expect(result.subscriptionType).toBe('premium');
      expect(result.amount).toBe(29.90);
      expect(result.features.advertisingAccess).toBe(true);
    });

    it('should create new subscription when user has no current subscription', async () => {
      const newSubscription = {
        id: 'new-sub',
        user_id: 'user-123',
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

      // Mock no current subscription
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock checking for existing subscription (for creation)
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // Mock creating new subscription
      mockDb.query.mockResolvedValueOnce({ rows: [newSubscription] });

      const result = await subscriptionService.upgradeSubscription('user-123', 'enterprise', 'yearly');

      expect(result.subscriptionType).toBe('enterprise');
      expect(result.features.apiAccess).toBe(true);
    });
  });

  describe('Subscription Cancellation', () => {
    it('should cancel active subscription', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await subscriptionService.cancelSubscription('user-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE premium_subscriptions'),
        ['user-123']
      );
    });
  });

  describe('Subscription Renewal', () => {
    it('should renew monthly subscription correctly', async () => {
      const currentDate = new Date();
      const currentEndDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      const expectedNewEndDate = new Date(currentEndDate);
      expectedNewEndDate.setMonth(expectedNewEndDate.getMonth() + 1);

      const existingSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_type: 'premium',
        billing_cycle: 'monthly',
        start_date: currentDate.toISOString(),
        end_date: currentEndDate.toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const renewedSubscription = {
        ...existingSubscription,
        end_date: expectedNewEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [existingSubscription] }); // getSubscriptionById
      mockDb.query.mockResolvedValueOnce({ rows: [renewedSubscription] }); // renewal update

      const result = await subscriptionService.renewSubscription('sub-123');

      expect(result.endDate).toBeTruthy();
      expect(new Date(result.endDate!).getTime()).toBeCloseTo(expectedNewEndDate.getTime(), -10000);
    });

    it('should throw error when trying to renew basic subscription', async () => {
      const basicSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_type: 'basic',
        billing_cycle: 'monthly',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [basicSubscription] });

      await expect(subscriptionService.renewSubscription('sub-123'))
        .rejects.toThrow('Basic subscriptions do not require renewal');
    });

    it('should throw error when subscription not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(subscriptionService.renewSubscription('non-existent'))
        .rejects.toThrow('Subscription not found');
    });
  });

  describe('Subscription History', () => {
    it('should get user subscription history with pagination', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          user_id: 'user-123',
          subscription_type: 'premium',
          status: 'active',
          total: '2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'sub-2',
          user_id: 'user-123',
          subscription_type: 'basic',
          status: 'cancelled',
          total: '2',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockSubscriptions });

      const result = await subscriptionService.getUserSubscriptionHistory('user-123', 10, 0);

      expect(result.subscriptions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.subscriptions[0].id).toBe('sub-1');
    });
  });

  describe('Subscription Analytics', () => {
    it('should calculate subscription analytics correctly', async () => {
      // Mock total subscriptions
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: '150' }] });
      // Mock active subscriptions
      mockDb.query.mockResolvedValueOnce({ rows: [{ active: '120' }] });
      // Mock subscriptions by type
      mockDb.query.mockResolvedValueOnce({ 
        rows: [
          { subscription_type: 'basic', count: '50' },
          { subscription_type: 'premium', count: '60' },
          { subscription_type: 'enterprise', count: '10' },
        ]
      });
      // Mock monthly revenue
      mockDb.query.mockResolvedValueOnce({ rows: [{ monthly_revenue: '2500.50' }] });
      // Mock churn rate
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ churned: '5', new_subscriptions: '25' }]
      });

      const result = await subscriptionService.getSubscriptionAnalytics();

      expect(result.totalSubscriptions).toBe(150);
      expect(result.activeSubscriptions).toBe(120);
      expect(result.subscriptionsByType.basic).toBe(50);
      expect(result.subscriptionsByType.premium).toBe(60);
      expect(result.subscriptionsByType.enterprise).toBe(10);
      expect(result.monthlyRevenue).toBe(2500.50);
      expect(result.churnRate).toBe(20); // 5/25 * 100
    });
  });

  describe('Subscription Renewal Processing', () => {
    it('should process renewals for expiring subscriptions', async () => {
      const expiringSubscriptions = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          subscription_type: 'premium',
          billing_cycle: 'monthly',
          end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          status: 'active',
          auto_renew: true,
        },
        {
          id: 'sub-2',
          user_id: 'user-2',
          subscription_type: 'enterprise',
          billing_cycle: 'yearly',
          end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          status: 'active',
          auto_renew: true,
        },
      ];

      // Mock finding expiring subscriptions
      mockDb.query.mockResolvedValueOnce({ rows: expiringSubscriptions });
      
      // Mock successful renewals
      for (const sub of expiringSubscriptions) {
        mockDb.query.mockResolvedValueOnce({ rows: [sub] }); // getSubscriptionById
        mockDb.query.mockResolvedValueOnce({ rows: [{ ...sub, end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }] }); // renewal
      }

      const result = await subscriptionService.processRenewals();

      expect(result.renewed).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle renewal failures gracefully', async () => {
      const expiringSubscriptions = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          subscription_type: 'premium',
          billing_cycle: 'monthly',
          end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          auto_renew: true,
        },
      ];

      // Mock finding expiring subscriptions
      mockDb.query.mockResolvedValueOnce({ rows: expiringSubscriptions });
      // Mock renewal failure
      mockDb.query.mockRejectedValueOnce(new Error('Payment failed'));

      const result = await subscriptionService.processRenewals();

      expect(result.renewed).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('Static Methods', () => {
    it('should return subscription pricing', () => {
      const pricing = SubscriptionService.getSubscriptionPricing();

      expect(pricing.basic.monthly).toBe(0);
      expect(pricing.premium.monthly).toBe(29.90);
      expect(pricing.enterprise.yearly).toBe(999.90);
    });

    it('should return subscription features', () => {
      const features = SubscriptionService.getSubscriptionFeatures();

      expect(features.basic.advertisingAccess).toBe(false);
      expect(features.premium.advertisingAccess).toBe(true);
      expect(features.enterprise.apiAccess).toBe(true);
    });
  });
});