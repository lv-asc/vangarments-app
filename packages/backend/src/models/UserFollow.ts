import { db } from '../database/connection';
import { UserFollow, UserProfile } from '@vangarments/shared';

export interface CreateUserFollowData {
  followerId: string;
  followingId: string;
}

export class UserFollowModel {
  static async create(followData: CreateUserFollowData): Promise<UserFollow> {
    const { followerId, followingId } = followData;

    if (followerId === followingId) {
      throw new Error('Users cannot follow themselves');
    }

    // Check if already following
    const existing = await this.findByIds(followerId, followingId);
    if (existing) {
      throw new Error('Already following this user');
    }

    const query = `
      INSERT INTO user_follows (follower_id, following_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await db.query(query, [followerId, followingId]);
    return this.mapRowToUserFollow(result.rows[0]);
  }

  static async findByIds(followerId: string, followingId: string): Promise<UserFollow | null> {
    const query = `
      SELECT uf.*, 
             follower.profile as follower_profile,
             following.profile as following_profile
      FROM user_follows uf
      LEFT JOIN users follower ON uf.follower_id = follower.id
      LEFT JOIN users following ON uf.following_id = following.id
      WHERE uf.follower_id = $1 AND uf.following_id = $2
    `;

    const result = await db.query(query, [followerId, followingId]);
    return result.rows.length > 0 ? this.mapRowToUserFollow(result.rows[0]) : null;
  }

  static async getFollowers(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: UserProfile[]; total: number }> {
    const query = `
      SELECT u.id, u.profile,
             COUNT(*) OVER() as total
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      WHERE uf.following_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    
    return {
      users: result.rows.map(row => ({
        id: row.id,
        profile: row.profile,
      })),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async getFollowing(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: UserProfile[]; total: number }> {
    const query = `
      SELECT u.id, u.profile,
             COUNT(*) OVER() as total
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    
    return {
      users: result.rows.map(row => ({
        id: row.id,
        profile: row.profile,
      })),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async delete(followerId: string, followingId: string): Promise<boolean> {
    const query = 'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const result = await db.query(query, [followerId, followingId]);
    return result.rowCount > 0;
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const result = await db.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  }

  static async getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    const query = `
      SELECT 
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) as following_count
    `;

    const result = await db.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
    };
  }

  static async getFollowingIds(userId: string): Promise<string[]> {
    const query = 'SELECT following_id FROM user_follows WHERE follower_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.following_id);
  }

  private static mapRowToUserFollow(row: any): UserFollow {
    return {
      id: row.id,
      followerId: row.follower_id,
      followingId: row.following_id,
      createdAt: row.created_at,
      follower: row.follower_profile ? {
        id: row.follower_id,
        profile: row.follower_profile,
      } : undefined,
      following: row.following_profile ? {
        id: row.following_id,
        profile: row.following_profile,
      } : undefined,
    };
  }
}