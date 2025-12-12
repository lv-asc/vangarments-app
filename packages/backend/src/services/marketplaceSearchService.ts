import { MarketplaceModel } from '../models/Marketplace';
import { MarketplaceEnhancedModel } from '../models/MarketplaceEnhanced';
import { VUFSCatalogModel } from '../models/VUFSCatalog';
import { MarketplaceFilters, MarketplaceListing } from '../types/shared';

export interface SearchSuggestion {
  type: 'brand' | 'category' | 'style' | 'color';
  value: string;
  count: number;
}

export interface MarketplaceRecommendation {
  type: 'similar_items' | 'price_drop' | 'trending' | 'recently_viewed' | 'saved_search';
  title: string;
  description: string;
  listings: MarketplaceListing[];
  priority: number;
}

export class MarketplaceSearchService {
  /**
   * Enhanced search with VUFS integration
   */
  static async enhancedSearch(
    filters: MarketplaceFilters,
    userId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    listings: MarketplaceListing[];
    total: number;
    suggestions: SearchSuggestion[];
    recommendations: MarketplaceRecommendation[];
  }> {
    // Get basic search results
    const searchResult = await MarketplaceEnhancedModel.searchListings(filters, limit, offset);

    // Generate search suggestions
    const suggestions = await this.generateSearchSuggestions(filters);

    // Generate personalized recommendations
    const recommendations = userId
      ? await this.generateRecommendations(userId, filters)
      : await this.generateTrendingRecommendations();

    return {
      ...searchResult,
      suggestions,
      recommendations,
    };
  }

  /**
   * Get similar items based on VUFS attributes
   */
  static async findSimilarItems(
    itemId: string,
    limit: number = 10
  ): Promise<MarketplaceListing[]> {
    // Get the VUFS item details
    const vufsItem = await VUFSCatalogModel.findById(itemId);
    if (!vufsItem) {
      return [];
    }

    const item = vufsItem.item;

    // Search for items with similar attributes
    const filters: MarketplaceFilters = {
      brand: item.brand,
      // Add more VUFS-specific filters based on item type
    };

    if ('pieceType' in item) {
      filters.category = (item as any).pieceType;
    }

    const result = await MarketplaceModel.searchListings(filters, limit);

    // Filter out the original item and sort by similarity
    return result.listings
      .filter(listing => listing.itemId !== itemId)
      .slice(0, limit);
  }

  /**
   * Get trending items based on views, likes, and recent activity
   */
  static async getTrendingItems(
    category?: string,
    limit: number = 20
  ): Promise<MarketplaceListing[]> {
    const filters: MarketplaceFilters = {
      sortBy: 'most_watched',
    };

    if (category) {
      filters.category = category;
    }

    const result = await MarketplaceEnhancedModel.searchListings(filters, limit);
    return result.listings;
  }

  /**
   * Get price history and market analysis for an item
   */
  static async getMarketAnalysis(itemId: string): Promise<{
    averagePrice: number;
    priceRange: { min: number; max: number };
    recentSales: number;
    marketTrend: 'rising' | 'stable' | 'falling';
    confidence: number;
  }> {
    // This would analyze historical sales data
    // For now, return mock data
    return {
      averagePrice: 150,
      priceRange: { min: 80, max: 250 },
      recentSales: 5,
      marketTrend: 'stable',
      confidence: 75,
    };
  }

  /**
   * Generate search suggestions based on current filters
   */
  private static async generateSearchSuggestions(
    filters: MarketplaceFilters
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Brand suggestions
    if (!filters.brand) {
      suggestions.push(
        { type: 'brand', value: 'Nike®', count: 45 },
        { type: 'brand', value: 'Adidas®', count: 38 },
        { type: 'brand', value: 'Zara®', count: 32 }
      );
    }

    // Category suggestions
    if (!filters.category) {
      suggestions.push(
        { type: 'category', value: 'Sneakers', count: 67 },
        { type: 'category', value: 'Jackets', count: 23 },
        { type: 'category', value: 'Jeans', count: 19 }
      );
    }

    // Style suggestions
    suggestions.push(
      { type: 'style', value: 'Streetwear', count: 28 },
      { type: 'style', value: 'Vintage', count: 15 },
      { type: 'style', value: 'Minimalist', count: 12 }
    );

    return suggestions;
  }

  /**
   * Generate personalized recommendations
   */
  private static async generateRecommendations(
    userId: string,
    currentFilters: MarketplaceFilters
  ): Promise<MarketplaceRecommendation[]> {
    const recommendations: MarketplaceRecommendation[] = [];

    // Similar items recommendation
    if (currentFilters.search) {
      const similarItems = await this.getTrendingItems(currentFilters.category, 5);
      recommendations.push({
        type: 'similar_items',
        title: 'Similar Items',
        description: 'Items similar to what you\'re looking for',
        listings: similarItems,
        priority: 1,
      });
    }

    // Trending recommendation
    const trendingItems = await this.getTrendingItems(undefined, 5);
    recommendations.push({
      type: 'trending',
      title: 'Trending Now',
      description: 'Popular items other users are viewing',
      listings: trendingItems,
      priority: 2,
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate trending recommendations for non-authenticated users
   */
  private static async generateTrendingRecommendations(): Promise<MarketplaceRecommendation[]> {
    const trendingItems = await this.getTrendingItems(undefined, 8);

    return [
      {
        type: 'trending',
        title: 'Trending Items',
        description: 'Popular items in the marketplace',
        listings: trendingItems,
        priority: 1,
      }
    ];
  }

  /**
   * Auto-complete search suggestions
   */
  static async getAutocompleteSuggestions(
    query: string,
    limit: number = 10
  ): Promise<{
    brands: string[];
    categories: string[];
    items: { title: string; id: string }[];
  }> {
    const queryLower = query.toLowerCase();

    // Mock data - in production this would query the database
    const brands = [
      'Nike®', 'Adidas®', 'Zara®', 'H&M', 'Uniqlo®', 'Puma®', 'Vans®'
    ].filter(brand => brand.toLowerCase().includes(queryLower)).slice(0, limit);

    const categories = [
      'Sneakers', 'Jackets', 'Jeans', 'T-Shirts', 'Dresses', 'Boots'
    ].filter(cat => cat.toLowerCase().includes(queryLower)).slice(0, limit);

    // This would search actual listings
    const items: { title: string; id: string }[] = [];

    return { brands, categories, items };
  }

  /**
   * Get saved searches for a user
   */
  static async getSavedSearches(userId: string): Promise<{
    id: string;
    name: string;
    filters: MarketplaceFilters;
    alertsEnabled: boolean;
    newResults: number;
    createdAt: Date;
  }[]> {
    // This would query saved_searches table
    // For now, return empty array
    return [];
  }

  /**
   * Save a search for future alerts
   */
  static async saveSearch(
    userId: string,
    name: string,
    filters: MarketplaceFilters,
    alertsEnabled: boolean = true
  ): Promise<string> {
    // This would save to saved_searches table
    // For now, return mock ID
    return 'search_' + Date.now();
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(): Promise<{
    totalListings: number;
    totalSellers: number;
    averagePrice: number;
    topCategories: { category: string; count: number }[];
    recentActivity: {
      newListings: number;
      soldItems: number;
      activeUsers: number;
    };
  }> {
    // Get real data from the enhanced model
    return await MarketplaceEnhancedModel.getMarketplaceStats();
  }

  /**
   * Get personalized feed for user
   */
  static async getPersonalizedFeed(
    userId: string,
    limit: number = 20
  ): Promise<{
    recommendations: MarketplaceRecommendation[];
    newListings: MarketplaceListing[];
    priceDrops: MarketplaceListing[];
    endingSoon: MarketplaceListing[];
  }> {
    // Get user's preferences and history to personalize feed
    const recommendations = await this.generateRecommendations(userId, {});

    // Get new listings in user's preferred categories
    const newListings = await this.getTrendingItems(undefined, limit);

    // Mock price drops and ending soon - would be real data in production
    const priceDrops: MarketplaceListing[] = [];
    const endingSoon: MarketplaceListing[] = [];

    return {
      recommendations,
      newListings,
      priceDrops,
      endingSoon,
    };
  }

  /**
   * Advanced filtering with VUFS attributes
   */
  static async advancedVUFSSearch(vufsFilters: {
    domain?: 'APPAREL' | 'FOOTWEAR';
    brand?: string;
    pieceType?: string;
    color?: string;
    material?: string;
    style?: string[];
    fit?: string;
    size?: string;
  }): Promise<MarketplaceListing[]> {
    // This would join marketplace_listings with vufs_catalog
    // and filter based on VUFS attributes

    const filters: MarketplaceFilters = {};

    if (vufsFilters.brand) filters.brand = vufsFilters.brand;
    if (vufsFilters.pieceType) filters.category = vufsFilters.pieceType;
    if (vufsFilters.color) filters.color = vufsFilters.color;
    if (vufsFilters.size) filters.size = vufsFilters.size;

    const result = await MarketplaceEnhancedModel.searchListings(filters, 50);
    return result.listings;
  }

  /**
   * Real-time price tracking and market value display
   */
  static async getRealTimePricing(itemId: string): Promise<{
    currentPrice: number;
    marketValue: number;
    priceHistory: { date: Date; price: number }[];
    priceChange24h: number;
    priceChange7d: number;
    volatility: 'low' | 'medium' | 'high';
    lastUpdated: Date;
  }> {
    // Get current listing price
    const listing = await MarketplaceModel.findById(itemId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Get market analysis for historical data
    const analysis = await this.getMarketAnalysis(listing.itemId);

    // Calculate price changes (mock data for now)
    const priceHistory = [
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), price: listing.price * 0.95 },
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), price: listing.price * 0.97 },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), price: listing.price * 0.98 },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), price: listing.price * 1.02 },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), price: listing.price * 1.01 },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), price: listing.price * 0.99 },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), price: listing.price * 1.03 },
      { date: new Date(), price: listing.price },
    ];

    const priceChange24h = ((listing.price - priceHistory[6].price) / priceHistory[6].price) * 100;
    const priceChange7d = ((listing.price - priceHistory[0].price) / priceHistory[0].price) * 100;

    // Calculate volatility based on price variance
    const prices = priceHistory.map(p => p.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const volatility = variance > 100 ? 'high' : variance > 25 ? 'medium' : 'low';

    return {
      currentPrice: listing.price,
      marketValue: analysis.averagePrice,
      priceHistory,
      priceChange24h,
      priceChange7d,
      volatility,
      lastUpdated: new Date(),
    };
  }

  /**
   * Automatic model matching for items
   */
  static async getAutomaticModelMatching(itemId: string): Promise<{
    matches: {
      confidence: number;
      vufsItem: any;
      marketListing?: MarketplaceListing;
      officialRetailPrice?: number;
      brandCatalogId?: string;
    }[];
    bestMatch?: {
      confidence: number;
      vufsItem: any;
      marketListing?: MarketplaceListing;
    };
  }> {
    // Get the VUFS item details
    const vufsItem = await VUFSCatalogModel.findById(itemId);
    if (!vufsItem) {
      return { matches: [] };
    }

    const item = vufsItem.item;

    // Search for similar items in the catalog
    const { items: similarItems } = await VUFSCatalogModel.search({
      brand: item.brand,
      domain: vufsItem.domain,
      // Add more specific matching criteria based on item type
    }, 10);

    const matches = [];

    for (const similarItem of similarItems) {
      if (similarItem.id === itemId) continue;

      // Calculate confidence based on attribute matching
      let confidence = 0;

      // Brand match (high weight)
      if (similarItem.item.brand === item.brand) confidence += 30;

      // Type/category match
      if ('pieceType' in similarItem.item && 'pieceType' in item) {
        if ((similarItem.item as any).pieceType === (item as any).pieceType) {
          confidence += 25;
        }
      }

      // Color match
      if ('color' in similarItem.item && 'color' in item) {
        if ((similarItem.item as any).color === (item as any).color) {
          confidence += 15;
        }
      }

      // Material match
      if ('material' in similarItem.item && 'material' in item) {
        if ((similarItem.item as any).material === (item as any).material) {
          confidence += 10;
        }
      }

      // Size match
      if ('size' in similarItem.item && 'size' in item) {
        if ((similarItem.item as any).size === (item as any).size) {
          confidence += 20;
        }
      }

      if (confidence >= 50) { // Only include high-confidence matches
        // Check if this item has marketplace listings
        const marketListings = await MarketplaceModel.searchListings({
          // Search by VUFS item ID would require database join
        }, 1);

        matches.push({
          confidence,
          vufsItem: similarItem,
          marketListing: marketListings.listings[0] || undefined,
          officialRetailPrice: undefined, // Would come from brand catalog
          brandCatalogId: undefined, // Would come from brand integration
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return {
      matches,
      bestMatch: matches.length > 0 ? matches[0] : undefined,
    };
  }

  /**
   * Build recommendation engine for similar items
   */
  static async getRecommendationEngine(
    userId?: string,
    itemId?: string,
    filters?: MarketplaceFilters
  ): Promise<{
    personalizedRecommendations: MarketplaceListing[];
    trendingRecommendations: MarketplaceListing[];
    similarItemRecommendations: MarketplaceListing[];
    priceBasedRecommendations: MarketplaceListing[];
    brandRecommendations: MarketplaceListing[];
  }> {
    const recommendations = {
      personalizedRecommendations: [] as MarketplaceListing[],
      trendingRecommendations: [] as MarketplaceListing[],
      similarItemRecommendations: [] as MarketplaceListing[],
      priceBasedRecommendations: [] as MarketplaceListing[],
      brandRecommendations: [] as MarketplaceListing[],
    };

    // Get trending items
    recommendations.trendingRecommendations = await this.getTrendingItems(undefined, 10);

    // If itemId provided, get similar items
    if (itemId) {
      recommendations.similarItemRecommendations = await this.findSimilarItems(itemId, 10);
    }

    // If filters provided, get price-based recommendations
    if (filters?.priceRange) {
      const priceBasedFilters = {
        ...filters,
        priceRange: {
          min: Math.max(0, filters.priceRange.min * 0.8),
          max: filters.priceRange.max * 1.2,
        },
      };
      const priceBasedResult = await MarketplaceEnhancedModel.searchListings(priceBasedFilters, 10);
      recommendations.priceBasedRecommendations = priceBasedResult.listings;
    }

    // Brand-based recommendations
    if (filters?.brand) {
      const brandResult = await MarketplaceEnhancedModel.searchListings({
        brand: filters.brand,
        sortBy: 'most_watched',
      }, 10);
      recommendations.brandRecommendations = brandResult.listings;
    }

    // Personalized recommendations for authenticated users
    if (userId) {
      // This would analyze user's purchase history, viewed items, and preferences
      // For now, return trending items as personalized
      recommendations.personalizedRecommendations = recommendations.trendingRecommendations.slice(0, 5);
    }

    return recommendations;
  }

  /**
   * Advanced search with backend search service integration
   */
  static async advancedBackendSearch(searchParams: {
    query?: string;
    filters: MarketplaceFilters;
    facets?: string[];
    boost?: Record<string, number>;
    userId?: string;
  }): Promise<{
    listings: MarketplaceListing[];
    total: number;
    facets: Record<string, { value: string; count: number }[]>;
    searchTime: number;
    suggestions: string[];
  }> {
    const startTime = Date.now();

    // Enhanced search with faceted results
    const searchResult = await MarketplaceEnhancedModel.searchListings(
      searchParams.filters,
      50,
      0
    );

    // Generate facets for filtering
    const facets: Record<string, { value: string; count: number }[]> = {};

    if (searchParams.facets?.includes('brand')) {
      facets.brand = [
        { value: 'Nike®', count: 45 },
        { value: 'Adidas®', count: 38 },
        { value: 'Zara®', count: 32 },
        { value: 'H&M', count: 28 },
      ];
    }

    if (searchParams.facets?.includes('category')) {
      facets.category = [
        { value: 'Sneakers', count: 67 },
        { value: 'Jackets', count: 23 },
        { value: 'Jeans', count: 19 },
        { value: 'T-Shirts', count: 15 },
      ];
    }

    if (searchParams.facets?.includes('condition')) {
      facets.condition = [
        { value: 'new', count: 89 },
        { value: 'excellent', count: 156 },
        { value: 'good', count: 78 },
        { value: 'fair', count: 23 },
      ];
    }

    if (searchParams.facets?.includes('price')) {
      facets.price = [
        { value: '0-50', count: 45 },
        { value: '50-100', count: 67 },
        { value: '100-200', count: 89 },
        { value: '200+', count: 34 },
      ];
    }

    // Generate search suggestions
    const suggestions = searchParams.query
      ? await this.generateSearchSuggestions(searchParams.filters)
      : [];

    const searchTime = Date.now() - startTime;

    return {
      listings: searchResult.listings,
      total: searchResult.total,
      facets,
      searchTime,
      suggestions: suggestions.map(s => s.value),
    };
  }
}