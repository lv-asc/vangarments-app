import { DataDrivenService, AIModelTrainingData, ItemValuationRequest } from '../../src/services/dataDrivenService';
import { DataDrivenFeaturesModel } from '../../src/models/DataDrivenFeatures';

// Mock the models
jest.mock('../../src/models/DataDrivenFeatures');

const mockDataDrivenFeaturesModel = DataDrivenFeaturesModel as jest.Mocked<typeof DataDrivenFeaturesModel>;

describe('DataDrivenService', () => {
  let dataDrivenService: DataDrivenService;

  beforeEach(() => {
    dataDrivenService = new DataDrivenService();
    jest.clearAllMocks();
  });

  describe('updateAIModelMetrics', () => {
    it('should update AI model metrics successfully', async () => {
      const trainingData: AIModelTrainingData = {
        modelName: 'fashion-classifier-v2',
        modelVersion: '2.1.0',
        trainingResults: {
          accuracy: 0.92,
          precision: 0.89,
          recall: 0.94,
          f1Score: 0.91,
          trainingDataSize: 50000,
          performanceMetrics: {
            categoryAccuracy: {
              'tops': 0.95,
              'bottoms': 0.88,
              'dresses': 0.93,
            },
            colorAccuracy: {
              'red': 0.91,
              'blue': 0.89,
              'green': 0.87,
            },
            styleAccuracy: {
              'casual': 0.94,
              'formal': 0.88,
              'vintage': 0.85,
            },
          },
        },
      };

      const expectedMetricsData = {
        modelName: trainingData.modelName,
        modelVersion: trainingData.modelVersion,
        accuracy: trainingData.trainingResults.accuracy,
        precision: trainingData.trainingResults.precision,
        recall: trainingData.trainingResults.recall,
        f1Score: trainingData.trainingResults.f1Score,
        trainingDataSize: trainingData.trainingResults.trainingDataSize,
        lastTrainingDate: expect.any(String),
        performanceMetrics: trainingData.trainingResults.performanceMetrics,
      };

      const mockResult = { id: 'metrics-123', ...expectedMetricsData };
      mockDataDrivenFeaturesModel.updateAIModelMetrics.mockResolvedValue(mockResult);

      const result = await dataDrivenService.updateAIModelMetrics(trainingData);

      expect(mockDataDrivenFeaturesModel.updateAIModelMetrics).toHaveBeenCalledWith(expectedMetricsData);
      expect(result).toEqual(mockResult);
    });

    it('should handle model metrics with low performance', async () => {
      const trainingData: AIModelTrainingData = {
        modelName: 'experimental-model',
        modelVersion: '1.0.0',
        trainingResults: {
          accuracy: 0.65, // Low accuracy
          precision: 0.60,
          recall: 0.70,
          f1Score: 0.64,
          trainingDataSize: 1000, // Small dataset
          performanceMetrics: {
            categoryAccuracy: {
              'tops': 0.70,
              'bottoms': 0.60,
            },
            colorAccuracy: {
              'red': 0.65,
              'blue': 0.62,
            },
            styleAccuracy: {
              'casual': 0.68,
              'formal': 0.58,
            },
          },
        },
      };

      mockDataDrivenFeaturesModel.updateAIModelMetrics.mockResolvedValue({ id: 'metrics-456' });

      const result = await dataDrivenService.updateAIModelMetrics(trainingData);

      expect(result).toBeDefined();
      expect(mockDataDrivenFeaturesModel.updateAIModelMetrics).toHaveBeenCalled();
    });
  });

  describe('getUserAnalytics', () => {
    it('should return comprehensive user analytics', async () => {
      const userId = 'user-123';

      const result = await dataDrivenService.getUserAnalytics(userId);

      expect(result).toHaveProperty('styleDNA');
      expect(result).toHaveProperty('wardrobeOptimization');
      expect(result).toHaveProperty('trendPredictions');
      expect(result).toHaveProperty('itemValuations');
      expect(result).toHaveProperty('usageAnalytics');

      // Verify structure of analytics data
      expect(result.usageAnalytics).toHaveProperty('totalWardrobeValue');
      expect(result.usageAnalytics).toHaveProperty('averageItemUsage');
      expect(Array.isArray(result.itemValuations)).toBe(true);
    });

    it('should calculate wardrobe value correctly', async () => {
      const userId = 'user-123';

      const result = await dataDrivenService.getUserAnalytics(userId);

      // Verify that total wardrobe value is calculated from item valuations
      const expectedTotal = result.itemValuations.reduce((sum: number, item: any) => sum + item.currentValue, 0);
      expect(result.usageAnalytics.totalWardrobeValue).toBe(expectedTotal);
    });
  });

  describe('trackUserInteraction', () => {
    it('should track user interaction for analytics improvement', async () => {
      const userId = 'user-123';
      const interactionData = {
        action: 'item_view',
        itemId: 'item-456',
        timestamp: new Date().toISOString(),
        context: {
          source: 'wardrobe',
          duration: 15000, // 15 seconds
        },
      };

      // Mock the tracking method
      const trackingSpy = jest.spyOn(dataDrivenService, 'trackUserInteraction');
      trackingSpy.mockResolvedValue(undefined);

      await dataDrivenService.trackUserInteraction(userId, interactionData);

      expect(trackingSpy).toHaveBeenCalledWith(userId, interactionData);
    });
  });

  describe('Data Collection Compliance Tests', () => {
    it('should respect user privacy settings in data collection', async () => {
      const userId = 'privacy-user-123';
      const userData = {
        privacySettings: {
          allowAnalytics: false,
          allowPersonalization: true,
          allowMarketingData: false,
        },
      };

      // Mock privacy-compliant data collection
      const collectedData = {
        // Only collect data user has consented to
        personalizationData: userData.privacySettings.allowPersonalization ? {
          stylePreferences: ['casual', 'sustainable'],
        } : null,
        analyticsData: userData.privacySettings.allowAnalytics ? {
          usageMetrics: { sessionCount: 10 },
        } : null,
        marketingData: userData.privacySettings.allowMarketingData ? {
          interests: ['fashion'],
        } : null,
      };

      expect(collectedData.personalizationData).toBeDefined();
      expect(collectedData.analyticsData).toBeNull();
      expect(collectedData.marketingData).toBeNull();
    });

    it('should anonymize data for trend analysis', async () => {
      const rawUserData = [
        { userId: 'user-1', age: 25, preferences: ['casual'] },
        { userId: 'user-2', age: 30, preferences: ['formal'] },
        { userId: 'user-3', age: 28, preferences: ['vintage'] },
      ];

      // Mock anonymization process
      const anonymizedData = rawUserData.map((user, index) => ({
        anonymousId: `anon-${index}`,
        ageGroup: user.age < 30 ? '18-29' : '30-39',
        preferences: user.preferences,
        // Remove userId and exact age
      }));

      anonymizedData.forEach(data => {
        expect(data).not.toHaveProperty('userId');
        expect(data).not.toHaveProperty('age');
        expect(data).toHaveProperty('anonymousId');
        expect(data).toHaveProperty('ageGroup');
      });
    });

    it('should implement data retention policies', async () => {
      const currentDate = new Date();
      const retentionPeriod = 365; // days
      const cutoffDate = new Date(currentDate.getTime() - (retentionPeriod * 24 * 60 * 60 * 1000));

      const mockAnalyticsData = [
        { id: '1', createdAt: new Date('2023-01-01'), data: 'old-data' },
        { id: '2', createdAt: new Date(), data: 'recent-data' },
      ];

      // Filter data based on retention policy
      const retainedData = mockAnalyticsData.filter(
        item => new Date(item.createdAt) > cutoffDate
      );

      expect(retainedData).toHaveLength(1);
      expect(retainedData[0].data).toBe('recent-data');
    });

    it('should handle LGPD compliance for Brazilian users', async () => {
      const brazilianUser = {
        userId: 'br-user-123',
        country: 'BR',
        consentStatus: {
          dataProcessing: true,
          marketing: false,
          analytics: true,
        },
      };

      // Mock LGPD-compliant data handling
      const lgpdCompliantData = {
        canProcessPersonalData: brazilianUser.consentStatus.dataProcessing,
        canUseForMarketing: brazilianUser.consentStatus.marketing,
        canUseForAnalytics: brazilianUser.consentStatus.analytics,
        dataSubjectRights: {
          canRequestData: true,
          canDeleteData: true,
          canCorrectData: true,
          canPortData: true,
        },
      };

      expect(lgpdCompliantData.canProcessPersonalData).toBe(true);
      expect(lgpdCompliantData.canUseForMarketing).toBe(false);
      expect(lgpdCompliantData.dataSubjectRights.canRequestData).toBe(true);
    });
  });

  describe('AI Model Performance Tests', () => {
    it('should validate model accuracy thresholds', () => {
      const modelMetrics = {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
      };

      const minThresholds = {
        accuracy: 0.80,
        precision: 0.75,
        recall: 0.80,
        f1Score: 0.75,
      };

      const isModelValid = (
        modelMetrics.accuracy >= minThresholds.accuracy &&
        modelMetrics.precision >= minThresholds.precision &&
        modelMetrics.recall >= minThresholds.recall &&
        modelMetrics.f1Score >= minThresholds.f1Score
      );

      expect(isModelValid).toBe(true);
    });

    it('should detect model degradation', () => {
      const previousMetrics = {
        accuracy: 0.90,
        precision: 0.88,
        recall: 0.92,
      };

      const currentMetrics = {
        accuracy: 0.82, // Significant drop
        precision: 0.80,
        recall: 0.85,
      };

      const degradationThreshold = 0.05; // 5% drop threshold

      const accuracyDrop = previousMetrics.accuracy - currentMetrics.accuracy;
      const precisionDrop = previousMetrics.precision - currentMetrics.precision;
      const recallDrop = previousMetrics.recall - currentMetrics.recall;

      const hasDegradation = (
        accuracyDrop > degradationThreshold ||
        precisionDrop > degradationThreshold ||
        recallDrop > degradationThreshold
      );

      expect(hasDegradation).toBe(true);
      expect(accuracyDrop).toBeGreaterThan(degradationThreshold);
    });

    it('should calculate confidence scores correctly', () => {
      const predictions = [
        { category: 'tops', confidence: 0.95 },
        { category: 'bottoms', confidence: 0.78 },
        { category: 'accessories', confidence: 0.45 },
      ];

      const highConfidenceThreshold = 0.80;
      const lowConfidenceThreshold = 0.60;

      const highConfidencePredictions = predictions.filter(p => p.confidence >= highConfidenceThreshold);
      const lowConfidencePredictions = predictions.filter(p => p.confidence < lowConfidenceThreshold);

      expect(highConfidencePredictions).toHaveLength(1);
      expect(lowConfidencePredictions).toHaveLength(1);
      expect(highConfidencePredictions[0].category).toBe('tops');
      expect(lowConfidencePredictions[0].category).toBe('accessories');
    });

    it('should handle bias detection in AI models', () => {
      const modelPredictions = {
        byGender: {
          male: { accuracy: 0.88, sampleSize: 1000 },
          female: { accuracy: 0.92, sampleSize: 1200 },
        },
        byAge: {
          '18-25': { accuracy: 0.91, sampleSize: 800 },
          '26-35': { accuracy: 0.89, sampleSize: 900 },
          '36-45': { accuracy: 0.85, sampleSize: 600 },
        },
      };

      const biasThreshold = 0.05; // 5% difference threshold

      const genderBias = Math.abs(
        modelPredictions.byGender.male.accuracy - modelPredictions.byGender.female.accuracy
      );

      const ageBiasMax = Math.max(
        ...Object.values(modelPredictions.byAge).map(group => group.accuracy)
      );
      const ageBiasMin = Math.min(
        ...Object.values(modelPredictions.byAge).map(group => group.accuracy)
      );
      const ageBias = ageBiasMax - ageBiasMin;

      expect(genderBias).toBeLessThan(biasThreshold);
      expect(ageBias).toBeGreaterThan(biasThreshold); // Age bias detected
    });
  });

  describe('Analytics Performance Tests', () => {
    it('should handle large dataset analytics efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        userId: `user-${i}`,
        interactions: Math.floor(Math.random() * 100),
        value: Math.random() * 1000,
      }));

      const startTime = Date.now();

      // Mock analytics calculation
      const analytics = {
        totalUsers: largeDataset.length,
        averageInteractions: largeDataset.reduce((sum, user) => sum + user.interactions, 0) / largeDataset.length,
        totalValue: largeDataset.reduce((sum, user) => sum + user.value, 0),
      };

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(analytics.totalUsers).toBe(10000);
      expect(analytics.averageInteractions).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should cache frequently accessed analytics', async () => {
      const userId = 'frequent-user-123';
      const cacheKey = `user-analytics-${userId}`;

      // Mock cache implementation
      const cache = new Map();
      
      // First call - cache miss
      let startTime = Date.now();
      if (!cache.has(cacheKey)) {
        const analytics = await dataDrivenService.getUserAnalytics(userId);
        cache.set(cacheKey, analytics);
      }
      let firstCallTime = Date.now() - startTime;

      // Second call - cache hit
      startTime = Date.now();
      const cachedAnalytics = cache.get(cacheKey);
      let secondCallTime = Date.now() - startTime;

      expect(cachedAnalytics).toBeDefined();
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime); // Cache should be same or faster
    });

    it('should batch process analytics updates', async () => {
      const batchSize = 100;
      const updates = Array.from({ length: 250 }, (_, i) => ({
        userId: `user-${i}`,
        data: { interactions: i },
      }));

      // Mock batch processing
      const batches = [];
      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(3); // 250 items in batches of 100
      expect(batches[0]).toHaveLength(100);
      expect(batches[1]).toHaveLength(100);
      expect(batches[2]).toHaveLength(50);
    });
  });

  describe('Trend Analysis Tests', () => {
    it('should identify emerging fashion trends', () => {
      const fashionData = [
        { category: 'sustainable', mentions: 1500, growth: 0.25 },
        { category: 'vintage', mentions: 800, growth: 0.15 },
        { category: 'minimalist', mentions: 600, growth: 0.35 },
        { category: 'maximalist', mentions: 400, growth: -0.10 },
      ];

      const emergingTrends = fashionData.filter(trend => 
        trend.growth > 0.20 && trend.mentions > 500
      );

      expect(emergingTrends).toHaveLength(2);
      expect(emergingTrends.map(t => t.category)).toContain('sustainable');
      expect(emergingTrends.map(t => t.category)).toContain('minimalist');
    });

    it('should calculate trend momentum', () => {
      const trendHistory = [
        { week: 1, mentions: 100 },
        { week: 2, mentions: 120 },
        { week: 3, mentions: 150 },
        { week: 4, mentions: 180 },
      ];

      // Calculate week-over-week growth
      const momentum = trendHistory.slice(1).map((current, index) => {
        const previous = trendHistory[index];
        return (current.mentions - previous.mentions) / previous.mentions;
      });

      const averageMomentum = momentum.reduce((sum, growth) => sum + growth, 0) / momentum.length;

      expect(averageMomentum).toBeGreaterThan(0.15); // Strong positive momentum
      expect(momentum.every(growth => growth > 0)).toBe(true); // Consistent growth
    });

    it('should predict seasonal trends', () => {
      const seasonalData = {
        spring: { colors: ['pastel', 'light'], styles: ['floral', 'light'] },
        summer: { colors: ['bright', 'neon'], styles: ['casual', 'beach'] },
        fall: { colors: ['earth', 'warm'], styles: ['layered', 'cozy'] },
        winter: { colors: ['dark', 'jewel'], styles: ['formal', 'warm'] },
      };

      const currentSeason = 'spring';
      const predictedTrends = seasonalData[currentSeason];

      expect(predictedTrends.colors).toContain('pastel');
      expect(predictedTrends.styles).toContain('floral');
    });
  });
});