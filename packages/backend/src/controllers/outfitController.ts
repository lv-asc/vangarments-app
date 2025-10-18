import { Request, Response } from 'express';
import { OutfitModel } from '../models/Outfit';
import { OutfitStylingService } from '../services/outfitStylingService';
import { AuthenticatedRequest } from '../utils/auth';

export class OutfitController {
  /**
   * Create new outfit
   */
  static async createOutfit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { name, description, items, occasion, season, style, isPublic } = req.body;

      if (!name || !items || !occasion || !season) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Name, items, occasion, and season are required',
          },
        });
      }

      const outfit = await OutfitModel.create({
        userId: req.user.userId,
        name,
        description,
        items,
        occasion,
        season,
        style: style || [],
        isPublic: isPublic || false,
      });

      res.status(201).json({
        message: 'Outfit created successfully',
        outfit,
      });
    } catch (error) {
      console.error('Create outfit error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the outfit',
        },
      });
    }
  }

  /**
   * Get user's outfits with filters
   */
  static async getUserOutfits(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { occasion, season, style, colors, hasItem, isFavorite, search } = req.query;

      const filters: any = {};
      if (occasion) filters.occasion = occasion;
      if (season) filters.season = season;
      if (style) filters.style = Array.isArray(style) ? style : [style];
      if (colors) filters.colors = Array.isArray(colors) ? colors : [colors];
      if (hasItem) filters.hasItem = hasItem;
      if (isFavorite !== undefined) filters.isFavorite = isFavorite === 'true';
      if (search) filters.search = search;

      const outfits = await OutfitModel.getUserOutfits(req.user.userId, filters);

      res.json({
        outfits,
        count: outfits.length,
      });
    } catch (error) {
      console.error('Get user outfits error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching outfits',
        },
      });
    }
  }

  /**
   * Get outfit by ID
   */
  static async getOutfit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const outfit = await OutfitModel.findById(id);
      if (!outfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      res.json({ outfit });
    } catch (error) {
      console.error('Get outfit error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the outfit',
        },
      });
    }
  }

  /**
   * Update outfit
   */
  static async updateOutfit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if outfit exists and belongs to user
      const existingOutfit = await OutfitModel.findById(id);
      if (!existingOutfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      if (existingOutfit.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own outfits',
          },
        });
      }

      const updatedOutfit = await OutfitModel.update(id, updateData);

      res.json({
        message: 'Outfit updated successfully',
        outfit: updatedOutfit,
      });
    } catch (error) {
      console.error('Update outfit error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the outfit',
        },
      });
    }
  }

  /**
   * Delete outfit
   */
  static async deleteOutfit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      // Check if outfit exists and belongs to user
      const existingOutfit = await OutfitModel.findById(id);
      if (!existingOutfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      if (existingOutfit.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own outfits',
          },
        });
      }

      const deleted = await OutfitModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      res.json({
        message: 'Outfit deleted successfully',
      });
    } catch (error) {
      console.error('Delete outfit error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the outfit',
        },
      });
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      // Check if outfit belongs to user
      const existingOutfit = await OutfitModel.findById(id);
      if (!existingOutfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      if (existingOutfit.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only favorite your own outfits',
          },
        });
      }

      const updatedOutfit = await OutfitModel.toggleFavorite(id);

      res.json({
        message: `Outfit ${updatedOutfit?.isFavorite ? 'added to' : 'removed from'} favorites`,
        outfit: updatedOutfit,
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating favorite status',
        },
      });
    }
  }

  /**
   * Record outfit wear
   */
  static async recordWear(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      // Check if outfit belongs to user
      const existingOutfit = await OutfitModel.findById(id);
      if (!existingOutfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      if (existingOutfit.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only record wear for your own outfits',
          },
        });
      }

      const updatedOutfit = await OutfitModel.recordWear(id);

      res.json({
        message: 'Outfit wear recorded successfully',
        outfit: updatedOutfit,
      });
    } catch (error) {
      console.error('Record wear error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while recording wear',
        },
      });
    }
  }

  /**
   * Get outfit suggestions based on pinned item
   */
  static async getOutfitSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { baseItemId } = req.params;
      const { occasion, season, style } = req.query;

      const preferences: any = {};
      if (occasion) preferences.occasion = occasion;
      if (season) preferences.season = season;
      if (style) preferences.style = Array.isArray(style) ? style : [style];

      const suggestions = await OutfitStylingService.generateOutfitSuggestions(
        baseItemId,
        req.user.userId,
        preferences
      );

      res.json({
        baseItemId,
        suggestions,
        count: suggestions.length,
      });
    } catch (error) {
      console.error('Get outfit suggestions error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while generating outfit suggestions',
        },
      });
    }
  }

  /**
   * Analyze outfit and provide insights
   */
  static async analyzeOutfit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const outfit = await OutfitModel.findById(id);
      if (!outfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      const analysis = await OutfitStylingService.analyzeOutfit(outfit.items);
      analysis.outfitId = id;

      res.json({
        outfit,
        analysis,
      });
    } catch (error) {
      console.error('Analyze outfit error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while analyzing the outfit',
        },
      });
    }
  }

  /**
   * Get style recommendations for outfit improvement
   */
  static async getStyleRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      const outfit = await OutfitModel.findById(id);
      if (!outfit) {
        return res.status(404).json({
          error: {
            code: 'OUTFIT_NOT_FOUND',
            message: 'Outfit not found',
          },
        });
      }

      const recommendations = await OutfitStylingService.getStyleRecommendations(
        outfit.items,
        req.user.userId
      );

      res.json({
        outfit,
        recommendations,
      });
    } catch (error) {
      console.error('Get style recommendations error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while generating style recommendations',
        },
      });
    }
  }

  /**
   * Get user outfit statistics
   */
  static async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const stats = await OutfitModel.getUserOutfitStats(req.user.userId);

      res.json({ stats });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching outfit statistics',
        },
      });
    }
  }

  /**
   * Search public outfits
   */
  static async searchPublicOutfits(req: Request, res: Response) {
    try {
      const { occasion, season, style, search, limit = 50 } = req.query;

      const filters: any = {};
      if (occasion) filters.occasion = occasion;
      if (season) filters.season = season;
      if (style) filters.style = Array.isArray(style) ? style : [style];
      if (search) filters.search = search;

      const outfits = await OutfitModel.searchPublicOutfits(filters, parseInt(limit as string));

      res.json({
        outfits,
        count: outfits.length,
      });
    } catch (error) {
      console.error('Search public outfits error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching outfits',
        },
      });
    }
  }
}