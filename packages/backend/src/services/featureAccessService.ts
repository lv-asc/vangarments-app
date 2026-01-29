import { SubscriptionService } from './subscriptionService';

export interface FeatureDefinition {
  name: string;
  description: string;
  category: 'core' | 'social' | 'marketplace' | 'analytics' | 'professional';
  tier: 'free' | 'premium' | 'enterprise';
  requiresAccountLinking?: boolean;
  limitations?: {
    maxItems?: number;
    maxUploads?: number;
    maxFollows?: number;
    maxListings?: number;
  };
}

export class FeatureAccessService {
  private subscriptionService = new SubscriptionService();

  // Define all platform features and their access levels
  private static readonly FEATURES: Record<string, FeatureDefinition> = {
    // Free Tier Features (Core Functionality)
    'wardrobe_cataloging': {
      name: 'Wardrobe Cataloging',
      description: 'Digital wardrobe organization and management',
      category: 'core',
      tier: 'free',
      limitations: {
        maxItems: 100, // Free users can catalog up to 100 items
      },
    },
    'ai_background_removal': {
      name: 'AI Background Removal',
      description: 'Automatic background removal from item photos',
      category: 'core',
      tier: 'free',
    },
    'ai_categorization': {
      name: 'AI Item Categorization',
      description: 'Automatic item categorization using AI',
      category: 'core',
      tier: 'free',
    },
    'photo_guides': {
      name: 'Photography Guides',
      description: 'Step-by-step photo instruction guides',
      category: 'core',
      tier: 'free',
    },
    'brand_partnership_links': {
      name: 'Brand Partnership Links',
      description: 'Access to national brand partnership links',
      category: 'core',
      tier: 'free',
    },

    // Basic Social Features (Requires Account Linking)
    'basic_social_sharing': {
      name: 'Basic Social Sharing',
      description: 'Share items with bio links',
      category: 'social',
      tier: 'free',
      requiresAccountLinking: true,
      limitations: {
        maxFollows: 50,
      },
    },
    'profile_customization': {
      name: 'Profile Customization',
      description: 'Basic profile customization options',
      category: 'social',
      tier: 'free',
      requiresAccountLinking: true,
    },
    'content_discovery': {
      name: 'Content Discovery',
      description: 'Browse and discover fashion content',
      category: 'social',
      tier: 'free',
    },

    // Premium Features
    'marketplace_trading': {
      name: 'Marketplace Trading',
      description: 'Buy and sell fashion items on the marketplace',
      category: 'marketplace',
      tier: 'premium',
    },
    'enhanced_social_features': {
      name: 'Enhanced Social Features',
      description: 'Advanced social functionality and engagement',
      category: 'social',
      tier: 'premium',
    },
    'advanced_analytics': {
      name: 'Advanced Analytics',
      description: 'Detailed wardrobe and usage analytics',
      category: 'analytics',
      tier: 'premium',
    },
    'style_dna_analysis': {
      name: 'Style DNA Analysis',
      description: 'Personal style profiling and analysis',
      category: 'analytics',
      tier: 'premium',
    },
    'trend_predictions': {
      name: 'Trend Predictions',
      description: 'Personalized fashion trend predictions',
      category: 'analytics',
      tier: 'premium',
    },
    'wardrobe_optimization': {
      name: 'Wardrobe Optimization',
      description: 'AI-powered wardrobe optimization recommendations',
      category: 'analytics',
      tier: 'premium',
    },
    'unlimited_cataloging': {
      name: 'Unlimited Cataloging',
      description: 'Unlimited wardrobe items',
      category: 'core',
      tier: 'premium',
    },

    // Enterprise Features
    'professional_tools': {
      name: 'Professional Tools',
      description: 'Business and professional fashion tools',
      category: 'professional',
      tier: 'enterprise',
    },
    'brand_management': {
      name: 'Brand Management',
      description: 'Advanced brand and business management features',
      category: 'professional',
      tier: 'enterprise',
    },
    'api_access': {
      name: 'API Access',
      description: 'Full API access for integrations',
      category: 'professional',
      tier: 'enterprise',
    },
    'custom_branding': {
      name: 'Custom Branding',
      description: 'White-label and custom branding options',
      category: 'professional',
      tier: 'enterprise',
    },
    'priority_support': {
      name: 'Priority Support',
      description: 'Dedicated customer support',
      category: 'professional',
      tier: 'enterprise',
    },
  };

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(
    userId: string,
    featureName: string,
    context?: {
      currentUsage?: number;
      hasAccountLinking?: boolean;
    }
  ): Promise<{
    hasAccess: boolean;
    reason?: string;
    upgradeRequired?: string;
    limitation?: any;
  }> {
    const feature = FeatureAccessService.FEATURES[featureName];
    if (!feature) {
      return {
        hasAccess: false,
        reason: 'Feature not found',
      };
    }

    // Get user's subscription
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    const userTier = subscription?.subscriptionType || 'basic';

    // Check tier access
    const tierHierarchy = { 'free': 0, 'basic': 0, 'premium': 1, 'enterprise': 2 };
    const requiredTierLevel = tierHierarchy[feature.tier];
    const userTierLevel = tierHierarchy[userTier];

    if (userTierLevel < requiredTierLevel) {
      return {
        hasAccess: false,
        reason: `Feature requires ${feature.tier} subscription`,
        upgradeRequired: feature.tier,
      };
    }

    // Check account linking requirement
    if (feature.requiresAccountLinking && !context?.hasAccountLinking) {
      return {
        hasAccess: false,
        reason: 'Feature requires account linking (similar to VSCO with Instagram bio links)',
      };
    }

    // Check usage limitations for free/basic users
    if (userTier === 'basic' && feature.limitations && context?.currentUsage !== undefined) {
      const limitation = this.getApplicableLimitation(feature, context.currentUsage);
      if (limitation) {
        return {
          hasAccess: false,
          reason: `Usage limit reached: ${limitation.message}`,
          upgradeRequired: 'premium',
          limitation,
        };
      }
    }

    return { hasAccess: true };
  }

  /**
   * Get all features available to a user
   */
  async getUserAvailableFeatures(
    userId: string,
    hasAccountLinking = false
  ): Promise<{
    available: FeatureDefinition[];
    restricted: Array<FeatureDefinition & { reason: string; upgradeRequired?: string }>;
  }> {
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    const userTier = subscription?.subscriptionType || 'basic';

    const available: FeatureDefinition[] = [];
    const restricted: Array<FeatureDefinition & { reason: string; upgradeRequired?: string }> = [];

    for (const [key, feature] of Object.entries(FeatureAccessService.FEATURES)) {
      const access = await this.hasFeatureAccess(userId, key, { hasAccountLinking });

      if (access.hasAccess) {
        available.push(feature);
      } else {
        restricted.push({
          ...feature,
          reason: access.reason || 'Access denied',
          upgradeRequired: access.upgradeRequired,
        });
      }
    }

    return { available, restricted };
  }

  /**
   * Get feature usage statistics for a user
   */
  async getUserFeatureUsage(userId: string): Promise<{
    wardrobeItems: number;
    socialFollows: number;
    marketplaceListings: number;
    monthlyUploads: number;
  }> {
    // This would normally query the database for actual usage
    // For now, return mock data
    return {
      wardrobeItems: 45,
      socialFollows: 23,
      marketplaceListings: 3,
      monthlyUploads: 8,
    };
  }

  /**
   * Get upgrade recommendations for a user
   */
  async getUpgradeRecommendations(userId: string): Promise<{
    currentTier: string;
    recommendedTier: string;
    reasons: string[];
    features: FeatureDefinition[];
    estimatedValue: number;
  }> {
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    const currentTier = subscription?.subscriptionType || 'basic';
    const usage = await this.getUserFeatureUsage(userId);

    let recommendedTier = 'premium';
    const reasons: string[] = [];
    const features: FeatureDefinition[] = [];

    // Analyze usage patterns to recommend upgrades
    if (usage.wardrobeItems > 80) {
      reasons.push('You\'re approaching the free tier limit of 100 wardrobe items');
      features.push(FeatureAccessService.FEATURES['unlimited_cataloging']);
    }


    if (usage.socialFollows > 40) {
      reasons.push('Unlock enhanced social features for better engagement');
      features.push(FeatureAccessService.FEATURES['enhanced_social_features']);
    }

    if (usage.monthlyUploads > 15) {
      reasons.push('Get advanced analytics to understand your fashion patterns');
      features.push(FeatureAccessService.FEATURES['advanced_analytics']);
      features.push(FeatureAccessService.FEATURES['style_dna_analysis']);
    }

    // Always recommend marketplace if not already premium
    if (currentTier === 'basic') {
      reasons.push('Start monetizing your wardrobe with marketplace trading');
      features.push(FeatureAccessService.FEATURES['marketplace_trading']);
    }

    // Check if enterprise features would be valuable
    if (usage.marketplaceListings > 20 || usage.socialFollows > 500) {
      recommendedTier = 'enterprise';
      reasons.push('Professional tools can help you scale your fashion business');
      features.push(FeatureAccessService.FEATURES['professional_tools']);
      features.push(FeatureAccessService.FEATURES['brand_management']);
    }

    return {
      currentTier,
      recommendedTier,
      reasons,
      features: [...new Set(features)], // Remove duplicates
      estimatedValue: this.calculateEstimatedValue(features),
    };
  }

  /**
   * Get all feature definitions
   */
  static getAllFeatures(): Record<string, FeatureDefinition> {
    return FeatureAccessService.FEATURES;
  }

  /**
   * Get features by category
   */
  static getFeaturesByCategory(category: FeatureDefinition['category']): FeatureDefinition[] {
    return Object.values(FeatureAccessService.FEATURES).filter(f => f.category === category);
  }

  /**
   * Get features by tier
   */
  static getFeaturesByTier(tier: FeatureDefinition['tier']): FeatureDefinition[] {
    return Object.values(FeatureAccessService.FEATURES).filter(f => f.tier === tier);
  }

  /**
   * Check if user is approaching any limits
   */
  async checkUsageLimits(userId: string): Promise<{
    warnings: Array<{
      feature: string;
      current: number;
      limit: number;
      percentage: number;
      message: string;
    }>;
    blocked: Array<{
      feature: string;
      current: number;
      limit: number;
      message: string;
    }>;
  }> {
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    const userTier = subscription?.subscriptionType || 'basic';
    const usage = await this.getUserFeatureUsage(userId);

    const warnings: any[] = [];
    const blocked: any[] = [];

    if (userTier === 'basic') {
      // Check wardrobe items limit
      const wardrobeLimit = 100;
      const wardrobePercentage = (usage.wardrobeItems / wardrobeLimit) * 100;

      if (wardrobePercentage >= 100) {
        blocked.push({
          feature: 'wardrobe_cataloging',
          current: usage.wardrobeItems,
          limit: wardrobeLimit,
          message: 'Wardrobe item limit reached. Upgrade to add more items.',
        });
      } else if (wardrobePercentage >= 80) {
        warnings.push({
          feature: 'wardrobe_cataloging',
          current: usage.wardrobeItems,
          limit: wardrobeLimit,
          percentage: wardrobePercentage,
          message: `You're using ${Math.round(wardrobePercentage)}% of your wardrobe limit.`,
        });
      }


      // Check social follows limit
      const followsLimit = 50;
      const followsPercentage = (usage.socialFollows / followsLimit) * 100;

      if (followsPercentage >= 100) {
        blocked.push({
          feature: 'basic_social_sharing',
          current: usage.socialFollows,
          limit: followsLimit,
          message: 'Following limit reached. Upgrade for unlimited follows.',
        });
      } else if (followsPercentage >= 80) {
        warnings.push({
          feature: 'basic_social_sharing',
          current: usage.socialFollows,
          limit: followsLimit,
          percentage: followsPercentage,
          message: `You're using ${Math.round(followsPercentage)}% of your following limit.`,
        });
      }
    }

    return { warnings, blocked };
  }

  private getApplicableLimitation(feature: FeatureDefinition, currentUsage: number): any {
    if (!feature.limitations) return null;

    if (feature.limitations.maxItems && currentUsage >= feature.limitations.maxItems) {
      return {
        type: 'maxItems',
        limit: feature.limitations.maxItems,
        current: currentUsage,
        message: `Maximum ${feature.limitations.maxItems} items allowed`,
      };
    }

    if (feature.limitations.maxUploads && currentUsage >= feature.limitations.maxUploads) {
      return {
        type: 'maxUploads',
        limit: feature.limitations.maxUploads,
        current: currentUsage,
        message: `Maximum ${feature.limitations.maxUploads} uploads per month`,
      };
    }

    if (feature.limitations.maxFollows && currentUsage >= feature.limitations.maxFollows) {
      return {
        type: 'maxFollows',
        limit: feature.limitations.maxFollows,
        current: currentUsage,
        message: `Maximum ${feature.limitations.maxFollows} follows allowed`,
      };
    }

    if (feature.limitations.maxListings && currentUsage >= feature.limitations.maxListings) {
      return {
        type: 'maxListings',
        limit: feature.limitations.maxListings,
        current: currentUsage,
        message: `Maximum ${feature.limitations.maxListings} marketplace listings`,
      };
    }

    return null;
  }

  private calculateEstimatedValue(features: FeatureDefinition[]): number {
    // Calculate estimated monthly value based on features
    let value = 0;

    features.forEach(feature => {
      switch (feature.name) {
        case 'Marketplace Trading':
          value += 15; // Potential earnings from selling items
          break;
        case 'Advanced Analytics':
          value += 10; // Value of insights
          break;
        case 'Unlimited Cataloging':
          value += 8; // Convenience value
          break;
        case 'Enhanced Social Features':
          value += 12; // Social engagement value
          break;
        case 'Professional Tools':
          value += 25; // Business value
          break;
        default:
          value += 5; // Default feature value
      }
    });

    return Math.min(value, 100); // Cap at $100 estimated value
  }
}