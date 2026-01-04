import { db } from '../database/connection';
import { VUFSItemModel } from './VUFSItem';

export interface BrandCatalogItem {
  id: string;
  brandId: string;
  vufsItemId: string;
  officialPrice?: number;
  availabilityStatus: 'available' | 'out_of_stock' | 'discontinued' | 'pre_order';
  purchaseLink?: string;
  brandSpecificData?: {
    sku?: string;
    collection?: string;
    season?: string;
    launchDate?: string;
    materials?: string[];
    careInstructions?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandCatalogItemData {
  brandId: string;
  vufsItemId: string;
  officialPrice?: number;
  availabilityStatus?: 'available' | 'out_of_stock' | 'discontinued' | 'pre_order';
  purchaseLink?: string;
  brandSpecificData?: {
    sku?: string;
    collection?: string;
    season?: string;
    launchDate?: string;
    materials?: string[];
    careInstructions?: string[];
  };
}

export interface UpdateBrandCatalogItemData {
  officialPrice?: number;
  availabilityStatus?: 'available' | 'out_of_stock' | 'discontinued' | 'pre_order';
  purchaseLink?: string;
  brandSpecificData?: {
    sku?: string;
    collection?: string;
    season?: string;
    launchDate?: string;
    materials?: string[];
    careInstructions?: string[];
  };
}

export interface BrandCatalogFilters {
  brandId?: string;
  availabilityStatus?: 'available' | 'out_of_stock' | 'discontinued' | 'pre_order';
  priceRange?: { min?: number; max?: number };
  collection?: string;
  season?: string;
  search?: string;
}

export class BrandCatalogModel {
  static async create(itemData: CreateBrandCatalogItemData): Promise<BrandCatalogItem> {
    const {
      brandId,
      vufsItemId,
      officialPrice,
      availabilityStatus = 'available',
      purchaseLink,
      brandSpecificData,
    } = itemData;

    // Verify the VUFS item exists
    const vufsItem = await VUFSItemModel.findById(vufsItemId);
    if (!vufsItem) {
      throw new Error('VUFS item not found');
    }

    // Check if item is already in brand catalog
    const existing = await this.findByVufsItemId(vufsItemId, brandId);
    if (existing) {
      throw new Error('Item already exists in brand catalog');
    }

    const query = `
      INSERT INTO brand_catalog_items (
        brand_id, vufs_item_id, official_price, availability_status, 
        purchase_link, brand_specific_data
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      brandId,
      vufsItemId,
      officialPrice || null,
      availabilityStatus,
      purchaseLink || null,
      brandSpecificData ? JSON.stringify(brandSpecificData) : null,
    ];

    const result = await db.query(query, values);
    return this.mapRowToBrandCatalogItem(result.rows[0]);
  }

  static async findById(id: string): Promise<BrandCatalogItem | null> {
    const query = `
      SELECT bci.*, 
             ba.brand_info,
             vi.category_hierarchy,
             vi.brand_hierarchy,
             vi.metadata as vufs_metadata
      FROM brand_catalog_items bci
      LEFT JOIN brand_accounts ba ON bci.brand_id = ba.id
      LEFT JOIN vufs_items vi ON bci.vufs_item_id = vi.id
      WHERE bci.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToBrandCatalogItem(result.rows[0]) : null;
  }

  static async findByVufsItemId(vufsItemId: string, brandId?: string): Promise<BrandCatalogItem | null> {
    let query = `
      SELECT bci.*, 
             ba.brand_info,
             vi.category_hierarchy,
             vi.brand_hierarchy,
             vi.metadata as vufs_metadata
      FROM brand_catalog_items bci
      LEFT JOIN brand_accounts ba ON bci.brand_id = ba.id
      LEFT JOIN vufs_items vi ON bci.vufs_item_id = vi.id
      WHERE bci.vufs_item_id = $1
    `;

    const values = [vufsItemId];

    if (brandId) {
      query += ' AND bci.brand_id = $2';
      values.push(brandId);
    }

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToBrandCatalogItem(result.rows[0]) : null;
  }

  static async findByBrandId(
    brandId: string,
    filters: Omit<BrandCatalogFilters, 'brandId'> = {},
    limit = 20,
    offset = 0
  ): Promise<{ items: BrandCatalogItem[]; total: number }> {
    const whereConditions: string[] = ['bci.brand_id = $1'];
    const values: any[] = [brandId];
    let paramIndex = 2;

    if (filters.availabilityStatus) {
      whereConditions.push(`bci.availability_status = $${paramIndex++}`);
      values.push(filters.availabilityStatus);
    }

    if (filters.priceRange?.min !== undefined) {
      whereConditions.push(`bci.official_price >= $${paramIndex++}`);
      values.push(filters.priceRange.min);
    }

    if (filters.priceRange?.max !== undefined) {
      whereConditions.push(`bci.official_price <= $${paramIndex++}`);
      values.push(filters.priceRange.max);
    }

    if (filters.collection) {
      whereConditions.push(`bci.brand_specific_data->>'collection' ILIKE $${paramIndex++}`);
      values.push(`%${filters.collection}%`);
    }

    if (filters.season) {
      whereConditions.push(`bci.brand_specific_data->>'season' ILIKE $${paramIndex++}`);
      values.push(`%${filters.season}%`);
    }

    if (filters.search) {
      whereConditions.push(`
        (vi.metadata->>'name' ILIKE $${paramIndex} OR 
         bci.brand_specific_data->>'sku' ILIKE $${paramIndex} OR
         vi.brand_hierarchy->>'brand' ILIKE $${paramIndex})
      `);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT bci.*, 
             ba.brand_info,
             vi.category_hierarchy,
             vi.brand_hierarchy,
             vi.metadata as vufs_metadata,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image,
             ARRAY(SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id ORDER BY ii.is_primary DESC, ii.created_at ASC) as all_images,
             COUNT(*) OVER() as total
      FROM brand_catalog_items bci
      LEFT JOIN brand_accounts ba ON bci.brand_id = ba.id
      LEFT JOIN vufs_items vi ON bci.vufs_item_id = vi.id
      WHERE ${whereClause}
      ORDER BY bci.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    return {
      items: result.rows.map(row => this.mapRowToBrandCatalogItem(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async update(id: string, updateData: UpdateBrandCatalogItemData): Promise<BrandCatalogItem | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.officialPrice !== undefined) {
      setClause.push(`official_price = $${paramIndex++}`);
      values.push(updateData.officialPrice);
    }

    if (updateData.availabilityStatus) {
      setClause.push(`availability_status = $${paramIndex++}`);
      values.push(updateData.availabilityStatus);
    }

    if (updateData.purchaseLink !== undefined) {
      setClause.push(`purchase_link = $${paramIndex++}`);
      values.push(updateData.purchaseLink);
    }

    if (updateData.brandSpecificData) {
      // Get current data and merge with updates
      const current = await this.findById(id);
      if (!current) return null;

      const updatedData = {
        ...current.brandSpecificData,
        ...updateData.brandSpecificData,
      };

      setClause.push(`brand_specific_data = $${paramIndex++}`);
      values.push(JSON.stringify(updatedData));
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE brand_catalog_items 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToBrandCatalogItem(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM brand_catalog_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async bulkUpdateAvailability(
    brandId: string,
    updates: Array<{ vufsItemId: string; availabilityStatus: string }>
  ): Promise<void> {
    if (updates.length === 0) return;

    // Build bulk update query
    const cases = updates.map((_, index) =>
      `WHEN vufs_item_id = $${index * 2 + 2} THEN $${index * 2 + 3}::availability_status`
    ).join(' ');

    const values: any[] = [brandId];
    const itemIds: string[] = [];

    updates.forEach(update => {
      values.push(update.vufsItemId, update.availabilityStatus);
      itemIds.push(update.vufsItemId);
    });

    values.push(itemIds);

    const query = `
      UPDATE brand_catalog_items 
      SET availability_status = CASE ${cases} END,
          updated_at = NOW()
      WHERE brand_id = $1 AND vufs_item_id = ANY($${values.length})
    `;

    await db.query(query, values);
  }

  static async getCollections(brandId: string): Promise<Array<{ collection: string; itemCount: number }>> {
    const query = `
      SELECT 
        brand_specific_data->>'collection' as collection,
        COUNT(*)::int as item_count
      FROM brand_catalog_items 
      WHERE brand_id = $1 
        AND brand_specific_data->>'collection' IS NOT NULL
      GROUP BY brand_specific_data->>'collection'
      ORDER BY item_count DESC
    `;

    const result = await db.query(query, [brandId]);
    return result.rows.map(row => ({
      collection: row.collection,
      itemCount: row.item_count,
    }));
  }

  static async getSeasons(brandId: string): Promise<Array<{ season: string; itemCount: number }>> {
    const query = `
      SELECT 
        brand_specific_data->>'season' as season,
        COUNT(*)::int as item_count
      FROM brand_catalog_items 
      WHERE brand_id = $1 
        AND brand_specific_data->>'season' IS NOT NULL
      GROUP BY brand_specific_data->>'season'
      ORDER BY item_count DESC
    `;

    const result = await db.query(query, [brandId]);
    return result.rows.map(row => ({
      season: row.season,
      itemCount: row.item_count,
    }));
  }

  private static mapRowToBrandCatalogItem(row: any): BrandCatalogItem & { brand?: any; item?: any } {
    const brandInfo = row.brand_info ? (typeof row.brand_info === 'string' ? JSON.parse(row.brand_info) : row.brand_info) : null;
    const vufsMetadata = row.vufs_metadata ? (typeof row.vufs_metadata === 'string' ? JSON.parse(row.vufs_metadata) : row.vufs_metadata) : null;

    const { slugify } = require('../utils/slugify');

    return {
      id: row.id,
      brandId: row.brand_id,
      vufsItemId: row.vufs_item_id,
      officialPrice: row.official_price ? parseFloat(row.official_price) : undefined,
      availabilityStatus: row.availability_status,
      purchaseLink: row.purchase_link,
      brandSpecificData: row.brand_specific_data || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      brand: brandInfo ? {
        id: row.brand_id,
        name: brandInfo.name,
        slug: brandInfo.slug || slugify(brandInfo.name),
        logo: brandInfo.logo
      } : undefined,
      item: vufsMetadata ? {
        id: row.vufs_item_id,
        name: vufsMetadata.name || 'Untitled Item',
        description: vufsMetadata.description || '',
        images: row.all_images && row.all_images.length > 0 ? row.all_images : (row.primary_image ? [row.primary_image] : []),
        metadata: vufsMetadata,
        category: row.category_hierarchy,
        retailPriceBrl: row.official_price ? parseFloat(row.official_price) : undefined
      } : undefined
    };
  }
}