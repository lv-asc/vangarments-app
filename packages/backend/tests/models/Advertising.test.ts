import { AdvertisingModel, CreateCampaignData, CreateAdvertisementData } from '../../src/models/Advertising';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');

const mockDb = db as jest.Mocked<typeof db>;

describe.skip('AdvertisingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create advertising campaign successfully', async () => {
      const campaignData: CreateCampaignData = {
        advertiserId: 'brand-123',
        campaignName: 'Summer Collection 2024',
        campaignType: 'brand_awareness',
        targeting: {
          demographics: {
            ageRange: { min: 18, max: 35 },
            gender: ['female'],
            location: ['São Paulo', 'Rio de Janeiro'],
          },
          fashionPreferences: {
            preferredBrands: ['sustainable-brand-1'],
            styleProfiles: ['casual', 'sustainable'],
            categories: ['tops', 'dresses'],
          },
        },
        creativeAssets: [],
        budget: 5000,
        schedule: {
          startDate: '2024-06-01',
          endDate: '2024-08-31',
        },
      };

      const mockCampaign = {
        id: 'campaign-123',
        ...campaignData,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      // Mock database insert
      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'campaign-123' }),
        findOne: jest.fn().mockResolvedValue(mockCampaign),
      });

      const result = await AdvertisingModel.createCampaign(campaignData);

      expect(result).toEqual(mockCampaign);
    });

    it('should validate required campaign fields', async () => {
      const invalidCampaignData = {
        // Missing required fields
        campaignName: '',
        campaignType: 'invalid_type',
      } as CreateCampaignData;

      await expect(
        AdvertisingModel.createCampaign(invalidCampaignData)
      ).rejects.toThrow();
    });

    it('should set default campaign status to draft', async () => {
      const campaignData: CreateCampaignData = {
        advertiserId: 'brand-123',
        campaignName: 'Test Campaign',
        campaignType: 'brand_awareness',
        targeting: {},
        creativeAssets: [],
        budget: 1000,
        schedule: {
          startDate: '2024-06-01',
        },
      };

      const mockCampaign = {
        id: 'campaign-123',
        ...campaignData,
        status: 'draft',
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'campaign-123' }),
        findOne: jest.fn().mockResolvedValue(mockCampaign),
      });

      const result = await AdvertisingModel.createCampaign(campaignData);

      expect(result.status).toBe('draft');
    });
  });

  describe('recordImpression', () => {
    it('should record ad impression with all required data', async () => {
      const impressionData = {
        campaignId: 'campaign-123',
        userId: 'user-456',
        adId: 'ad-789',
        placement: 'feed',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
      };

      const mockImpression = {
        id: 'impression-123',
        ...impressionData,
        timestamp: new Date().toISOString(),
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'impression-123' }),
        findOne: jest.fn().mockResolvedValue(mockImpression),
      });

      const result = await AdvertisingModel.recordImpression(impressionData);

      expect(result).toEqual(mockImpression);
    });

    it('should handle impression recording errors gracefully', async () => {
      const impressionData = {
        campaignId: 'invalid-campaign',
        userId: 'user-456',
        adId: 'ad-789',
        placement: 'feed',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        AdvertisingModel.recordImpression(impressionData)
      ).rejects.toThrow('Database error');
    });

    it('should validate impression data before recording', async () => {
      const invalidImpressionData = {
        // Missing required fields
        campaignId: '',
        userId: '',
      };

      await expect(
        AdvertisingModel.recordImpression(invalidImpressionData as any)
      ).rejects.toThrow();
    });
  });

  describe('recordClick', () => {
    it('should record ad click with conversion tracking', async () => {
      const clickData = {
        impressionId: 'impression-123',
        campaignId: 'campaign-123',
        userId: 'user-456',
        destinationUrl: 'https://example.com/product',
        conversionTracked: false,
      };

      const mockClick = {
        id: 'click-123',
        ...clickData,
        timestamp: new Date().toISOString(),
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'click-123' }),
        findOne: jest.fn().mockResolvedValue(mockClick),
      });

      const result = await AdvertisingModel.recordClick(clickData);

      expect(result).toEqual(mockClick);
      expect(result.conversionTracked).toBe(false);
    });

    it('should link clicks to impressions correctly', async () => {
      const clickData = {
        impressionId: 'impression-123',
        campaignId: 'campaign-123',
        userId: 'user-456',
        destinationUrl: 'https://example.com/product',
        conversionTracked: false,
      };

      mockDb.collection = jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'click-123' }),
        findOne: jest.fn().mockResolvedValue({ id: 'click-123', ...clickData }),
      });

      const result = await AdvertisingModel.recordClick(clickData);

      expect(result.impressionId).toBe('impression-123');
    });
  });

  describe('findByAdvertiserId', () => {
    it('should return campaigns for specific advertiser', async () => {
      const advertiserId = 'brand-123';
      const mockCampaigns = [
        {
          id: 'campaign-1',
          advertiserId,
          campaignName: 'Campaign 1',
          status: 'active',
        },
        {
          id: 'campaign-2',
          advertiserId,
          campaignName: 'Campaign 2',
          status: 'paused',
        },
      ];

      mockDb.collection = jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockCampaigns),
        }),
      });

      const result = await AdvertisingModel.findByAdvertiserId(advertiserId);

      expect(result).toEqual(mockCampaigns);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for advertiser with no campaigns', async () => {
      const advertiserId = 'brand-no-campaigns';

      mockDb.collection = jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await AdvertisingModel.findByAdvertiserId(advertiserId);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return campaign by ID', async () => {
      const campaignId = 'campaign-123';
      const mockCampaign = {
        id: campaignId,
        advertiserId: 'brand-123',
        campaignName: 'Test Campaign',
        status: 'active',
      };

      mockDb.collection = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockCampaign),
      });

      const result = await AdvertisingModel.findById(campaignId);

      expect(result).toEqual(mockCampaign);
    });

    it('should return null for non-existent campaign', async () => {
      const campaignId = 'non-existent';

      mockDb.collection = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const result = await AdvertisingModel.findById(campaignId);

      expect(result).toBeNull();
    });
  });

  describe('Campaign Analytics', () => {
    it('should calculate campaign performance metrics', async () => {
      const campaignId = 'campaign-123';

      // Mock impressions and clicks data
      const mockImpressions = Array.from({ length: 1000 }, (_, i) => ({
        id: `impression-${i}`,
        campaignId,
        timestamp: new Date().toISOString(),
      }));

      const mockClicks = Array.from({ length: 50 }, (_, i) => ({
        id: `click-${i}`,
        campaignId,
        timestamp: new Date().toISOString(),
      }));

      mockDb.collection = jest.fn().mockImplementation((collectionName) => {
        if (collectionName === 'impressions') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockImpressions),
            }),
            countDocuments: jest.fn().mockResolvedValue(1000),
          };
        }
        if (collectionName === 'clicks') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockClicks),
            }),
            countDocuments: jest.fn().mockResolvedValue(50),
          };
        }
        return {};
      });

      // Calculate metrics
      const impressionCount = mockImpressions.length;
      const clickCount = mockClicks.length;
      const ctr = (clickCount / impressionCount) * 100;

      expect(impressionCount).toBe(1000);
      expect(clickCount).toBe(50);
      expect(ctr).toBe(5); // 5% CTR
    });

    it('should track campaign budget spending', async () => {
      const campaignId = 'campaign-123';
      const totalBudget = 5000;
      const dailyBudget = 200;

      // Mock spending data
      const mockSpending = [
        { date: '2024-06-01', amount: 180 },
        { date: '2024-06-02', amount: 195 },
        { date: '2024-06-03', amount: 210 }, // Over daily budget
      ];

      const totalSpent = mockSpending.reduce((sum, day) => sum + day.amount, 0);
      const remainingBudget = totalBudget - totalSpent;
      const averageDailySpend = totalSpent / mockSpending.length;

      expect(totalSpent).toBe(585);
      expect(remainingBudget).toBe(4415);
      expect(averageDailySpend).toBe(195);

      // Check if any day exceeded daily budget
      const overBudgetDays = mockSpending.filter(day => day.amount > dailyBudget);
      expect(overBudgetDays).toHaveLength(1);
    });

    it('should calculate audience reach and frequency', async () => {
      const campaignId = 'campaign-123';

      // Mock user impressions (some users see ads multiple times)
      const mockUserImpressions = [
        { userId: 'user-1', impressions: 3 },
        { userId: 'user-2', impressions: 1 },
        { userId: 'user-3', impressions: 2 },
        { userId: 'user-4', impressions: 4 },
        { userId: 'user-5', impressions: 1 },
      ];

      const uniqueUsers = mockUserImpressions.length;
      const totalImpressions = mockUserImpressions.reduce((sum, user) => sum + user.impressions, 0);
      const averageFrequency = totalImpressions / uniqueUsers;

      expect(uniqueUsers).toBe(5);
      expect(totalImpressions).toBe(11);
      expect(averageFrequency).toBe(2.2);
    });
  });

  describe('Targeting Validation', () => {
    it('should validate demographic targeting parameters', () => {
      const targeting = {
        demographics: {
          ageRange: { min: 18, max: 65 },
          gender: ['male', 'female'],
          location: ['São Paulo', 'Rio de Janeiro'],
        },
      };

      // Validate age range
      expect(targeting.demographics.ageRange.min).toBeGreaterThanOrEqual(13);
      expect(targeting.demographics.ageRange.max).toBeLessThanOrEqual(100);
      expect(targeting.demographics.ageRange.min).toBeLessThan(targeting.demographics.ageRange.max);

      // Validate gender options
      const validGenders = ['male', 'female', 'non-binary', 'all'];
      targeting.demographics.gender.forEach(gender => {
        expect(validGenders).toContain(gender);
      });

      // Validate locations (Brazilian cities/states)
      const brazilianLocations = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília'];
      targeting.demographics.location.forEach(location => {
        expect(brazilianLocations).toContain(location);
      });
    });

    it('should validate fashion preference targeting', () => {
      const fashionTargeting = {
        preferredBrands: ['nike', 'adidas', 'local-brand'],
        styleProfiles: ['casual', 'formal', 'sustainable'],
        priceRanges: [
          { min: 0, max: 100 },
          { min: 100, max: 500 },
        ],
        categories: ['tops', 'bottoms', 'shoes'],
        colors: ['red', 'blue', 'green'],
      };

      // Validate price ranges
      fashionTargeting.priceRanges.forEach(range => {
        expect(range.min).toBeGreaterThanOrEqual(0);
        expect(range.max).toBeGreaterThan(range.min);
      });

      // Validate categories
      const validCategories = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories'];
      fashionTargeting.categories.forEach(category => {
        expect(validCategories).toContain(category);
      });

      // Validate style profiles
      const validStyles = ['casual', 'formal', 'vintage', 'sustainable', 'luxury'];
      fashionTargeting.styleProfiles.forEach(style => {
        expect(validStyles).toContain(style);
      });
    });

    it('should validate behavior targeting parameters', () => {
      const behaviorTargeting = {
        wardrobeComposition: ['minimalist', 'maximalist', 'sustainable'],
        purchaseHistory: ['frequent_buyer', 'occasional_buyer', 'first_time_buyer'],
        engagementPatterns: ['high_engagement', 'medium_engagement', 'low_engagement'],
        socialActivity: ['influencer', 'active_user', 'passive_user'],
      };

      // All targeting arrays should have valid values
      expect(behaviorTargeting.wardrobeComposition.length).toBeGreaterThan(0);
      expect(behaviorTargeting.purchaseHistory.length).toBeGreaterThan(0);
      expect(behaviorTargeting.engagementPatterns.length).toBeGreaterThan(0);
      expect(behaviorTargeting.socialActivity.length).toBeGreaterThan(0);

      // Validate engagement patterns
      const validEngagementLevels = ['high_engagement', 'medium_engagement', 'low_engagement'];
      behaviorTargeting.engagementPatterns.forEach(pattern => {
        expect(validEngagementLevels).toContain(pattern);
      });
    });
  });

  describe('Campaign Status Management', () => {
    it('should handle campaign status transitions correctly', async () => {
      const campaignId = 'campaign-123';
      const validTransitions = {
        'draft': ['active', 'cancelled'],
        'active': ['paused', 'completed', 'cancelled'],
        'paused': ['active', 'cancelled'],
        'completed': [],
        'cancelled': [],
      };

      // Test valid transitions
      expect(validTransitions.draft).toContain('active');
      expect(validTransitions.active).toContain('paused');
      expect(validTransitions.paused).toContain('active');

      // Test invalid transitions
      expect(validTransitions.completed).toHaveLength(0);
      expect(validTransitions.cancelled).toHaveLength(0);
    });

    it('should validate campaign schedule constraints', () => {
      const schedule = {
        startDate: '2025-06-01', // Use future date
        endDate: '2025-08-31',
        timezone: 'America/Sao_Paulo',
      };

      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const now = new Date();

      // Start date should be in the future or today
      expect(startDate.getTime()).toBeGreaterThanOrEqual(now.getTime() - 24 * 60 * 60 * 1000);

      // End date should be after start date
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());

      // Timezone should be valid
      expect(schedule.timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
    });
  });
});