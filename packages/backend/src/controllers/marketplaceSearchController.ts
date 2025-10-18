import { Request, Response } from 'express';
import { MarketplaceSearchService } from '../services/marketplaceSearchService';
import { MarketplaceDiscoveryService } from '../services/marketplaceDiscoveryService';
import { AuthenticatedRequest } from '../utils/auth';

export class MarketplaceSearchController {
  /**
   * Enhanced search with recommendations and suggestions
   */
  static async enhancedSearch(req: Request, res: Response) {
    try {
      const {
        q, category, brand, condition, minPrice, maxPrice, size, color,
        sortBy, page = 1, limit = 20
      } = req.query;

      const filters: any = {};
      
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (condition) filters.condition = Array.isArray(condition) ? condition : [condition];
      if (minPrice || maxPrice) {
        filters.priceRange = {
          min: minPrice ? parseFloat(minPrice as string) : 0,
          max: maxPrice ? parseFloat(maxPrice as string) : 999999,
        };
      }
      if (size) filters.size = size;
      if (color) filters.color = color;
      if (sortBy) filters.sortBy = sortBy;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const userId = (req as AuthenticatedRequest).user?.userId;

      const result = await MarketplaceDiscoveryService.advancedSearch(
        q as string || '',
        filters,
        userId,
        limitNum,
        offset
      );

      res.json({
        ...result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error('Enhanced search error:', error);
      res.status(500).json({
        error: {
          code: 'SEARCH_ERROR',
          message: 'An error occurred while searching',
        },
      });
    }
  }

  /**
   * Get similar items
   */
  static async getSimilarItems(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { limit = 10 } = req.query;
      const userId = (req as AuthenticatedRequest).user?.userId;

      const similarItems = await MarketplaceDiscoveryService.findSimilarItems(
        itemId,
        userId,
        parseInt(limit as string)
      );

      res.json({
        itemId,
        similarItems,
        count: similarItems.length,
      });
    } catch (error) {
      console.error('Get similar items error:', error);
      res.status(500).json({
        error: {
          code: 'SIMILAR_ITEMS_ERROR',
          message: 'An error occurred while finding similar items',
        },
      });
    }
  }

  /**
   * Get trending items
   */
  static async getTrendingItems(req: Request, res: Response) {
    try {
      const { category, timeframe = 'week', limit = 20 } = req.query;

      const trendingItems = await MarketplaceDiscoveryService.getTrendingItems(
        category as string,
        timeframe as 'day' | 'week' | 'month',
        parseInt(limit as string)
      );

      res.json({
        trendingItems,
        count: trendingItems.length,
        category: category || 'all',
        timeframe,
      });
    } catch (error) {
      console.error('Get trending items error:', error);
      res.status(500).json({
        error: {
          code: 'TRENDING_ERROR',
          message: 'An error occurred while fetching trending items',
        },
      });
    }
  }

  /**
   * Get market analysis for an item
   */
  static async getMarketAnalysis(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const analysis = await MarketplaceSearchService.getMarketAnalysis(itemId);

      res.json({
        itemId,
        analysis,
      });
    } catch (error) {
      console.error('Get market analysis error:', error);
      res.status(500).json({
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'An error occurred while analyzing market data',
        },
      });
    }
  }

  /**
   * Get autocomplete suggestions
   */
  static async getAutocompleteSuggestions(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Query parameter is required',
          },
        });
      }

      const suggestions = await MarketplaceSearchService.getAutocompleteSuggestions(
        q,
        parseInt(limit as string)
      );

      res.json({
        query: q,
        suggestions,
      });
    } catch (error) {
      console.error('Get autocomplete suggestions error:', error);
      res.status(500).json({
        error: {
          code: 'AUTOCOMPLETE_ERROR',
          message: 'An error occurred while fetching suggestions',
        },
      });
    }
  }

  /**
   * Get personalized feed
   */
  static async getPersonalizedFeed(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { limit = 20 } = req.query;

      const recommendations = await MarketplaceDiscoveryService.getPersonalizedRecommendations(
        req.user.userId,
        parseInt(limit as string)
      );

      res.json({
        recommendations,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get personalized feed error:', error);
      res.status(500).json({
        error: {
          code: 'FEED_ERROR',
          message: 'An error occurred while generating your personalized feed',
        },
      });
    }
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(req: Request, res: Response) {
    try {
      const stats = await MarketplaceSearchService.getMarketplaceStats();

      res.json({
        stats,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get marketplace stats error:', error);
      res.status(500).json({
        error: {
          code: 'STATS_ERROR',
          message: 'An error occurred while fetching marketplace statistics',
        },
      });
    }
  }

  /**
   * Advanced VUFS-based search
   */
  static async vufsSearch(req: Request, res: Response) {
    try {
      const {
        domain, brand, pieceType, color, material, style, fit, size
      } = req.query;

      const vufsFilters: any = {};
      
      if (domain) vufsFilters.domain = domain;
      if (brand) vufsFilters.brand = brand;
      if (pieceType) vufsFilters.pieceType = pieceType;
      if (color) vufsFilters.color = color;
      if (material) vufsFilters.material = material;
      if (style) vufsFilters.style = Array.isArray(style) ? style : [style];
      if (fit) vufsFilters.fit = fit;
      if (size) vufsFilters.size = size;

      const results = await MarketplaceSearchService.advancedVUFSSearch(vufsFilters);

      res.json({
        vufsFilters,
        results,
        count: results.length,
      });
    } catch (error) {
      console.error('VUFS search error:', error);
      res.status(500).json({
        error: {
          code: 'VUFS_SEARCH_ERROR',
          message: 'An error occurred while performing VUFS search',
        },
      });
    }
  }

  /**
   * Save search for alerts
   */
  static async saveSearch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { name, filters, alertsEnabled = true } = req.body;

      if (!name || !filters) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Name and filters are required',
          },
        });
      }

      const searchId = await MarketplaceSearchService.saveSearch(
        req.user.userId,
        name,
        filters,
        alertsEnabled
      );

      res.status(201).json({
        message: 'Search saved successfully',
        searchId,
        alertsEnabled,
      });
    } catch (error) {
      console.error('Save search error:', error);
      res.status(500).json({
        error: {
          code: 'SAVE_SEARCH_ERROR',
          message: 'An error occurred while saving the search',
        },
      });
    }
  }

  /**
   * Get saved searches
   */
  static async getSavedSearches(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const savedSearches = await MarketplaceSearchService.getSavedSearches(req.user.userId);

      res.json({
        savedSearches,
        count: savedSearches.length,
      });
    } catch (error) {
      console.error('Get saved searches error:', error);
      res.status(500).json({
        error: {
          code: 'SAVED_SEARCHES_ERROR',
          message: 'An error occurred while fetching saved searches',
        },
      });
    }
  }

  /**
   * Get real-time pricing for an item
   */
  static async getRealTimePricing(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const pricing = await MarketplaceSearchService.getRealTimePricing(itemId);

      res.json({
        itemId,
        pricing,
      });
    } catch (error) {
      console.error('Get real-time pricing error:', error);
      res.status(500).json({
        error: {
          code: 'PRICING_ERROR',
          message: 'An error occurred while fetching real-time pricing',
        },
      });
    }
  }

  /**
   * Get automatic model matching
   */
  static async getAutomaticModelMatching(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const matching = await MarketplaceSearchService.getAutomaticModelMatching(itemId);

      res.json({
        itemId,
        matching,
      });
    } catch (error) {
      console.error('Get automatic model matching error:', error);
      res.status(500).json({
        error: {
          code: 'MODEL_MATCHING_ERROR',
          message: 'An error occurred while performing model matching',
        },
      });
    }
  }

  /**
   * Get recommendation engine results
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const { itemId } = req.query;
      const userId = (req as AuthenticatedRequest).user?.userId;
      
      const filters: any = {};
      const { category, brand, priceMin, priceMax } = req.query;
      
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (priceMin || priceMax) {
        filters.priceRange = {
          min: priceMin ? parseFloat(priceMin as string) : 0,
          max: priceMax ? parseFloat(priceMax as string) : 999999,
        };
      }

      const recommendations = await MarketplaceSearchService.getRecommendationEngine(
        userId,
        itemId as string,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        recommendations,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        error: {
          code: 'RECOMMENDATIONS_ERROR',
          message: 'An error occurred while generating recommendations',
        },
      });
    }
  }

  /**
   * Advanced backend search with facets
   */
  static async advancedSearch(req: Request, res: Response) {
    try {
      const {
        q, category, brand, condition, minPrice, maxPrice, size, color,
        facets, boost, page = 1, limit = 20
      } = req.query;

      const filters: any = {};
      
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (condition) filters.condition = Array.isArray(condition) ? condition : [condition];
      if (minPrice || maxPrice) {
        filters.priceRange = {
          min: minPrice ? parseFloat(minPrice as string) : 0,
          max: maxPrice ? parseFloat(maxPrice as string) : 999999,
        };
      }
      if (size) filters.size = size;
      if (color) filters.color = color;

      const userId = (req as AuthenticatedRequest).user?.userId;
      const facetList = facets ? (Array.isArray(facets) ? facets : [facets]) : ['brand', 'category', 'condition', 'price'];
      const boostParams = boost ? JSON.parse(boost as string) : {};

      const result = await MarketplaceSearchService.advancedBackendSearch({
        query: q as string,
        filters,
        facets: facetList as string[],
        boost: boostParams,
        userId,
      });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      res.json({
        ...result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({
        error: {
          code: 'ADVANCED_SEARCH_ERROR',
          message: 'An error occurred while performing advanced search',
        },
      });
    }
  }
}