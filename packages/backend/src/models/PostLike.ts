import { db } from '../database/connection';
import { PostLike } from '@vangarments/shared';

export interface CreatePostLikeData {
  postId: string;
  userId: string;
}

export class PostLikeModel {
  static async create(likeData: CreatePostLikeData): Promise<PostLike> {
    const { postId, userId } = likeData;

    // Check if already liked
    const existing = await this.findByIds(postId, userId);
    if (existing) {
      throw new Error('Post already liked');
    }

    const query = `
      INSERT INTO post_likes (post_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await db.query(query, [postId, userId]);
    return this.mapRowToPostLike(result.rows[0]);
  }

  static async findByIds(postId: string, userId: string): Promise<PostLike | null> {
    const query = `
      SELECT pl.*, 
             u.profile as user_profile,
             u.verification_status,
             (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles
      FROM post_likes pl
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE pl.post_id = $1 AND pl.user_id = $2
    `;

    const result = await db.query(query, [postId, userId]);
    return result.rows.length > 0 ? this.mapRowToPostLike(result.rows[0]) : null;
  }

  static async findByPostId(
    postId: string,
    limit = 20,
    offset = 0
  ): Promise<{ likes: PostLike[]; total: number }> {
    const query = `
      SELECT pl.*, 
             u.profile as user_profile,
             u.verification_status,
             (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles,
             COUNT(*) OVER() as total
      FROM post_likes pl
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE pl.post_id = $1
      ORDER BY pl.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [postId, limit, offset]);

    return {
      likes: result.rows.map(row => this.mapRowToPostLike(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async delete(postId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2';
    const result = await db.query(query, [postId, userId]);
    return (result.rowCount || 0) > 0;
  }

  static async getLikeCount(postId: string): Promise<number> {
    const query = 'SELECT COUNT(*)::int as count FROM post_likes WHERE post_id = $1';
    const result = await db.query(query, [postId]);
    return result.rows[0].count || 0;
  }

  static async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2';
    const result = await db.query(query, [postId, userId]);
    return result.rows.length > 0;
  }

  static async getUserLikedPosts(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ postIds: string[]; total: number }> {
    const query = `
      SELECT pl.post_id,
             COUNT(*) OVER() as total
      FROM post_likes pl
      WHERE pl.user_id = $1
      ORDER BY pl.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    return {
      postIds: result.rows.map(row => row.post_id),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  private static mapRowToPostLike(row: any): PostLike {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      createdAt: row.created_at,
      user: row.user_profile ? {
        id: row.user_id,
        profile: row.user_profile,
        verificationStatus: (row.user_roles && row.user_roles.includes('admin')) ? 'verified' : (row.verification_status || 'unverified'),
        roles: row.user_roles || [],
      } : undefined,
    };
  }
}