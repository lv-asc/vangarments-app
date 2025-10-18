import { db } from '../database/connection';
import { 
  VUFSItem, 
  ApparelItem, 
  FootwearItem, 
  VUFSDomain, 
  OperationalStatus,
  VUFSCatalogEntry,
  PlatformExport,
  FinancialRecord
} from '@vangarments/shared/types/vufs';
import { VUFSUtils } from '../utils/vufs';

export interface CreateVUFSItemData {
  domain: VUFSDomain;
  item: Omit<VUFSItem, 'createdDate' | 'operationalStatus' | 'platformExports'>;
  createdBy: string;
}

export interface UpdateVUFSItemData {
  item?: Partial<VUFSItem>;
  operationalStatus?: OperationalStatus;
}

export interface VUFSFilters {
  domain?: VUFSDomain;
  brand?: string;
  owner?: string;
  operationalStatus?: OperationalStatus;
  condition?: string;
  sold?: boolean;
  photographed?: boolean;
  priceRange?: { min: number; max: number };
  search?: string;
}

export class VUFSCatalogModel {
  /**
   * Create new VUFS catalog entry
   */
  static async create(data: CreateVUFSItemData): Promise<VUFSCatalogEntry> {
    // Validate the item
    const validationErrors = VUFSUtils.validateVUFSItem(data.item);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Generate VUFS code (using SKU as the unique identifier)
    const vufsCode = data.item.sku;

    const completeItem: VUFSItem = {
      ...data.item,
      createdDate: new Date(),
      operationalStatus: data.item.photographed ? 'photographed' : 'not_photographed',
      platformExports: [],
    };

    const query = `
      INSERT INTO vufs_catalog (
        vufs_code, domain, item_data, created_by, last_modified_by
      )
      VALUES ($1, $2, $3, $4, $4)
      RETURNING *
    `;

    const values = [
      vufsCode,
      data.domain,
      JSON.stringify(completeItem),
      data.createdBy,
    ];

    const result = await db.query(query, values);
    return this.mapToCatalogEntry(result.rows[0]);
  }

  /**
   * Find item by ID
   */
  static async findById(id: string): Promise<VUFSCatalogEntry | null> {
    const query = 'SELECT * FROM vufs_catalog WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToCatalogEntry(result.rows[0]);
  }

  /**
   * Find item by VUFS code (SKU)
   */
  static async findByVUFSCode(vufsCode: string): Promise<VUFSCatalogEntry | null> {
    const query = 'SELECT * FROM vufs_catalog WHERE vufs_code = $1';
    const result = await db.query(query, [vufsCode]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToCatalogEntry(result.rows[0]);
  }

  /**
   * Search and filter catalog entries
   */
  static async search(filters: VUFSFilters, limit: number = 50, offset: number = 0): Promise<{
    items: VUFSCatalogEntry[];
    total: number;
  }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (filters.domain) {
      whereConditions.push(`domain = $${paramCount}`);
      values.push(filters.domain);
      paramCount++;
    }

    if (filters.brand) {
      whereConditions.push(`item_data->>'brand' ILIKE $${paramCount}`);
      values.push(`%${filters.brand}%`);
      paramCount++;
    }

    if (filters.owner) {
      whereConditions.push(`item_data->>'owner' = $${paramCount}`);
      values.push(filters.owner);
      paramCount++;
    }

    if (filters.operationalStatus) {
      whereConditions.push(`item_data->>'operationalStatus' = $${paramCount}`);
      values.push(filters.operationalStatus);
      paramCount++;
    }

    if (filters.condition) {
      whereConditions.push(`item_data->>'condition' = $${paramCount}`);
      values.push(filters.condition);
      paramCount++;
    }

    if (filters.sold !== undefined) {
      whereConditions.push(`(item_data->>'sold')::boolean = $${paramCount}`);
      values.push(filters.sold);
      paramCount++;
    }

    if (filters.photographed !== undefined) {
      whereConditions.push(`(item_data->>'photographed')::boolean = $${paramCount}`);
      values.push(filters.photographed);
      paramCount++;
    }

    if (filters.priceRange) {
      whereConditions.push(`(item_data->>'price')::numeric BETWEEN $${paramCount} AND $${paramCount + 1}`);
      values.push(filters.priceRange.min, filters.priceRange.max);
      paramCount += 2;
    }

    if (filters.search) {
      whereConditions.push(`(
        vufs_code ILIKE $${paramCount} OR
        item_data::text ILIKE $${paramCount}
      )`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM vufs_catalog ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get items with pagination
    const itemsQuery = `
      SELECT * FROM vufs_catalog 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const itemsResult = await db.query(itemsQuery, values);
    const items = itemsResult.rows.map(row => this.mapToCatalogEntry(row));

    return { items, total };
  }

  /**
   * Update catalog entry
   */
  static async update(id: string, updateData: UpdateVUFSItemData): Promise<VUFSCatalogEntry | null> {
    const existingEntry = await this.findById(id);
    if (!existingEntry) {
      return null;
    }

    let updatedItem = existingEntry.item;

    if (updateData.item) {
      updatedItem = { ...updatedItem, ...updateData.item };
    }

    if (updateData.operationalStatus) {
      updatedItem.operationalStatus = updateData.operationalStatus;
    }

    const query = `
      UPDATE vufs_catalog 
      SET item_data = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const values = [JSON.stringify(updatedItem), id];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToCatalogEntry(result.rows[0]);
  }

  /**
   * Mark item as sold
   */
  static async markAsSold(id: string, soldPrice: number, platform?: string): Promise<VUFSCatalogEntry | null> {
    const entry = await this.findById(id);
    if (!entry) {
      return null;
    }

    const updatedItem: VUFSItem = {
      ...entry.item,
      sold: true,
      soldPrice,
      operationalStatus: 'sold',
    };

    // Add platform export record if provided
    if (platform) {
      const platformExport: PlatformExport = {
        platform: platform as any,
        exportedAt: new Date(),
        status: 'published',
      };
      updatedItem.platformExports = [...(updatedItem.platformExports || []), platformExport];
    }

    return this.update(id, { item: updatedItem });
  }

  /**
   * Mark item as repassed (payment sent to owner)
   */
  static async markAsRepassed(id: string): Promise<VUFSCatalogEntry | null> {
    const entry = await this.findById(id);
    if (!entry) {
      return null;
    }

    const updatedItem: VUFSItem = {
      ...entry.item,
      repassStatus: true,
      operationalStatus: 'repassed',
    };

    return this.update(id, { item: updatedItem });
  }

  /**
   * Get items by operational status
   */
  static async getByOperationalStatus(status: OperationalStatus): Promise<VUFSCatalogEntry[]> {
    const query = `
      SELECT * FROM vufs_catalog 
      WHERE item_data->>'operationalStatus' = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [status]);
    return result.rows.map(row => this.mapToCatalogEntry(row));
  }

  /**
   * Get items ready for repass (sold but not repassed)
   */
  static async getItemsReadyForRepass(): Promise<VUFSCatalogEntry[]> {
    const query = `
      SELECT * FROM vufs_catalog 
      WHERE (item_data->>'sold')::boolean = true 
      AND (item_data->>'repassStatus')::boolean = false
      ORDER BY created_at ASC
    `;

    const result = await db.query(query);
    return result.rows.map(row => this.mapToCatalogEntry(row));
  }

  /**
   * Get owner statistics
   */
  static async getOwnerStats(owner: string): Promise<{
    totalItems: number;
    soldItems: number;
    totalRevenue: number;
    pendingRepass: number;
    averagePrice: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN (item_data->>'sold')::boolean = true THEN 1 END) as sold_items,
        COALESCE(SUM(CASE WHEN (item_data->>'sold')::boolean = true THEN (item_data->>'soldPrice')::numeric END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN (item_data->>'sold')::boolean = true AND (item_data->>'repassStatus')::boolean = false THEN (item_data->>'amountToTransfer')::numeric END), 0) as pending_repass,
        COALESCE(AVG((item_data->>'price')::numeric), 0) as average_price
      FROM vufs_catalog 
      WHERE item_data->>'owner' = $1
    `;

    const result = await db.query(query, [owner]);
    const row = result.rows[0];

    return {
      totalItems: parseInt(row.total_items),
      soldItems: parseInt(row.sold_items),
      totalRevenue: parseFloat(row.total_revenue),
      pendingRepass: parseFloat(row.pending_repass),
      averagePrice: parseFloat(row.average_price),
    };
  }

  /**
   * Delete catalog entry
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM vufs_catalog WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Map database row to catalog entry
   */
  private static mapToCatalogEntry(row: any): VUFSCatalogEntry {
    const itemData = typeof row.item_data === 'string' 
      ? JSON.parse(row.item_data) 
      : row.item_data;

    return {
      id: row.id,
      vufsCode: row.vufs_code,
      domain: row.domain,
      item: itemData,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
    };
  }
}