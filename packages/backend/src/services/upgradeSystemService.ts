import { SubscriptionService } from './subscriptionService';
import { FeatureAccessService } from './featureAccessService';
import { db } from '../database/connection';

export interface UpgradePrompt {
  id: string;
  userId: string;
  promptType: 'usage_limit' | 'feature_discovery' | 'value_demonstration' | 'social_proof';
  featureContext?: string;
  promptContent: {
    title: string;
    message: string;
    benefits: string[];
    ctaText: string;
    urgency?: string;
    socialProof?: string;
    discount?: {
      percentage: number;
      validUntil: string;
    };
  };
  shownAt: string;
  userAction?: 'dismissed' | 'upgraded' | 'learn_more' | 'ignored';
  actionAt?: string;
  conversionValue?: number;
}

export interface UpgradeFlow {
  step: 'feature_blocked' | 'value_proposition' | 'pricing_comparison' | 'payment' | 'confirmation';
  data: any;
  nextStep?: string;
  canSkip: boolean;
}

export class UpgradeSystemService {
  private subscriptionService = new SubscriptionService();
  private featureAccessService = new FeatureAccessService();

  /**
   * Trigger upgrade prompt when user hits a limitation
   */
  async triggerUpgradePrompt(
    userId: string,
    context: {
      featureName: string;
      currentUsage: number;
      limit: number;
      action: string;
    }
  ): Promise<UpgradePrompt> {
    const promptContent = this.generatePromptContent(context);
    
    const prompt: Omit<UpgradePrompt, 'id'> = {
      userId,
      promptType: 'usage_limit',
      featureContext: context.featureName,
      promptContent,
      shownAt: new Date().toISOString(),
    };

    return await this.saveUpgradePrompt(prompt);
  }

  /**
   * Show feature discovery prompt for premium features
   */
  async showFeatureDiscoveryPrompt(
    userId: string,
    featureName: string
  ): Promise<UpgradePrompt> {
    const feature = FeatureAccessService.getAllFeatures()[featureName];
    if (!feature) {
      throw new Error('Feature not found');
    }

    const promptContent = {
      title: `Unlock ${feature.name}`,
      message: `Discover the power of ${feature.description}`,
      benefits: this.getFeatureBenefits(featureName),
      ctaText: 'Upgrade Now',
      socialProof: 'Join 10,000+ fashion enthusiasts who upgraded',
    };

    const prompt: Omit<UpgradePrompt, 'id'> = {
      userId,
      promptType: 'feature_discovery',
      featureContext: featureName,
      promptContent,
      shownAt: new Date().toISOString(),
    };

    return await this.saveUpgradePrompt(prompt);
  }

  /**
   * Generate upgrade flow based on user context
   */
  async generateUpgradeFlow(
    userId: string,
    targetTier: 'premium' | 'enterprise',
    context?: {
      featureName?: string;
      currentStep?: string;
    }
  ): Promise<UpgradeFlow[]> {
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    const currentTier = subscription?.subscriptionType || 'basic';
    const recommendations = await this.featureAccessService.getUpgradeRecommendations(userId);

    const flow: UpgradeFlow[] = [];

    // Step 1: Feature blocked / Value proposition
    if (context?.featureName) {
      flow.push({
        step: 'feature_blocked',
        data: {
          featureName: context.featureName,
          feature: FeatureAccessService.getAllFeatures()[context.featureName],
          currentTier,
          requiredTier: targetTier,
        },
        nextStep: 'value_proposition',
        canSkip: false,
      });
    }

    // Step 2: Value proposition
    flow.push({
      step: 'value_proposition',
      data: {
        currentTier,
        targetTier,
        benefits: this.getTierBenefits(targetTier),
        personalizedReasons: recommendations.reasons,
        estimatedValue: recommendations.estimatedValue,
      },
      nextStep: 'pricing_comparison',
      canSkip: true,
    });

    // Step 3: Pricing comparison
    flow.push({
      step: 'pricing_comparison',
      data: {
        pricing: SubscriptionService.getSubscriptionPricing(),
        currentTier,
        targetTier,
        discount: await this.getAvailableDiscount(userId),
        comparison: this.generatePricingComparison(currentTier, targetTier),
      },
      nextStep: 'payment',
      canSkip: false,
    });

    // Step 4: Payment
    flow.push({
      step: 'payment',
      data: {
        subscriptionOptions: this.getSubscriptionOptions(targetTier),
        paymentMethods: ['credit_card', 'pix', 'boleto'],
        securityFeatures: ['ssl_encryption', 'pci_compliance'],
      },
      nextStep: 'confirmation',
      canSkip: false,
    });

    // Step 5: Confirmation
    flow.push({
      step: 'confirmation',
      data: {
        welcomeMessage: `Welcome to ${targetTier} tier!`,
        nextSteps: this.getOnboardingSteps(targetTier),
        newFeatures: FeatureAccessService.getFeaturesByTier(targetTier),
      },
      canSkip: false,
    });

    return flow;
  }

  /**
   * Process upgrade completion
   */
  async processUpgradeCompletion(
    userId: string,
    subscriptionData: {
      subscriptionType: 'premium' | 'enterprise';
      billingCycle: 'monthly' | 'quarterly' | 'yearly';
      paymentMethodId?: string;
    },
    promptId?: string
  ): Promise<{
    subscription: any;
    unlockedFeatures: string[];
    onboardingSteps: any[];
  }> {
    // Create or upgrade subscription
    const subscription = await this.subscriptionService.upgradeSubscription(
      userId,
      subscriptionData.subscriptionType,
      subscriptionData.billingCycle
    );

    // Update prompt with conversion
    if (promptId) {
      await this.updatePromptAction(promptId, 'upgraded', subscription.amount);
    }

    // Get newly unlocked features
    const unlockedFeatures = this.getUnlockedFeatures(subscriptionData.subscriptionType);
    
    // Generate onboarding steps
    const onboardingSteps = this.getOnboardingSteps(subscriptionData.subscriptionType);

    return {
      subscription,
      unlockedFeatures,
      onboardingSteps,
    };
  }

  /**
   * Get upgrade analytics for admin
   */
  async getUpgradeAnalytics(
    dateRange?: { start: string; end: string }
  ): Promise<{
    conversionRate: number;
    promptPerformance: Record<string, { shown: number; converted: number; rate: number }>;
    revenueBySource: Record<string, number>;
    topConvertingFeatures: Array<{ feature: string; conversions: number; revenue: number }>;
    userJourney: Array<{ step: string; dropoffRate: number }>;
  }> {
    // This would normally query the database for real analytics
    // For now, return mock data
    return {
      conversionRate: 0.12, // 12% conversion rate
      promptPerformance: {
        usage_limit: { shown: 1500, converted: 180, rate: 0.12 },
        feature_discovery: { shown: 800, converted: 64, rate: 0.08 },
        value_demonstration: { shown: 600, converted: 90, rate: 0.15 },
        social_proof: { shown: 400, converted: 52, rate: 0.13 },
      },
      revenueBySource: {
        usage_limit: 5400, // R$ 5,400
        feature_discovery: 1920, // R$ 1,920
        value_demonstration: 2700, // R$ 2,700
        social_proof: 1560, // R$ 1,560
      },
      topConvertingFeatures: [
        { feature: 'marketplace_trading', conversions: 120, revenue: 3600 },
        { feature: 'advanced_analytics', conversions: 95, revenue: 2850 },
        { feature: 'unlimited_cataloging', conversions: 85, revenue: 2550 },
        { feature: 'enhanced_social_features', conversions: 70, revenue: 2100 },
      ],
      userJourney: [
        { step: 'feature_blocked', dropoffRate: 0.15 },
        { step: 'value_proposition', dropoffRate: 0.25 },
        { step: 'pricing_comparison', dropoffRate: 0.35 },
        { step: 'payment', dropoffRate: 0.20 },
        { step: 'confirmation', dropoffRate: 0.05 },
      ],
    };
  }

  /**
   * A/B test different upgrade prompts
   */
  async runUpgradePromptTest(
    userId: string,
    testVariants: Array<{
      name: string;
      promptContent: UpgradePrompt['promptContent'];
      weight: number;
    }>
  ): Promise<UpgradePrompt> {
    // Select variant based on weights
    const totalWeight = testVariants.reduce((sum, variant) => sum + variant.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    let selectedVariant = testVariants[0];
    
    for (const variant of testVariants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        selectedVariant = variant;
        break;
      }
    }

    const prompt: Omit<UpgradePrompt, 'id'> = {
      userId,
      promptType: 'value_demonstration',
      promptContent: {
        ...selectedVariant.promptContent,
        // Add test variant info to metadata
      },
      shownAt: new Date().toISOString(),
    };

    return await this.saveUpgradePrompt(prompt);
  }

  /**
   * Get personalized upgrade recommendations
   */
  async getPersonalizedUpgradeRecommendations(userId: string): Promise<{
    recommendedTier: string;
    urgency: 'low' | 'medium' | 'high';
    personalizedMessage: string;
    keyBenefits: string[];
    estimatedSavings: number;
    socialProof: string;
  }> {
    const recommendations = await this.featureAccessService.getUpgradeRecommendations(userId);
    const usage = await this.featureAccessService.getUserFeatureUsage(userId);

    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (usage.wardrobeItems > 90 || usage.outfits > 45) urgency = 'high';
    else if (usage.wardrobeItems > 70 || usage.outfits > 35) urgency = 'medium';

    const personalizedMessage = this.generatePersonalizedMessage(usage, recommendations);
    const keyBenefits = recommendations.features.slice(0, 3).map(f => f.description);
    const estimatedSavings = this.calculateEstimatedSavings(usage);
    const socialProof = this.generateSocialProof(recommendations.recommendedTier);

    return {
      recommendedTier: recommendations.recommendedTier,
      urgency,
      personalizedMessage,
      keyBenefits,
      estimatedSavings,
      socialProof,
    };
  }

  // Private helper methods

  private generatePromptContent(context: {
    featureName: string;
    currentUsage: number;
    limit: number;
    action: string;
  }): UpgradePrompt['promptContent'] {
    const feature = FeatureAccessService.getAllFeatures()[context.featureName];
    const percentage = Math.round((context.currentUsage / context.limit) * 100);

    return {
      title: `You've reached your ${feature?.name || context.featureName} limit`,
      message: `You're using ${percentage}% of your ${context.featureName} allowance. Upgrade to continue ${context.action}.`,
      benefits: this.getFeatureBenefits(context.featureName),
      ctaText: 'Upgrade Now',
      urgency: percentage >= 100 ? 'Upgrade required to continue' : undefined,
    };
  }

  private getFeatureBenefits(featureName: string): string[] {
    const benefitMap: Record<string, string[]> = {
      wardrobe_cataloging: [
        'Unlimited wardrobe items',
        'Advanced organization tools',
        'Detailed analytics and insights',
      ],
      marketplace_trading: [
        'Monetize your wardrobe',
        'Access to premium buyers',
        'Advanced selling tools',
      ],
      advanced_analytics: [
        'Detailed usage insights',
        'Cost-per-wear analysis',
        'Style DNA profiling',
      ],
      enhanced_social_features: [
        'Unlimited follows',
        'Advanced engagement tools',
        'Priority in feeds',
      ],
    };

    return benefitMap[featureName] || ['Enhanced functionality', 'Priority support', 'Advanced features'];
  }

  private getTierBenefits(tier: 'premium' | 'enterprise'): string[] {
    const benefits = {
      premium: [
        'Unlimited wardrobe cataloging',
        'Marketplace trading capabilities',
        'Advanced analytics and insights',
        'Enhanced social features',
        'Priority customer support',
      ],
      enterprise: [
        'All Premium features',
        'Professional business tools',
        'Custom branding options',
        'API access for integrations',
        'Dedicated account manager',
      ],
    };

    return benefits[tier];
  }

  private async getAvailableDiscount(userId: string): Promise<{ percentage: number; validUntil: string } | null> {
    // Check if user qualifies for any discounts
    // For now, return a sample discount
    return {
      percentage: 20,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }

  private generatePricingComparison(currentTier: string, targetTier: string): any {
    const pricing = SubscriptionService.getSubscriptionPricing();
    const currentPrice = currentTier === 'basic' ? 0 : pricing[currentTier as keyof typeof pricing].monthly;
    const targetPrice = pricing[targetTier as keyof typeof pricing].monthly;

    return {
      current: { tier: currentTier, price: currentPrice },
      target: { tier: targetTier, price: targetPrice },
      difference: targetPrice - currentPrice,
      annualSavings: targetTier === 'premium' ? 59.80 : 199.80, // Savings with annual billing
    };
  }

  private getSubscriptionOptions(tier: 'premium' | 'enterprise'): any[] {
    const pricing = SubscriptionService.getSubscriptionPricing();
    const tierPricing = pricing[tier];

    return [
      {
        cycle: 'monthly',
        price: tierPricing.monthly,
        totalPrice: tierPricing.monthly,
        savings: 0,
        popular: false,
      },
      {
        cycle: 'quarterly',
        price: tierPricing.quarterly,
        monthlyEquivalent: tierPricing.quarterly / 3,
        totalPrice: tierPricing.quarterly,
        savings: (tierPricing.monthly * 3) - tierPricing.quarterly,
        popular: false,
      },
      {
        cycle: 'yearly',
        price: tierPricing.yearly,
        monthlyEquivalent: tierPricing.yearly / 12,
        totalPrice: tierPricing.yearly,
        savings: (tierPricing.monthly * 12) - tierPricing.yearly,
        popular: true,
      },
    ];
  }

  private getOnboardingSteps(tier: 'premium' | 'enterprise'): any[] {
    const steps = {
      premium: [
        {
          title: 'Explore Marketplace',
          description: 'Start selling items from your wardrobe',
          action: 'list_first_item',
        },
        {
          title: 'View Analytics',
          description: 'Check your wardrobe insights and style DNA',
          action: 'view_analytics',
        },
        {
          title: 'Unlimited Cataloging',
          description: 'Add more items to your wardrobe',
          action: 'add_items',
        },
      ],
      enterprise: [
        {
          title: 'Set Up Business Profile',
          description: 'Configure your professional brand presence',
          action: 'setup_business',
        },
        {
          title: 'API Integration',
          description: 'Connect your existing systems',
          action: 'setup_api',
        },
        {
          title: 'Custom Branding',
          description: 'Apply your brand colors and logo',
          action: 'customize_branding',
        },
      ],
    };

    return steps[tier];
  }

  private getUnlockedFeatures(tier: 'premium' | 'enterprise'): string[] {
    const features = FeatureAccessService.getFeaturesByTier(tier);
    return features.map(f => f.name);
  }

  private generatePersonalizedMessage(usage: any, recommendations: any): string {
    if (usage.wardrobeItems > 90) {
      return "You're a power user! Unlock unlimited cataloging to organize your extensive wardrobe.";
    } else if (usage.socialFollows > 40) {
      return "Your social engagement is growing! Upgrade for enhanced social features.";
    } else if (usage.monthlyUploads > 15) {
      return "You're actively building your wardrobe. Get insights with advanced analytics.";
    }
    return "Take your fashion journey to the next level with premium features.";
  }

  private calculateEstimatedSavings(usage: any): number {
    // Calculate potential savings from marketplace trading
    const averageItemValue = 50; // R$ 50 average item value
    const potentialSales = Math.min(usage.wardrobeItems * 0.1, 10); // 10% of items, max 10
    return potentialSales * averageItemValue * 0.8; // 80% after fees
  }

  private generateSocialProof(tier: string): string {
    const proofMessages = {
      premium: "Join 15,000+ fashion enthusiasts who upgraded to Premium",
      enterprise: "Trusted by 500+ fashion businesses and influencers",
    };
    return proofMessages[tier as keyof typeof proofMessages] || "Join thousands of satisfied users";
  }

  private async saveUpgradePrompt(prompt: Omit<UpgradePrompt, 'id'>): Promise<UpgradePrompt> {
    const query = `
      INSERT INTO upgrade_prompts (
        user_id, prompt_type, feature_context, prompt_content
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      prompt.userId,
      prompt.promptType,
      prompt.featureContext,
      JSON.stringify(prompt.promptContent),
    ];

    const result = await db.query(query, values);
    return this.mapRowToUpgradePrompt(result.rows[0]);
  }

  private async updatePromptAction(
    promptId: string,
    action: 'dismissed' | 'upgraded' | 'learn_more' | 'ignored',
    conversionValue?: number
  ): Promise<void> {
    const query = `
      UPDATE upgrade_prompts 
      SET user_action = $2, action_at = NOW(), conversion_value = $3
      WHERE id = $1
    `;

    await db.query(query, [promptId, action, conversionValue || null]);
  }

  private mapRowToUpgradePrompt(row: any): UpgradePrompt {
    return {
      id: row.id,
      userId: row.user_id,
      promptType: row.prompt_type,
      featureContext: row.feature_context,
      promptContent: row.prompt_content,
      shownAt: row.shown_at,
      userAction: row.user_action,
      actionAt: row.action_at,
      conversionValue: row.conversion_value,
    };
  }
}