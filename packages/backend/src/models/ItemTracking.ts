import { db } from '../database/connection';
import { LoanRecord, WishlistItem, ItemTrackingUtils } from '../utils/itemTracking';

export class ItemTrackingModel {
  // Loan Management
  static async createLoan(loanData: Omit<LoanRecord, 'id' | 'status'>): Promise<LoanRecord> {
    const validationErrors = ItemTrackingUtils.validateLoanRecord(loanData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const query = `
      INSERT INTO item_loans (
        item_id, loanee_id, loanee_name, loan_date, 
        expected_return_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      loanData.itemId,
      loanData.loaneeId,
      loanData.loaneeName,
      loanData.loanDate,
      loanData.expectedReturnDate || null,
      loanData.notes || null,
    ];

    const result = await db.query(query, values);
    return this.mapToLoanRecord(result.rows[0]);
  }

  static async updateLoan(id: string, updateData: Partial<LoanRecord>): Promise<LoanRecord | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.expectedReturnDate !== undefined) {
      updates.push(`expected_return_date = $${paramCount}`);
      values.push(updateData.expectedReturnDate);
      paramCount++;
    }

    if (updateData.actualReturnDate !== undefined) {
      updates.push(`actual_return_date = $${paramCount}`);
      values.push(updateData.actualReturnDate);
      paramCount++;
    }

    if (updateData.notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(updateData.notes);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findLoanById(id);
    }

    values.push(id);
    const query = `
      UPDATE item_loans 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToLoanRecord(result.rows[0]);
  }

  static async findLoanById(id: string): Promise<LoanRecord | null> {
    const query = 'SELECT * FROM item_loans WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToLoanRecord(result.rows[0]);
  }

  static async getLoansByItem(itemId: string): Promise<LoanRecord[]> {
    const query = `
      SELECT * FROM item_loans 
      WHERE item_id = $1 
      ORDER BY loan_date DESC
    `;

    const result = await db.query(query, [itemId]);
    return result.rows.map(row => this.mapToLoanRecord(row));
  }

  static async getLoansByUser(userId: string): Promise<LoanRecord[]> {
    const query = `
      SELECT il.* FROM item_loans il
      JOIN vufs_items vi ON il.item_id = vi.id
      WHERE vi.owner_id = $1
      ORDER BY il.loan_date DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapToLoanRecord(row));
  }

  static async getActiveLoans(userId: string): Promise<LoanRecord[]> {
    const query = `
      SELECT il.* FROM item_loans il
      JOIN vufs_items vi ON il.item_id = vi.id
      WHERE vi.owner_id = $1 AND il.actual_return_date IS NULL
      ORDER BY il.loan_date DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapToLoanRecord(row));
  }

  static async getOverdueLoans(userId: string): Promise<LoanRecord[]> {
    const query = `
      SELECT il.* FROM item_loans il
      JOIN vufs_items vi ON il.item_id = vi.id
      WHERE vi.owner_id = $1 
      AND il.actual_return_date IS NULL 
      AND il.expected_return_date < NOW()
      ORDER BY il.expected_return_date ASC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapToLoanRecord(row));
  }

  // Wishlist Management
  static async createWishlistItem(wishlistData: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WishlistItem> {
    const validationErrors = ItemTrackingUtils.validateWishlistItem(wishlistData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const query = `
      INSERT INTO wishlist_items (
        user_id, item_reference, desired_item
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      wishlistData.userId,
      wishlistData.itemReference || null,
      JSON.stringify(wishlistData.desiredItem),
    ];

    const result = await db.query(query, values);
    return this.mapToWishlistItem(result.rows[0]);
  }

  static async updateWishlistItem(id: string, updateData: Partial<WishlistItem>): Promise<WishlistItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.itemReference !== undefined) {
      updates.push(`item_reference = $${paramCount}`);
      values.push(updateData.itemReference);
      paramCount++;
    }

    if (updateData.desiredItem !== undefined) {
      updates.push(`desired_item = $${paramCount}`);
      values.push(JSON.stringify(updateData.desiredItem));
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findWishlistItemById(id);
    }

    values.push(id);
    const query = `
      UPDATE wishlist_items 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToWishlistItem(result.rows[0]);
  }

  static async findWishlistItemById(id: string): Promise<WishlistItem | null> {
    const query = 'SELECT * FROM wishlist_items WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToWishlistItem(result.rows[0]);
  }

  static async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    const query = `
      SELECT * FROM wishlist_items 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapToWishlistItem(row));
  }

  static async deleteWishlistItem(id: string): Promise<boolean> {
    const query = 'DELETE FROM wishlist_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  // Usage Tracking
  static async recordItemWear(itemId: string): Promise<void> {
    const query = `
      INSERT INTO item_usage_log (item_id, wear_date)
      VALUES ($1, NOW())
    `;

    await db.query(query, [itemId]);
  }

  static async getItemWearCount(itemId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as wear_count FROM item_usage_log WHERE item_id = $1';
    const result = await db.query(query, [itemId]);
    return parseInt(result.rows[0].wear_count);
  }

  static async getItemUsageHistory(itemId: string, limit: number = 50): Promise<Date[]> {
    const query = `
      SELECT wear_date FROM item_usage_log 
      WHERE item_id = $1 
      ORDER BY wear_date DESC 
      LIMIT $2
    `;

    const result = await db.query(query, [itemId, limit]);
    return result.rows.map(row => new Date(row.wear_date));
  }

  static async getUserUsageStats(userId: string): Promise<{
    totalWears: number;
    mostWornItems: Array<{ itemId: string; wearCount: number }>;
    leastWornItems: Array<{ itemId: string; wearCount: number }>;
  }> {
    const query = `
      SELECT 
        vi.id as item_id,
        COUNT(iul.wear_date) as wear_count
      FROM vufs_items vi
      LEFT JOIN item_usage_log iul ON vi.id = iul.item_id
      WHERE vi.owner_id = $1
      GROUP BY vi.id
      ORDER BY wear_count DESC
    `;

    const result = await db.query(query, [userId]);
    const items = result.rows.map(row => ({
      itemId: row.item_id,
      wearCount: parseInt(row.wear_count),
    }));

    const totalWears = items.reduce((sum, item) => sum + item.wearCount, 0);
    const mostWornItems = items.slice(0, 10); // Top 10
    const leastWornItems = items.slice(-10).reverse(); // Bottom 10

    return {
      totalWears,
      mostWornItems,
      leastWornItems,
    };
  }

  private static mapToLoanRecord(row: any): LoanRecord {
    return {
      id: row.id,
      itemId: row.item_id,
      loaneeId: row.loanee_id,
      loaneeName: row.loanee_name,
      loanDate: new Date(row.loan_date),
      expectedReturnDate: row.expected_return_date ? new Date(row.expected_return_date) : undefined,
      actualReturnDate: row.actual_return_date ? new Date(row.actual_return_date) : undefined,
      status: ItemTrackingUtils.calculateLoanStatus({
        id: row.id,
        itemId: row.item_id,
        loaneeId: row.loanee_id,
        loaneeName: row.loanee_name,
        loanDate: new Date(row.loan_date),
        expectedReturnDate: row.expected_return_date ? new Date(row.expected_return_date) : undefined,
        actualReturnDate: row.actual_return_date ? new Date(row.actual_return_date) : undefined,
        status: 'active', // Will be calculated
        notes: row.notes,
      }),
      notes: row.notes,
    };
  }

  private static mapToWishlistItem(row: any): WishlistItem {
    const desiredItem = typeof row.desired_item === 'string'
      ? JSON.parse(row.desired_item)
      : row.desired_item;

    return {
      id: row.id,
      userId: row.user_id,
      itemReference: row.item_reference,
      desiredItem,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}