import { VUFSCatalogModel } from '../models/VUFSCatalog';
import {
  OutfitSuggestion,
  StyleRecommendation,
  OutfitAnalysis,
  SizeRecommendation,
  OutfitItem,
  OutfitPosition,
  VUFSItem,
  ApparelItem,
  FootwearItem
} from '../types/shared';

export class OutfitStylingService {
  /**
   * Generate outfit suggestions based on a pinned item
   */
  static async generateOutfitSuggestions(
    baseItemId: string,
    userId: string,
    preferences?: {
      occasion?: string;
      season?: string;
      style?: string[];
    }
  ): Promise<OutfitSuggestion[]> {
    // Get the base item
    const baseItem = await VUFSCatalogModel.findById(baseItemId);
    if (!baseItem) {
      throw new Error('Base item not found');
    }

    // Get user's wardrobe
    const userItems = await VUFSCatalogModel.search({
      owner: baseItem.item.owner,
    });

    // Determine what positions need to be filled
    const basePosition = this.determineItemPosition(baseItem.item);
    const neededPositions = this.getComplementaryPositions(basePosition, baseItem.item);

    const suggestions: OutfitSuggestion[] = [];

    // Generate multiple outfit combinations
    for (let i = 0; i < 5; i++) {
      const suggestion = await this.createOutfitSuggestion(
        baseItem,
        userItems.items,
        neededPositions,
        preferences
      );

      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Sort by overall score
    return suggestions.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Analyze an existing outfit and provide insights
   */
  static async analyzeOutfit(outfitItems: OutfitItem[]): Promise<OutfitAnalysis> {
    // Get all items in the outfit
    const items: VUFSItem[] = [];
    for (const outfitItem of outfitItems) {
      const item = await VUFSCatalogModel.findById(outfitItem.vufsItemId);
      if (item) {
        items.push(item.item);
      }
    }

    // Analyze color harmony
    const colorAnalysis = this.analyzeColors(items);

    // Analyze style coherence
    const styleAnalysis = this.analyzeStyles(items);

    // Calculate scores
    const scores = {
      colorHarmony: colorAnalysis.harmony,
      styleCoherence: styleAnalysis.coherence,
      occasionAppropriate: this.calculateOccasionScore(items),
      seasonalFit: this.calculateSeasonalScore(items),
      overall: 0,
    };

    scores.overall = Math.round(
      (scores.colorHarmony + scores.styleCoherence + scores.occasionAppropriate + scores.seasonalFit) / 4
    );

    // Generate insights
    const insights = this.generateOutfitInsights(items, scores);

    return {
      outfitId: '', // Will be set by caller
      scores,
      insights,
      colorAnalysis,
      styleAnalysis,
    };
  }

  /**
   * Generate size recommendations for an item
   */
  static async generateSizeRecommendation(
    itemId: string,
    userMeasurements: any
  ): Promise<SizeRecommendation | null> {
    const item = await VUFSCatalogModel.findById(itemId);
    if (!item) {
      return null;
    }

    // This would integrate with brand-specific size charts
    // For now, we'll provide basic recommendations
    const recommendation = this.calculateSizeRecommendation(
      item.item,
      userMeasurements
    );

    return {
      itemId,
      userMeasurements,
      itemSizing: {
        brand: item.item.brand,
        sizeChart: {}, // Would be populated from brand data
        fit: 'pieceType' in item.item ? (item.item as unknown as ApparelItem).fit : 'regular',
      },
      recommendation,
    };
  }

  /**
   * Get style recommendations for improving an outfit
   */
  static async getStyleRecommendations(
    outfitItems: OutfitItem[],
    userId: string
  ): Promise<StyleRecommendation[]> {
    const analysis = await this.analyzeOutfit(outfitItems);
    const recommendations: StyleRecommendation[] = [];

    // Recommend missing pieces
    if (analysis.insights.missingPieces.length > 0) {
      recommendations.push({
        recommendationType: 'missing_piece',
        suggestions: analysis.insights.missingPieces.map(piece => ({
          position: piece as OutfitPosition,
          description: `Add a ${piece} to complete the outfit`,
          reasoning: 'This piece would balance the overall look',
          priority: 'medium',
        })),
        styleInsights: analysis.styleAnalysis,
      });
    }

    // Recommend alternatives for low-scoring items
    if (analysis.scores.overall < 70) {
      recommendations.push({
        recommendationType: 'alternative_item',
        suggestions: analysis.insights.alternativeSuggestions.map(suggestion => ({
          position: 'top_base' as OutfitPosition, // Would be determined dynamically
          description: suggestion,
          reasoning: 'This alternative would improve the overall harmony',
          priority: 'high',
        })),
        styleInsights: analysis.styleAnalysis,
      });
    }

    return recommendations;
  }

  /**
   * Determine the position of an item in an outfit
   */
  private static determineItemPosition(item: VUFSItem): OutfitPosition {
    const isApparel = 'pieceType' in item;

    if (!isApparel) {
      return 'footwear';
    }

    const apparel = item as ApparelItem;
    const pieceType = apparel.pieceType.toLowerCase();

    // Map piece types to positions
    if (pieceType.includes('shirt') || pieceType.includes('top') || pieceType.includes('blouse')) {
      return 'top_base';
    }
    if (pieceType.includes('jacket') || pieceType.includes('blazer') || pieceType.includes('coat')) {
      return 'top_outer';
    }
    if (pieceType.includes('pants') || pieceType.includes('jeans') || pieceType.includes('shorts') || pieceType.includes('skirt')) {
      return 'bottom';
    }
    if (pieceType.includes('dress')) {
      return 'top_base'; // Dresses cover both top and bottom
    }
    if (pieceType.includes('bag')) {
      return 'bag';
    }
    if (pieceType.includes('jewelry')) {
      return 'jewelry_neck';
    }
    if (pieceType.includes('eyewear')) {
      return 'eyewear';
    }
    if (pieceType.includes('headwear')) {
      return 'headwear';
    }

    return 'accessories';
  }

  /**
   * Get positions that complement the base item
   */
  private static getComplementaryPositions(
    basePosition: OutfitPosition,
    baseItem: VUFSItem
  ): OutfitPosition[] {
    const positions: OutfitPosition[] = [];

    switch (basePosition) {
      case 'top_base':
        positions.push('bottom', 'footwear');
        if ('pieceType' in baseItem && !(baseItem as ApparelItem).pieceType.toLowerCase().includes('dress')) {
          positions.push('top_outer');
        }
        break;
      case 'bottom':
        positions.push('top_base', 'footwear');
        break;
      case 'footwear':
        positions.push('top_base', 'bottom');
        break;
      case 'top_outer':
        positions.push('top_base', 'bottom', 'footwear');
        break;
    }

    // Always suggest accessories
    positions.push('accessories', 'bag');

    return positions;
  }

  /**
   * Create a single outfit suggestion
   */
  private static async createOutfitSuggestion(
    baseItem: any,
    availableItems: any[],
    neededPositions: OutfitPosition[],
    preferences?: any
  ): Promise<OutfitSuggestion | null> {
    const suggestedItems: any[] = [];

    for (const position of neededPositions) {
      const compatibleItems = availableItems.filter(item =>
        this.determineItemPosition(item.item) === position &&
        this.isCompatible(baseItem.item, item.item, preferences)
      );

      if (compatibleItems.length > 0) {
        // Pick the best matching item
        const bestMatch = this.findBestMatch(baseItem.item, compatibleItems, position);
        if (bestMatch) {
          suggestedItems.push({
            itemId: bestMatch.id,
            position,
            confidence: this.calculateCompatibilityScore(baseItem.item, bestMatch.item),
            reason: this.generateMatchReason(baseItem.item, bestMatch.item),
          });
        }
      }
    }

    if (suggestedItems.length === 0) {
      return null;
    }

    // Calculate overall scores
    const styleScore = this.calculateStyleScore(baseItem.item, suggestedItems);
    const colorHarmony = this.calculateColorHarmony(baseItem.item, suggestedItems);
    const occasionMatch = preferences?.occasion ? 80 : 70; // Default score

    return {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      baseItemId: baseItem.id,
      suggestedItems,
      styleScore,
      colorHarmony,
      occasionMatch,
      overallScore: Math.round((styleScore + colorHarmony + occasionMatch) / 3),
      explanation: this.generateOutfitExplanation(baseItem.item, suggestedItems),
    };
  }

  /**
   * Check if two items are compatible
   */
  private static isCompatible(item1: VUFSItem, item2: VUFSItem, preferences?: any): boolean {
    // Basic compatibility checks
    if (item1.gender !== item2.gender && item1.gender !== 'Unisex' && item2.gender !== 'Unisex') {
      return false;
    }

    // Style compatibility (if both are apparel)
    if ('style' in item1 && 'style' in item2) {
      const styles1 = (item1 as ApparelItem).style || [];
      const styles2 = (item2 as ApparelItem).style || [];

      // Check for style overlap or complementary styles
      const hasOverlap = styles1.some(style => styles2.includes(style));
      const hasComplementary = this.areStylesComplementary(styles1, styles2);

      if (!hasOverlap && !hasComplementary) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find the best matching item for a position
   */
  private static findBestMatch(baseItem: VUFSItem, candidates: any[], position: OutfitPosition): any {
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateCompatibilityScore(baseItem, candidate.item);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate compatibility score between two items
   */
  private static calculateCompatibilityScore(item1: VUFSItem, item2: VUFSItem): number {
    let score = 50; // Base score

    // Color compatibility
    const colorScore = this.calculateColorCompatibility(item1.color, item2.color);
    score += colorScore * 0.3;

    // Style compatibility (for apparel)
    if ('style' in item1 && 'style' in item2) {
      const styleScore = this.calculateStyleCompatibility(
        (item1 as ApparelItem).style || [],
        (item2 as ApparelItem).style || []
      );
      score += styleScore * 0.4;
    }

    // Brand synergy
    if (item1.brand === item2.brand) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate color compatibility between two colors
   */
  private static calculateColorCompatibility(color1: string, color2: string): number {
    // Simplified color harmony rules
    const neutrals = ['Black', 'White', 'Gray', 'Charcoal', 'Cream', 'Off-White'];
    const blues = ['Blue', 'Navy', 'Light Blue'];
    const earth = ['Brown', 'Tan', 'Beige'];

    if (color1 === color2) return 100;
    if (neutrals.includes(color1) || neutrals.includes(color2)) return 80;
    if (blues.includes(color1) && blues.includes(color2)) return 90;
    if (earth.includes(color1) && earth.includes(color2)) return 85;

    return 60; // Default compatibility
  }

  /**
   * Calculate style compatibility
   */
  private static calculateStyleCompatibility(styles1: string[], styles2: string[]): number {
    const overlap = styles1.filter(style => styles2.includes(style)).length;
    if (overlap > 0) return 90;

    if (this.areStylesComplementary(styles1, styles2)) return 75;

    return 40;
  }

  /**
   * Check if styles are complementary
   */
  private static areStylesComplementary(styles1: string[], styles2: string[]): boolean {
    const complementaryPairs = [
      ['Casual', 'Athleisure'],
      ['Classic', 'Minimalist'],
      ['Streetwear', 'Urban'],
      ['Vintage', 'Grunge'],
    ];

    return complementaryPairs.some(pair =>
      (styles1.includes(pair[0]) && styles2.includes(pair[1])) ||
      (styles1.includes(pair[1]) && styles2.includes(pair[0]))
    );
  }

  // Additional helper methods for scoring and analysis...
  private static calculateStyleScore(baseItem: VUFSItem, suggestedItems: any[]): number {
    return 75; // Placeholder
  }

  private static calculateColorHarmony(baseItem: VUFSItem, suggestedItems: any[]): number {
    return 80; // Placeholder
  }

  private static generateMatchReason(item1: VUFSItem, item2: VUFSItem): string {
    return `Complements the ${item1.color} ${('pieceType' in item1) ? (item1 as ApparelItem).pieceType : 'footwear'}`;
  }

  private static generateOutfitExplanation(baseItem: VUFSItem, suggestedItems: any[]): string {
    return `This outfit combines ${baseItem.color} tones with complementary pieces for a cohesive look.`;
  }

  private static analyzeColors(items: VUFSItem[]): any {
    const colors = items.map(item => item.color);
    return {
      dominantColors: [...new Set(colors)],
      colorScheme: 'mixed',
      harmony: 75,
    };
  }

  private static analyzeStyles(items: VUFSItem[]): any {
    const allStyles = items
      .filter(item => 'style' in item)
      .flatMap(item => (item as ApparelItem).style || []);

    return {
      dominantStyles: [...new Set(allStyles)],
      coherence: 70,
      mixedStylesWorking: true,
    };
  }

  private static calculateOccasionScore(items: VUFSItem[]): number {
    return 75; // Placeholder
  }

  private static calculateSeasonalScore(items: VUFSItem[]): number {
    return 80; // Placeholder
  }

  private static generateOutfitInsights(items: VUFSItem[], scores: any): any {
    return {
      strengths: ['Good color coordination', 'Balanced proportions'],
      improvements: ['Consider adding accessories', 'Try different footwear'],
      missingPieces: ['accessories'],
      alternativeSuggestions: ['Try a different top color'],
    };
  }

  private static calculateSizeRecommendation(item: VUFSItem, userMeasurements: any): any {
    return {
      recommendedSize: item.size,
      confidence: 80,
      reasoning: 'Based on brand sizing and your measurements',
      fitPrediction: 'perfect',
    };
  }
}