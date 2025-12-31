import { db } from '../database/connection';
import { SocialPost } from '@vangarments/shared';
import { slugify } from '../utils/slugify';

export interface CreateSocialPostData {
  userId: string;
  postType: 'outfit' | 'item' | 'inspiration';
  content: {
    title?: string;
    description?: string;
    imageUrls: string[];
    tags?: string[];
  };
  wardrobeItemIds?: string[];
  visibility?: 'public' | 'followers' | 'private';
}

export interface UpdateSocialPostData {
  slug?: string;
  content?: {
    title?: string;
    description?: string;
    imageUrls?: string[];
    tags?: string[];
  };
  visibility?: 'public' | 'followers' | 'private';
}

export interface SocialPostFilters {
  userId?: string;
  postType?: 'outfit' | 'item' | 'inspiration';
  visibility?: 'public' | 'followers' | 'private';
  tags?: string[];
  followingIds?: string[];
}

export class SocialPostModel {
  static async create(postData: CreateSocialPostData): Promise<SocialPost> {
    const { userId, postType, content, wardrobeItemIds = [], visibility = 'public' } = postData;

    // Validate content has required fields
    if (!content.imageUrls || content.imageUrls.length === 0) {
      throw new Error('Content must include at least one image URL');
    }

    // Generate slug
    let slug = '';
    if (content.title) {
      slug = slugify(content.title);
      // Append short hash to ensure uniqueness as titles might be common
      const shortHash = Math.random().toString(36).substring(2, 7);
      slug = `${slug}-${shortHash}`;
    } else {
      // Fallback if no title
      const shortHash = Math.random().toString(36).substring(2, 9);
      slug = `${postType}-${shortHash}`;
    }

    const query = `
      INSERT INTO social_posts (user_id, slug, post_type, content, wardrobe_item_ids, visibility)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userId,
      slug,
      postType,
      JSON.stringify(content),
      wardrobeItemIds,
      visibility,
    ];

    const result = await db.query(query, values);
    return this.mapRowToSocialPost(result.rows[0]);
  }

  static async findById(id: string): Promise<SocialPost | null> {
    const query = `
      SELECT sp.*, 
             u.profile as user_profile,
             u.verification_status,
             (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles,
             (
               SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = sp.id
             ) as likes_count,
             (
               SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = sp.id
             ) as comments_count
      FROM social_posts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToSocialPost(result.rows[0]) : null;
  }

  static async findBySlugOrId(identifier: string): Promise<SocialPost | null> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUUID) {
      return this.findById(identifier);
    }

    const query = `
      SELECT sp.*, 
             u.profile as user_profile,
             u.verification_status,
             (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles,
             (
               SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = sp.id
             ) as likes_count,
             (
               SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = sp.id
             ) as comments_count
      FROM social_posts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.slug = $1
    `;

    const result = await db.query(query, [identifier]);
    return result.rows.length > 0 ? this.mapRowToSocialPost(result.rows[0]) : null;
  }

  static async findMany(
    filters: SocialPostFilters = {},
    limit = 20,
    offset = 0
  ): Promise<{ posts: SocialPost[]; total: number }> {
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      whereConditions.push(`sp.user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.postType) {
      whereConditions.push(`sp.post_type = $${paramIndex++}`);
      values.push(filters.postType);
    }

    if (filters.visibility) {
      whereConditions.push(`sp.visibility = $${paramIndex++}`);
      values.push(filters.visibility);
    }

    if (filters.followingIds && filters.followingIds.length > 0) {
      whereConditions.push(`sp.user_id = ANY($${paramIndex++})`);
      values.push(filters.followingIds);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Use JSONB contains operator instead of ?| which requires additional extensions
      const tagConditions = filters.tags.map(() => `sp.content->'tags' @> $${paramIndex++}`);
      whereConditions.push(`(${tagConditions.join(' OR ')})`);
      filters.tags.forEach(tag => values.push(JSON.stringify([tag])));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT sp.*, 
             u.profile as user_profile,
             u.verification_status,
             (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles,
             (
               SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = sp.id
             ) as likes_count,
             (
               SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = sp.id
             ) as comments_count
      FROM social_posts sp
      LEFT JOIN users u ON sp.user_id = u.id
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM social_posts sp
      ${whereClause}
    `;

    const [postsResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2)), // Remove limit and offset for count
    ]);

    return {
      posts: postsResult.rows.map(row => this.mapRowToSocialPost(row)),
      total: countResult.rows[0].total,
    };
  }

  static async update(id: string, updateData: UpdateSocialPostData): Promise<SocialPost | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.content) {
      setClause.push(`content = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.content));
    }

    if (updateData.visibility) {
      setClause.push(`visibility = $${paramIndex++}`);
      values.push(updateData.visibility);
    }

    if (updateData.slug) {
      setClause.push(`slug = $${paramIndex++}`);
      values.push(updateData.slug);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE social_posts 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToSocialPost(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM social_posts WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async updateEngagementStats(postId: string): Promise<void> {
    const query = `
      UPDATE social_posts 
      SET engagement_stats = jsonb_build_object(
        'likes', (SELECT COUNT(*) FROM post_likes WHERE post_id = $1),
        'comments', (SELECT COUNT(*) FROM post_comments WHERE post_id = $1),
        'shares', 0
      )
      WHERE id = $1
    `;

    await db.query(query, [postId]);
  }

  private static mapRowToSocialPost(row: any): SocialPost {
    return {
      id: row.id,
      slug: row.slug,
      userId: row.user_id,
      postType: row.post_type,
      content: row.content,
      wardrobeItemIds: row.wardrobe_item_ids || [],
      engagementStats: {
        likes: row.likes_count || (row.engagement_stats && row.engagement_stats.likes) || 0,
        comments: row.comments_count || (row.engagement_stats && row.engagement_stats.comments) || 0,
        shares: (row.engagement_stats && row.engagement_stats.shares) || 0,
      },
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user_profile ? {
        id: row.user_id,
        profile: row.user_profile,
        verificationStatus: (row.user_roles && row.user_roles.includes('admin')) ? 'verified' : (row.verification_status || 'unverified'),
        roles: row.user_roles || [],
      } : undefined,
    };
  }
}