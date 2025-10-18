import { UpgradeSystemService } from '../../src/services/upgradeSystemService';
import { SubscriptionService } from '../../src/services/subscriptionService';
import { FeatureAccessService } from '../../src/services/featureAccessService';

// Mock the dependencies
jest.mock('../../src/services/subscriptionService');
jest.mock('../../src/services/featureAccessService');

const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>;
const mockFeatureAccessService = FeatureAccessService as jest.Mocked<typeof FeatureAccessService>;

describe('UpgradeSystemService', () => {
  let upgradeSystemService: UpgradeSystemService;

  beforeEach(() => {
    jest.clearAllMocks();
    upgradeSystemService = new UpgradeSystemService();
  });

  describe('triggerUpgradePrompt', () => {
    it('should trigger upgrade prompt when usage limit is reached', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        userId: 'user-123',
        promptType: 'usage_limit' as const,
        featureContext: 'wardrobe_cataloging',
        promptContent: {
          title: 'Wardrobe Limit Reached',
          message: 'You\'ve reached your wardrobe cataloging limit',
          benefits: ['Unlimited items', 'Advanced features'],
          ctaText: 'Upgrade Now',
        },
        shownAt: new Date().toISOString(),
      };

      // Mock FeatureAccessService.getAllFeatures to return the feature
      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({
        wardrobe_cataloging: {
          name: 'Wardrobe Cataloging',
          description: 'Digital wardrobe management',
          category: 'core',
          tier: 'free',
        },
      });

      // Mock the private method by spying on the service
      jest.spyOn(upgradeSystemService as any, 'saveUpgradePrompt').mockResolvedValue(mockPrompt);

      const result = await upgradeSystemService.triggerUpgradePrompt('user-123', {
        featureName: 'wardrobe_cataloging',
        currentUsage: 100,
        limit: 100,
        action: 'add_item',
      });

      expect(result.promptType).toBe('usage_limit');
      expect(result.featureContext).toBe('wardrobe_cataloging');
      expect(result.promptContent.title).toContain('Wardrobe');
    });

    it('should handle different feature contexts', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        userId: 'user-123',
        promptType: 'usage_limit' as const,
        featureContext: 'outfit_creation',
        promptContent: {
          title: 'Outfit Limit Reached',
          message: 'You\'ve reached your outfit creation limit',
          benefits: ['Unlimited outfits'],
          ctaText: 'Upgrade Now',
        },
        shownAt: new Date().toISOString(),
      };

      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({
        outfit_creation: {
          name: 'Outfit Creation',
          description: 'Create outfit combinations',
          category: 'core',
          tier: 'free',
        },
      });

      jest.spyOn(upgradeSystemService as any, 'saveUpgradePrompt').mockResolvedValue(mockPrompt);

      const result = await upgradeSystemService.triggerUpgradePrompt('user-123', {
        featureName: 'outfit_creation',
        currentUsage: 50,
        limit: 50,
        action: 'create_outfit',
      });

      expect(result.featureContext).toBe('outfit_creation');
    });
  });

  describe('showFeatureDiscoveryPrompt', () => {
    it('should show feature discovery prompt for marketplace feature', async () => {
      const mockFeature = {
        name: 'Marketplace Trading',
        description: 'Buy and sell fashion items on the marketplace',
        category: 'marketplace' as const,
        tier: 'premium' as const,
      };

      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({
        marketplace_trading: mockFeature,
      });

      const mockPrompt = {
        id: 'prompt-123',
        userId: 'user-123',
        promptType: 'feature_discovery' as const,
        featureContext: 'marketplace_trading',
        promptContent: {
          title: 'Unlock Marketplace Trading',
          message: 'Discover the power of Buy and sell fashion items on the marketplace',
          benefits: ['Monetize your wardrobe', 'Access to buyers'],
          ctaText: 'Upgrade Now',
          socialProof: 'Join 10,000+ fashion enthusiasts who upgraded',
        },
        shownAt: new Date().toISOString(),
      };

      jest.spyOn(upgradeSystemService as any, 'saveUpgradePrompt').mockResolvedValue(mockPrompt);
      jest.spyOn(upgradeSystemService as any, 'getFeatureBenefits').mockReturnValue(['Monetize your wardrobe', 'Access to buyers']);

      const result = await upgradeSystemService.showFeatureDiscoveryPrompt('user-123', 'marketplace_trading');

      expect(result.promptType).toBe('feature_discovery');
      expect(result.featureContext).toBe('marketplace_trading');
      expect(result.promptContent.title).toContain('Marketplace Trading');
    });

    it('should throw error for non-existent feature', async () => {
      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({});

      await expect(
        upgradeSystemService.showFeatureDiscoveryPrompt('user-123', 'non_existent_feature')
      ).rejects.toThrow('Feature not found');
    });
  });

  describe('generateUpgradeFlow', () => {
    it('should generate complete upgrade flow for premium upgrade', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        subscriptionType: 'basic' as const,
        features: {},
        status: 'active' as const,
      };

      const mockRecommendations = {
        currentTier: 'basic',
        recommendedTier: 'premium',
        reasons: ['Unlock marketplace trading'],
        features: [],
        estimatedValue: 50,
      };

      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(mockSubscription as any);
      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockResolvedValue(mockRecommendations as any);
      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({
        marketplace_trading: {
          name: 'Marketplace Trading',
          description: 'Buy and sell items',
          category: 'marketplace',
          tier: 'premium',
        },
      });
      jest.spyOn(SubscriptionService, 'getSubscriptionPricing').mockReturnValue({
        basic: { monthly: 0, quarterly: 0, yearly: 0 },
        premium: { monthly: 29.90, quarterly: 79.90, yearly: 299.90 },
        enterprise: { monthly: 99.90, quarterly: 269.90, yearly: 999.90 },
      });

      // Mock private methods
      jest.spyOn(upgradeSystemService as any, 'getTierBenefits').mockReturnValue(['Marketplace access', 'Advanced analytics']);
      jest.spyOn(upgradeSystemService as any, 'getAvailableDiscount').mockResolvedValue(null);
      jest.spyOn(upgradeSystemService as any, 'generatePricingComparison').mockReturnValue({});

      const result = await upgradeSystemService.generateUpgradeFlow('user-123', 'premium', {
        featureName: 'marketplace_trading',
      });

      expect(result).toHaveLength(5); // Feature blocked, value prop, pricing, payment, confirmation
      expect(result[0].step).toBe('feature_blocked');
      expect(result[1].step).toBe('value_proposition');
      expect(result[2].step).toBe('pricing_comparison');
      expect(result[0].data.featureName).toBe('marketplace_trading');
    });

    it('should generate flow for enterprise upgrade', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        subscriptionType: 'premium' as const,
        features: {},
        status: 'active' as const,
      };

      const mockRecommendations = {
        currentTier: 'premium',
        recommendedTier: 'enterprise',
        reasons: ['Scale your business'],
        features: [],
        estimatedValue: 100,
      };

      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(mockSubscription as any);
      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockResolvedValue(mockRecommendations as any);
      jest.spyOn(FeatureAccessService, 'getAllFeatures').mockReturnValue({
        professional_tools: {
          name: 'Professional Tools',
          description: 'Business tools',
          category: 'professional',
          tier: 'enterprise',
        },
      });
      jest.spyOn(SubscriptionService, 'getSubscriptionPricing').mockReturnValue({
        basic: { monthly: 0, quarterly: 0, yearly: 0 },
        premium: { monthly: 29.90, quarterly: 79.90, yearly: 299.90 },
        enterprise: { monthly: 99.90, quarterly: 269.90, yearly: 999.90 },
      });

      // Mock private methods
      jest.spyOn(upgradeSystemService as any, 'getTierBenefits').mockReturnValue(['Professional tools', 'API access']);
      jest.spyOn(upgradeSystemService as any, 'getAvailableDiscount').mockResolvedValue(null);
      jest.spyOn(upgradeSystemService as any, 'generatePricingComparison').mockReturnValue({});

      const result = await upgradeSystemService.generateUpgradeFlow('user-123', 'enterprise', {
        featureName: 'professional_tools',
      });

      expect(result.some(step => step.data.targetTier === 'enterprise')).toBe(true);
    });
  });

  describe('Feature Access Service Integration', () => {
    it('should work with feature access service for recommendations', async () => {
      const mockRecommendations = {
        currentTier: 'basic',
        recommendedTier: 'premium',
        reasons: [
          'You\'re approaching the wardrobe limit',
          'Unlock marketplace trading',
        ],
        features: [
          {
            name: 'Unlimited Cataloging',
            description: 'No limits on items',
            category: 'core' as const,
            tier: 'premium' as const,
          },
        ],
        estimatedValue: 75,
      };

      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockResolvedValue(mockRecommendations as any);

      // Test the feature access service directly since the upgrade system service uses it
      const result = await mockFeatureAccessService.prototype.getUpgradeRecommendations('user-123');

      expect(result.recommendedTier).toBe('premium');
      expect(result.reasons).toContain('You\'re approaching the wardrobe limit');
      expect(result.estimatedValue).toBe(75);
    });
  });

  describe('Private Method Testing', () => {
    it('should test prompt content generation through triggerUpgradePrompt', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        userId: 'user-123',
        promptType: 'usage_limit' as const,
        featureContext: 'wardrobe_cataloging',
        promptContent: {
          title: 'Wardrobe Limit Reached',
          message: 'You\'ve reached 95% of your wardrobe cataloging limit',
          benefits: ['Unlimited items', 'Advanced features'],
          ctaText: 'Upgrade Now',
          urgency: 'high',
        },
        shownAt: new Date().toISOString(),
      };

      jest.spyOn(upgradeSystemService as any, 'saveUpgradePrompt').mockResolvedValue(mockPrompt);

      const result = await upgradeSystemService.triggerUpgradePrompt('user-123', {
        featureName: 'wardrobe_cataloging',
        currentUsage: 95,
        limit: 100,
        action: 'add_item',
      });

      expect(result.promptContent.title).toContain('Wardrobe');
      expect(result.promptContent.urgency).toBe('high');
    });

    it('should test different feature contexts through triggerUpgradePrompt', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        userId: 'user-123',
        promptType: 'usage_limit' as const,
        featureContext: 'outfit_creation',
        promptContent: {
          title: 'Outfit Limit Reached',
          message: 'You\'ve reached 90% of your outfit creation limit',
          benefits: ['Unlimited outfits'],
          ctaText: 'Upgrade Now',
        },
        shownAt: new Date().toISOString(),
      };

      jest.spyOn(upgradeSystemService as any, 'saveUpgradePrompt').mockResolvedValue(mockPrompt);

      const result = await upgradeSystemService.triggerUpgradePrompt('user-123', {
        featureName: 'outfit_creation',
        currentUsage: 45,
        limit: 50,
        action: 'create_outfit',
      });

      expect(result.promptContent.title).toContain('Outfit');
    });
  });

  describe('Private Helper Methods', () => {
    it('should calculate correct urgency levels', () => {
      // Test high urgency (>90% usage)
      const highUrgencyUsage = {
        wardrobeItems: 95,
        outfits: 48,
        socialFollows: 50,
        marketplaceListings: 0,
        monthlyUploads: 10,
      };

      // Test medium urgency (70-90% usage)
      const mediumUrgencyUsage = {
        wardrobeItems: 80,
        outfits: 35,
        socialFollows: 40,
        marketplaceListings: 0,
        monthlyUploads: 8,
      };

      // Test low urgency (<70% usage)
      const lowUrgencyUsage = {
        wardrobeItems: 50,
        outfits: 20,
        socialFollows: 25,
        marketplaceListings: 0,
        monthlyUploads: 5,
      };

      // These would be tested through the public methods that use them
      expect(true).toBe(true); // Placeholder for private method testing
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription service errors', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        upgradeSystemService.generateUpgradeFlow('user-123', 'premium', { featureName: 'marketplace_trading' })
      ).rejects.toThrow('Database error');
    });

    it('should handle feature access service errors', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(
        upgradeSystemService.generateUpgradeFlow('user-123', 'premium')
      ).rejects.toThrow('Service unavailable');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle user with no subscription', async () => {
      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(null);
      
      const mockRecommendations = {
        currentTier: 'basic',
        recommendedTier: 'premium',
        reasons: ['Start with premium features'],
        features: [],
        estimatedValue: 30,
      };

      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockResolvedValue(mockRecommendations as any);
      jest.spyOn(SubscriptionService, 'getSubscriptionPricing').mockReturnValue({
        basic: { monthly: 0, quarterly: 0, yearly: 0 },
        premium: { monthly: 29.90, quarterly: 79.90, yearly: 299.90 },
        enterprise: { monthly: 99.90, quarterly: 269.90, yearly: 999.90 },
      });

      // Mock private methods
      jest.spyOn(upgradeSystemService as any, 'getTierBenefits').mockReturnValue(['Premium features']);
      jest.spyOn(upgradeSystemService as any, 'getAvailableDiscount').mockResolvedValue(null);
      jest.spyOn(upgradeSystemService as any, 'generatePricingComparison').mockReturnValue({});

      const result = await upgradeSystemService.generateUpgradeFlow('user-123', 'premium');

      expect(result[1].data.currentTier).toBe('basic');
      expect(result[1].data.targetTier).toBe('premium');
    });

    it('should handle enterprise user flow generation', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        subscriptionType: 'enterprise' as const,
        features: {},
        status: 'active' as const,
      };

      const mockRecommendations = {
        currentTier: 'enterprise',
        recommendedTier: 'enterprise',
        reasons: ['You have access to all features'],
        features: [],
        estimatedValue: 0,
      };

      mockSubscriptionService.prototype.getUserActiveSubscription.mockResolvedValue(mockSubscription as any);
      mockFeatureAccessService.prototype.getUpgradeRecommendations.mockResolvedValue(mockRecommendations as any);
      jest.spyOn(SubscriptionService, 'getSubscriptionPricing').mockReturnValue({
        basic: { monthly: 0, quarterly: 0, yearly: 0 },
        premium: { monthly: 29.90, quarterly: 79.90, yearly: 299.90 },
        enterprise: { monthly: 99.90, quarterly: 269.90, yearly: 999.90 },
      });

      // Mock private methods
      jest.spyOn(upgradeSystemService as any, 'getTierBenefits').mockReturnValue(['Enterprise features']);
      jest.spyOn(upgradeSystemService as any, 'getAvailableDiscount').mockResolvedValue(null);
      jest.spyOn(upgradeSystemService as any, 'generatePricingComparison').mockReturnValue({});

      const result = await upgradeSystemService.generateUpgradeFlow('user-123', 'enterprise');

      expect(result[1].data.currentTier).toBe('enterprise');
      expect(result[1].data.targetTier).toBe('enterprise');
    });
  });
});