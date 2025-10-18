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

export interface OutfitCreationSession {
  id: string;
  userId: string;
  pinnedItemId?: string;
  selectedItemIds: string[];
  suggestions: string[];
  occasion?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
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
      'outfit',
      JSON.stringify(content),
      wardrobeItemIds,
      visibility,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Create or update outfit creation session
   */
  static async createOutfitSession(sessionData: Partial<OutfitCreationSession>): Promise<OutfitCreationSession> {
    const { userId, pinnedItemId, selectedItemIds = [], suggestions = [], occasion, season } = sessionData;

    const query = `
      INSERT INTO outfit_creation_sessions (
        user_id, pinned_item, selected_items, preferences, suggestions, expires_at, current_step
      )
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', 'select_base_item')
      RETURNING *
    `;

    const preferences = { occasion, season };
    const values = [
      userId,
      pinnedItemId || null,
      JSON.stringify(selectedItemIds),
      JSON.stringify(preferences),
      JSON.stringify(suggestions),
    ];

    const result = await db.query(query, values);
    return this.mapRowToOutfitSession(result.rows[0]);
  }

  /**
   * Update outfit creation session
   */
  static async updateOutfitSession(
    sessionId: string,
    updateData: Partial<OutfitCreationSession>
  ): Promise<OutfitCreationSession | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.pinnedItemId !== undefined) {
      setClause.push(`pinned_item = $${paramIndex++}`);
      values.push(updateData.pinnedItemId);
    }

    if (updateData.selectedItemIds) {
      setClause.push(`selected_items = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.selectedItemIds));
    }

    if (updateData.suggestions) {
      setClause.push(`suggestions = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.suggestions));
    }

    if (updateData.occasion || updateData.season) {
      const preferences = { occasion: updateData.occasion, season: updateData.season };
      setClause.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(preferences));
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(sessionId);

    const query = `
      UPDATE outfit_creation_sessions 
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToOutfitSession(result.rows[0]) : null;
  }

  /**
   * Get outfit creation session by ID
   */
  static async getOutfitSession(sessionId: string): Promise<OutfitCreationSession | null> {
    const query = 'SELECT * FROM outfit_creation_sessions WHERE id = $1 AND expires_at > NOW()';
    const result = await db.query(query, [sessionId]);
    return result.rows.length > 0 ? this.mapRowToOutfitSession(result.rows[0]) : null;
  }

  /**
   * Get active outfit session for user
   */
  static async getActiveOutfitSession(userId: string): Promise<OutfitCreationSession | null> {
    const query = `
      SELECT * FROM outfit_creation_sessions 
      WHERE user_id = $1 AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToOutfitSession(result.rows[0]) : null;
  }

  /**
   * Generate outfit suggestions based on pinned item
   */
  static async generateOutfitSuggestions(
    userId: string,
    pinnedItemId: string,
    occasion?: string,
    season?: string
  ): Promise<string[]> {
    // Get the pinned item details
    const pinnedItemQuery = 'SELECT * FROM vufs_items WHERE id = $1 AND owner_id = $2';
    const pinnedItemResult = await db.query(pinnedItemQuery, [pinnedItemId, userId]);
    
    if (pinnedItemResult.rows.length === 0) {
      throw new Error('Pinned item not found or does not belong to user');
    }

    const pinnedItem = pinnedItemResult.rows[0];
    const pinnedCategory = pinnedItem.category_hierarchy;

    // Simple suggestion algorithm - find complementary items
    let suggestionQuery = `
      SELECT id FROM vufs_items 
      WHERE owner_id = $1 
      AND id != $2
      AND (category_hierarchy->>'page') != $3
    `;
    
    const queryParams = [userId, pinnedItemId, pinnedCategory.page];
    let paramIndex = 4;

    // Add occasion-based filtering if provided
    if (occasion) {
      suggestionQuery += ` AND (metadata->>'occasion' IS NULL OR metadata->>'occasion' = $${paramIndex++})`;
      queryParams.push(occasion);
    }

    // Add season-based filtering if provided
    if (season) {
      suggestionQuery += ` AND (metadata->>'season' IS NULL OR metadata->>'season' = $${paramIndex++})`;
      queryParams.push(season);
    }

    suggestionQuery += ' ORDER BY created_at DESC LIMIT 10';

    const result = await db.query(suggestionQuery, queryParams as any[]);
    return result.rows.map(row => row.id);
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

    const queryParams = [userId];
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

    const countParams = [userId];
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

  private static mapRowToOutfitSession(row: any): OutfitCreationSession {
    return {
      id: row.id,
      userId: row.user_id,
      pinnedItemId: row.pinned_item,
      selectedItemIds: row.selected_items || [],
      suggestions: row.suggestions || [],
      occasion: row.preferences?.occasion,
      season: row.preferences?.season,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}