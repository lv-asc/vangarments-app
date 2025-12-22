import { db } from '../database/connection';
import { MarketplaceReview } from '../types/shared';

export interface CreateReviewRequest {
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  type: 'buyer_to_seller' | 'seller_to_buyer';
  rating: number;
  title?: string;
  comment?: string;
  aspects: {
    communication: number;
    shipping: number;
    itemCondition: number;
    overall: number;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  aspectAverages: {
    communication: number;
    shipping: number;
    itemCondition: number;
    overall: number;
  };
  recentReviews: MarketplaceReview[];
}

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: CreateReviewRequest): Promise<MarketplaceReview> {
    // Validate transaction exists and reviewer is authorized
    const transactionQuery = `
      SELECT * FROM marketplace_transactions 
      WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
    `;
    const transactionResult = await db.query(transactionQuery, [data.transactionId, data.reviewerId]);
    
    if (transactionResult.rows.length === 0) {
      throw new Error('Transaction not found or unauthorized');
    }

    const transaction = transactionResult.rows[0];

    // Validate review type matches reviewer role
    if (data.type === 'buyer_to_seller' && transaction.buyer_id !== data.reviewerId) {
      throw new Error('Only buyers can leave seller reviews');
    }
    if (data.type === 'seller_to_buyer' && transaction.seller_id !== data.reviewerId) {
      throw new Error('Only sellers can leave buyer reviews');
    }

    // Check if review already exists
    const existingReviewQuery = `
      SELECT id FROM marketplace_reviews 
      WHERE transaction_id = $1 AND reviewer_id = $2 AND type = $3
    `;
    const existingResult = await db.query(existingReviewQuery, [
      data.transactionId,
      data.reviewerId,
      data.type,
    ]);

    if (existingResult.rows.length > 0) {
      throw new Error('Review already exists for this transaction');
    }

    // Validate rating values
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const aspects = data.aspects;
    if (aspects.communication < 1 || aspects.communication > 5 ||
        aspects.shipping < 1 || aspects.shipping > 5 ||
        aspects.itemCondition < 1 || aspects.itemCondition > 5 ||
        aspects.overall < 1 || aspects.overall > 5) {
      throw new Error('All aspect ratings must be between 1 and 5');
    }

    // Create review
    const query = `
      INSERT INTO marketplace_reviews (
        transaction_id, reviewer_id, reviewee_id, type, rating, title, comment, aspects
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.transactionId,
      data.reviewerId,
      data.revieweeId,
      data.type,
      data.rating,
      data.title || null,
      data.comment || null,
      JSON.stringify(aspects),
    ];

    const result = await db.query(query, values);
    const review = this.mapToReview(result.rows[0]);

    // Update user's overall rating
    await this.updateUserRating(data.revieweeId);

    return review;
  }

  /**
   * Get reviews for a user
   */
  async getUserReviews(
    userId: string,
    type?: 'buyer_to_seller' | 'seller_to_buyer',
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    reviews: MarketplaceReview[];
    total: number;
    stats: ReviewStats;
  }> {
    const whereConditions = ['reviewee_id = $1'];
    const values: any[] = [userId];
    let paramCount = 2;

    if (type) {
      whereConditions.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM marketplace_reviews WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get reviews
    const reviewsQuery = `
      SELECT * FROM marketplace_reviews 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const reviewsResult = await db.query(reviewsQuery, values);
    const reviews = reviewsResult.rows.map(row => this.mapToReview(row));

    // Get stats
    const stats = await this.getUserReviewStats(userId, type);

    return {
      reviews,
      total,
      stats,
    };
  }

  /**
   * Get review statistics for a user
   */
  async getUserReviewStats(
    userId: string,
    type?: 'buyer_to_seller' | 'seller_to_buyer'
  ): Promise<ReviewStats> {
    const whereConditions = ['reviewee_id = $1'];
    const values: any[] = [userId];
    let paramCount = 2;

    if (type) {
      whereConditions.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get overall stats
    const statsQuery = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        AVG((aspects->>'communication')::float) as avg_communication,
        AVG((aspects->>'shipping')::float) as avg_shipping,
        AVG((aspects->>'itemCondition')::float) as avg_item_condition,
        AVG((aspects->>'overall')::float) as avg_overall
      FROM marketplace_reviews 
      WHERE ${whereClause}
    `;

    const statsResult = await db.query(statsQuery, values);
    const stats = statsResult.rows[0];

    // Get rating distribution
    const distributionQuery = `
      SELECT rating, COUNT(*) as count
      FROM marketplace_reviews 
      WHERE ${whereClause}
      GROUP BY rating
      ORDER BY rating
    `;

    const distributionResult = await db.query(distributionQuery, values);
    const ratingDistribution: Record<number, number> = {};
    
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    
    for (const row of distributionResult.rows) {
      ratingDistribution[parseInt(row.rating)] = parseInt(row.count);
    }

    // Get recent reviews
    const recentQuery = `
      SELECT * FROM marketplace_reviews 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentResult = await db.query(recentQuery, values);
    const recentReviews = recentResult.rows.map(row => this.mapToReview(row));

    return {
      averageRating: parseFloat(stats.average_rating) || 0,
      totalReviews: parseInt(stats.total_reviews) || 0,
      ratingDistribution,
      aspectAverages: {
        communication: parseFloat(stats.avg_communication) || 0,
        shipping: parseFloat(stats.avg_shipping) || 0,
        itemCondition: parseFloat(stats.avg_item_condition) || 0,
        overall: parseFloat(stats.avg_overall) || 0,
      },
      recentReviews,
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<MarketplaceReview | null> {
    const query = 'SELECT * FROM marketplace_reviews WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToReview(result.rows[0]);
  }

  /**
   * Update review helpful count
   */
  async markReviewHelpful(reviewId: string, userId: string): Promise<void> {
    // Check if user already marked this review as helpful
    const existingQuery = `
      SELECT id FROM review_helpful_votes 
      WHERE review_id = $1 AND user_id = $2
    `;
    const existingResult = await db.query(existingQuery, [reviewId, userId]);

    if (existingResult.rows.length > 0) {
      // Remove helpful vote
      await db.query('DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
      await db.query('UPDATE marketplace_reviews SET helpful = helpful - 1 WHERE id = $1', [reviewId]);
    } else {
      // Add helpful vote
      await db.query('INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)', [reviewId, userId]);
      await db.query('UPDATE marketplace_reviews SET helpful = helpful + 1 WHERE id = $1', [reviewId]);
    }
  }

  /**
   * Report review for moderation
   */
  async reportReview(reviewId: string, reporterId: string, reason: string): Promise<void> {
    const query = `
      INSERT INTO review_reports (review_id, reporter_id, reason, status)
      VALUES ($1, $2, $3, 'pending')
    `;

    await db.query(query, [reviewId, reporterId, reason]);
  }

  /**
   * Get reviews that need moderation
   */
  async getReviewsForModeration(limit: number = 50): Promise<{
    reviews: (MarketplaceReview & { reports: { reason: string; reportedAt: Date }[] })[];
  }> {
    const query = `
      SELECT r.*, 
             json_agg(json_build_object('reason', rr.reason, 'reportedAt', rr.created_at)) as reports
      FROM marketplace_reviews r
      INNER JOIN review_reports rr ON r.id = rr.review_id
      WHERE rr.status = 'pending'
      GROUP BY r.id
      ORDER BY COUNT(rr.id) DESC, r.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    
    return {
      reviews: result.rows.map(row => ({
        ...this.mapToReview(row),
        reports: row.reports || [],
      })),
    };
  }

  /**
   * Update user's overall rating based on reviews
   */
  private async updateUserRating(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET profile = profile || jsonb_build_object(
        'rating', (
          SELECT AVG(rating) 
          FROM marketplace_reviews 
          WHERE reviewee_id = $1 AND type = 'buyer_to_seller'
        )
      )
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  /**
   * Map database row to MarketplaceReview object
   */
  private mapToReview(row: any): MarketplaceReview {
    const aspects = typeof row.aspects === 'string' ? JSON.parse(row.aspects) : row.aspects;

    return {
      id: row.id,
      transactionId: row.transaction_id,
      reviewerId: row.reviewer_id,
      revieweeId: row.reviewee_id,
      type: row.type,
      rating: parseInt(row.rating),
      title: row.title,
      comment: row.comment,
      aspects,
      helpful: row.helpful || 0,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Get seller performance metrics
   */
  async getSellerPerformanceMetrics(sellerId: string): Promise<{
    overallRating: number;
    totalReviews: number;
    responseTime: number; // hours
    shippingTime: number; // days
    positiveRating: number; // percentage
    badges: string[];
    performanceScore: number; // 0-100
  }> {
    const stats = await this.getUserReviewStats(sellerId, 'buyer_to_seller');
    
    // Calculate performance metrics
    const positiveRating = stats.totalReviews > 0 
      ? ((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalReviews) * 100
      : 0;

    // Mock response and shipping times (would be calculated from actual data)
    const responseTime = 2; // hours
    const shippingTime = 1; // days

    // Calculate performance score
    let performanceScore = 0;
    if (stats.totalReviews > 0) {
      performanceScore = (
        (stats.averageRating / 5) * 40 + // 40% weight on rating
        (positiveRating / 100) * 30 + // 30% weight on positive rating
        (Math.max(0, (24 - responseTime) / 24)) * 15 + // 15% weight on response time
        (Math.max(0, (7 - shippingTime) / 7)) * 15 // 15% weight on shipping time
      ) * 100;
    }

    // Determine badges based on performance
    const badges: string[] = [];
    if (stats.averageRating >= 4.8 && stats.totalReviews >= 10) {
      badges.push('top_seller');
    }
    if (shippingTime <= 1) {
      badges.push('fast_shipper');
    }
    if (responseTime <= 2) {
      badges.push('responsive_seller');
    }
    if (stats.totalReviews >= 50 && positiveRating >= 95) {
      badges.push('trusted_seller');
    }

    return {
      overallRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      responseTime,
      shippingTime,
      positiveRating,
      badges,
      performanceScore: Math.round(performanceScore),
    };
  }

  /**
   * Get marketplace review trends
   */
  async getReviewTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    averageRating: number;
    totalReviews: number;
    trendDirection: 'up' | 'down' | 'stable';
    categoryBreakdown: Record<string, { rating: number; count: number }>;
    commonIssues: { issue: string; frequency: number }[];
  }> {
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "created_at >= NOW() - INTERVAL '90 days'";
        break;
    }

    const query = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews
      FROM marketplace_reviews 
      WHERE ${dateFilter}
    `;

    const result = await db.query(query);
    const stats = result.rows[0];

    // Mock trend analysis (would be calculated from historical data)
    const trendDirection = 'stable';
    const categoryBreakdown = {
      'Sneakers': { rating: 4.2, count: 45 },
      'Jackets': { rating: 4.5, count: 23 },
      'Jeans': { rating: 4.1, count: 19 },
    };

    const commonIssues = [
      { issue: 'Item condition not as described', frequency: 12 },
      { issue: 'Slow shipping', frequency: 8 },
      { issue: 'Poor communication', frequency: 5 },
    ];

    return {
      averageRating: parseFloat(stats.average_rating) || 0,
      totalReviews: parseInt(stats.total_reviews) || 0,
      trendDirection,
      categoryBreakdown,
      commonIssues,
    };
  }
}