import { db } from '../database/connection';

export interface BrandInfo {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  banner?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  brandColors?: string[];
  brandStyle?: string[];
}

export interface BrandAccount {
  id: string;
  userId: string;
  brandInfo: BrandInfo;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  partnershipTier: 'basic' | 'premium' | 'enterprise';
  badges: string[];
  analytics: {
    totalCatalogItems: number;
    totalSales: number;
    totalCommission: number;
    monthlyViews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandAccountData {
  userId: string;
  brandInfo: BrandInfo;
  partnershipTier?: 'basic' | 'premium' | 'enterprise';
}

export interface UpdateBrandAccountData {
  brandInfo?: Partial<BrandInfo>;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  partnershipTier?: 'basic' | 'premium' | 'enterprise';
  badges?: string[];
}

export class BrandAccountModel {
  static async create(brandData: CreateBrandAccountData): Promise<BrandAccount> {
    const { userId, brandInfo, partnershipTier = 'basic' } = brandData;

    // Check if user already has a brand account
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new Error('User already has a brand account');
    }

    const query = `
      INSERT INTO brand_accounts (user_id, brand_info, partnership_tier, verification_status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      userId,
      JSON.stringify(brandInfo),
      partnershipTier,
      'pending',
    ];

    const result = await db.query(query, values);
    return this.mapRowToBrandAccount(result.rows[0]);
  }

  static async findById(id: string): Promise<BrandAccount | null> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (
               SELECT COUNT(*)::int FROM brand_catalog_items bci WHERE bci.brand_id = ba.id
             ) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async findByUserId(userId: string): Promise<BrandAccount | null> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (
               SELECT COUNT(*)::int FROM brand_catalog_items bci WHERE bci.brand_id = ba.id
             ) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async findMany(
    filters: {
      verificationStatus?: 'pending' | 'verified' | 'rejected';
      partnershipTier?: 'basic' | 'premium' | 'enterprise';
      search?: string;
    } = {},
    limit = 20,
    offset = 0
  ): Promise<{ brands: BrandAccount[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filters.verificationStatus) {
      whereConditions.push(`ba.verification_status = $${paramIndex++}`);
      values.push(filters.verificationStatus);
    }

    if (filters.partnershipTier) {
      whereConditions.push(`ba.partnership_tier = $${paramIndex++}`);
      values.push(filters.partnershipTier);
    }

    if (filters.search) {
      whereConditions.push(`ba.brand_info->>'name' ILIKE $${paramIndex++}`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (
               SELECT COUNT(*)::int FROM brand_catalog_items bci WHERE bci.brand_id = ba.id
             ) as catalog_items_count,
             COUNT(*) OVER() as total
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      ${whereClause}
      ORDER BY ba.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      brands: result.rows.map(row => this.mapRowToBrandAccount(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async update(id: string, updateData: UpdateBrandAccountData): Promise<BrandAccount | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.brandInfo) {
      // Get current brand info and merge with updates
      const current = await this.findById(id);
      if (!current) return null;

      const updatedBrandInfo = {
        ...current.brandInfo,
        ...updateData.brandInfo,
      };

      setClause.push(`brand_info = $${paramIndex++}`);
      values.push(JSON.stringify(updatedBrandInfo));
    }

    if (updateData.verificationStatus) {
      setClause.push(`verification_status = $${paramIndex++}`);
      values.push(updateData.verificationStatus);
    }

    if (updateData.partnershipTier) {
      setClause.push(`partnership_tier = $${paramIndex++}`);
      values.push(updateData.partnershipTier);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE brand_accounts 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM brand_accounts WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getAnalytics(brandId: string): Promise<{
    catalogItems: number;
    totalSales: number;
    totalCommission: number;
    monthlyViews: number;
    topSellingItems: any[];
    revenueByMonth: Array<{ month: string; revenue: number; commission: number }>;
  }> {
    // Get catalog items count
    const catalogQuery = 'SELECT COUNT(*)::int as count FROM brand_catalog_items WHERE brand_id = $1';
    const catalogResult = await db.query(catalogQuery, [brandId]);
    const catalogItems = catalogResult.rows[0].count;

    // Get sales and commission data (simplified for now)
    // In a real implementation, this would query actual transaction data
    const salesQuery = `
      SELECT 
        COALESCE(SUM(amount), 0)::decimal as total_sales,
        COALESCE(SUM(amount * 0.05), 0)::decimal as total_commission
      FROM marketplace_transactions mt
      JOIN marketplace_listings ml ON mt.listing_id = ml.id
      JOIN brand_catalog_items bci ON ml.item_id = bci.vufs_item_id
      WHERE bci.brand_id = $1 AND mt.status = 'completed'
    `;

    const salesResult = await db.query(salesQuery, [brandId]);
    const salesData = salesResult.rows[0];

    // Mock monthly views for now
    const monthlyViews = Math.floor(Math.random() * 10000) + 1000;

    return {
      totalCatalogItems: catalogItems,
      totalSales: parseFloat(salesData.total_sales || '0'),
      totalCommission: parseFloat(salesData.total_commission || '0'),
      monthlyViews,
      topSellingItems: [], // TODO: Implement top selling items query
      revenueByMonth: [], // TODO: Implement monthly revenue breakdown
    };
  }

  static async addBadge(brandId: string, badge: string): Promise<void> {
    const query = `
      UPDATE brand_accounts 
      SET badges = COALESCE(badges, '[]'::jsonb) || $2::jsonb
      WHERE id = $1 AND NOT (badges @> $2::jsonb)
    `;

    await db.query(query, [brandId, JSON.stringify([badge])]);
  }

  static async removeBadge(brandId: string, badge: string): Promise<void> {
    const query = `
      UPDATE brand_accounts 
      SET badges = badges - $2
      WHERE id = $1
    `;

    await db.query(query, [brandId, badge]);
  }

  private static mapRowToBrandAccount(row: any): BrandAccount {
    return {
      id: row.id,
      userId: row.user_id,
      brandInfo: row.brand_info,
      verificationStatus: row.verification_status,
      partnershipTier: row.partnership_tier,
      badges: row.badges || [],
      analytics: {
        totalCatalogItems: row.catalog_items_count || 0,
        totalSales: 0, // Will be populated by getAnalytics
        totalCommission: 0,
        monthlyViews: 0,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}