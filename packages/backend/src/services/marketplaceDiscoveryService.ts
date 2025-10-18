import { MarketplaceEnhancedModel } from '../models/MarketplaceEnhanced';
import { VUFSCatalogModel } from '../models/VUFSCatalog';
import { MarketplaceFilters, MarketplaceListing } from '@vangarments/shared';
import { db } from '../database/connection';

export interface SearchSuggestion {
  type: 'brand' | 'category' | 'style' | 'color' | 'material';
  value: string;
  count: number;
  confidence: number;
}

export interface DiscoveryRecommendation {
  type: 'trending' | 'similar_style' | 'price_match' | 'brand_match' | 'recently_viewed' | 'saved_search';
  title: string;
  description: string;
  listings: MarketplaceListing[];
  priority: number;
  metadata?: any;
}

export interface SearchFacet {
  field: string;
  label: string;
  values: {
    value: string;
    label: string;
    count: number;
    selected?: boolean;
  }[];
}

export interface AdvancedSearchResult {
  listings: MarketplaceListing[];
  total: number;
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  recommendations: DiscoveryRecommendation[];
  searchTime: number;
  query: {
    original: string;
    processed: string;
    filters: MarketplaceFilters;
  };
}

export class MarketplaceDiscoveryService {
  /**
   * Advanced search with real-time facets and suggestions
   */
  static async advancedSearch(
    query: string,
    filters: MarketplaceFilters,
    userId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdvancedSearchResult> {
    const startTime = Date.now();

    // Process the search query
    const processedQuery = this.processSearchQuery(query);
    const enhancedFilters = { ...filters, search: processedQuery };

    // Get search results
    const searchResult = await MarketplaceEnhancedModel.searchListings(
      enhancedFilters,
      limit,
      offset
    );

    // Generate facets based on current results
    const facets = await this.generateSearchFacets(enhancedFilters, searchResult.listings);

    // Generate search suggestions
    const suggestions = await this.generateSearchSuggestions(query, filters);

    // Generate personalized recommendations
    const recommendations = userId 
      ? await this.generatePersonalizedRecommendations(userId, enhancedFilters, searchResult.listings)
      : await this.generateGeneralRecommendations(enhancedFilters, searchResult.listings);

    const searchTime = Date.now() - startTime;

    return {
      listings: searchResult.listings,
      total: searchResult.total,
      facets,
      suggestions,
      recommendations,
      searchTime,
      query: {
        original: query,
        processed: processedQuery,
        filters: enhancedFilters,
      },
    };
  }

  /**
   * Get trending items with real data analysis
   */
  static async getTrendingItems(
    category?: string,
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 20
  ): Promise<MarketplaceListing[]> {
    const timeframeHours = {
      day: 24,
      week: 168,
      month: 720,
    };

    const query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain,
             (ml.views * 0.4 + ml.likes * 0.3 + ml.watchers * 0.3) as trending_score
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND ml.created_at >= NOW() - INTERVAL '${timeframeHours[timeframe]} hours'
        ${category ? 'AND ml.category = $1' : ''}
      ORDER BY trending_score DESC, ml.created_at DESC
      LIMIT $${category ? '2' : '1'}
    `;

    const values = category ? [category, limit] : [limit];
    const result = await db.query(query, values);

    return result.rows.map(row => this.mapToListing(row));
  }

  /**
   * Find similar items using VUFS data and user behavior
   */
  static async findSimilarItems(
    itemId: string,
    userId?: string,
    limit: number = 10
  ): Promise<MarketplaceListing[]> {
    // Get the reference item
    const referenceListing = await MarketplaceEnhancedModel.findById(itemId);
    if (!referenceListing) {
      return [];
    }

    // Get VUFS data for the reference item
    const vufsItem = await VUFSCatalogModel.findById(referenceListing.itemId);
    if (!vufsItem) {
      return [];
    }

    const item = vufsItem.item;

    // Build similarity query with VUFS attributes
    const query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain,
             (
               CASE WHEN vc.item_data->>'brand' = $1 THEN 30 ELSE 0 END +
               CASE WHEN vc.item_data->>'color' = $2 THEN 20 ELSE 0 END +
               CASE WHEN vc.item_data->>'material' = $3 THEN 15 ELSE 0 END +
               CASE WHEN ml.category = $4 THEN 25 ELSE 0 END +
               CASE WHEN ABS(ml.price - $5) <= ($5 * 0.3) THEN 10 ELSE 0 END
             ) as similarity_score
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND ml.id != $6
        AND vc.domain = $7
      HAVING similarity_score >= 30
      ORDER BY similarity_score DESC, ml.created_at DESC
      LIMIT $8
    `;

    const values = [
      item.brand || '',
      (item as any).color || '',
      (item as any).material || '',
      referenceListing.category,
      referenceListing.price,
      itemId,
      vufsItem.domain,
      limit,
    ];

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToListing(row));
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<DiscoveryRecommendation[]> {
    const recommendations: DiscoveryRecommendation[] = [];

    // Get user's recent activity
    const recentViews = await this.getUserRecentViews(userId, 10);
    const recentLikes = await this.getUserRecentLikes(userId, 5);
    const userPreferences = await this.getUserPreferences(userId);

    // Recommendation 1: Based on recently viewed items
    if (recentViews.length > 0) {
      const similarToViewed = await this.findSimilarToUserActivity(recentViews, 5);
      if (similarToViewed.length > 0) {
        recommendations.push({
          type: 'recently_viewed',
          title: 'Baseado no que você viu recentemente',
          description: 'Itens similares aos que você visualizou',
          listings: similarToViewed,
          priority: 1,
          metadata: { sourceItems: recentViews.length },
        });
      }
    }

    // Recommendation 2: Based on liked items
    if (recentLikes.length > 0) {
      const similarToLiked = await this.findSimilarToUserActivity(recentLikes, 5);
      if (similarToLiked.length > 0) {
        recommendations.push({
          type: 'similar_style',
          title: 'Você pode gostar',
          description: 'Baseado nos itens que você curtiu',
          listings: similarToLiked,
          priority: 2,
          metadata: { sourceItems: recentLikes.length },
        });
      }
    }

    // Recommendation 3: Based on user preferences
    if (userPreferences.preferredBrands.length > 0) {
      const brandRecommendations = await this.getRecommendationsByBrands(
        userPreferences.preferredBrands,
        5
      );
      if (brandRecommendations.length > 0) {
        recommendations.push({
          type: 'brand_match',
          title: 'Das suas marcas favoritas',
          description: `Novos itens de ${userPreferences.preferredBrands.slice(0, 2).join(', ')}`,
          listings: brandRecommendations,
          priority: 3,
          metadata: { brands: userPreferences.preferredBrands },
        });
      }
    }

    // Recommendation 4: Price range matches
    if (userPreferences.priceRange) {
      const priceMatches = await this.getRecommendationsByPriceRange(
        userPreferences.priceRange,
        5
      );
      if (priceMatches.length > 0) {
        recommendations.push({
          type: 'price_match',
          title: 'Na sua faixa de preço',
          description: `Itens entre R$ ${userPreferences.priceRange.min} e R$ ${userPreferences.priceRange.max}`,
          listings: priceMatches,
          priority: 4,
          metadata: { priceRange: userPreferences.priceRange },
        });
      }
    }

    // Add trending items as fallback
    const trending = await this.getTrendingItems(undefined, 'week', 5);
    if (trending.length > 0) {
      recommendations.push({
        type: 'trending',
        title: 'Em alta esta semana',
        description: 'Os itens mais populares do momento',
        listings: trending,
        priority: 5,
        metadata: { timeframe: 'week' },
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate search facets based on current results
   */
  private static async generateSearchFacets(
    filters: MarketplaceFilters,
    currentResults: MarketplaceListing[]
  ): Promise<SearchFacet[]> {
    const facets: SearchFacet[] = [];

    // Brand facet
    const brandQuery = `
      SELECT vc.item_data->>'brand' as brand, COUNT(*) as count
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND vc.item_data->>'brand' IS NOT NULL
      GROUP BY vc.item_data->>'brand'
      ORDER BY count DESC
      LIMIT 10
    `;
    const brandResult = await db.query(brandQuery);
    
    if (brandResult.rows.length > 0) {
      facets.push({
        field: 'brand',
        label: 'Marca',
        values: brandResult.rows.map(row => ({
          value: row.brand,
          label: row.brand,
          count: parseInt(row.count),
          selected: filters.brand === row.brand,
        })),
      });
    }

    // Category facet
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM marketplace_listings
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    const categoryResult = await db.query(categoryQuery);
    
    if (categoryResult.rows.length > 0) {
      facets.push({
        field: 'category',
        label: 'Categoria',
        values: categoryResult.rows.map(row => ({
          value: row.category,
          label: row.category,
          count: parseInt(row.count),
          selected: filters.category === row.category,
        })),
      });
    }

    // Price range facet
    const priceRanges = [
      { min: 0, max: 50, label: 'Até R$ 50' },
      { min: 50, max: 100, label: 'R$ 50 - R$ 100' },
      { min: 100, max: 200, label: 'R$ 100 - R$ 200' },
      { min: 200, max: 500, label: 'R$ 200 - R$ 500' },
      { min: 500, max: 999999, label: 'Acima de R$ 500' },
    ];

    const priceValues = [];
    for (const range of priceRanges) {
      const priceQuery = `
        SELECT COUNT(*) as count
        FROM marketplace_listings
        WHERE status = 'active'
          AND price BETWEEN $1 AND $2
      `;
      const priceResult = await db.query(priceQuery, [range.min, range.max]);
      const count = parseInt(priceResult.rows[0].count);
      
      if (count > 0) {
        priceValues.push({
          value: `${range.min}-${range.max}`,
          label: range.label,
          count,
          selected: filters.priceRange?.min === range.min && filters.priceRange?.max === range.max,
        });
      }
    }

    if (priceValues.length > 0) {
      facets.push({
        field: 'priceRange',
        label: 'Faixa de Preço',
        values: priceValues,
      });
    }

    // Condition facet
    const conditionQuery = `
      SELECT condition_info->>'status' as condition, COUNT(*) as count
      FROM marketplace_listings
      WHERE status = 'active'
        AND condition_info->>'status' IS NOT NULL
      GROUP BY condition_info->>'status'
      ORDER BY count DESC
    `;
    const conditionResult = await db.query(conditionQuery);
    
    if (conditionResult.rows.length > 0) {
      const conditionLabels: Record<string, string> = {
        'new': 'Novo',
        'dswt': 'Novo com etiqueta',
        'never_used': 'Nunca usado',
        'excellent': 'Excelente',
        'good': 'Bom',
        'fair': 'Regular',
      };

      facets.push({
        field: 'condition',
        label: 'Condição',
        values: conditionResult.rows.map(row => ({
          value: row.condition,
          label: conditionLabels[row.condition] || row.condition,
          count: parseInt(row.count),
          selected: filters.condition?.includes(row.condition),
        })),
      });
    }

    return facets;
  }

  /**
   * Generate intelligent search suggestions
   */
  private static async generateSearchSuggestions(
    query: string,
    filters: MarketplaceFilters
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    if (!query || query.length < 2) {
      return suggestions;
    }

    const queryLower = query.toLowerCase();

    // Brand suggestions
    const brandQuery = `
      SELECT vc.item_data->>'brand' as brand, COUNT(*) as count
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND LOWER(vc.item_data->>'brand') LIKE $1
      GROUP BY vc.item_data->>'brand'
      ORDER BY count DESC
      LIMIT 5
    `;
    const brandResult = await db.query(brandQuery, [`%${queryLower}%`]);
    
    brandResult.rows.forEach(row => {
      suggestions.push({
        type: 'brand',
        value: row.brand,
        count: parseInt(row.count),
        confidence: this.calculateSuggestionConfidence(queryLower, row.brand.toLowerCase()),
      });
    });

    // Category suggestions
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM marketplace_listings
      WHERE status = 'active'
        AND LOWER(category) LIKE $1
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `;
    const categoryResult = await db.query(categoryQuery, [`%${queryLower}%`]);
    
    categoryResult.rows.forEach(row => {
      suggestions.push({
        type: 'category',
        value: row.category,
        count: parseInt(row.count),
        confidence: this.calculateSuggestionConfidence(queryLower, row.category.toLowerCase()),
      });
    });

    // Color suggestions from VUFS data
    const colorQuery = `
      SELECT vc.item_data->>'color' as color, COUNT(*) as count
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND LOWER(vc.item_data->>'color') LIKE $1
      GROUP BY vc.item_data->>'color'
      ORDER BY count DESC
      LIMIT 3
    `;
    const colorResult = await db.query(colorQuery, [`%${queryLower}%`]);
    
    colorResult.rows.forEach(row => {
      suggestions.push({
        type: 'color',
        value: row.color,
        count: parseInt(row.count),
        confidence: this.calculateSuggestionConfidence(queryLower, row.color.toLowerCase()),
      });
    });

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Process and enhance search query
   */
  private static processSearchQuery(query: string): string {
    if (!query) return '';

    // Basic query processing
    let processed = query.trim().toLowerCase();

    // Handle common abbreviations and synonyms
    const synonyms: Record<string, string> = {
      'tenis': 'tênis',
      'calcado': 'calçado',
      'sapato': 'calçado',
      'roupa': 'vestuário',
      'blusa': 'camiseta',
      'short': 'shorts',
    };

    Object.entries(synonyms).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    });

    return processed;
  }

  /**
   * Calculate suggestion confidence based on string similarity
   */
  private static calculateSuggestionConfidence(query: string, suggestion: string): number {
    if (suggestion.includes(query)) {
      return 0.9;
    }
    
    if (suggestion.startsWith(query)) {
      return 0.8;
    }
    
    if (query.includes(suggestion)) {
      return 0.7;
    }
    
    // Simple Levenshtein distance approximation
    const maxLength = Math.max(query.length, suggestion.length);
    const distance = this.levenshteinDistance(query, suggestion);
    return Math.max(0, 1 - (distance / maxLength));
  }

  /**
   * Simple Levenshtein distance calculation
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Helper methods for personalized recommendations
  private static async getUserRecentViews(userId: string, limit: number): Promise<string[]> {
    // This would track user views in a separate table
    // For now, return empty array
    return [];
  }

  private static async getUserRecentLikes(userId: string, limit: number): Promise<string[]> {
    const query = `
      SELECT listing_id
      FROM listing_likes
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [userId, limit]);
    return result.rows.map(row => row.listing_id);
  }

  private static async getUserPreferences(userId: string): Promise<{
    preferredBrands: string[];
    priceRange: { min: number; max: number };
  }> {
    // This would analyze user's purchase history and preferences
    // For now, return default preferences
    return {
      preferredBrands: [],
      priceRange: { min: 0, max: 1000 },
    };
  }

  private static async findSimilarToUserActivity(
    itemIds: string[],
    limit: number
  ): Promise<MarketplaceListing[]> {
    if (itemIds.length === 0) return [];

    const query = `
      SELECT DISTINCT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND ml.id NOT IN (${itemIds.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY ml.created_at DESC
      LIMIT $${itemIds.length + 1}
    `;

    const result = await db.query(query, [...itemIds, limit]);
    return result.rows.map(row => this.mapToListing(row));
  }

  private static async getRecommendationsByBrands(
    brands: string[],
    limit: number
  ): Promise<MarketplaceListing[]> {
    if (brands.length === 0) return [];

    const query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND vc.item_data->>'brand' = ANY($1)
      ORDER BY ml.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [brands, limit]);
    return result.rows.map(row => this.mapToListing(row));
  }

  private static async getRecommendationsByPriceRange(
    priceRange: { min: number; max: number },
    limit: number
  ): Promise<MarketplaceListing[]> {
    const query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.status = 'active'
        AND ml.price BETWEEN $1 AND $2
      ORDER BY ml.created_at DESC
      LIMIT $3
    `;

    const result = await db.query(query, [priceRange.min, priceRange.max, limit]);
    return result.rows.map(row => this.mapToListing(row));
  }

  private static async generatePersonalizedRecommendations(
    userId: string,
    filters: MarketplaceFilters,
    currentResults: MarketplaceListing[]
  ): Promise<DiscoveryRecommendation[]> {
    return this.getPersonalizedRecommendations(userId, 5);
  }

  private static async generateGeneralRecommendations(
    filters: MarketplaceFilters,
    currentResults: MarketplaceListing[]
  ): Promise<DiscoveryRecommendation[]> {
    const recommendations: DiscoveryRecommendation[] = [];

    // Add trending items
    const trending = await this.getTrendingItems(filters.category, 'week', 5);
    if (trending.length > 0) {
      recommendations.push({
        type: 'trending',
        title: 'Em alta esta semana',
        description: 'Os itens mais populares do momento',
        listings: trending,
        priority: 1,
      });
    }

    return recommendations;
  }

  private static mapToListing(row: any): MarketplaceListing {
    const condition = typeof row.condition_info === 'string' 
      ? JSON.parse(row.condition_info) 
      : row.condition_info;
    
    const shipping = typeof row.shipping_options === 'string' 
      ? JSON.parse(row.shipping_options) 
      : row.shipping_options;
    
    const location = typeof row.location === 'string' 
      ? JSON.parse(row.location) 
      : row.location;

    return {
      id: row.id,
      itemId: row.item_id,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      currency: row.currency || 'BRL',
      condition,
      shipping,
      images: row.images || [],
      status: row.status,
      views: row.views || 0,
      likes: row.likes || 0,
      watchers: row.watchers || 0,
      category: row.category,
      tags: row.tags || [],
      location,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }
}