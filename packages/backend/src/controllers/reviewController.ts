import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';
import { AuthenticatedRequest } from '../utils/auth';

export class ReviewController {
  private static reviewService = new ReviewService();

  /**
   * Create new review
   */
  static async createReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const {
        transactionId,
        revieweeId,
        type,
        rating,
        title,
        comment,
        aspects,
      } = req.body;

      if (!transactionId || !revieweeId || !type || !rating || !aspects) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Transaction ID, reviewee ID, type, rating, and aspects are required',
          },
        });
      }

      const review = await ReviewController.reviewService.createReview({
        transactionId,
        reviewerId: req.user.userId,
        revieweeId,
        type,
        rating,
        title,
        comment,
        aspects,
      });

      res.status(201).json({
        message: 'Review created successfully',
        review,
      });
    } catch (error: any) {
      console.error('Create review error:', error);
      res.status(400).json({
        error: {
          code: 'REVIEW_ERROR',
          message: error.message || 'An error occurred while creating the review',
        },
      });
    }
  }

  /**
   * Get reviews for a user
   */
  static async getUserReviews(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type, page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await ReviewController.reviewService.getUserReviews(
        userId,
        type as 'buyer_to_seller' | 'seller_to_buyer',
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
    } catch (error: any) {
      console.error('Get user reviews error:', error);
      res.status(500).json({
        error: {
          code: 'REVIEWS_ERROR',
          message: 'An error occurred while fetching reviews',
        },
      });
    }
  }

  /**
   * Get review by ID
   */
  static async getReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      const review = await ReviewController.reviewService.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found',
          },
        });
      }

      res.json({
        review,
      });
    } catch (error: any) {
      console.error('Get review error:', error);
      res.status(500).json({
        error: {
          code: 'REVIEW_ERROR',
          message: 'An error occurred while fetching the review',
        },
      });
    }
  }

  /**
   * Mark review as helpful
   */
  static async markReviewHelpful(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { reviewId } = req.params;

      await ReviewController.reviewService.markReviewHelpful(reviewId, req.user.userId);

      res.json({
        message: 'Review helpfulness updated',
      });
    } catch (error: any) {
      console.error('Mark review helpful error:', error);
      res.status(500).json({
        error: {
          code: 'HELPFUL_ERROR',
          message: 'An error occurred while updating review helpfulness',
        },
      });
    }
  }

  /**
   * Report review
   */
  static async reportReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { reviewId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REASON',
            message: 'Report reason is required',
          },
        });
      }

      await ReviewController.reviewService.reportReview(reviewId, req.user.userId, reason);

      res.json({
        message: 'Review reported successfully',
      });
    } catch (error: any) {
      console.error('Report review error:', error);
      res.status(500).json({
        error: {
          code: 'REPORT_ERROR',
          message: 'An error occurred while reporting the review',
        },
      });
    }
  }

  /**
   * Get seller performance metrics
   */
  static async getSellerPerformance(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;

      const metrics = await ReviewController.reviewService.getSellerPerformanceMetrics(sellerId);

      res.json({
        sellerId,
        metrics,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get seller performance error:', error);
      res.status(500).json({
        error: {
          code: 'PERFORMANCE_ERROR',
          message: 'An error occurred while fetching seller performance metrics',
        },
      });
    }
  }

  /**
   * Get review trends (admin only)
   */
  static async getReviewTrends(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // In production, check for admin role
      // if (!req.user.roles.includes('admin')) {
      //   return res.status(403).json({
      //     error: {
      //       code: 'FORBIDDEN',
      //       message: 'Admin access required',
      //     },
      //   });
      // }

      const { period = 'month' } = req.query;

      const trends = await ReviewController.reviewService.getReviewTrends(
        period as 'week' | 'month' | 'quarter'
      );

      res.json({
        trends,
        period,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get review trends error:', error);
      res.status(500).json({
        error: {
          code: 'TRENDS_ERROR',
          message: 'An error occurred while fetching review trends',
        },
      });
    }
  }

  /**
   * Get reviews for moderation (admin only)
   */
  static async getReviewsForModeration(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // In production, check for admin/moderator role
      // if (!req.user.roles.includes('admin') && !req.user.roles.includes('moderator')) {
      //   return res.status(403).json({
      //     error: {
      //       code: 'FORBIDDEN',
      //       message: 'Moderator access required',
      //     },
      //   });
      // }

      const { limit = 50 } = req.query;

      const result = await ReviewController.reviewService.getReviewsForModeration(
        parseInt(limit as string)
      );

      res.json({
        ...result,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get reviews for moderation error:', error);
      res.status(500).json({
        error: {
          code: 'MODERATION_ERROR',
          message: 'An error occurred while fetching reviews for moderation',
        },
      });
    }
  }

  /**
   * Get review statistics for a user
   */
  static async getReviewStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      const stats = await ReviewController.reviewService.getUserReviewStats(
        userId,
        type as 'buyer_to_seller' | 'seller_to_buyer'
      );

      res.json({
        userId,
        type: type || 'all',
        stats,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        error: {
          code: 'STATS_ERROR',
          message: 'An error occurred while fetching review statistics',
        },
      });
    }
  }
}