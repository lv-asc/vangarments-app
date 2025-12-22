import { db } from '../database/connection';

export interface InventoryItem {
  id: string;
  brandId: string;
  catalogItemId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  cost: number;
  location?: string;
  supplier?: string;
  lastRestocked?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemData {
  brandId: string;
  catalogItemId: string;
  sku: string;
  quantity: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  cost?: number;
  location?: string;
  supplier?: string;
  notes?: string;
}

export interface UpdateInventoryItemData {
  quantity?: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  cost?: number;
  location?: string;
  supplier?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  movementType: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
  quantity: number;
  reason: string;
  reference?: string; // Order ID, return ID, etc.
  performedBy: string;
  createdAt: string;
}

export interface CreateInventoryMovementData {
  inventoryItemId: string;
  movementType: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
  quantity: number;
  reason: string;
  reference?: string;
  performedBy: string;
}

export class InventoryManagementModel {
  static async create(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    const {
      brandId,
      catalogItemId,
      sku,
      quantity,
      reorderLevel = 0,
      reorderQuantity = 0,
      cost = 0,
      location,
      supplier,
      notes,
    } = itemData;

    const query = `
      INSERT INTO inventory_items (
        brand_id, catalog_item_id, sku, quantity, available_quantity,
        reorder_level, reorder_quantity, cost, location, supplier, notes
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      brandId,
      catalogItemId,
      sku,
      quantity,
      reorderLevel,
      reorderQuantity,
      cost,
      location || null,
      supplier || null,
      notes || null,
    ];

    const result = await db.query(query, values);
    return this.mapRowToInventoryItem(result.rows[0]);
  }

  static async findById(id: string): Promise<InventoryItem | null> {
    const query = `
      SELECT ii.*, bci.official_price, bci.brand_specific_data
      FROM inventory_items ii
      LEFT JOIN brand_catalog_items bci ON ii.catalog_item_id = bci.id
      WHERE ii.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToInventoryItem(result.rows[0]) : null;
  }

  static async findByBrandId(
    brandId: string,
    filters: {
      lowStock?: boolean;
      location?: string;
      supplier?: string;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ items: InventoryItem[]; total: number }> {
    const whereConditions: string[] = ['ii.brand_id = $1'];
    const values: any[] = [brandId];
    let paramIndex = 2;

    if (filters.lowStock) {
      whereConditions.push('ii.available_quantity <= ii.reorder_level');
    }

    if (filters.location) {
      whereConditions.push(`ii.location ILIKE $${paramIndex++}`);
      values.push(`%${filters.location}%`);
    }

    if (filters.supplier) {
      whereConditions.push(`ii.supplier ILIKE $${paramIndex++}`);
      values.push(`%${filters.supplier}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT ii.*, 
             bci.official_price, 
             bci.brand_specific_data,
             COUNT(*) OVER() as total
      FROM inventory_items ii
      LEFT JOIN brand_catalog_items bci ON ii.catalog_item_id = bci.id
      WHERE ${whereClause}
      ORDER BY ii.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      items: result.rows.map(row => this.mapRowToInventoryItem(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async update(id: string, updateData: UpdateInventoryItemData): Promise<InventoryItem | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.quantity !== undefined) {
      setClause.push(`quantity = $${paramIndex++}`);
      values.push(updateData.quantity);
      
      // Recalculate available quantity
      setClause.push(`available_quantity = quantity - reserved_quantity`);
    }

    if (updateData.reservedQuantity !== undefined) {
      setClause.push(`reserved_quantity = $${paramIndex++}`);
      values.push(updateData.reservedQuantity);
      
      // Recalculate available quantity
      setClause.push(`available_quantity = quantity - reserved_quantity`);
    }

    if (updateData.reorderLevel !== undefined) {
      setClause.push(`reorder_level = $${paramIndex++}`);
      values.push(updateData.reorderLevel);
    }

    if (updateData.reorderQuantity !== undefined) {
      setClause.push(`reorder_quantity = $${paramIndex++}`);
      values.push(updateData.reorderQuantity);
    }

    if (updateData.cost !== undefined) {
      setClause.push(`cost = $${paramIndex++}`);
      values.push(updateData.cost);
    }

    if (updateData.location !== undefined) {
      setClause.push(`location = $${paramIndex++}`);
      values.push(updateData.location);
    }

    if (updateData.supplier !== undefined) {
      setClause.push(`supplier = $${paramIndex++}`);
      values.push(updateData.supplier);
    }

    if (updateData.notes !== undefined) {
      setClause.push(`notes = $${paramIndex++}`);
      values.push(updateData.notes);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE inventory_items 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToInventoryItem(result.rows[0]) : null;
  }

  static async recordMovement(movementData: CreateInventoryMovementData): Promise<InventoryMovement> {
    const { inventoryItemId, movementType, quantity, reason, reference, performedBy } = movementData;

    // Start transaction
    return await db.transaction(async (client) => {
      // Record the movement
      const movementQuery = `
        INSERT INTO inventory_movements (
          inventory_item_id, movement_type, quantity, reason, reference, performed_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const movementValues = [inventoryItemId, movementType, quantity, reason, reference || null, performedBy];
      const movementResult = await client.query(movementQuery, movementValues);

      // Update inventory quantities based on movement type
      let quantityUpdate = '';
      switch (movementType) {
        case 'in':
          quantityUpdate = 'quantity = quantity + $2, available_quantity = quantity - reserved_quantity';
          break;
        case 'out':
          quantityUpdate = 'quantity = quantity - $2, available_quantity = quantity - reserved_quantity';
          break;
        case 'adjustment':
          quantityUpdate = 'quantity = $2, available_quantity = quantity - reserved_quantity';
          break;
        case 'reserved':
          quantityUpdate = 'reserved_quantity = reserved_quantity + $2, available_quantity = quantity - reserved_quantity';
          break;
        case 'released':
          quantityUpdate = 'reserved_quantity = reserved_quantity - $2, available_quantity = quantity - reserved_quantity';
          break;
      }

      const updateQuery = `
        UPDATE inventory_items 
        SET ${quantityUpdate}, updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(updateQuery, [inventoryItemId, Math.abs(quantity)]);

      return this.mapRowToInventoryMovement(movementResult.rows[0]);
    });
  }

  static async getMovementHistory(
    inventoryItemId: string,
    limit = 20,
    offset = 0
  ): Promise<{ movements: InventoryMovement[]; total: number }> {
    const query = `
      SELECT im.*, 
             u.profile as performed_by_profile,
             COUNT(*) OVER() as total
      FROM inventory_movements im
      LEFT JOIN users u ON im.performed_by = u.id
      WHERE im.inventory_item_id = $1
      ORDER BY im.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [inventoryItemId, limit, offset]);
    
    return {
      movements: result.rows.map(row => this.mapRowToInventoryMovement(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async getLowStockItems(brandId: string): Promise<InventoryItem[]> {
    const query = `
      SELECT ii.*, bci.official_price, bci.brand_specific_data
      FROM inventory_items ii
      LEFT JOIN brand_catalog_items bci ON ii.catalog_item_id = bci.id
      WHERE ii.brand_id = $1 AND ii.available_quantity <= ii.reorder_level
      ORDER BY ii.available_quantity ASC
    `;

    const result = await db.query(query, [brandId]);
    return result.rows.map(row => this.mapRowToInventoryItem(row));
  }

  static async getInventorySummary(brandId: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalQuantity: number;
    averageCost: number;
  }> {
    const query = `
      SELECT 
        COUNT(*)::int as total_items,
        COALESCE(SUM(quantity * cost), 0)::decimal as total_value,
        COALESCE(SUM(CASE WHEN available_quantity <= reorder_level THEN 1 ELSE 0 END), 0)::int as low_stock_items,
        COALESCE(SUM(CASE WHEN available_quantity = 0 THEN 1 ELSE 0 END), 0)::int as out_of_stock_items,
        COALESCE(SUM(quantity), 0)::int as total_quantity,
        COALESCE(AVG(cost), 0)::decimal as average_cost
      FROM inventory_items 
      WHERE brand_id = $1
    `;

    const result = await db.query(query, [brandId]);
    const summary = result.rows[0];

    return {
      totalItems: summary.total_items,
      totalValue: parseFloat(summary.total_value),
      lowStockItems: summary.low_stock_items,
      outOfStockItems: summary.out_of_stock_items,
      totalQuantity: summary.total_quantity,
      averageCost: parseFloat(summary.average_cost),
    };
  }

  private static mapRowToInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      brandId: row.brand_id,
      catalogItemId: row.catalog_item_id,
      sku: row.sku,
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity || 0,
      availableQuantity: row.available_quantity || 0,
      reorderLevel: row.reorder_level || 0,
      reorderQuantity: row.reorder_quantity || 0,
      cost: parseFloat(row.cost || '0'),
      location: row.location,
      supplier: row.supplier,
      lastRestocked: row.last_restocked,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToInventoryMovement(row: any): InventoryMovement {
    return {
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      movementType: row.movement_type,
      quantity: row.quantity,
      reason: row.reason,
      reference: row.reference,
      performedBy: row.performed_by,
      createdAt: row.created_at,
    };
  }
}