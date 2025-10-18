import { Request, Response } from 'express';
import { ContentCreationService } from '../services/contentCreationService';
import { AuthenticatedRequest } from '../utils/auth';

const contentCreationService = new ContentCreationService();

export class ContentCreationController {
  /**
   * Create a fit pic with wardrobe item tagging
   */
  async createFitPic(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { imageUrl, wardrobeItemIds, caption, location, tags, visibility } = req.body;

      if (!imageUrl) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Image URL is required',
          },
        });
        return;
      }

      const fitPic = await contentCreationService.createFitPic(userId, {
        imageUrl,
        wardrobeItemIds: wardrobeItemIds || [],
        caption,
        location,
        tags,
        visibility,
      });

      res.status(201).json({
        success: true,
        data: { fitPic },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'FIT_PIC_CREATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Start outfit creation session
   */
  async startOutfitCreation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { pinnedItemId } = req.body;

      const session = await contentCreationService.startOutfitCreation(userId, pinnedItemId);

      res.status(201).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'OUTFIT_CREATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Add item to outfit
   */
  async addItemToOutfit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const { itemId } = req.body;

      if (!itemId) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Item ID is required',
          },
        });
        return;
      }

      const session = await contentCreationService.addItemToOutfit(userId, sessionId, itemId);

      res.json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'ADD_ITEM_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Remove item from outfit
   */
  async removeItemFromOutfit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { sessionId, itemId } = req.params;

      const session = await contentCreationService.removeItemFromOutfit(userId, sessionId, itemId);

      res.json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'REMOVE_ITEM_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get outfit suggestions
   */
  async getOutfitSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { pinnedItemId, occasion, season, stylePreferences } = req.query;

      if (!pinnedItemId) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Pinned item ID is required',
          },
        });
        return;
      }

      const suggestions = await contentCreationService.getOutfitSuggestions(userId, {
        pinnedItemId: pinnedItemId as string,
        occasion: occasion as string,
        season: season as string,
        stylePreferences: stylePreferences ? (stylePreferences as string).split(',') : undefined,
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_SUGGESTIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get personalized content feed
   */
  async getPersonalizedFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { interests, page = 1, limit = 20, includeFollowing = true } = req.query;

      const userInterests = interests ? (interests as string).split(',') : [];

      const feed = await contentCreationService.getPersonalizedFeed(userId, {
        interests: userInterests,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        includeFollowing: includeFollowing === 'true',
      });

      res.json({
        success: true,
        data: {
          ...feed,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_FEED_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get content visibility analytics
   */
  async getContentAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const analytics = await contentCreationService.getContentVisibilityAnalytics(userId);

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ANALYTICS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const trending = await contentCreationService.getTrendingContent();

      res.json({
        success: true,
        data: trending,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_TRENDING_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get content creation tips
   */
  async getContentCreationTips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const tips = await contentCreationService.getContentCreationTips(userId);

      res.json({
        success: true,
        data: tips,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_TIPS_FAILED',
          message: error.message,
        },
      });
    }
  }
}