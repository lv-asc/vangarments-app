import { Request, Response } from 'express';
import { ContentDiscoveryService } from '../services/contentDiscoveryService';
import { AuthenticatedRequest } from '../utils/auth';

const contentDiscoveryService = new ContentDiscoveryService();

export class ContentDiscoveryController {
  /**
   * Get personalized content discovery feed
   */
  async getDiscoveryFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const {
        category,
        tags,
        contentType,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
        contentType: contentType as 'item' | 'inspiration',
      };

      const result = await contentDiscoveryService.getDiscoveryFeed(
        userId,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'DISCOVERY_FEED_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get trending content and tags
   */
  async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe = '7d', limit = 10 } = req.query;

      const result = await contentDiscoveryService.getTrendingContent(
        timeframe as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'TRENDING_CONTENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get content categories
   */
  async getContentCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await contentDiscoveryService.getContentCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_CATEGORIES_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type = 'all', limit = 10 } = req.query;

      const recommendations = await contentDiscoveryService.getPersonalizedRecommendations(
        userId,
        type as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'RECOMMENDATIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Search content with advanced filters
   */
  async searchContent(req: Request, res: Response): Promise<void> {
    try {
      const {
        q: query = '',
        contentType,
        tags,
        userId,
        category,
        sortBy = 'relevance',
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        contentType: contentType as 'item' | 'inspiration',
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
        userId: userId as string,
        category: category as string,
      };

      const result = await contentDiscoveryService.searchContent(
        query as string,
        filters,
        sortBy as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'SEARCH_CONTENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get content by tag
   */
  async getContentByTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const { page = 1, limit = 20, sortBy = 'recent' } = req.query;

      const result = await contentDiscoveryService.getContentByTag(
        tag,
        sortBy as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_TAG_CONTENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const featuredContent = await contentDiscoveryService.getFeaturedContent(
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { posts: featuredContent },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_FEATURED_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get similar content
   */
  async getSimilarContent(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { limit = 5 } = req.query;

      const similarContent = await contentDiscoveryService.getSimilarContent(
        postId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { posts: similarContent },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_SIMILAR_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Report content
   */
  async reportContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contentId, contentType, reason, description } = req.body;
      const reportedBy = req.user!.id;

      if (!contentId || !contentType || !reason) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Content ID, content type, and reason are required',
          },
        });
        return;
      }

      const report = await contentDiscoveryService.reportContent({
        reportedBy,
        reportedContentId: contentId,
        reportedContentType: contentType,
        reason,
        description,
      });

      res.status(201).json({
        success: true,
        data: { report },
        message: 'Content reported successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'REPORT_CONTENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get user's feed preferences
   */
  async getFeedPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const preferences = await contentDiscoveryService.getUserFeedPreferences(userId);

      res.json({
        success: true,
        data: { preferences },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_PREFERENCES_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Update user's feed preferences
   */
  async updateFeedPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      const updatedPreferences = await contentDiscoveryService.updateUserFeedPreferences(
        userId,
        preferences
      );

      res.json({
        success: true,
        data: { preferences: updatedPreferences },
        message: 'Feed preferences updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_PREFERENCES_FAILED',
          message: error.message,
        },
      });
    }
  }
}