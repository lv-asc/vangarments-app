import { db } from '../database/connection';
import { UserFollow, UserProfile } from '@vangarments/shared';
import { UserModel } from './User';

export interface CreateUserFollowData {
  followerId: string;
  followingId: string;
  status?: 'pending' | 'accepted';
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
      if (existing.status === 'pending') {
        throw new Error('Follow request already pending');
      }
      throw new Error('Already following this user');
    }

    // Check if target user has a private profile - if so, set status to pending
    const targetUser = await UserModel.findById(followingId);
    let finalStatus: 'pending' | 'accepted' = followData.status || 'accepted';

    if (targetUser?.privacySettings?.isPrivate) {
      finalStatus = 'pending';
    }

    const query = `
      INSERT INTO user_follows (follower_id, following_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [followerId, followingId, finalStatus]);
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
    offset = 0,
    search?: string
  ): Promise<{ users: UserProfile[]; total: number }> {
    let query = `
      SELECT u.*, array_agg(ur.role) as roles,
             COUNT(*) OVER() as total
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE uf.following_id = $1 AND uf.status = 'accepted'
    `;
    const params: any[] = [userId];

    if (search) {
      query += ` AND (u.username ILIKE $${params.length + 1} OR (u.profile->>'name') ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at, uf.created_at
      ORDER BY uf.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      users: result.rows.map(row => UserModel.mapToUserProfile(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async getFollowing(
    userId: string,
    limit = 20,
    offset = 0,
    search?: string
  ): Promise<{ users: UserProfile[]; total: number }> {
    let query = `
      SELECT u.*, array_agg(ur.role) as roles,
             COUNT(*) OVER() as total
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE uf.follower_id = $1 AND uf.status = 'accepted'
    `;
    const params: any[] = [userId];

    if (search) {
      query += ` AND (u.username ILIKE $${params.length + 1} OR (u.profile->>'name') ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at, uf.created_at
      ORDER BY uf.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      users: result.rows.map(row => UserModel.mapToUserProfile(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async getFriends(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: UserProfile[]; total: number }> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles,
             COUNT(*) OVER() as total
      FROM user_follows uf1
      JOIN user_follows uf2 ON uf1.follower_id = uf2.following_id AND uf1.following_id = uf2.follower_id
      JOIN users u ON uf1.following_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE uf1.follower_id = $1 AND uf1.status = 'accepted' AND uf2.status = 'accepted'
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at, uf1.created_at
      ORDER BY uf1.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    return {
      users: result.rows.map(row => UserModel.mapToUserProfile(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async getMutualConnections(
    viewerId: string,
    targetUserId: string,
    limit = 3
  ): Promise<{ users: UserProfile[]; total: number }> {
    // Find users who:
    // 1. Are followed by viewerId (uf1)
    // 2. Are following targetUserId (uf2)
    const query = `
      SELECT u.*, array_agg(ur.role) as roles,
             COUNT(*) OVER() as total
      FROM users u
      JOIN user_follows uf1 ON u.id = uf1.following_id   -- Viewer follows U
      JOIN user_follows uf2 ON u.id = uf2.follower_id    -- U follows Target
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE uf1.follower_id = $1 
        AND uf2.following_id = $2
        AND uf1.status = 'accepted'
        AND uf2.status = 'accepted'
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at
      LIMIT $3
    `;

    const result = await db.query(query, [viewerId, targetUserId, limit]);

    return {
      users: result.rows.map(row => UserModel.mapToUserProfile(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async delete(followerId: string, followingId: string): Promise<boolean> {
    const query = 'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const result = await db.query(query, [followerId, followingId]);
    return (result.rowCount || 0) > 0;
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2 AND status = \'accepted\'';
    const result = await db.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  }

  static async getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number; friendsCount: number; pendingCount: number }> {
    const query = `
      SELECT 
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1 AND status = 'accepted') as followers_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1 AND status = 'accepted') as following_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1 AND status = 'pending') as pending_count,
        (SELECT COUNT(*)::int FROM user_follows uf1 
         JOIN user_follows uf2 ON uf1.follower_id = uf2.following_id AND uf1.following_id = uf2.follower_id
         WHERE uf1.follower_id = $1 AND uf1.status = 'accepted' AND uf2.status = 'accepted') as friends_count
    `;

    const result = await db.query(query, [userId]);
    const row = result.rows[0];

    return {
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      friendsCount: row.friends_count || 0,
      pendingCount: row.pending_count || 0,
    };
  }

  static async getFollowingIds(userId: string): Promise<string[]> {
    const query = 'SELECT following_id FROM user_follows WHERE follower_id = $1 AND status = \'accepted\'';
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.following_id);
  }

  static async updateStatus(followerId: string, followingId: string, status: 'accepted' | 'pending'): Promise<boolean> {
    const query = `
      UPDATE user_follows 
      SET status = $3, updated_at = NOW()
      WHERE follower_id = $1 AND following_id = $2
      RETURNING id
    `;
    const result = await db.query(query, [followerId, followingId, status]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get pending follow requests for a user (users who want to follow them)
   */
  static async getPendingFollowRequests(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: UserProfile[]; total: number }> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles,
             COUNT(*) OVER() as total,
             uf.created_at as requested_at
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE uf.following_id = $1 AND uf.status = 'pending'
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at, uf.created_at
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    return {
      users: result.rows.map(row => ({
        ...UserModel.mapToUserProfile(row),
        requestedAt: row.requested_at,
      })),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  /**
   * Get follow status between two users
   * Returns: 'none' | 'pending' | 'accepted'
   */
  static async getFollowStatus(followerId: string, followingId: string): Promise<'none' | 'pending' | 'accepted'> {
    const query = 'SELECT status FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const result = await db.query(query, [followerId, followingId]);

    if (result.rows.length === 0) {
      return 'none';
    }

    return result.rows[0].status as 'pending' | 'accepted';
  }

  /**
   * Accept a follow request
   */
  static async acceptFollowRequest(followerId: string, followingId: string): Promise<boolean> {
    return this.updateStatus(followerId, followingId, 'accepted');
  }

  /**
   * Decline/delete a follow request
   */
  static async declineFollowRequest(followerId: string, followingId: string): Promise<boolean> {
    return this.delete(followerId, followingId);
  }

  /**
   * Get count of pending follow requests for a user
   */
  static async getPendingFollowRequestCount(userId: string): Promise<number> {
    const query = 'SELECT COUNT(*)::int as count FROM user_follows WHERE following_id = $1 AND status = \'pending\'';
    const result = await db.query(query, [userId]);
    return result.rows[0].count || 0;
  }


  private static mapRowToUserFollow(row: any): UserFollow {
    return {
      id: row.id,
      followerId: row.follower_id,
      followingId: row.following_id,
      status: row.status as 'pending' | 'accepted',
      createdAt: row.created_at,
      follower: row.follower_profile ? {
        id: row.follower_id,
        profile: row.follower_profile,
      } : undefined,
      following: row.following_profile ? {
        id: row.following_id,
        profile: row.following_profile,
      } : undefined,
    } as UserFollow;
  }
}