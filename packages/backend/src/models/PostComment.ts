import { db } from '../database/connection';
import { PostComment } from '@vangarments/shared';

export interface CreatePostCommentData {
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
}

export interface UpdatePostCommentData {
  content?: string;
}

export class PostCommentModel {
  static async create(commentData: CreatePostCommentData): Promise<PostComment> {
    const { postId, userId, content, parentCommentId } = commentData;

    if (!content || content.trim().length === 0 || content.length > 500) {
      throw new Error('Comment content must be between 1 and 500 characters');
    }

    const query = `
      INSERT INTO post_comments (post_id, user_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [postId, userId, content.trim(), parentCommentId || null];
    const result = await db.query(query, values);
    return this.mapRowToPostComment(result.rows[0]);
  }

  static async findById(id: string): Promise<PostComment | null> {
    const query = `
      SELECT pc.*, 
             u.profile as user_profile
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToPostComment(result.rows[0]) : null;
  }

  static async findByPostId(
    postId: string,
    limit = 20,
    offset = 0
  ): Promise<{ comments: PostComment[]; total: number }> {
    const query = `
      SELECT pc.*, 
             u.profile as user_profile,
             COUNT(*) OVER() as total
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL
      ORDER BY pc.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [postId, limit, offset]);

    return {
      comments: result.rows.map(row => this.mapRowToPostComment(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async findReplies(
    parentCommentId: string,
    limit = 10,
    offset = 0
  ): Promise<{ comments: PostComment[]; total: number }> {
    const query = `
      SELECT pc.*, 
             u.profile as user_profile,
             COUNT(*) OVER() as total
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.parent_comment_id = $1
      ORDER BY pc.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [parentCommentId, limit, offset]);

    return {
      comments: result.rows.map(row => this.mapRowToPostComment(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async update(id: string, userId: string, updateData: UpdatePostCommentData): Promise<PostComment | null> {
    if (!updateData.content || updateData.content.trim().length === 0 || updateData.content.length > 500) {
      throw new Error('Comment content must be between 1 and 500 characters');
    }

    const query = `
      UPDATE post_comments 
      SET content = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [updateData.content.trim(), id, userId]);
    return result.rows.length > 0 ? this.mapRowToPostComment(result.rows[0]) : null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM post_comments WHERE id = $1 AND user_id = $2';
    const result = await db.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  static async getCommentCount(postId: string): Promise<number> {
    const query = 'SELECT COUNT(*)::int as count FROM post_comments WHERE post_id = $1';
    const result = await db.query(query, [postId]);
    return result.rows[0].count || 0;
  }

  private static mapRowToPostComment(row: any): PostComment {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      content: row.content,
      parentCommentId: row.parent_comment_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user_profile ? {
        id: row.user_id,
        profile: row.user_profile,
      } : undefined,
    };
  }
}