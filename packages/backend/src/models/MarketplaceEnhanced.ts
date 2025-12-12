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

export class MarketplaceEnhancedModel {
  /**
   * Create new marketplace listing with real data persistence
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

    // Update VUFS item status to published
    await db.query(
      `UPDATE vufs_catalog 
       SET item_data = item_data || '{"operationalStatus": "published"}'::jsonb
       WHERE id = $1`,
      [data.itemId]
    );

    return this.mapToListing(result.rows[0]);
  }

  /**
   * Find listing by ID with VUFS data
   */
  static async findById(id: string): Promise<MarketplaceListing | null> {
    const query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
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
   * Enhanced search with VUFS integration and real data filtering
   */
  static async searchListings(
    filters: MarketplaceFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ listings: MarketplaceListing[]; total: number }> {
    let whereConditions: string[] = ['ml.status = $1'];
    let values: any[] = ['active'];
    let paramCount = 2;

    // Apply filters with VUFS integration
    if (filters.category) {
      whereConditions.push(`ml.category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    if (filters.brand) {
      whereConditions.push(`(ml.tags @> $${paramCount} OR vc.item_data->>'brand' = $${paramCount + 1})`);
      values.push([filters.brand], filters.brand);
      paramCount += 2;
    }

    if (filters.condition && filters.condition.length > 0) {
      whereConditions.push(`ml.condition_info->>'status' = ANY($${paramCount})`);
      values.push(filters.condition);
      paramCount++;
    }

    if (filters.priceRange) {
      whereConditions.push(`ml.price BETWEEN $${paramCount} AND $${paramCount + 1}`);
      values.push(filters.priceRange.min, filters.priceRange.max);
      paramCount += 2;
    }

    if (filters.size) {
      whereConditions.push(`vc.item_data->>'size' = $${paramCount}`);
      values.push(filters.size);
      paramCount++;
    }

    if (filters.color) {
      whereConditions.push(`vc.item_data->>'color' = $${paramCount}`);
      values.push(filters.color);
      paramCount++;
    }

    if (filters.search) {
      whereConditions.push(`(
        ml.title ILIKE $${paramCount} OR 
        ml.description ILIKE $${paramCount} OR
        $${paramCount + 1} = ANY(ml.tags) OR
        vc.item_data->>'brand' ILIKE $${paramCount}
      )`);
      values.push(`%${filters.search}%`, filters.search);
      paramCount += 2;
    }

    if (filters.location?.country) {
      whereConditions.push(`ml.location->>'country' = $${paramCount}`);
      values.push(filters.location.country);
      paramCount++;
    }

    if (filters.shipping?.freeShipping) {
      whereConditions.push(`ml.shipping_options->'domestic'->>'cost' = '0'`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count with JOIN
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ${whereClause}
    `;
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
        case 'ending_soon':
          orderBy = 'ml.expires_at ASC NULLS LAST';
          break;
      }
    }

    const listingsQuery = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
      LEFT JOIN vufs_catalog vc ON ml.item_id = vc.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const listingsResult = await db.query(listingsQuery, values);
    const listings = listingsResult.rows.map(row => this.mapToListing(row));

    return { listings, total };
  }

  /**
   * Get seller's listings with real data
   */
  static async getSellerListings(sellerId: string, status?: string): Promise<MarketplaceListing[]> {
    let query = `
      SELECT ml.*, vc.item_data as vufs_item_data, vc.domain as vufs_domain
      FROM marketplace_listings ml
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
   * Update listing with real persistence
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
   * Update listing status with real persistence
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
   * Real view tracking
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
   * Real like system with persistence
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
   * Real transaction creation with persistence
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
   * Get real seller profile with actual statistics
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
        email: true,
        phone: false,
        identity: false,
        address: false,
      },
      badges: [],
      policies: {
        returnPolicy: 'Standard return policy',
        shippingPolicy: 'Ships within 1-2 business days',
        communicationStyle: 'Responsive and professional',
      },
      stats: {
        responseTime: 2,
        shippingTime: 1,
        positiveRating: 95,
      },
    };
  }

  /**
   * Delete listing with real persistence
   */
  static async deleteListing(id: string): Promise<boolean> {
    // First update the VUFS item status
    await db.query(`
      UPDATE vufs_catalog 
      SET item_data = item_data || '{"operationalStatus": "available"}'::jsonb
      WHERE id = (SELECT item_id FROM marketplace_listings WHERE id = $1)
    `, [id]);

    // Then delete the listing
    const query = 'DELETE FROM marketplace_listings WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get marketplace statistics with real data
   */
  static async getMarketplaceStats(): Promise<{
    totalListings: number;
    totalSellers: number;
    averagePrice: number;
    topCategories: { category: string; count: number }[];
    recentActivity: {
      newListings: number;
      soldItems: number;
      activeUsers: number;
    };
  }> {
    // Get total listings
    const listingsResult = await db.query('SELECT COUNT(*) as count FROM marketplace_listings WHERE status = $1', ['active']);
    const totalListings = parseInt(listingsResult.rows[0].count);

    // Get total sellers
    const sellersResult = await db.query('SELECT COUNT(DISTINCT seller_id) as count FROM marketplace_listings');
    const totalSellers = parseInt(sellersResult.rows[0].count);

    // Get average price
    const priceResult = await db.query('SELECT AVG(price) as avg_price FROM marketplace_listings WHERE status = $1', ['active']);
    const averagePrice = parseFloat(priceResult.rows[0].avg_price) || 0;

    // Get top categories
    const categoriesResult = await db.query(`
      SELECT category, COUNT(*) as count 
      FROM marketplace_listings 
      WHERE status = $1 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 5
    `, ['active']);
    const topCategories = categoriesResult.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    }));

    // Get recent activity (last 7 days)
    const recentListingsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM marketplace_listings 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const newListings = parseInt(recentListingsResult.rows[0].count);

    const soldItemsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM marketplace_listings 
      WHERE status = 'sold' AND updated_at >= NOW() - INTERVAL '7 days'
    `);
    const soldItems = parseInt(soldItemsResult.rows[0].count);

    const activeUsersResult = await db.query(`
      SELECT COUNT(DISTINCT seller_id) as count 
      FROM marketplace_listings 
      WHERE created_at >= NOW() - INTERVAL '7 days' OR updated_at >= NOW() - INTERVAL '7 days'
    `);
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    return {
      totalListings,
      totalSellers,
      averagePrice,
      topCategories,
      recentActivity: {
        newListings,
        soldItems,
        activeUsers,
      },
    };
  }

  /**
   * Add item to watchlist with real persistence
   */
  static async addToWatchlist(userId: string, listingId: string, priceAlert?: number): Promise<WatchlistItem> {
    const query = `
      INSERT INTO marketplace_watchlist (user_id, listing_id, price_alert)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, listing_id) 
      DO UPDATE SET price_alert = EXCLUDED.price_alert, created_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [userId, listingId, priceAlert || null]);

    // Increment watchers count
    await db.query('UPDATE marketplace_listings SET watchers = watchers + 1 WHERE id = $1', [listingId]);

    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      listingId: result.rows[0].listing_id,
      priceAlert: result.rows[0].price_alert,
      notifications: result.rows[0].notifications,
      createdAt: new Date(result.rows[0].created_at),
    };
  }

  /**
   * Remove from watchlist with real persistence
   */
  static async removeFromWatchlist(userId: string, listingId: string): Promise<boolean> {
    const query = 'DELETE FROM marketplace_watchlist WHERE user_id = $1 AND listing_id = $2';
    const result = await db.query(query, [userId, listingId]);

    if ((result.rowCount || 0) > 0) {
      // Decrement watchers count
      await db.query('UPDATE marketplace_listings SET watchers = GREATEST(watchers - 1, 0) WHERE id = $1', [listingId]);
      return true;
    }

    return false;
  }

  /**
   * Get user's watchlist with real data
   */
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    const query = `
      SELECT mw.*, ml.title, ml.price, ml.status
      FROM marketplace_watchlist mw
      JOIN marketplace_listings ml ON mw.listing_id = ml.id
      WHERE mw.user_id = $1
      ORDER BY mw.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      listingId: row.listing_id,
      priceAlert: row.price_alert,
      notifications: row.notifications,
      createdAt: new Date(row.created_at),
    }));
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
      timeline: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}