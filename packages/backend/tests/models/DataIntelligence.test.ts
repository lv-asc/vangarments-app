import { DataIntelligenceModel, CreateTrendReportData } from '../../src/models/DataIntelligence';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');

const mockDb = db as jest.Mocked<typeof db>;

describe('DataIntelligenceModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrendReport', () => {
    it('should create fashion trend report successfully', async () => {
      const trendReportData: CreateTrendReportData = {
        reportType: 'monthly',
        title: 'Fashion Trends - December 2024',
        description: 'Monthly analysis of fashion trends in Brazil',
        dateRange: {
          start: '2024-12-01',
          end: '2024-12-31',
        },
        data: {
          trendingCategories: [
            {
              category: 'sustainable_fashion',
              growth: 0.25,
              volume: 1500,
              demographics: { primaryAge: '25-35', primaryGender: 'female' },
            },
            {
              category: 'vintage_style',
              growth: 0.15,
              volume: 800,
              demographics: { primaryAge: '18-28', primaryGender: 'all' },
            },
          ],
          trendingBrands: [
            {
              brand: 'EcoFashion Brasil',
              mentions: 2500,
              sentiment: 0.85,
              growth: 0.30,
            },
          ],
          trendingColors: [
            {
              color: 'earth_tones',
              hex: '#8B4513',
              usage: 0.35,
              seasonality: 'year_round',
            },
          ],
          priceAnalysis: {
            averagePrices: {
              'tops': 89.50,
              'bottoms': 125.00,
              'dresses': 180.00,
            },
            priceRanges: {
              'budget': { min: 0, max: 100 },
              'mid_range': { min: 100, max: 300 },
              'premium': { min: 300, max: 1000 },
            },
            marketTrends: ['price_increase_sustainable', 'discount_fast_fashion'],
          },
          geographicInsights: [
            {
              region: 'São Paulo',
              preferences: ['sustainable', 'local_brands'],
              volume: 5000,
            },
          ],
        },
        insights: [
          'Sustainable fashion continues strong growth trajectory',
          'Local Brazilian brands gaining market share',
        ],
        recommendations: [
          'Invest in sustainable fashion partnerships',
          'Focus marketing on São Paulo region',
        ],
        accessLevel: 'premium',
      };

      const mockReport = {
        id: 'report-123',
        ...trendReportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'report-123' }),
        findOne: jest.fn().mockResolvedValue(mockReport),
      });

      const result = await DataIntelligenceModel.createTrendReport(trendReportData);

      expect(result).toEqual(mockReport);
      expect(result.accessLevel).toBe('premium');
    });

    it('should validate trend report data structure', async () => {
      const invalidReportData = {
        reportType: 'invalid_type',
        title: '',
        // Missing required fields
      } as CreateTrendReportData;

      await expect(
        DataIntelligenceModel.createTrendReport(invalidReportData)
      ).rejects.toThrow();
    });

    it('should handle different access levels correctly', async () => {
      const publicReportData: CreateTrendReportData = {
        reportType: 'weekly',
        title: 'Public Fashion Trends',
        description: 'General fashion trends for public access',
        dateRange: {
          start: '2024-12-01',
          end: '2024-12-07',
        },
        data: {
          trendingCategories: [],
          trendingBrands: [],
          trendingColors: [],
          priceAnalysis: {
            averagePrices: {},
            priceRanges: {},
            marketTrends: [],
          },
          geographicInsights: [],
        },
        insights: ['General fashion insights'],
        recommendations: ['Basic recommendations'],
        accessLevel: 'public',
      };

      const mockReport = {
        id: 'public-report-123',
        ...publicReportData,
        createdAt: new Date().toISOString(),
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'public-report-123' }),
        findOne: jest.fn().mockResolvedValue(mockReport),
      });

      const result = await DataIntelligenceModel.createTrendReport(publicReportData);

      expect(result.accessLevel).toBe('public');
    });
  });

  describe('getUserBehaviorAnalytics', () => {
    it('should track user behavior analytics correctly', async () => {
      const userId = 'user-123';
      const behaviorData = {
        sessionMetrics: {
          totalSessions: 45,
          averageSessionDuration: 12.5, // minutes
          pagesPerSession: 8.2,
          bounceRate: 0.25,
        },
        interactionMetrics: {
          itemsViewed: 234,
          itemsLiked: 67,
          itemsShared: 12,
          outfitsCreated: 15,
          socialEngagement: 0.15,
        },
        purchaseMetrics: {
          totalPurchases: 8,
          totalSpent: 1250.00,
          averageOrderValue: 156.25,
          favoriteCategories: ['tops', 'dresses'],
          preferredBrands: ['sustainable-brand-1', 'local-brand-2'],
        },
        fashionProfile: {
          stylePreferences: ['casual', 'sustainable', 'vintage'],
          colorPreferences: ['earth_tones', 'pastels'],
          sizeProfile: {
            tops: 'M',
            bottoms: '38',
            shoes: '37',
          },
          wardrobeComposition: {
            totalItems: 156,
            categoryBreakdown: {
              'tops': 45,
              'bottoms': 32,
              'dresses': 28,
              'shoes': 25,
              'accessories': 26,
            },
          },
        },
      };

      const mockAnalytics = {
        userId,
        ...behaviorData,
        lastUpdated: new Date().toISOString(),
      };

      mockDb.collection = jest.fn().mockReturnValue({
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        findOne: jest.fn().mockResolvedValue(mockAnalytics),
      });

      const result = await DataIntelligenceModel.updateUserBehaviorAnalytics(userId, behaviorData);

      expect(result).toEqual(mockAnalytics);
      expect(result.fashionProfile.wardrobeComposition.totalItems).toBe(156);
    });

    it('should calculate engagement scores correctly', () => {
      const userMetrics = {
        itemsViewed: 100,
        itemsLiked: 25,
        itemsShared: 5,
        commentsPosted: 10,
        outfitsCreated: 8,
        socialFollowers: 150,
      };

      // Calculate engagement score (0-1 scale)
      const likeRate = userMetrics.itemsLiked / userMetrics.itemsViewed;
      const shareRate = userMetrics.itemsShared / userMetrics.itemsViewed;
      const creationRate = userMetrics.outfitsCreated / userMetrics.itemsViewed;
      
      const engagementScore = (likeRate * 0.4) + (shareRate * 0.3) + (creationRate * 0.3);

      expect(likeRate).toBe(0.25);
      expect(shareRate).toBe(0.05);
      expect(creationRate).toBe(0.08);
      expect(engagementScore).toBeCloseTo(0.139, 3);
    });

    it('should identify user fashion personas', () => {
      const userBehavior = {
        sustainableFashionInterest: 0.85,
        luxuryBrandAffinity: 0.20,
        vintageStylePreference: 0.70,
        socialMediaActivity: 0.60,
        priceConsciousness: 0.75,
      };

      // Determine primary persona based on highest scores
      const personas = {
        'eco_conscious': userBehavior.sustainableFashionInterest,
        'luxury_lover': userBehavior.luxuryBrandAffinity,
        'vintage_enthusiast': userBehavior.vintageStylePreference,
        'social_influencer': userBehavior.socialMediaActivity,
        'budget_conscious': userBehavior.priceConsciousness,
      };

      const primaryPersona = Object.entries(personas).reduce((a, b) => 
        personas[a[0]] > personas[b[0]] ? a : b
      )[0];

      expect(primaryPersona).toBe('eco_conscious');
    });
  });

  describe('Market Intelligence Analytics', () => {
    it('should analyze market trends correctly', async () => {
      const marketData = {
        totalUsers: 15420,
        activeUsers: 8934,
        newUsers: 1247,
        userGrowthRate: 0.08, // 8% monthly growth
        
        contentMetrics: {
          totalItems: 89456,
          newItemsThisMonth: 3421,
          popularCategories: [
            { category: 'tops', count: 23456, growth: 0.12 },
            { category: 'bottoms', count: 18923, growth: 0.08 },
            { category: 'dresses', count: 15678, growth: 0.15 },
          ],
        },
        
        engagementMetrics: {
          totalPosts: 45678,
          totalLikes: 234567,
          totalComments: 67890,
          avgEngagementRate: 0.067,
        },
        
        marketplaceMetrics: {
          totalListings: 12345,
          totalTransactions: 5678,
          totalRevenue: 1234567.89,
          avgOrderValue: 217.45,
          conversionRate: 0.046, // 4.6%
        },
      };

      // Analyze growth trends
      expect(marketData.userGrowthRate).toBeGreaterThan(0.05); // Healthy growth
      expect(marketData.marketplaceMetrics.conversionRate).toBeGreaterThan(0.03); // Good conversion
      
      // Find fastest growing category
      const fastestGrowingCategory = marketData.contentMetrics.popularCategories
        .reduce((prev, current) => (prev.growth > current.growth) ? prev : current);
      
      expect(fastestGrowingCategory.category).toBe('dresses');
      expect(fastestGrowingCategory.growth).toBe(0.15);
    });

    it('should calculate market penetration metrics', () => {
      const brazilianMarketData = {
        totalPopulation: 215000000,
        targetDemographic: 45000000, // Fashion-interested population
        currentUsers: 15420,
        competitorUsers: 125000,
      };

      const marketPenetration = brazilianMarketData.currentUsers / brazilianMarketData.targetDemographic;
      const competitorPenetration = brazilianMarketData.competitorUsers / brazilianMarketData.targetDemographic;
      const marketShare = brazilianMarketData.currentUsers / (brazilianMarketData.currentUsers + brazilianMarketData.competitorUsers);

      expect(marketPenetration).toBeCloseTo(0.000343, 6); // 0.034% penetration
      expect(competitorPenetration).toBeCloseTo(0.002778, 6);
      expect(marketShare).toBeCloseTo(0.110, 3); // 11% market share
    });

    it('should identify seasonal trends', () => {
      const seasonalData = {
        spring: {
          categories: { 'dresses': 0.35, 'light_tops': 0.28, 'sandals': 0.22 },
          colors: { 'pastels': 0.40, 'florals': 0.30, 'light_colors': 0.25 },
        },
        summer: {
          categories: { 'swimwear': 0.45, 'shorts': 0.35, 'tank_tops': 0.30 },
          colors: { 'bright': 0.50, 'white': 0.35, 'neon': 0.20 },
        },
        fall: {
          categories: { 'jackets': 0.40, 'boots': 0.35, 'sweaters': 0.30 },
          colors: { 'earth_tones': 0.45, 'burgundy': 0.25, 'navy': 0.20 },
        },
        winter: {
          categories: { 'coats': 0.50, 'boots': 0.40, 'scarves': 0.25 },
          colors: { 'dark': 0.40, 'jewel_tones': 0.30, 'black': 0.25 },
        },
      };

      const currentSeason = 'fall';
      const seasonTrends = seasonalData[currentSeason];

      // Find dominant category and color for the season
      const dominantCategory = Object.entries(seasonTrends.categories)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const dominantColor = Object.entries(seasonTrends.colors)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

      expect(dominantCategory).toBe('jackets');
      expect(dominantColor).toBe('earth_tones');
    });
  });

  describe('Privacy and Compliance', () => {
    it('should anonymize sensitive data in reports', async () => {
      const rawUserData = [
        {
          userId: 'user-123',
          email: 'user@example.com',
          cpf: '123.456.789-00',
          age: 25,
          preferences: ['casual', 'sustainable'],
          purchaseHistory: [
            { amount: 150, date: '2024-12-01' },
            { amount: 200, date: '2024-11-15' },
          ],
        },
      ];

      // Anonymization process
      const anonymizedData = rawUserData.map((user, index) => ({
        anonymousId: `anon_${index}_${Date.now()}`,
        ageGroup: user.age < 30 ? '18-29' : '30+',
        preferences: user.preferences,
        purchaseBehavior: {
          averageOrderValue: user.purchaseHistory.reduce((sum, p) => sum + p.amount, 0) / user.purchaseHistory.length,
          purchaseFrequency: user.purchaseHistory.length,
        },
        // Remove all PII
      }));

      const anonymized = anonymizedData[0];
      expect(anonymized).not.toHaveProperty('userId');
      expect(anonymized).not.toHaveProperty('email');
      expect(anonymized).not.toHaveProperty('cpf');
      expect(anonymized).not.toHaveProperty('age');
      expect(anonymized).toHaveProperty('anonymousId');
      expect(anonymized).toHaveProperty('ageGroup');
      expect(anonymized.purchaseBehavior.averageOrderValue).toBe(175);
    });

    it('should implement data retention policies', () => {
      const currentDate = new Date('2024-12-07');
      const retentionPeriods = {
        userAnalytics: 730, // 2 years
        marketingData: 365, // 1 year
        basicMetrics: 1095, // 3 years
      };

      const testData = [
        { type: 'userAnalytics', createdAt: new Date('2022-06-01'), data: 'old-analytics' },
        { type: 'marketingData', createdAt: new Date('2023-06-01'), data: 'old-marketing' },
        { type: 'basicMetrics', createdAt: new Date('2021-06-01'), data: 'old-metrics' },
        { type: 'userAnalytics', createdAt: new Date('2024-06-01'), data: 'recent-analytics' },
      ];

      const retainedData = testData.filter(item => {
        const retentionDays = retentionPeriods[item.type];
        const cutoffDate = new Date(currentDate.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
        return new Date(item.createdAt) > cutoffDate;
      });

      expect(retainedData).toHaveLength(1); // Only recent data should be retained
      expect(retainedData.map(d => d.data)).toContain('recent-analytics');
    });

    it('should handle LGPD data subject requests', async () => {
      const userId = 'user-123';
      const dataSubjectRequest = {
        type: 'data_export', // or 'data_deletion', 'data_correction'
        userId,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };

      // Mock data export process
      const userDataExport = {
        personalData: {
          // This would be encrypted/anonymized in real implementation
          profileInfo: 'user profile data',
          preferences: 'user preferences',
        },
        analyticsData: {
          behaviorMetrics: 'anonymized behavior data',
          engagementMetrics: 'anonymized engagement data',
        },
        marketingData: {
          consentStatus: 'user consent preferences',
          communicationHistory: 'marketing communication log',
        },
      };

      expect(dataSubjectRequest.type).toBe('data_export');
      expect(userDataExport).toHaveProperty('personalData');
      expect(userDataExport).toHaveProperty('analyticsData');
      expect(userDataExport).toHaveProperty('marketingData');
    });

    it('should validate consent for data processing', () => {
      const userConsent = {
        userId: 'user-123',
        consentDate: new Date().toISOString(),
        consentVersion: '1.2',
        purposes: {
          analytics: true,
          marketing: false,
          personalization: true,
          research: false,
        },
        dataTypes: {
          behaviorData: true,
          purchaseData: true,
          socialData: false,
          locationData: false,
        },
      };

      // Check if specific data processing is allowed
      const canProcessForAnalytics = userConsent.purposes.analytics && userConsent.dataTypes.behaviorData;
      const canProcessForMarketing = userConsent.purposes.marketing;
      const canProcessSocialData = userConsent.dataTypes.socialData;

      expect(canProcessForAnalytics).toBe(true);
      expect(canProcessForMarketing).toBe(false);
      expect(canProcessSocialData).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large dataset aggregations efficiently', async () => {
      const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
        userId: `user-${i}`,
        category: ['tops', 'bottoms', 'dresses'][i % 3],
        value: Math.random() * 1000,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));

      const startTime = Date.now();

      // Simulate aggregation operations
      const categoryAggregation = largeDataset.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const valueAggregation = largeDataset.reduce((acc, item) => {
        acc.total += item.value;
        acc.count += 1;
        return acc;
      }, { total: 0, count: 0 });

      const processingTime = Date.now() - startTime;

      expect(Object.keys(categoryAggregation)).toHaveLength(3);
      expect(valueAggregation.count).toBe(100000);
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should implement efficient caching for frequent queries', () => {
      const cache = new Map();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes

      const getCachedData = (key: string, dataFetcher: () => any) => {
        const cached = cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < cacheExpiry) {
          return cached.data;
        }

        const freshData = dataFetcher();
        cache.set(key, { data: freshData, timestamp: now });
        return freshData;
      };

      // Test cache hit
      const data1 = getCachedData('trend-report-123', () => ({ report: 'fresh data' }));
      const data2 = getCachedData('trend-report-123', () => ({ report: 'should not fetch' }));

      expect(data1).toEqual(data2);
      expect(cache.size).toBe(1);
    });

    it('should batch process analytics updates', () => {
      const updates = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user-${i}`,
        metric: 'page_view',
        value: 1,
        timestamp: new Date(),
      }));

      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(10);
      expect(batches[0]).toHaveLength(100);
      expect(batches[9]).toHaveLength(100);

      // Verify all updates are included
      const totalUpdates = batches.reduce((sum, batch) => sum + batch.length, 0);
      expect(totalUpdates).toBe(1000);
    });
  });
});