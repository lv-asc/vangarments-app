export interface OutfitItem {
    vufsItemId: string;
    position: OutfitPosition;
    layerOrder: number;
}
export type OutfitPosition = 'headwear' | 'eyewear' | 'jewelry_neck' | 'jewelry_ears' | 'top_base' | 'top_mid' | 'top_outer' | 'bottom' | 'footwear' | 'accessories' | 'bag';
export interface Outfit {
    id: string;
    userId: string;
    name: string;
    description?: string;
    items: OutfitItem[];
    occasion: OutfitOccasion;
    season: Season;
    style: string[];
    colorPalette: string[];
    isPublic: boolean;
    isFavorite: boolean;
    wearCount: number;
    lastWorn?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type OutfitOccasion = 'casual' | 'work' | 'formal' | 'party' | 'date' | 'workout' | 'travel' | 'special_event' | 'everyday';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all_season';
export interface OutfitSuggestion {
    id: string;
    baseItemId: string;
    suggestedItems: {
        itemId: string;
        position: OutfitPosition;
        confidence: number;
        reason: string;
    }[];
    styleScore: number;
    colorHarmony: number;
    occasionMatch: number;
    overallScore: number;
    explanation: string;
}
export interface StyleRecommendation {
    outfitId?: string;
    recommendationType: 'complete_outfit' | 'missing_piece' | 'alternative_item' | 'seasonal_update';
    suggestions: {
        itemId?: string;
        position: OutfitPosition;
        description: string;
        reasoning: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    styleInsights: {
        dominantStyle: string;
        colorAnalysis: string;
        fitAnalysis: string;
        improvements: string[];
    };
}
export interface OutfitAnalysis {
    outfitId: string;
    scores: {
        colorHarmony: number;
        styleCoherence: number;
        occasionAppropriate: number;
        seasonalFit: number;
        overall: number;
    };
    insights: {
        strengths: string[];
        improvements: string[];
        missingPieces: string[];
        alternativeSuggestions: string[];
    };
    colorAnalysis: {
        dominantColors: string[];
        colorScheme: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'mixed';
        harmony: number;
    };
    styleAnalysis: {
        dominantStyles: string[];
        coherence: number;
        mixedStylesWorking: boolean;
    };
}
export interface OutfitPhoto {
    id: string;
    outfitId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    location?: string;
    isProfilePhoto: boolean;
    likes: number;
    createdAt: Date;
}
export interface OutfitFilters {
    occasion?: OutfitOccasion;
    season?: Season;
    style?: string[];
    colors?: string[];
    hasItem?: string;
    isPublic?: boolean;
    isFavorite?: boolean;
    userId?: string;
    search?: string;
}
export interface SizeRecommendation {
    itemId: string;
    userMeasurements: {
        height: number;
        weight: number;
        sizes: Record<string, string>;
    };
    itemSizing: {
        brand: string;
        sizeChart: Record<string, any>;
        fit: string;
    };
    recommendation: {
        recommendedSize: string;
        confidence: number;
        reasoning: string;
        fitPrediction: 'too_small' | 'perfect' | 'slightly_loose' | 'too_large';
        alternatives?: string[];
    };
}
export type OutfitCreationStep = 'select_base_item' | 'add_complementary_items' | 'adjust_styling' | 'review_outfit' | 'save_outfit';
export interface OutfitCreationSession {
    id: string;
    userId: string;
    currentStep: OutfitCreationStep;
    pinnedItem?: string;
    selectedItems: OutfitItem[];
    preferences: {
        occasion?: OutfitOccasion;
        season?: Season;
        style?: string[];
    };
    suggestions: OutfitSuggestion[];
    createdAt: Date;
    expiresAt: Date;
}
//# sourceMappingURL=outfit.d.ts.map