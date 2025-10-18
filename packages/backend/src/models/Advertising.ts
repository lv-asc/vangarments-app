import { db } from '../database/connection';

export interface AdvertisingCampaign {
  id: string;
  advertiserId: string; // Brand or advertiser user ID
  campaignName: string;
  campaignType: 'brand_awareness' | 'product_promotion' | 'marketplace_listing' | 'sponsored_content';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget: {
    totalBudget: number;
    dailyBudget: number;
    spentAmount: number;
    currency: string;
  };
  targeting: {
    demographics: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      location?: string[];
    };
    fashionPreferences: {
      preferredBrands?: string[];
      styleProfiles?: string[];
      priceRanges?: Array<{ min: number; max: number }>;
      categories?: string[];
      colors?: string[];
    };
    behaviorTargeting: {
      wardrobeComposition?: string[];
      purchaseHistory?: string[];
      engagementPatterns?: string[];
      socialActivity?: string[];
    };
  };
  creativeAssets: {
    images: string[];
    videos?: string[];
    copy: {
      headline: string;
      description: string;
      callToAction: string;
    };
  };
  placements: string[]; // 'feed', 'discovery', 'product_page', 'stories'
  schedule: {
    startDate: string;
    endDate?: string;
    timezone: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number; // Click-through rate
    cpc: number; // Cost per click
    cpm: number; // Cost per mille
    roas: number; // Return on ad spend
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  advertiserId: string;
  campaignName: string;
  campaignType: 'brand_awareness' | 'product_promotion' | 'marketplace_listing' | 'sponsored_content';
  budget: {
    totalBudget: number;
    dailyBudget: number;
    currency: string;
  };
  targeting: AdvertisingCampaign['targeting'];
  creativeAssets: AdvertisingCampaign['creativeAssets'];
  placements: string[];
  schedule: AdvertisingCampaign['schedule'];
}

export interface AdImpression {
  id: string;
  campaignId: string;
  userId: string;
  adPlacement: string;
  timestamp: string;
  userContext: {
    currentPage: string;
    deviceType: string;
    location?: string;
    sessionData?: any;
  };
  targeting: {
    matchedCriteria: string[];
    relevanceScore: number;
  };
}

export interface AdClick {
  id: string;
  impressionId: string;
  campaignId: string;
  userId: string;
  clickedAt: string;
  destinationUrl: string;
  conversionTracked: boolean;
}

export interface AdConversion {
  id: string;
  clickId: string;
  campaignId: string;
  userId: string;
  conversionType: 'purchase' | 'signup' | 'add_to_cart' | 'wishlist' | 'follow';
  conversionValue: number;
  conversionData: any;
  convertedAt: string;
}

export class AdvertisingModel {
  static async createCampaign(campaignData: CreateCampaignData): Promise<AdvertisingCampaign> {
    const {
      advertiserId,
      campaignName,
      campaignType,
      budget,
      targeting,
      creativeAssets,
      placements,
      schedule,
    } = campaignData;

    const query = `
      INSERT INTO advertising_campaigns (
        advertiser_id, campaign_name, campaign_type, budget, targeting,
        creative_assets, placements, schedule, metrics
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const defaultMetrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
    };

    const values = [
      advertiserId,
      campaignName,
      campaignType,
      JSON.stringify({ ...budget, spentAmount: 0 }),
      JSON.stringify(targeting),
      JSON.stringify(creativeAssets),
      placements,
      JSON.stringify(schedule),
      JSON.stringify(defaultMetrics),
    ];

    const result = await db.query(query, values);
    return this.mapRowToCampaign(result.rows[0]);
  }

  static async findById(id: string): Promise<AdvertisingCampaign | null> {
    const query = `
      SELECT ac.*, 
             ba.brand_info as advertiser_info
      FROM advertising_campaigns ac
      LEFT JOIN brand_accounts ba ON ac.advertiser_id = ba.user_id
      WHERE ac.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToCampaign(result.rows[0]) : null;
  }

  static async findByAdvertiserId(
    advertiserId: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<{ campaigns: AdvertisingCampaign[]; total: number }> {
    let whereClause = 'WHERE ac.advertiser_id = $1';
    const values: any[] = [advertiserId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND ac.status = $${paramIndex++}`;
      values.push(status);
    }

    const query = `
      SELECT ac.*, 
             ba.brand_info as advertiser_info,
             COUNT(*) OVER() as total
      FROM advertising_campaigns ac
      LEFT JOIN brand_accounts ba ON ac.advertiser_id = ba.user_id
      ${whereClause}
      ORDER BY ac.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      campaigns: result.rows.map(row => this.mapRowToCampaign(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async updateCampaignStatus(
    campaignId: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  ): Promise<AdvertisingCampaign | null> {
    const query = `
      UPDATE advertising_campaigns 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, campaignId]);
    return result.rows.length > 0 ? this.mapRowToCampaign(result.rows[0]) : null;
  }

  static async recordImpression(impressionData: Omit<AdImpression, 'id' | 'timestamp'>): Promise<AdImpression> {
    const query = `
      INSERT INTO ad_impressions (
        campaign_id, user_id, ad_placement, user_context, targeting
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      impressionData.campaignId,
      impressionData.userId,
      impressionData.adPlacement,
      JSON.stringify(impressionData.userContext),
      JSON.stringify(impressionData.targeting),
    ];

    const result = await db.query(query, values);
    return this.mapRowToImpression(result.rows[0]);
  }

  static async recordClick(clickData: Omit<AdClick, 'id' | 'clickedAt'>): Promise<AdClick> {
    const query = `
      INSERT INTO ad_clicks (
        impression_id, campaign_id, user_id, destination_url, conversion_tracked
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      clickData.impressionId,
      clickData.campaignId,
      clickData.userId,
      clickData.destinationUrl,
      clickData.conversionTracked || false,
    ];

    const result = await db.query(query, values);
    
    // Update campaign metrics
    await this.updateCampaignMetrics(clickData.campaignId);
    
    return this.mapRowToClick(result.rows[0]);
  }

  static async recordConversion(conversionData: Omit<AdConversion, 'id' | 'convertedAt'>): Promise<AdConversion> {
    const query = `
      INSERT INTO ad_conversions (
        click_id, campaign_id, user_id, conversion_type, 
        conversion_value, conversion_data
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      conversionData.clickId,
      conversionData.campaignId,
      conversionData.userId,
      conversionData.conversionType,
      conversionData.conversionValue,
      JSON.stringify(conversionData.conversionData),
    ];

    const result = await db.query(query, values);
    
    // Update campaign metrics
    await this.updateCampaignMetrics(conversionData.campaignId);
    
    return this.mapRowToConversion(result.rows[0]);
  }

  static async getCampaignAnalytics(
    campaignId: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    overview: AdvertisingCampaign['metrics'];
    dailyBreakdown: Array<{
      date: string;
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
    }>;
    audienceInsights: {
      topDemographics: any[];
      topInterests: any[];
      deviceBreakdown: any[];
    };
  }> {
    // Get campaign overview
    const campaign = await this.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get daily breakdown
    let dateFilter = '';
    const values = [campaignId];
    if (dateRange) {
      dateFilter = 'AND DATE(ai.timestamp) BETWEEN $2 AND $3';
      values.push(dateRange.start, dateRange.end);
    }

    const dailyQuery = `
      SELECT 
        DATE(ai.timestamp) as date,
        COUNT(ai.id)::int as impressions,
        COUNT(ac.id)::int as clicks,
        COUNT(conv.id)::int as conversions,
        0 as spend -- TODO: Calculate actual spend
      FROM ad_impressions ai
      LEFT JOIN ad_clicks ac ON ai.id = ac.impression_id
      LEFT JOIN ad_conversions conv ON ac.id = conv.click_id
      WHERE ai.campaign_id = $1 ${dateFilter}
      GROUP BY DATE(ai.timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyResult = await db.query(dailyQuery, values);

    return {
      overview: campaign.metrics,
      dailyBreakdown: dailyResult.rows,
      audienceInsights: {
        topDemographics: [], // TODO: Implement demographic analysis
        topInterests: [], // TODO: Implement interest analysis
        deviceBreakdown: [], // TODO: Implement device analysis
      },
    };
  }

  static async getTargetingRecommendations(
    advertiserId: string,
    campaignType: string
  ): Promise<{
    recommendedAudiences: any[];
    suggestedBudget: { min: number; max: number; recommended: number };
    estimatedReach: number;
    competitorInsights: any[];
  }> {
    // This would normally analyze platform data to provide recommendations
    // For now, return mock recommendations
    return {
      recommendedAudiences: [
        {
          name: 'Fashion Enthusiasts 18-35',
          size: 15000,
          interests: ['fashion', 'style', 'shopping'],
          expectedCtr: 2.3,
        },
        {
          name: 'Sustainable Fashion Advocates',
          size: 8500,
          interests: ['sustainable fashion', 'eco-friendly', 'ethical brands'],
          expectedCtr: 3.1,
        },
      ],
      suggestedBudget: {
        min: 500,
        max: 5000,
        recommended: 1500,
      },
      estimatedReach: 12000,
      competitorInsights: [],
    };
  }

  private static async updateCampaignMetrics(campaignId: string): Promise<void> {
    const metricsQuery = `
      SELECT 
        COUNT(DISTINCT ai.id)::int as impressions,
        COUNT(DISTINCT ac.id)::int as clicks,
        COUNT(DISTINCT conv.id)::int as conversions,
        COALESCE(SUM(conv.conversion_value), 0)::decimal as total_conversion_value
      FROM ad_impressions ai
      LEFT JOIN ad_clicks ac ON ai.id = ac.impression_id
      LEFT JOIN ad_conversions conv ON ac.id = conv.click_id
      WHERE ai.campaign_id = $1
    `;

    const result = await db.query(metricsQuery, [campaignId]);
    const metrics = result.rows[0];

    const impressions = metrics.impressions || 0;
    const clicks = metrics.clicks || 0;
    const conversions = metrics.conversions || 0;
    const totalValue = parseFloat(metrics.total_conversion_value || '0');

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    const updateQuery = `
      UPDATE advertising_campaigns 
      SET metrics = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(metrics, '{impressions}', $2::text::jsonb),
            '{clicks}', $3::text::jsonb
          ),
          '{conversions}', $4::text::jsonb
        ),
        '{ctr}', $5::text::jsonb
      )
      WHERE id = $1
    `;

    await db.query(updateQuery, [campaignId, impressions, clicks, conversions, ctr.toFixed(2)]);
  }

  private static mapRowToCampaign(row: any): AdvertisingCampaign {
    return {
      id: row.id,
      advertiserId: row.advertiser_id,
      campaignName: row.campaign_name,
      campaignType: row.campaign_type,
      status: row.status,
      budget: row.budget,
      targeting: row.targeting,
      creativeAssets: row.creative_assets,
      placements: row.placements || [],
      schedule: row.schedule,
      metrics: row.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToImpression(row: any): AdImpression {
    return {
      id: row.id,
      campaignId: row.campaign_id,
      userId: row.user_id,
      adPlacement: row.ad_placement,
      timestamp: row.timestamp,
      userContext: row.user_context,
      targeting: row.targeting,
    };
  }

  private static mapRowToClick(row: any): AdClick {
    return {
      id: row.id,
      impressionId: row.impression_id,
      campaignId: row.campaign_id,
      userId: row.user_id,
      clickedAt: row.clicked_at,
      destinationUrl: row.destination_url,
      conversionTracked: row.conversion_tracked,
    };
  }

  private static mapRowToConversion(row: any): AdConversion {
    return {
      id: row.id,
      clickId: row.click_id,
      campaignId: row.campaign_id,
      userId: row.user_id,
      conversionType: row.conversion_type,
      conversionValue: parseFloat(row.conversion_value),
      conversionData: row.conversion_data,
      convertedAt: row.converted_at,
    };
  }
}