import { FeatureAccessService } from '../../src/services/featureAccessService';
import { SubscriptionService } from '../../src/services/subscriptionService';

// Mock the subscription service
jest.mock('../../src/services/subscriptionService');

const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>;

describe('Feature Access Control', () => {
  let featureAccessService: FeatureAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    featureAccessService = new FeatureAccessService();
  });

  describe('Free Tier Features', () => {
    beforeEach(() => {
      // Mock basic/free subscription
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
    });

    it('should allow access to wardrobe cataloging with limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'wardrobe_cataloging', {
        currentUsage: 50,
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should block wardrobe cataloging when limit exceeded', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'wardrobe_cataloging', {
        currentUsage: 100,
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Maximum 100 items allowed');
      expect(result.upgradeRequired).toBe('premium');
    });

    it('should allow AI background removal without limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'ai_background_removal');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow AI categorization without limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'ai_categorization');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow outfit creation with limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'outfit_creation', {
        currentUsage: 25,
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should block outfit creation when limit exceeded', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'outfit_creation', {
        currentUsage: 50,
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Maximum 50 items allowed');
      expect(result.upgradeRequired).toBe('premium');
    });

    it('should allow photo guides without limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'photo_guides');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow brand partnership links without limitations', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'brand_partnership_links');

      expect(result.hasAccess).toBe(true);
    });
  });

  describe('Social Features with Account Linking', () => {
    beforeEach(() => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
    });

    it('should allow basic social sharing with account linking', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'basic_social_sharing', {
        hasAccountLinking: true,
        currentUsage: 25,
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should block basic social sharing without account linking', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'basic_social_sharing', {
        hasAccountLinking: false,
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('requires account linking');
    });

    it('should block social sharing when follow limit exceeded', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'basic_social_sharing', {
        hasAccountLinking: true,
        currentUsage: 50,
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Maximum 50 follows allowed');
      expect(result.upgradeRequired).toBe('premium');
    });

    it('should allow profile customization with account linking', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'profile_customization', {
        hasAccountLinking: true,
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should block profile customization without account linking', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'profile_customization', {
        hasAccountLinking: false,
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('requires account linking');
    });

    it('should allow content discovery without account linking', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'content_discovery');

      expect(result.hasAccess).toBe(true);
    });
  });

  describe('Premium Features', () => {
    beforeEach(() => {
      // Mock premium subscription
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue({
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
        billingCycle: 'monthly',
        amount: 29.90,
        currency: 'BRL',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('should allow marketplace trading for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'marketplace_trading');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow enhanced social features for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'enhanced_social_features');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow advanced analytics for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'advanced_analytics');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow style DNA analysis for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'style_dna_analysis');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow trend predictions for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'trend_predictions');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow wardrobe optimization for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'wardrobe_optimization');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow unlimited cataloging for premium users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'unlimited_cataloging', {
        currentUsage: 500, // Well above free tier limit
      });

      expect(result.hasAccess).toBe(true);
    });
  });

  describe('Enterprise Features', () => {
    beforeEach(() => {
      // Mock enterprise subscription
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        subscriptionType: 'enterprise',
        features: {
          advertisingAccess: true,
          dataIntelligence: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
        },
        billingCycle: 'yearly',
        amount: 999.90,
        currency: 'BRL',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('should allow professional tools for enterprise users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'professional_tools');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow brand management for enterprise users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'brand_management');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow API access for enterprise users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'api_access');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow custom branding for enterprise users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'custom_branding');

      expect(result.hasAccess).toBe(true);
    });

    it('should allow priority support for enterprise users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'priority_support');

      expect(result.hasAccess).toBe(true);
    });
  });

  describe('Feature Access Denial for Lower Tiers', () => {
    beforeEach(() => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
    });

    it('should deny marketplace trading for free users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'marketplace_trading');

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('requires premium subscription');
      expect(result.upgradeRequired).toBe('premium');
    });

    it('should deny professional tools for free users', async () => {
      const result = await featureAccessService.hasFeatureAccess('user-123', 'professional_tools');

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('requires enterprise subscription');
      expect(result.upgradeRequired).toBe('enterprise');
    });

    it('should deny API access for premium users', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue({
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
        billingCycle: 'monthly',
        amount: 29.90,
        currency: 'BRL',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await featureAccessService.hasFeatureAccess('user-123', 'api_access');

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('requires enterprise subscription');
      expect(result.upgradeRequired).toBe('enterprise');
    });
  });

  describe('Usage Limits Checking', () => {
    beforeEach(() => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
      // Mock usage data
      jest.spyOn(featureAccessService, 'getUserFeatureUsage').mockResolvedValue({
        wardrobeItems: 85,
        outfits: 45,
        socialFollows: 48,
        marketplaceListings: 0,
        monthlyUploads: 12,
      });
    });

    it('should return warnings when approaching limits', async () => {
      const result = await featureAccessService.checkUsageLimits('user-123');

      expect(result.warnings).toHaveLength(3);
      expect(result.warnings[0].feature).toBe('wardrobe_cataloging');
      expect(result.warnings[0].percentage).toBe(85);
      expect(result.warnings[1].feature).toBe('outfit_creation');
      expect(result.warnings[1].percentage).toBe(90);
      expect(result.warnings[2].feature).toBe('basic_social_sharing');
      expect(result.warnings[2].percentage).toBe(96);
    });

    it('should return blocked features when limits exceeded', async () => {
      jest.spyOn(featureAccessService, 'getUserFeatureUsage').mockResolvedValue({
        wardrobeItems: 100,
        outfits: 50,
        socialFollows: 50,
        marketplaceListings: 0,
        monthlyUploads: 12,
      });

      const result = await featureAccessService.checkUsageLimits('user-123');

      expect(result.blocked).toHaveLength(3);
      expect(result.blocked[0].feature).toBe('wardrobe_cataloging');
      expect(result.blocked[0].current).toBe(100);
      expect(result.blocked[0].limit).toBe(100);
      expect(result.blocked[1].feature).toBe('outfit_creation');
      expect(result.blocked[2].feature).toBe('basic_social_sharing');
    });

    it('should not return limits for premium users', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue({
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
        billingCycle: 'monthly',
        amount: 29.90,
        currency: 'BRL',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await featureAccessService.checkUsageLimits('user-123');

      expect(result.warnings).toHaveLength(0);
      expect(result.blocked).toHaveLength(0);
    });
  });

  describe('Feature Discovery', () => {
    it('should return available and restricted features for free users', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);

      const result = await featureAccessService.getUserAvailableFeatures('user-123', true);

      // Should have free tier features available
      const availableNames = result.available.map(f => f.name);
      expect(availableNames).toContain('Wardrobe Cataloging');
      expect(availableNames).toContain('AI Background Removal');
      expect(availableNames).toContain('Basic Social Sharing');

      // Should have premium/enterprise features restricted
      const restrictedNames = result.restricted.map(f => f.name);
      expect(restrictedNames).toContain('Marketplace Trading');
      expect(restrictedNames).toContain('Professional Tools');
      expect(restrictedNames).toContain('API Access');
    });

    it('should return more features for premium users', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue({
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
        billingCycle: 'monthly',
        amount: 29.90,
        currency: 'BRL',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await featureAccessService.getUserAvailableFeatures('user-123', true);

      // Should have premium features available
      const availableNames = result.available.map(f => f.name);
      expect(availableNames).toContain('Marketplace Trading');
      expect(availableNames).toContain('Advanced Analytics');
      expect(availableNames).toContain('Style DNA Analysis');

      // Should only have enterprise features restricted
      const restrictedNames = result.restricted.map(f => f.name);
      expect(restrictedNames).toContain('Professional Tools');
      expect(restrictedNames).toContain('API Access');
      expect(restrictedNames).not.toContain('Marketplace Trading');
    });
  });

  describe('Static Feature Methods', () => {
    it('should return all features', () => {
      const features = FeatureAccessService.getAllFeatures();

      expect(Object.keys(features)).toContain('wardrobe_cataloging');
      expect(Object.keys(features)).toContain('marketplace_trading');
      expect(Object.keys(features)).toContain('professional_tools');
    });

    it('should filter features by category', () => {
      const coreFeatures = FeatureAccessService.getFeaturesByCategory('core');
      const socialFeatures = FeatureAccessService.getFeaturesByCategory('social');

      expect(coreFeatures.length).toBeGreaterThan(0);
      expect(socialFeatures.length).toBeGreaterThan(0);
      expect(coreFeatures.every(f => f.category === 'core')).toBe(true);
      expect(socialFeatures.every(f => f.category === 'social')).toBe(true);
    });

    it('should filter features by tier', () => {
      const freeFeatures = FeatureAccessService.getFeaturesByTier('free');
      const premiumFeatures = FeatureAccessService.getFeaturesByTier('premium');
      const enterpriseFeatures = FeatureAccessService.getFeaturesByTier('enterprise');

      expect(freeFeatures.length).toBeGreaterThan(0);
      expect(premiumFeatures.length).toBeGreaterThan(0);
      expect(enterpriseFeatures.length).toBeGreaterThan(0);
      expect(freeFeatures.every(f => f.tier === 'free')).toBe(true);
      expect(premiumFeatures.every(f => f.tier === 'premium')).toBe(true);
      expect(enterpriseFeatures.every(f => f.tier === 'enterprise')).toBe(true);
    });
  });
});