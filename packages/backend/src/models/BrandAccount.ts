import { db } from '../database/connection';

export interface BrandInfo {
  name: string;
  slug?: string; // URL friendly identifier
  description?: string;
  website?: string;
  logo?: string;
  banner?: string;
  banners?: Array<{
    url: string;
    positionY?: number; // 0-100
  }>; // Array of banner objects
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
  country?: string; // Country of origin
  tags?: string[]; // Brand tags (e.g. Small, Independent, etc.)
  businessType?: 'brand' | 'store' | 'designer' | 'manufacturer' | 'non_profit';
}

export interface BrandProfileData {
  bio?: string;
  foundedDate?: string; // ISO date string
  foundedDatePrecision?: 'year' | 'month' | 'day'; // Display precision for foundedDate
  foundedBy?: string; // Founder name(s)
  instagram?: string; // Username or full URL
  tiktok?: string;
  youtube?: string;
  additionalLogos?: string[]; // Array of logo URLs
  logoMetadata?: Array<{ url: string; name: string }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

export interface BrandAccount {
  id: string;
  userId: string;
  brandInfo: BrandInfo;
  profileData?: BrandProfileData;
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
  deletedAt?: string;
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
  userId?: string | null;
}

export class BrandAccountModel {
  static async create(brandData: CreateBrandAccountData): Promise<BrandAccount> {
    const { userId, brandInfo, partnershipTier = 'basic' } = brandData;

    // Auto-generate slug if not provided
    if (!brandInfo.slug && brandInfo.name) {
      // Dynamic import to avoid circular dependency issues if any, though utils should be fine.
      // But let's use standard import at top of file ideally. For now doing inline to match instruction scope if I can't see top.
      // Actually I will assume I added the import at the top in a separate edit or I can use full path if needed but cleaner to import.
      // I'll stick to the existing logic structure but add the slug generation.
      const { slugify } = await import('../utils/slugify');
      brandInfo.slug = slugify(brandInfo.name);
    }

    // Users can have multiple brand accounts - no restriction

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
    const brand = this.mapRowToBrandAccount(result.rows[0]);

    // Ensure owner follows @v
    try {
      const vRes = await db.query("SELECT id FROM users WHERE username = 'v'");
      if (vRes.rows.length > 0) {
        const vId = vRes.rows[0].id;
        if (userId !== vId) {
          await db.query(`
            INSERT INTO user_follows (follower_id, following_id, status)
            VALUES ($1, $2, 'accepted')
            ON CONFLICT (follower_id, following_id) DO NOTHING
          `, [userId, vId]);
        }
      }
    } catch (e) {
      console.error('Error auto-following @v from brand creation:', e);
    }

    return brand;
  }

  static async findById(id: string): Promise<BrandAccount | null> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.id = $1 AND ba.deleted_at IS NULL
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async findBySlugOrId(identifier: string): Promise<BrandAccount | null> {
    // Check if identifier is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUUID) {
      return this.findById(identifier);
    }

    // Try to find by slug first, then by name (approximate slug match)
    const { slugify } = await import('../utils/slugify');
    const slug = slugify(identifier);

    // We also keep the original name fallback for loose matching if needed, but slug logic is preferred.
    const nameFallback = identifier.replace(/-/g, ' ');

    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE (
        ba.brand_info->>'slug' = $1 
        OR ba.brand_info->>'slug' = $2
        OR ba.brand_info->>'name' ILIKE $3
      ) 
      AND ba.deleted_at IS NULL
      LIMIT 1
    `;

    const result = await db.query(query, [identifier, slug, nameFallback]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async findByUserId(userId: string): Promise<BrandAccount | null> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.user_id = $1 AND ba.deleted_at IS NULL
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async findAllByUserId(userId: string): Promise<BrandAccount[]> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.user_id = $1 AND ba.deleted_at IS NULL
      ORDER BY ba.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToBrandAccount(row));
  }

  static async findMany(
    filters: {
      verificationStatus?: 'pending' | 'verified' | 'rejected';
      partnershipTier?: 'basic' | 'premium' | 'enterprise';
      businessType?: 'brand' | 'store' | 'designer' | 'manufacturer';
      search?: string;
    } = {},
    limit = 20,
    offset = 0
  ): Promise<{ brands: BrandAccount[]; total: number }> {
    const whereConditions: string[] = ['ba.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.verificationStatus) {
      whereConditions.push(`ba.verification_status = $${paramIndex++}`);
      values.push(filters.verificationStatus);
    }

    if (filters.partnershipTier) {
      whereConditions.push(`ba.partnership_tier = $${paramIndex++}`);
      values.push(filters.partnershipTier);
    }

    if (filters.businessType) {
      if (filters.businessType === 'brand') {
        // For brands, we include those explicitly marked as 'brand' OR those with no businessType (legacy/default)
        whereConditions.push(`(ba.brand_info->>'businessType' = $${paramIndex++} OR ba.brand_info->>'businessType' IS NULL)`);
        values.push(filters.businessType);
      } else {
        // For other types (store, etc.), we require explicit match
        whereConditions.push(`ba.brand_info->>'businessType' = $${paramIndex++}`);
        values.push(filters.businessType);
      }
    }

    if (filters.search) {
      whereConditions.push(`ba.brand_info->>'name' ILIKE $${paramIndex++}`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count,
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

      // Ensure slug exists if we have a name
      if (!updatedBrandInfo.slug && updatedBrandInfo.name) {
        const { slugify } = await import('../utils/slugify');
        updatedBrandInfo.slug = slugify(updatedBrandInfo.name);
      }

      setClause.push(`brand_info = $${paramIndex++}`);
      values.push(JSON.stringify(updatedBrandInfo));
    }

    if (updateData.verificationStatus !== undefined) {
      setClause.push(`verification_status = $${paramIndex++}`);
      values.push(updateData.verificationStatus);
    }

    if (updateData.partnershipTier) {
      setClause.push(`partnership_tier = $${paramIndex++}`);
      values.push(updateData.partnershipTier);
    }

    if (updateData.badges) {
      setClause.push(`badges = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.badges));
    }

    if (updateData.userId !== undefined) {
      setClause.push(`user_id = $${paramIndex++}`);
      values.push(updateData.userId);
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

  static async softDelete(id: string): Promise<boolean> {
    const query = 'UPDATE brand_accounts SET deleted_at = NOW() WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async restore(id: string): Promise<boolean> {
    const query = 'UPDATE brand_accounts SET deleted_at = NULL WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async findDeleted(): Promise<BrandAccount[]> {
    const query = `
      SELECT ba.*, 
             u.profile as user_profile,
             (SELECT COUNT(*)::int FROM sku_items si WHERE si.brand_id = ba.id AND si.deleted_at IS NULL) as catalog_items_count
      FROM brand_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE ba.deleted_at IS NOT NULL
      ORDER BY ba.deleted_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map(row => this.mapRowToBrandAccount(row));
  }

  static async updateProfileData(brandId: string, profileData: Partial<BrandProfileData>): Promise<BrandAccount | null> {
    // Merge with existing profile data
    const existing = await this.findById(brandId);
    if (!existing) return null;

    const mergedProfileData = {
      ...(existing.profileData || {}),
      ...profileData
    };

    const query = `
      UPDATE brand_accounts
      SET profile_data = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [JSON.stringify(mergedProfileData), brandId]);
    return result.rows.length > 0 ? this.mapRowToBrandAccount(result.rows[0]) : null;
  }

  static async getFullProfile(brandId: string): Promise<{
    brand: BrandAccount;
    team: any[];
    lookbooks: any[];
    collections: any[];
    followerCount: number;
  } | null> {
    const brand = await this.findBySlugOrId(brandId);
    if (!brand) return null;

    // Import dependencies dynamically to avoid circular imports
    const { BrandTeamModel } = await import('./BrandTeam');
    const { BrandLookbookModel } = await import('./BrandLookbook');
    const { BrandCollectionModel } = await import('./BrandCollection');
    const { EntityFollowModel } = await import('./EntityFollow');

    // Determine entity type based on business type
    const businessType = brand.brandInfo.businessType || 'brand';
    const entityType = businessType === 'store' ? 'store' : 'brand';

    const [team, lookbooks, collections, followerCount] = await Promise.all([
      BrandTeamModel.getTeamMembers(brand.id, true), // Public only - use resolved ID
      BrandLookbookModel.findByBrand(brand.id, true), // Published only - use resolved ID
      BrandCollectionModel.findByBrand(brand.id, true), // Published only - use resolved ID
      EntityFollowModel.getFollowerCount(entityType, brand.id)
    ]);

    return { brand, team, lookbooks, collections, followerCount };
  }

  static async getAnalytics(brandId: string): Promise<{
    catalogItems: number;
    totalSales: number;
    totalCommission: number;
    monthlyViews: number;
    topSellingItems: any[];
    revenueByMonth: Array<{ month: string; revenue: number; commission: number }>;
  }> {
    // Get catalog items count from sku_items table
    const catalogQuery = `
      SELECT COUNT(*)::int as count FROM sku_items WHERE brand_id = $1 AND deleted_at IS NULL
    `;
    const catalogResult = await db.query(catalogQuery, [brandId]);
    const catalogItems = catalogResult.rows[0]?.count || 0;

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
      catalogItems: catalogItems,
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

  static async syncFromVufs(systemUserId: string): Promise<number> {
    // Ensure system user follows @v
    try {
      const vRes = await db.query("SELECT id FROM users WHERE username = 'v'");
      if (vRes.rows.length > 0) {
        const vId = vRes.rows[0].id;
        if (systemUserId !== vId) {
          await db.query(`
            INSERT INTO user_follows (follower_id, following_id, status)
            VALUES ($1, $2, 'accepted')
            ON CONFLICT (follower_id, following_id) DO NOTHING
          `, [systemUserId, vId]);
        }
      }
    } catch (e) {
      console.error('Error ensuring system user follows @v:', e);
    }

    // 1. Get all active vufs_brands
    const vufsQuery = `
      SELECT id, name, type 
      FROM vufs_brands 
      WHERE is_active = true
    `;
    const vufsResult = await db.query(vufsQuery);
    const vufsBrands = vufsResult.rows;

    let syncedCount = 0;

    // 2. Iterate and sync
    for (const vBrand of vufsBrands) {
      // Check if brand already exists in brand_accounts (by name match for now)
      // In a more robust system, we might store vufs_brand_id in brand_accounts
      const checkQuery = `
        SELECT id FROM brand_accounts 
        WHERE brand_info->>'name' ILIKE $1
      `;
      const checkResult = await db.query(checkQuery, [vBrand.name]);

      if (checkResult.rows.length === 0) {
        try {
          // Create new brand account
          const { slugify } = require('../utils/slugify');
          const brandInfo: BrandInfo = {
            name: vBrand.name,
            slug: slugify(vBrand.name),
            description: `Official ${vBrand.name} brand account`,
            businessType: 'brand', // Explicitly set type to brand
            // Add default styling or placeholders if needed
          };

          const insertQuery = `
            INSERT INTO brand_accounts (user_id, brand_info, partnership_tier, verification_status)
            VALUES ($1, $2, $3, $4)
            `;

          await db.query(insertQuery, [
            systemUserId,
            JSON.stringify(brandInfo),
            'basic', // Default tier
            'verified' // Auto-verify VUFS brands
          ]);
          syncedCount++;
        } catch (err) {
          console.error(`❌ Error syncing brand ${vBrand.name}:`, err);
        }
      }
    }

    return syncedCount;
  }

  private static mapRowToBrandAccount(row: any): BrandAccount {
    const brandInfo = row.brand_info;
    const { slugify } = require('../utils/slugify');

    if (brandInfo && !brandInfo.slug && brandInfo.name) {
      brandInfo.slug = slugify(brandInfo.name);
    }

    return {
      id: row.id,
      userId: row.user_id,
      brandInfo: brandInfo,
      profileData: row.profile_data || undefined,
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
      deletedAt: row.deleted_at
    };
  }
}