import { db } from '../database/connection';

export interface PremiumSubscription {
  id: string;
  userId: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  features: {
    advertisingAccess: boolean;
    dataIntelligence: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionData {
  userId: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  paymentMethodId?: string;
}

export class SubscriptionService {
  private static readonly SUBSCRIPTION_FEATURES = {
    basic: {
      advertisingAccess: false,
      dataIntelligence: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
    },
    premium: {
      advertisingAccess: true,
      dataIntelligence: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: false,
      apiAccess: false,
    },
    enterprise: {
      advertisingAccess: true,
      dataIntelligence: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
    },
  };

  private static readonly SUBSCRIPTION_PRICING = {
    basic: { monthly: 0, quarterly: 0, yearly: 0 },
    premium: { monthly: 29.90, quarterly: 79.90, yearly: 299.90 },
    enterprise: { monthly: 99.90, quarterly: 269.90, yearly: 999.90 },
  };

  /**
   * Create new subscription
   */
  async createSubscription(subscriptionData: CreateSubscriptionData): Promise<PremiumSubscription> {
    const { userId, subscriptionType, billingCycle, paymentMethodId } = subscriptionData;

    // Check if user already has an active subscription
    const existingSubscription = await this.getUserActiveSubscription(userId);
    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    const features = SubscriptionService.SUBSCRIPTION_FEATURES[subscriptionType];
    const amount = SubscriptionService.SUBSCRIPTION_PRICING[subscriptionType][billingCycle];

    // Calculate end date based on billing cycle
    const startDate = new Date();
    let endDate: Date | null = null;

    if (subscriptionType !== 'basic') {
      endDate = new Date(startDate);
      switch (billingCycle) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    const query = `
      INSERT INTO premium_subscriptions (
        user_id, subscription_type, features, billing_cycle, amount, 
        start_date, end_date, payment_method_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId,
      subscriptionType,
      JSON.stringify(features),
      billingCycle,
      amount,
      startDate.toISOString(),
      endDate?.toISOString() || null,
      paymentMethodId || null,
    ];

    const result = await db.query(query, values);
    return this.mapRowToSubscription(result.rows[0]);
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId: string): Promise<PremiumSubscription | null> {
    const query = `
      SELECT * FROM premium_subscriptions 
      WHERE user_id = $1 
        AND status = 'active' 
        AND (end_date IS NULL OR end_date > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToSubscription(result.rows[0]) : null;
  }

  /**
   * Check if user has access to premium feature
   */
  async hasFeatureAccess(
    userId: string, 
    feature: keyof PremiumSubscription['features']
  ): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    
    if (!subscription) {
      // Check if it's a basic feature (always available)
      return SubscriptionService.SUBSCRIPTION_FEATURES.basic[feature];
    }

    return subscription.features[feature] || false;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(
    userId: string,
    newSubscriptionType: 'premium' | 'enterprise',
    billingCycle: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<PremiumSubscription> {
    const currentSubscription = await this.getUserActiveSubscription(userId);
    
    if (!currentSubscription) {
      // Create new subscription
      return await this.createSubscription({
        userId,
        subscriptionType: newSubscriptionType,
        billingCycle,
      });
    }

    // Cancel current subscription
    await this.cancelSubscription(userId);

    // Create new subscription
    return await this.createSubscription({
      userId,
      subscriptionType: newSubscriptionType,
      billingCycle,
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const query = `
      UPDATE premium_subscriptions 
      SET status = 'cancelled', auto_renew = false, updated_at = NOW()
      WHERE user_id = $1 AND status = 'active'
    `;

    await db.query(query, [userId]);
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string): Promise<PremiumSubscription> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.subscriptionType === 'basic') {
      throw new Error('Basic subscriptions do not require renewal');
    }

    // Calculate new end date
    const currentEndDate = new Date(subscription.endDate || subscription.startDate);
    const newEndDate = new Date(currentEndDate);

    switch (subscription.billingCycle) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'quarterly':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'yearly':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }

    const query = `
      UPDATE premium_subscriptions 
      SET end_date = $2, status = 'active', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [subscriptionId, newEndDate.toISOString()]);
    return this.mapRowToSubscription(result.rows[0]);
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<PremiumSubscription | null> {
    const query = 'SELECT * FROM premium_subscriptions WHERE id = $1';
    const result = await db.query(query, [subscriptionId]);
    return result.rows.length > 0 ? this.mapRowToSubscription(result.rows[0]) : null;
  }

  /**
   * Get user subscription history
   */
  async getUserSubscriptionHistory(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<{ subscriptions: PremiumSubscription[]; total: number }> {
    const query = `
      SELECT *, COUNT(*) OVER() as total
      FROM premium_subscriptions 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    
    return {
      subscriptions: result.rows.map(row => this.mapRowToSubscription(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByType: Record<string, number>;
    monthlyRevenue: number;
    churnRate: number;
  }> {
    // Total subscriptions
    const totalQuery = 'SELECT COUNT(*) as total FROM premium_subscriptions';
    const totalResult = await db.query(totalQuery);
    const totalSubscriptions = parseInt(totalResult.rows[0].total);

    // Active subscriptions
    const activeQuery = `
      SELECT COUNT(*) as active 
      FROM premium_subscriptions 
      WHERE status = 'active' AND (end_date IS NULL OR end_date > NOW())
    `;
    const activeResult = await db.query(activeQuery);
    const activeSubscriptions = parseInt(activeResult.rows[0].active);

    // Subscriptions by type
    const typeQuery = `
      SELECT subscription_type, COUNT(*) as count
      FROM premium_subscriptions 
      WHERE status = 'active'
      GROUP BY subscription_type
    `;
    const typeResult = await db.query(typeQuery);
    const subscriptionsByType = typeResult.rows.reduce((acc, row) => {
      acc[row.subscription_type] = parseInt(row.count);
      return acc;
    }, {});

    // Monthly revenue (active subscriptions)
    const revenueQuery = `
      SELECT SUM(
        CASE 
          WHEN billing_cycle = 'monthly' THEN amount
          WHEN billing_cycle = 'quarterly' THEN amount / 3
          WHEN billing_cycle = 'yearly' THEN amount / 12
          ELSE 0
        END
      ) as monthly_revenue
      FROM premium_subscriptions 
      WHERE status = 'active' AND subscription_type != 'basic'
    `;
    const revenueResult = await db.query(revenueQuery);
    const monthlyRevenue = parseFloat(revenueResult.rows[0].monthly_revenue || '0');

    // Churn rate (last 30 days)
    const churnQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'cancelled' AND updated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as churned,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_subscriptions
      FROM premium_subscriptions
    `;
    const churnResult = await db.query(churnQuery);
    const churned = parseInt(churnResult.rows[0].churned);
    const newSubscriptions = parseInt(churnResult.rows[0].new_subscriptions);
    const churnRate = newSubscriptions > 0 ? (churned / newSubscriptions) * 100 : 0;

    return {
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByType,
      monthlyRevenue,
      churnRate,
    };
  }

  /**
   * Process subscription renewals (for scheduled job)
   */
  async processRenewals(): Promise<{ renewed: number; failed: number }> {
    // Find subscriptions expiring in the next 3 days with auto-renew enabled
    const query = `
      SELECT * FROM premium_subscriptions 
      WHERE status = 'active' 
        AND auto_renew = true 
        AND end_date <= NOW() + INTERVAL '3 days'
        AND end_date > NOW()
        AND subscription_type != 'basic'
    `;

    const result = await db.query(query);
    let renewed = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        await this.renewSubscription(row.id);
        renewed++;
      } catch (error) {
        console.error(`Failed to renew subscription ${row.id}:`, error);
        failed++;
      }
    }

    return { renewed, failed };
  }

  /**
   * Get subscription pricing
   */
  static getSubscriptionPricing(): typeof SubscriptionService.SUBSCRIPTION_PRICING {
    return SubscriptionService.SUBSCRIPTION_PRICING;
  }

  /**
   * Get subscription features
   */
  static getSubscriptionFeatures(): typeof SubscriptionService.SUBSCRIPTION_FEATURES {
    return SubscriptionService.SUBSCRIPTION_FEATURES;
  }

  private mapRowToSubscription(row: any): PremiumSubscription {
    return {
      id: row.id,
      userId: row.user_id,
      subscriptionType: row.subscription_type,
      features: row.features || {},
      billingCycle: row.billing_cycle,
      amount: parseFloat(row.amount),
      currency: row.currency || 'BRL',
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      autoRenew: row.auto_renew,
      paymentMethodId: row.payment_method_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}