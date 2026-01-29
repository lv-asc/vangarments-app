import { db } from '../database/connection';

export interface FitPicData {
  userId: string;
  imageUrl: string;
  wardrobeItemIds: string[];
  caption?: string;
  location?: string;
  tags?: string[];
  visibility: 'public' | 'followers' | 'private';
}


export class ContentCreationModel {
  /**
   * Create a fit pic post with wardrobe item tagging
   */
  static async createFitPic(fitPicData: FitPicData): Promise<any> {
    const { userId, imageUrl, wardrobeItemIds, caption, location, tags, visibility } = fitPicData;

    const content = {
      imageUrls: [imageUrl],
      caption,
      location,
      tags: tags || [],
      fitPic: true,
    };

    const query = `
      INSERT INTO social_posts (user_id, post_type, content, wardrobe_item_ids, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      userId,
      'inspiration',
      JSON.stringify(content),
      wardrobeItemIds,
      visibility,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }


  /**
   * Get personalized content feed with engagement metrics
   */
  static async getPersonalizedFeed(
    userId: string,
    interests: string[] = [],
    limit = 20,
    offset = 0
  ): Promise<{ posts: any[]; total: number }> {
    // Get following list
    const followingQuery = 'SELECT following_id FROM user_follows WHERE follower_id = $1';
    const followingResult = await db.query(followingQuery, [userId]);
    const followingIds = followingResult.rows.map(row => row.following_id);

    let feedQuery = `
      SELECT sp.*, 
             u.profile as user_profile,
             (
               SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = sp.id
             ) as likes_count,
             (
               SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = sp.id
             ) as comments_count,
             (
               SELECT EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = sp.id AND pl.user_id = $1)
             ) as user_liked
      FROM social_posts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.visibility IN ('public', 'followers')
    `;

    const queryParams: any[] = [userId];
    let paramIndex = 2;

    // Prioritize content from followed users
    if (followingIds.length > 0) {
      feedQuery += ` AND (sp.user_id = ANY($${paramIndex++}) OR sp.visibility = 'public')`;
      queryParams.push(followingIds);
    }

    // Filter by interests/tags if provided
    if (interests.length > 0) {
      feedQuery += ` AND (sp.content->>'tags' ?| $${paramIndex++})`;
      queryParams.push(interests);
    }

    // Order by engagement and recency
    feedQuery += `
      ORDER BY 
        (likes_count + comments_count * 2) DESC,
        sp.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    const result = await db.query(feedQuery, queryParams as any[]);

    // Get total count for pagination
    // Build count query with same filters
    let countQuery = `
      SELECT COUNT(*)::int as total
      FROM social_posts sp
      WHERE sp.visibility IN ('public', 'followers')
    `;

    const countParams: any[] = [userId];
    let countParamIndex = 2;

    if (followingIds.length > 0) {
      countQuery += ` AND (sp.user_id = ANY($${countParamIndex++}) OR sp.visibility = 'public')`;
      countParams.push(followingIds);
    }

    if (interests.length > 0) {
      countQuery += ` AND (sp.content->>'tags' ?| $${countParamIndex++})`;
      countParams.push(interests);
    }

    const countResult = await db.query(countQuery, countParams as any[]);

    return {
      posts: result.rows,
      total: countResult.rows[0].total,
    };
  }

  /**
   * Get social proof metrics for a user
   */
  static async getSocialProofMetrics(userId: string): Promise<{
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
    engagementRate: number;
    topPerformingPost?: any;
  }> {
    const metricsQuery = `
      SELECT 
        COUNT(sp.id)::int as total_posts,
        COALESCE(SUM((sp.engagement_stats->>'likes')::int), 0)::int as total_likes,
        COALESCE(SUM((sp.engagement_stats->>'comments')::int), 0)::int as total_comments
      FROM social_posts sp
      WHERE sp.user_id = $1
    `;

    const metricsResult = await db.query(metricsQuery, [userId]);
    const metrics = metricsResult.rows[0];

    // Calculate engagement rate
    const totalEngagement = metrics.total_likes + metrics.total_comments;
    const engagementRate = metrics.total_posts > 0 ? totalEngagement / metrics.total_posts : 0;

    // Get top performing post
    const topPostQuery = `
      SELECT sp.*, 
             ((sp.engagement_stats->>'likes')::int + (sp.engagement_stats->>'comments')::int * 2) as engagement_score
      FROM social_posts sp
      WHERE sp.user_id = $1
      ORDER BY engagement_score DESC
      LIMIT 1
    `;

    const topPostResult = await db.query(topPostQuery, [userId]);

    return {
      totalLikes: metrics.total_likes,
      totalComments: metrics.total_comments,
      totalPosts: metrics.total_posts,
      engagementRate,
      topPerformingPost: topPostResult.rows.length > 0 ? topPostResult.rows[0] : undefined,
    };
  }

}