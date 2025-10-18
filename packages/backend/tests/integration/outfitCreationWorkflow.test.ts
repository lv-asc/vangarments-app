// Integration test for outfit creation workflow services
import { OutfitStylingService } from '../../src/services/outfitStylingService';
import { PhotographyGuidanceService } from '../../src/services/photographyGuidanceService';
import { VUFSCatalogModel } from '../../src/models/VUFSCatalog';
import { ApparelItem, FootwearItem } from '@vangarments/shared/types/vufs';
import { OutfitItem } from '@vangarments/shared/types/outfit';

// Mock the catalog model
jest.mock('../../src/models/VUFSCatalog');

const mockVUFSCatalogModel = VUFSCatalogModel as jest.Mocked<typeof VUFSCatalogModel>;

describe('Outfit Creation Workflow Integration', () => {
  const mockShirt: ApparelItem = {
    id: 'shirt-1',
    owner: 'user-1',
    brand: 'Nike®',
    pieceType: 'Shirts',
    color: 'Blue',
    gender: 'Unisex',
    size: 'M',
    style: ['Casual', 'Athleisure'],
    material: ['Cotton'],
    fit: 'Regular'
  };

  const mockPants: ApparelItem = {
    id: 'pants-1',
    owner: 'user-1',
    brand: 'Levi\'s®',
    pieceType: 'Jeans',
    color: 'Blue',
    gender: 'Unisex',
    size: 'M',
    style: ['Casual'],
    material: ['Denim'],
    fit: 'Slim'
  };

  const mockShoes: FootwearItem = {
    id: 'shoes-1',
    owner: 'user-1',
    brand: 'Adidas®',
    shoeType: 'Sneakers',
    color: 'White',
    gender: 'Unisex',
    size: '9'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup catalog model mocks
    mockVUFSCatalogModel.findById.mockImplementation((id) => {
      const items = {
        'shirt-1': { id: 'shirt-1', item: mockShirt },
        'pants-1': { id: 'pants-1', item: mockPants },
        'shoes-1': { id: 'shoes-1', item: mockShoes }
      };
      return Promise.resolve(items[id as keyof typeof items] || null);
    });

    mockVUFSCatalogModel.search.mockResolvedValue({
      items: [
        { id: 'pants-1', item: mockPants },
        { id: 'shoes-1', item: mockShoes }
      ],
      total: 2
    });
  });

  describe('Outfit Styling Service Integration', () => {
    it('should generate outfit suggestions using real service logic', async () => {
      const suggestions = await OutfitStylingService.generateOutfitSuggestions(
        'shirt-1',
        'user-1',
        { occasion: 'casual', season: 'spring' }
      );

      expect(suggestions).toHaveLength(5);
      expect(suggestions[0]).toMatchObject({
        id: expect.any(String),
        baseItemId: 'shirt-1',
        suggestedItems: expect.any(Array),
        styleScore: expect.any(Number),
        colorHarmony: expect.any(Number),
        occasionMatch: expect.any(Number),
        overallScore: expect.any(Number),
        explanation: expect.any(String)
      });

      // Verify suggestions are sorted by score
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].overallScore).toBeGreaterThanOrEqual(
          suggestions[i + 1].overallScore
        );
      }
    });

    it('should handle missing base item gracefully', async () => {
      mockVUFSCatalogModel.findById.mockResolvedValueOnce(null);

      await expect(
        OutfitStylingService.generateOutfitSuggestions('invalid-id', 'user-1')
      ).rejects.toThrow('Base item not found');
    });
  });

  describe('Outfit Analysis Integration', () => {
    const mockOutfitItems: OutfitItem[] = [
      { vufsItemId: 'shirt-1', position: 'top_base', layerOrder: 0 },
      { vufsItemId: 'pants-1', position: 'bottom', layerOrder: 0 },
      { vufsItemId: 'shoes-1', position: 'footwear', layerOrder: 0 }
    ];

    it('should analyze outfit using real service logic', async () => {
      const analysis = await OutfitStylingService.analyzeOutfit(mockOutfitItems);

      expect(analysis).toMatchObject({
        outfitId: '',
        scores: {
          colorHarmony: expect.any(Number),
          styleCoherence: expect.any(Number),
          occasionAppropriate: expect.any(Number),
          seasonalFit: expect.any(Number),
          overall: expect.any(Number)
        },
        insights: {
          strengths: expect.any(Array),
          improvements: expect.any(Array),
          missingPieces: expect.any(Array),
          alternativeSuggestions: expect.any(Array)
        },
        colorAnalysis: {
          dominantColors: expect.any(Array),
          colorScheme: expect.any(String),
          harmony: expect.any(Number)
        },
        styleAnalysis: {
          dominantStyles: expect.any(Array),
          coherence: expect.any(Number),
          mixedStylesWorking: expect.any(Boolean)
        }
      });

      // Verify scores are within valid range
      expect(analysis.scores.overall).toBeGreaterThanOrEqual(0);
      expect(analysis.scores.overall).toBeLessThanOrEqual(100);
    });

    it('should handle empty outfit items', async () => {
      const analysis = await OutfitStylingService.analyzeOutfit([]);

      expect(analysis.colorAnalysis.dominantColors).toHaveLength(0);
      expect(analysis.styleAnalysis.dominantStyles).toHaveLength(0);
    });
  });

  describe('Size Recommendation Integration', () => {
    const mockUserMeasurements = {
      height: 175,
      weight: 70,
      sizes: { BR: 'M', US: 'M', EU: 'M' }
    };

    it('should generate size recommendation using real service logic', async () => {
      const recommendation = await OutfitStylingService.generateSizeRecommendation(
        'shirt-1',
        mockUserMeasurements
      );

      expect(recommendation).toMatchObject({
        itemId: 'shirt-1',
        userMeasurements: mockUserMeasurements,
        itemSizing: {
          brand: 'Nike®',
          sizeChart: expect.any(Object),
          fit: 'Regular'
        },
        recommendation: {
          recommendedSize: expect.any(String),
          confidence: expect.any(Number),
          reasoning: expect.any(String),
          fitPrediction: expect.any(String)
        }
      });

      expect(recommendation?.recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation?.recommendation.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle invalid item ID', async () => {
      mockVUFSCatalogModel.findById.mockResolvedValueOnce(null);

      const recommendation = await OutfitStylingService.generateSizeRecommendation(
        'invalid-id',
        mockUserMeasurements
      );

      expect(recommendation).toBeNull();
    });
  });

  describe('Style Recommendations Integration', () => {
    const mockOutfitItems: OutfitItem[] = [
      { vufsItemId: 'shirt-1', position: 'top_base', layerOrder: 0 }
    ];

    it('should provide style recommendations using real service logic', async () => {
      const recommendations = await OutfitStylingService.getStyleRecommendations(
        mockOutfitItems,
        'user-1'
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toMatchObject({
        recommendationType: 'missing_piece',
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            position: expect.any(String),
            description: expect.any(String),
            reasoning: expect.any(String),
            priority: expect.any(String)
          })
        ]),
        styleInsights: expect.objectContaining({
          dominantStyles: expect.any(Array),
          coherence: expect.any(Number),
          mixedStylesWorking: expect.any(Boolean)
        })
      });
    });
  });

  describe('Photography Guidance Integration', () => {
    it('should provide photography guidance for apparel items', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      expect(guidance).toMatchObject({
        domain: 'APPAREL',
        itemType: 'Shirts',
        instructions: expect.any(Array),
        totalDuration: expect.any(Number),
        requiredPhotos: expect.any(Array),
        optionalPhotos: expect.any(Array),
        equipmentTips: expect.any(Array),
        lightingTips: expect.any(Array)
      });

      expect(guidance.instructions.length).toBeGreaterThan(0);
      expect(guidance.totalDuration).toBeGreaterThan(0);
    });

    it('should provide photography guidance for footwear items', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');

      expect(guidance).toMatchObject({
        domain: 'FOOTWEAR',
        itemType: 'Sneakers',
        instructions: expect.any(Array),
        totalDuration: 32, // 4 steps × 8 seconds
        requiredPhotos: ['main'],
        optionalPhotos: expect.arrayContaining(['side', 'sole'])
      });
    });

    it('should provide 360-degree photography guidance', () => {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();

      expect(guidance).toHaveLength(2);
      expect(guidance[0]).toMatchObject({
        step: 1,
        title: 'Set Up 360° Photography Space',
        duration: 8,
        tips: expect.any(Array),
        commonMistakes: expect.any(Array)
      });
    });

    it('should provide condition-specific photography tips', () => {
      const lowLightTips = PhotographyGuidanceService.getPhotographyTips('low_light');
      const smallSpaceTips = PhotographyGuidanceService.getPhotographyTips('small_space');

      expect(lowLightTips).toContain('Move closer to a window for natural light');
      expect(smallSpaceTips).toContain('Use a smaller background like a white poster board');
    });
  });

  describe('End-to-End Service Integration Workflow', () => {
    it('should support complete outfit creation workflow using services', async () => {
      // Step 1: Get photography guidance for taking item photos
      const photoGuidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');
      expect(photoGuidance.domain).toBe('APPAREL');
      expect(photoGuidance.instructions.length).toBeGreaterThan(0);

      // Step 2: Generate outfit suggestions based on a pinned item
      const suggestions = await OutfitStylingService.generateOutfitSuggestions(
        'shirt-1',
        'user-1',
        { occasion: 'casual' }
      );
      expect(suggestions).toHaveLength(5);

      // Step 3: Analyze the created outfit
      const outfitItems: OutfitItem[] = [
        { vufsItemId: 'shirt-1', position: 'top_base', layerOrder: 0 },
        { vufsItemId: 'pants-1', position: 'bottom', layerOrder: 0 },
        { vufsItemId: 'shoes-1', position: 'footwear', layerOrder: 0 }
      ];

      const analysis = await OutfitStylingService.analyzeOutfit(outfitItems);
      expect(analysis.scores.overall).toBeGreaterThan(0);

      // Step 4: Get style recommendations for improvement
      const recommendations = await OutfitStylingService.getStyleRecommendations(
        [{ vufsItemId: 'shirt-1', position: 'top_base', layerOrder: 0 }],
        'user-1'
      );
      expect(recommendations).toHaveLength(1);

      // Step 5: Get size recommendation for a specific item
      const sizeRecommendation = await OutfitStylingService.generateSizeRecommendation(
        'shirt-1',
        { height: 175, weight: 70, sizes: { BR: 'M' } }
      );
      expect(sizeRecommendation?.recommendation.recommendedSize).toBeTruthy();
    });

    it('should handle service integration errors gracefully', async () => {
      // Test error handling in outfit suggestions with invalid item
      mockVUFSCatalogModel.findById.mockResolvedValueOnce(null);

      await expect(
        OutfitStylingService.generateOutfitSuggestions('invalid-id', 'user-1')
      ).rejects.toThrow('Base item not found');

      // Test error handling in size recommendations with invalid item
      await expect(
        OutfitStylingService.generateSizeRecommendation('invalid-id', {})
      ).resolves.toBeNull();
    });
  });
});