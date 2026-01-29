import { db } from '../database/connection';
import { CategoryHierarchy, BrandHierarchy, ItemMetadata, ItemCondition, OwnershipInfo } from '@vangarments/shared/types/vufs';
import { VUFSUtils } from '../utils/vufs';

// Local interface matching the actual DB structure and Frontend expectations
export interface BackendVUFSItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  category: CategoryHierarchy;
  brand: BrandHierarchy;
  metadata: ItemMetadata;
  images: Array<{
    url: string;
    type: string;
    isPrimary: boolean;
  }>;
  condition: ItemCondition;
  ownership: OwnershipInfo;
  skuItemId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Enriched fields
  brandInfo?: {
    name: string;
    logo?: string;
    slug?: string;
  };
  lineInfo?: {
    id: string;
    name: string;
    logo?: string;
  };
  collectionInfo?: {
    id: string;
    name: string;
    coverImage?: string;
  };
}

export interface CreateVUFSItemData {
  ownerId: string;
  category: CategoryHierarchy;
  brand: BrandHierarchy;
  metadata: ItemMetadata;
  condition: ItemCondition;
  ownership?: OwnershipInfo;
}

export interface UpdateVUFSItemData {
  category?: CategoryHierarchy;
  brand?: BrandHierarchy;
  metadata?: ItemMetadata;
  condition?: ItemCondition;
  ownership?: OwnershipInfo;
}

export interface VUFSItemFilters {
  ownerId?: string;
  category?: Partial<CategoryHierarchy>;
  brand?: string;
  condition?: string;
  visibility?: string;
  search?: string;
}

export class VUFSItemModel {
  static async create(itemData: CreateVUFSItemData): Promise<BackendVUFSItem> {
    const { ownerId, category, brand, metadata, condition, ownership } = itemData;

    // Normalize hierarchies
    const normalizedCategory = VUFSUtils.normalizeCategoryHierarchy(category);
    const normalizedBrand = VUFSUtils.normalizeBrandHierarchy(brand);

    // Generate VUFS code (using SKU as unique identifier for now)
    const vufsCode = `VG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate search keywords
    const searchKeywords = VUFSUtils.generateSearchKeywords(normalizedCategory, normalizedBrand);

    const defaultOwnership: OwnershipInfo = {
      status: 'owned',
      visibility: 'public',
    };

    const query = `
      INSERT INTO vufs_items (
        vufs_code, owner_id, category_hierarchy, brand_hierarchy, 
        metadata, condition_info, ownership_info, search_keywords
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      vufsCode,
      ownerId,
      JSON.stringify(normalizedCategory),
      JSON.stringify(normalizedBrand),
      JSON.stringify(metadata),
      JSON.stringify(condition),
      JSON.stringify(ownership || defaultOwnership),
      searchKeywords,
    ];

    const result = await db.query(query, values);
    return this.mapToVUFSItem(result.rows[0]);
  }

  static async findById(id: string): Promise<BackendVUFSItem | null> {
    const query = `
      SELECT v.*, 
             b.brand_info->>'name' as brand_account_name, 
             b.brand_info->>'logo' as brand_logo, 
             b.brand_info->>'slug' as brand_slug,
             l.name as line_name, l.logo as line_logo,
             c.name as collection_name, c.cover_image_url as collection_cover
      FROM vufs_items v
      LEFT JOIN brand_accounts b ON (v.brand_hierarchy->>'brand' ILIKE (b.brand_info->>'name'))
      LEFT JOIN brand_lines l ON (v.brand_hierarchy->>'line' = l.name AND b.id = l.brand_id)
      LEFT JOIN brand_collections c ON (v.metadata->>'collection' = c.name AND b.id = c.brand_id)
      WHERE v.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToVUFSItem(result.rows[0]);
  }

  static async findByVUFSCode(vufsCode: string): Promise<BackendVUFSItem | null> {
    const query = `
      SELECT v.*, 
             b.brand_info->>'name' as brand_account_name, 
             b.brand_info->>'logo' as brand_logo, 
             b.brand_info->>'slug' as brand_slug,
             l.name as line_name, l.logo as line_logo,
             c.name as collection_name, c.cover_image_url as collection_cover
      FROM vufs_items v
      LEFT JOIN brand_accounts b ON (v.brand_hierarchy->>'brand' ILIKE (b.brand_info->>'name'))
      LEFT JOIN brand_lines l ON (v.brand_hierarchy->>'line' = l.name AND b.id = l.brand_id)
      LEFT JOIN brand_collections c ON (v.metadata->>'collection' = c.name AND b.id = c.brand_id)
      WHERE v.vufs_code = $1
    `;
    const result = await db.query(query, [vufsCode]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToVUFSItem(result.rows[0]);
  }

  static async findByOwner(ownerId: string, filters?: VUFSItemFilters): Promise<BackendVUFSItem[]> {
    let query = `
      SELECT v.*, 
             b.brand_info->>'name' as brand_account_name, 
             b.brand_info->>'logo' as brand_logo, 
             b.brand_info->>'slug' as brand_slug,
             l.name as line_name, l.logo as line_logo,
             c.name as collection_name, c.cover_image_url as collection_cover
      FROM vufs_items v
      LEFT JOIN brand_accounts b ON (v.brand_hierarchy->>'brand' ILIKE (b.brand_info->>'name'))
      LEFT JOIN brand_lines l ON (v.brand_hierarchy->>'line' = l.name AND b.id = l.brand_id)
      LEFT JOIN brand_collections c ON (v.metadata->>'collection' = c.name AND b.id = c.brand_id)
      WHERE v.owner_id = $1 AND v.deleted_at IS NULL
    `;

    const values: any[] = [ownerId];
    let paramCount = 2;

    // Apply filters
    if (filters?.category?.page) {
      query += ` AND category_hierarchy->>'page' ILIKE $${paramCount}`;
      values.push(`%${filters.category.page}%`);
      paramCount++;
    }

    if (filters?.brand) {
      query += ` AND brand_hierarchy->>'brand' ILIKE $${paramCount}`;
      values.push(`%${filters.brand}%`);
      paramCount++;
    }

    if (filters?.condition) {
      query += ` AND condition_info->>'status' = $${paramCount}`;
      values.push(filters.condition);
      paramCount++;
    }

    if (filters?.visibility) {
      query += ` AND ownership_info->>'visibility' = $${paramCount}`;
      values.push(filters.visibility);
      paramCount++;
    }

    if (filters?.search) {
      query += ` AND (
        $${paramCount} = ANY(search_keywords) OR
        category_hierarchy::text ILIKE $${paramCount + 1} OR
        brand_hierarchy::text ILIKE $${paramCount + 1} OR
        metadata::text ILIKE $${paramCount + 1}
      )`;
      values.push(filters.search.toLowerCase());
      values.push(`%${filters.search}%`);
      paramCount += 2;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, values);
    const items = result.rows.map(row => this.mapToVUFSItem(row));

    if (items.length > 0) {
      const itemIds = items.map(item => item.id);
      const imagesQuery = `
        SELECT * FROM item_images 
        WHERE item_id = ANY($1) AND processing_status = 'completed'
        ORDER BY is_primary DESC, created_at DESC
      `;
      const imagesResult = await db.query(imagesQuery, [itemIds]);

      const imagesByItemIdx = new Map<string, any[]>();
      imagesResult.rows.forEach(row => {
        if (!imagesByItemIdx.has(row.item_id)) {
          imagesByItemIdx.set(row.item_id, []);
        }
        imagesByItemIdx.get(row.item_id)?.push({
          url: row.image_url,
          type: row.image_type,
          isPrimary: row.is_primary
        });
      });

      items.forEach(item => {
        item.images = imagesByItemIdx.get(item.id) || [];
      });
    }

    return items;
  }

  static async update(id: string, updateData: UpdateVUFSItemData): Promise<BackendVUFSItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.category) {
      const normalizedCategory = VUFSUtils.normalizeCategoryHierarchy(updateData.category);
      updates.push(`category_hierarchy = $${paramCount}`);
      values.push(JSON.stringify(normalizedCategory));
      paramCount++;
    }

    if (updateData.brand) {
      const normalizedBrand = VUFSUtils.normalizeBrandHierarchy(updateData.brand);
      updates.push(`brand_hierarchy = $${paramCount}`);
      values.push(JSON.stringify(normalizedBrand));
      paramCount++;

      // Update VUFS code if category or brand changed
      if (updateData.category || updateData.brand) {
        const currentItem = await this.findById(id);
        if (currentItem) {
          const category = updateData.category || currentItem.category;
          const brand = updateData.brand || currentItem.brand;
          // Skip VUFS code regeneration for now
          const newKeywords = VUFSUtils.generateSearchKeywords(category, brand);

          // Skip VUFS code regeneration for now

          updates.push(`search_keywords = $${paramCount}`);
          values.push(newKeywords);
          paramCount++;
        }
      }
    }

    if (updateData.metadata) {
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(updateData.metadata));
      paramCount++;
    }

    if (updateData.condition) {
      updates.push(`condition_info = $${paramCount}`);
      values.push(JSON.stringify(updateData.condition));
      paramCount++;
    }

    if (updateData.ownership) {
      updates.push(`ownership_info = $${paramCount}`);
      values.push(JSON.stringify(updateData.ownership));
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE vufs_items 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToVUFSItem(result.rows[0]);
  }

  /**
   * Soft-delete an item by setting deleted_at timestamp
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'UPDATE vufs_items SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Find deleted items for a user (trash)
   */
  static async findDeletedByOwner(ownerId: string): Promise<BackendVUFSItem[]> {
    const query = `
      SELECT * FROM vufs_items 
      WHERE owner_id = $1 AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    const result = await db.query(query, [ownerId]);
    const items = result.rows.map(row => this.mapToVUFSItem(row));

    // Fetch images for deleted items
    if (items.length > 0) {
      const itemIds = items.map(item => item.id);
      const imagesQuery = `
        SELECT * FROM item_images 
        WHERE item_id = ANY($1)
        ORDER BY is_primary DESC, created_at DESC
      `;
      const imagesResult = await db.query(imagesQuery, [itemIds]);

      const imagesByItemId = new Map<string, any[]>();
      imagesResult.rows.forEach(row => {
        if (!imagesByItemId.has(row.item_id)) {
          imagesByItemId.set(row.item_id, []);
        }
        imagesByItemId.get(row.item_id)?.push({
          url: row.image_url,
          type: row.image_type,
          isPrimary: row.is_primary
        });
      });

      items.forEach(item => {
        item.images = imagesByItemId.get(item.id) || [];
      });
    }

    return items;
  }

  /**
   * Restore a soft-deleted item
   */
  static async restore(id: string): Promise<boolean> {
    const query = 'UPDATE vufs_items SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Permanently delete an item (hard delete)
   */
  static async permanentDelete(id: string): Promise<boolean> {
    const query = 'DELETE FROM vufs_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Cleanup expired items (deleted more than 14 days ago)
   */
  static async cleanupExpiredItems(): Promise<{ deletedCount: number; itemIds: string[] }> {
    // First get the IDs of items to be deleted
    const selectQuery = `
      SELECT id FROM vufs_items 
      WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '14 days'
    `;
    const selectResult = await db.query(selectQuery);
    const itemIds = selectResult.rows.map(row => row.id);

    if (itemIds.length === 0) {
      return { deletedCount: 0, itemIds: [] };
    }

    // Delete the items (cascade will handle images in DB)
    const deleteQuery = `
      DELETE FROM vufs_items 
      WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '14 days'
    `;
    const result = await db.query(deleteQuery);

    return {
      deletedCount: result.rowCount || 0,
      itemIds
    };
  }

  static async search(searchTerm: string, filters?: VUFSItemFilters): Promise<BackendVUFSItem[]> {
    let query = `
      SELECT v.*, 
             b.brand_info->>'name' as brand_account_name, 
             b.brand_info->>'logo' as brand_logo, 
             b.brand_info->>'slug' as brand_slug,
             l.name as line_name, l.logo as line_logo,
             c.name as collection_name, c.cover_image_url as collection_cover
      FROM vufs_items v
      LEFT JOIN brand_accounts b ON (v.brand_hierarchy->>'brand' ILIKE (b.brand_info->>'name'))
      LEFT JOIN brand_lines l ON (v.brand_hierarchy->>'line' = l.name AND b.id = l.brand_id)
      LEFT JOIN brand_collections c ON (v.metadata->>'collection' = c.name AND b.id = c.brand_id)
      WHERE (
        $1 = ANY(v.search_keywords) OR
        v.category_hierarchy::text ILIKE $2 OR
        v.brand_hierarchy::text ILIKE $2 OR
        v.metadata::text ILIKE $2
      )
    `;

    const values: any[] = [searchTerm.toLowerCase(), `%${searchTerm}%`];
    let paramCount = 3;

    // Apply additional filters
    if (filters?.category?.page) {
      query += ` AND category_hierarchy->>'page' ILIKE $${paramCount}`;
      values.push(`%${filters.category.page}%`);
      paramCount++;
    }

    if (filters?.brand) {
      query += ` AND brand_hierarchy->>'brand' ILIKE $${paramCount}`;
      values.push(`%${filters.brand}%`);
      paramCount++;
    }

    if (filters?.visibility) {
      query += ` AND ownership_info->>'visibility' = $${paramCount}`;
      values.push(filters.visibility);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToVUFSItem(row));
  }

  static async getFacetsByOwner(ownerId: string): Promise<{
    brands: string[];
    categories: string[];
    colors: string[];
    patterns: string[];
    materials: string[];
    lines: string[];
    collections: string[];
  }> {
    const query = `
      WITH item_data AS (
        SELECT 
          category_hierarchy->>'page' as category,
          brand_hierarchy->>'brand' as brand,
          brand_hierarchy->>'line' as line,
          metadata->>'collection' as collection,
          metadata->>'pattern' as pattern,
          metadata->'colors' as colors,
          metadata->'composition' as composition
        FROM vufs_items 
        WHERE owner_id = $1 AND deleted_at IS NULL
      )
      SELECT 
        (SELECT jsonb_agg(DISTINCT brand) FROM item_data WHERE brand IS NOT NULL) as brands,
        (SELECT jsonb_agg(DISTINCT category) FROM item_data WHERE category IS NOT NULL) as categories,
        (SELECT jsonb_agg(DISTINCT line) FROM item_data WHERE line IS NOT NULL) as lines,
        (SELECT jsonb_agg(DISTINCT collection) FROM item_data WHERE collection IS NOT NULL) as collections,
        (SELECT jsonb_agg(DISTINCT pattern) FROM item_data WHERE pattern IS NOT NULL) as patterns,
        (SELECT jsonb_agg(DISTINCT c->>'name') FROM item_data, jsonb_array_elements(colors) c WHERE c->>'name' IS NOT NULL) as colors,
        (SELECT jsonb_agg(DISTINCT m->>'name') FROM item_data, jsonb_array_elements(composition) m WHERE m->>'name' IS NOT NULL) as materials
    `;

    const result = await db.query(query, [ownerId]);
    const row = result.rows[0] || {};

    return {
      brands: row.brands || [],
      categories: row.categories || [],
      colors: row.colors || [],
      patterns: row.patterns || [],
      materials: row.materials || [],
      lines: row.lines || [],
      collections: row.collections || [],
    };
  }

  static async getStatsByOwner(ownerId: string): Promise<{
    totalItems: number;
    itemsByCategory: Record<string, number>;
    itemsByBrand: Record<string, number>;
    itemsByCondition: Record<string, number>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        category_hierarchy->>'page' as category,
        brand_hierarchy->>'brand' as brand,
        condition_info->>'status' as condition
      FROM vufs_items 
      WHERE owner_id = $1
      GROUP BY category_hierarchy->>'page', brand_hierarchy->>'brand', condition_info->>'status'
    `;

    const result = await db.query(query, [ownerId]);

    const stats = {
      totalItems: 0,
      itemsByCategory: {} as Record<string, number>,
      itemsByBrand: {} as Record<string, number>,
      itemsByCondition: {} as Record<string, number>,
    };

    for (const row of result.rows) {
      stats.totalItems += parseInt(row.total_items);

      if (row.category) {
        stats.itemsByCategory[row.category] = (stats.itemsByCategory[row.category] || 0) + parseInt(row.total_items);
      }

      if (row.brand) {
        stats.itemsByBrand[row.brand] = (stats.itemsByBrand[row.brand] || 0) + parseInt(row.total_items);
      }

      if (row.condition) {
        stats.itemsByCondition[row.condition] = (stats.itemsByCondition[row.condition] || 0) + parseInt(row.total_items);
      }
    }

    return stats;
  }

  private static mapToVUFSItem(row: any): BackendVUFSItem {
    const categoryHierarchy = typeof row.category_hierarchy === 'string'
      ? JSON.parse(row.category_hierarchy)
      : row.category_hierarchy;

    const brandHierarchy = typeof row.brand_hierarchy === 'string'
      ? JSON.parse(row.brand_hierarchy)
      : row.brand_hierarchy;

    const metadata = typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata;

    const condition = typeof row.condition_info === 'string'
      ? JSON.parse(row.condition_info)
      : row.condition_info;

    const ownership = typeof row.ownership_info === 'string'
      ? JSON.parse(row.ownership_info)
      : row.ownership_info;

    return {
      id: row.id,
      vufsCode: row.vufs_code,
      ownerId: row.owner_id,
      category: categoryHierarchy,
      brand: brandHierarchy,
      metadata: metadata,
      images: [], // Will be populated by findByOwner/byId if queried
      condition: condition,
      ownership: ownership,
      skuItemId: row.sku_item_id, // Added field
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      brandInfo: row.brand_account_name ? {
        name: row.brand_account_name,
        logo: row.brand_logo,
        slug: row.brand_slug,
      } : undefined,
      lineInfo: row.line_name ? {
        id: row.line_id, // Note: we should select id if needed
        name: row.line_name,
        logo: row.line_logo,
      } : undefined,
      collectionInfo: row.collection_name ? {
        id: row.collection_id,
        name: row.collection_name,
        coverImage: row.collection_cover,
      } : undefined,
    };
  }
}