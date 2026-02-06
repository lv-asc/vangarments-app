import { db } from '../database/connection';
import {
  MarketplaceListing,
  Transaction,
  MarketplaceFilters,
  SellerProfile,
  MarketplaceOffer,
  WatchlistItem
} from '@vangarments/shared/types/marketplace';

export interface CreateListingData {
  itemId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  condition: any;
  shipping: any;
  images: string[];
  category: string;
  tags?: string[];
  location: any;
  expiresAt?: Date;
}

export class MarketplaceModel {
  /**
   * Create new marketplace listing
   */
  static async createListing(data: CreateListingData): Promise<MarketplaceListing> {
    const query = `
      INSERT INTO marketplace_listings (
        item_id, seller_id, title, description, price, condition_info,
        shipping_options, images, category, tags, location, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      data.itemId,
      data.sellerId,
      data.title,
      data.description,
      data.price,
      JSON.stringify(data.condition),
      JSON.stringify(data.shipping),
      data.images,
      data.category,
      data.tags || [],
      JSON.stringify(data.location),
      data.expiresAt || null,
    ];

    const result = await db.query(query, values);
    return this.findById(result.rows[0].id) as Promise<MarketplaceListing | any>;
  }

  /**
   * Find listing by ID
   */
  static async findById(id: string): Promise<MarketplaceListing | null> {
    const query = `
      SELECT ml.*, COALESCE(vi.vufs_code, vc.vufs_code) as vufs_code,
             COALESCE(vi.metadata, vc.item_data) as vufs_item_data,
             COALESCE(vi.category_hierarchy->>'domain', vc.domain) as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_items vi ON ml.item_id = vi.id
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToListing(result.rows[0]);
  }

  /**
   * Find listing by Item Code (SKU)
   */
  static async findByCode(code: string): Promise<MarketplaceListing | null> {
    const query = `
      SELECT ml.*, COALESCE(vi.vufs_code, vc.vufs_code) as vufs_code,
             COALESCE(vi.metadata, vc.item_data) as vufs_item_data,
             COALESCE(vi.category_hierarchy->>'domain', vc.domain) as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_items vi ON ml.item_id = vi.id
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE vi.vufs_code = $1 OR vc.vufs_code = $1
      LIMIT 1
    `;
    const result = await db.query(query, [code]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToListing(result.rows[0]);
  }

  /**
   * Search marketplace listings with filters
   */
  static async searchListings(
    filters: MarketplaceFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ listings: MarketplaceListing[]; total: number }> {
    const whereConditions: string[] = ['status = $1'];
    const values: any[] = ['active'];
    let paramCount = 2;

    // Apply filters
    if (filters.category) {
      whereConditions.push(`category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    if (filters.brand) {
      whereConditions.push(`tags @> $${paramCount}`);
      values.push([filters.brand]);
      paramCount++;
    }

    if (filters.condition && filters.condition.length > 0) {
      whereConditions.push(`condition_info->>'status' = ANY($${paramCount})`);
      values.push(filters.condition);
      paramCount++;
    }

    if (filters.priceRange) {
      whereConditions.push(`price BETWEEN $${paramCount} AND $${paramCount + 1}`);
      values.push(filters.priceRange.min, filters.priceRange.max);
      paramCount += 2;
    }

    if (filters.search) {
      whereConditions.push(`(
        title ILIKE $${paramCount} OR 
        description ILIKE $${paramCount} OR
        $${paramCount + 1} = ANY(tags)
      )`);
      values.push(`%${filters.search}%`, filters.search);
      paramCount += 2;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM marketplace_listings ml WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get listings with sorting
    let orderBy = 'ml.created_at DESC';
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
          orderBy = 'ml.price ASC';
          break;
        case 'price_high':
          orderBy = 'ml.price DESC';
          break;
        case 'newest':
          orderBy = 'ml.created_at DESC';
          break;
        case 'most_watched':
          orderBy = 'ml.watchers DESC';
          break;
      }
    }

    const listingsQuery = `
      SELECT ml.*, COALESCE(vi.vufs_code, vc.vufs_code) as vufs_code
      FROM marketplace_listings ml
      LEFT JOIN vufs_items vi ON ml.item_id = vi.id
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    const finalValues = [...values, limit, offset];

    const listingsResult = await db.query(listingsQuery, finalValues);
    const listings = listingsResult.rows.map(row => this.mapToListing(row));

    return { listings, total };
  }

  /**
   * Get seller's listings
   */
  static async getSellerListings(sellerId: string, status?: string): Promise<MarketplaceListing[]> {
    let query = `
      SELECT ml.*, COALESCE(vi.vufs_code, vc.vufs_code) as vufs_code
      FROM marketplace_listings ml
      LEFT JOIN vufs_items vi ON ml.item_id = vi.id
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ml.seller_id = $1
    `;
    const values: any[] = [sellerId];

    if (status) {
      query += ' AND ml.status = $2';
      values.push(status);
    }

    query += ' ORDER BY ml.created_at DESC';

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToListing(row));
  }

  /**
   * Update listing
   */
  static async updateListing(id: string, updateData: Partial<CreateListingData>): Promise<MarketplaceListing | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.title) {
      updates.push(`title = $${paramCount}`);
      values.push(updateData.title);
      paramCount++;
    }

    if (updateData.description) {
      updates.push(`description = $${paramCount}`);
      values.push(updateData.description);
      paramCount++;
    }

    if (updateData.price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(updateData.price);
      paramCount++;
    }

    if (updateData.condition) {
      updates.push(`condition_info = $${paramCount}`);
      values.push(JSON.stringify(updateData.condition));
      paramCount++;
    }

    if (updateData.shipping) {
      updates.push(`shipping_options = $${paramCount}`);
      values.push(JSON.stringify(updateData.shipping));
      paramCount++;
    }

    if (updateData.images) {
      updates.push(`images = $${paramCount}`);
      values.push(updateData.images);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE marketplace_listings 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToListing(result.rows[0]);
  }

  /**
   * Update listing status
   */
  static async updateStatus(id: string, status: string): Promise<MarketplaceListing | null> {
    const query = `
      UPDATE marketplace_listings 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToListing(result.rows[0]);
  }

  /**
   * Increment view count
   */
  static async incrementViews(id: string): Promise<void> {
    const query = `
      UPDATE marketplace_listings 
      SET views = views + 1, updated_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  /**
   * Toggle like
   */
  static async toggleLike(listingId: string, userId: string): Promise<boolean> {
    // Check if already liked
    const checkQuery = 'SELECT id FROM listing_likes WHERE listing_id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [listingId, userId]);

    if (checkResult.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM listing_likes WHERE listing_id = $1 AND user_id = $2', [listingId, userId]);
      await db.query('UPDATE marketplace_listings SET likes = likes - 1 WHERE id = $1', [listingId]);
      return false;
    } else {
      // Like
      await db.query('INSERT INTO listing_likes (listing_id, user_id) VALUES ($1, $2)', [listingId, userId]);
      await db.query('UPDATE marketplace_listings SET likes = likes + 1 WHERE id = $1', [listingId]);
      return true;
    }
  }

  /**
   * Create transaction
   */
  static async createTransaction(transactionData: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    fees: any;
    shippingAddress: any;
    paymentMethod: string;
  }): Promise<Transaction> {
    const netAmount = transactionData.amount - transactionData.fees.platformFee - transactionData.fees.paymentFee;

    const query = `
      INSERT INTO marketplace_transactions (
        listing_id, buyer_id, seller_id, amount, fees, net_amount,
        shipping_address, payment_method, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      transactionData.listingId,
      transactionData.buyerId,
      transactionData.sellerId,
      transactionData.amount,
      JSON.stringify(transactionData.fees),
      netAmount,
      JSON.stringify(transactionData.shippingAddress),
      transactionData.paymentMethod,
      'pending_payment',
    ];

    const result = await db.query(query, values);
    return this.mapToTransaction(result.rows[0]);
  }

  /**
   * Get seller profile
   */
  static async getSellerProfile(userId: string): Promise<SellerProfile | null> {
    const query = `
      SELECT 
        u.id, u.profile->>'name' as display_name,
        COUNT(ml.id) as total_listings,
        COUNT(CASE WHEN mt.status = 'completed' THEN 1 END) as total_sales,
        AVG(mr.rating) as rating,
        u.created_at as member_since
      FROM users u
      LEFT JOIN marketplace_listings ml ON u.id = ml.seller_id
      LEFT JOIN marketplace_transactions mt ON u.id = mt.seller_id
      LEFT JOIN marketplace_reviews mr ON u.id = mr.reviewee_id AND mr.type = 'buyer_to_seller'
      WHERE u.id = $1
      GROUP BY u.id, u.profile, u.created_at
    `;

    const result = await db.query(query, [userId]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.id,
      displayName: row.display_name || 'Anonymous Seller',
      rating: parseFloat(row.rating) || 0,
      totalSales: parseInt(row.total_sales) || 0,
      totalListings: parseInt(row.total_listings) || 0,
      memberSince: new Date(row.member_since),
      verificationStatus: {
        email: true, // Would be determined from user data
        phone: false,
        identity: false,
        address: false,
      },
      badges: [], // Would be calculated based on performance
      policies: {
        returnPolicy: 'Standard return policy',
        shippingPolicy: 'Ships within 1-2 business days',
        communicationStyle: 'Responsive and professional',
      },
      stats: {
        responseTime: 2, // hours
        shippingTime: 1, // days
        positiveRating: 95, // percentage
      },
    };
  }

  /**
   * Delete listing
   */
  static async deleteListing(id: string): Promise<boolean> {
    const query = 'DELETE FROM marketplace_listings WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  private static mapToListing(row: any): MarketplaceListing {
    const condition = typeof row.condition_info === 'string'
      ? JSON.parse(row.condition_info)
      : row.condition_info;

    const shipping = typeof row.shipping_options === 'string'
      ? JSON.parse(row.shipping_options)
      : row.shipping_options;

    const location = typeof row.location === 'string'
      ? JSON.parse(row.location)
      : row.location;

    return {
      id: row.id,
      itemId: row.item_id,
      itemCode: row.vufs_code,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      currency: row.currency || 'BRL',
      condition,
      shipping,
      images: row.images || [],
      status: row.status,
      views: row.views || 0,
      likes: row.likes || 0,
      watchers: row.watchers || 0,
      category: row.category,
      tags: row.tags || [],
      location,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }

  private static mapToTransaction(row: any): Transaction {
    const fees = typeof row.fees === 'string' ? JSON.parse(row.fees) : row.fees;
    const shippingAddress = typeof row.shipping_address === 'string'
      ? JSON.parse(row.shipping_address)
      : row.shipping_address;

    return {
      id: row.id,
      listingId: row.listing_id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      amount: parseFloat(row.amount),
      currency: row.currency || 'BRL',
      fees,
      netAmount: parseFloat(row.net_amount),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentId: row.payment_id,
      shipping: {
        address: shippingAddress,
        method: row.shipping_method || 'standard',
        trackingNumber: row.tracking_number,
        estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : undefined,
        actualDelivery: row.actual_delivery ? new Date(row.actual_delivery) : undefined,
      },
      timeline: [], // Would be populated from transaction_events table
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}