import { db } from '../database/connection';

export interface BusinessBadge {
  id: string;
  name: string;
  description: string;
  badgeType: 'verified_brand' | 'premium_partner' | 'custom';
  iconUrl?: string;
  color?: string;
  criteria?: {
    minSales?: number;
    minFollowers?: number;
    verificationRequired?: boolean;
    customCriteria?: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export interface CreateBusinessBadgeData {
  name: string;
  description: string;
  badgeType: 'verified_brand' | 'premium_partner' | 'custom';
  iconUrl?: string;
  color?: string;
  criteria?: {
    minSales?: number;
    minFollowers?: number;
    verificationRequired?: boolean;
    customCriteria?: string[];
  };
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  awardedBy?: string;
  reason?: string;
  badge?: BusinessBadge;
}

export class BusinessBadgeModel {
  static async create(badgeData: CreateBusinessBadgeData): Promise<BusinessBadge> {
    const { name, description, badgeType, iconUrl, color, criteria } = badgeData;

    const query = `
      INSERT INTO brand_badges (name, description, badge_type, icon_url, color, criteria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      name,
      description,
      badgeType,
      iconUrl || null,
      color || null,
      criteria ? JSON.stringify(criteria) : null,
    ];

    const result = await db.query(query, values);
    return this.mapRowToBusinessBadge(result.rows[0]);
  }

  static async findById(id: string): Promise<BusinessBadge | null> {
    const query = 'SELECT * FROM brand_badges WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToBusinessBadge(result.rows[0]) : null;
  }

  static async findAll(activeOnly = true): Promise<BusinessBadge[]> {
    let query = 'SELECT * FROM brand_badges';
    const values: any[] = [];

    if (activeOnly) {
      query += ' WHERE is_active = $1';
      values.push(true);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapRowToBusinessBadge(row));
  }

  static async findByType(badgeType: string): Promise<BusinessBadge[]> {
    const query = 'SELECT * FROM brand_badges WHERE badge_type = $1 AND is_active = true';
    const result = await db.query(query, [badgeType]);
    return result.rows.map(row => this.mapRowToBusinessBadge(row));
  }

  static async awardBadgeToUser(
    userId: string,
    badgeId: string,
    awardedBy?: string,
    reason?: string
  ): Promise<UserBadge> {
    // Check if user already has this badge
    const existingQuery = 'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2';
    const existingResult = await db.query(existingQuery, [userId, badgeId]);

    if (existingResult.rows.length > 0) {
      throw new Error('User already has this badge');
    }

    const query = `
      INSERT INTO user_badges (user_id, badge_id, awarded_by, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [userId, badgeId, awardedBy || null, reason || null];
    const result = await db.query(query, values);
    return this.mapRowToUserBadge(result.rows[0]);
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const query = `
      SELECT ub.*, bb.name, bb.description, bb.badge_type, bb.icon_url, bb.color
      FROM user_badges ub
      JOIN brand_badges bb ON ub.badge_id = bb.id
      WHERE ub.user_id = $1
      ORDER BY ub.awarded_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToUserBadge(row));
  }

  static async checkBadgeEligibility(userId: string, badgeId: string): Promise<{
    eligible: boolean;
    missingCriteria: string[];
  }> {
    const badge = await this.findById(badgeId);
    if (!badge || !badge.criteria) {
      return { eligible: false, missingCriteria: ['Badge not found or no criteria defined'] };
    }

    const missingCriteria: string[] = [];

    // Check verification requirement
    if (badge.criteria.verificationRequired) {
      const verificationQuery = `
        SELECT verification_status FROM brand_accounts WHERE user_id = $1
      `;
      const verificationResult = await db.query(verificationQuery, [userId]);

      if (verificationResult.rows.length === 0 || verificationResult.rows[0].verification_status !== 'verified') {
        missingCriteria.push('Brand verification required');
      }
    }

    // Check minimum sales
    if (badge.criteria.minSales) {
      // TODO: Implement sales checking logic
      // For now, assume user meets sales criteria
    }

    // Check minimum followers
    if (badge.criteria.minFollowers) {
      // TODO: Implement follower checking logic
      // For now, assume user meets follower criteria
    }

    return {
      eligible: missingCriteria.length === 0,
      missingCriteria,
    };
  }

  static async getAvailableBadges(userId: string): Promise<{
    earned: UserBadge[];
    available: BusinessBadge[];
  }> {
    const [earned, allBadges] = await Promise.all([
      this.getUserBadges(userId),
      this.findAll(true),
    ]);

    const earnedBadgeIds = earned.map(ub => ub.badgeId);
    const available = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

    return { earned, available };
  }

  private static mapRowToBusinessBadge(row: any): BusinessBadge {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      badgeType: row.badge_type,
      iconUrl: row.icon_url,
      color: row.color,
      criteria: row.criteria || {},
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  private static mapRowToUserBadge(row: any): UserBadge {
    return {
      id: row.id,
      userId: row.user_id,
      badgeId: row.badge_id,
      awardedAt: row.awarded_at,
      awardedBy: row.awarded_by,
      reason: row.reason,
      badge: row.name ? {
        id: row.badge_id,
        name: row.name,
        description: row.description,
        badgeType: row.badge_type,
        iconUrl: row.icon_url,
        color: row.color,
        criteria: {},
        isActive: true,
        createdAt: '',
      } : undefined,
    };
  }
}