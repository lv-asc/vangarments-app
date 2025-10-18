import { db } from '../database/connection';

export interface AnteroomItem {
  id: string;
  ownerId: string;
  itemData: any; // Partial VUFS item data
  completionStatus: {
    hasRequiredPhotos: boolean;
    hasCategory: boolean;
    hasBrand: boolean;
    hasCondition: boolean;
    completionPercentage: number;
  };
  reminders: {
    lastSent: Date | null;
    count: number;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AnteroomModel {
  /**
   * Add item to anteroom for completion within 14 days
   */
  static async addItem(ownerId: string, itemData: any): Promise<AnteroomItem> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

    const completionStatus = this.calculateCompletionStatus(itemData);

    const query = `
      INSERT INTO anteroom_items (
        owner_id, item_data, completion_status, expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      ownerId,
      JSON.stringify(itemData),
      JSON.stringify(completionStatus),
      expiresAt,
    ];

    const result = await db.query(query, values);
    return this.mapToAnteroomItem(result.rows[0]);
  }

  /**
   * Update item in anteroom
   */
  static async updateItem(id: string, itemData: any): Promise<AnteroomItem | null> {
    const completionStatus = this.calculateCompletionStatus(itemData);

    const query = `
      UPDATE anteroom_items 
      SET item_data = $1, completion_status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const values = [
      JSON.stringify(itemData),
      JSON.stringify(completionStatus),
      id,
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToAnteroomItem(result.rows[0]);
  }

  /**
   * Get user's anteroom items
   */
  static async getUserItems(ownerId: string): Promise<AnteroomItem[]> {
    const query = `
      SELECT * FROM anteroom_items 
      WHERE owner_id = $1 AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [ownerId]);
    return result.rows.map(row => this.mapToAnteroomItem(row));
  }

  /**
   * Get item by ID
   */
  static async findById(id: string): Promise<AnteroomItem | null> {
    const query = 'SELECT * FROM anteroom_items WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToAnteroomItem(result.rows[0]);
  }

  /**
   * Remove item from anteroom (when completed or expired)
   */
  static async removeItem(id: string): Promise<boolean> {
    const query = 'DELETE FROM anteroom_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get items that need reminders
   */
  static async getItemsNeedingReminders(): Promise<AnteroomItem[]> {
    const query = `
      SELECT * FROM anteroom_items 
      WHERE expires_at > NOW() 
      AND (
        reminders->>'lastSent' IS NULL OR 
        reminders->>'lastSent'::timestamp < NOW() - INTERVAL '3 days'
      )
      AND (reminders->>'count')::int < 3
    `;

    const result = await db.query(query);
    return result.rows.map(row => this.mapToAnteroomItem(row));
  }

  /**
   * Update reminder status
   */
  static async updateReminderStatus(id: string): Promise<void> {
    const query = `
      UPDATE anteroom_items 
      SET reminders = jsonb_set(
        jsonb_set(reminders, '{lastSent}', to_jsonb(NOW())),
        '{count}', 
        to_jsonb(COALESCE((reminders->>'count')::int, 0) + 1)
      )
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  /**
   * Clean up expired items
   */
  static async cleanupExpiredItems(): Promise<number> {
    const query = 'DELETE FROM anteroom_items WHERE expires_at <= NOW()';
    const result = await db.query(query);
    return result.rowCount;
  }

  /**
   * Calculate completion status of an item
   */
  private static calculateCompletionStatus(itemData: any): {
    hasRequiredPhotos: boolean;
    hasCategory: boolean;
    hasBrand: boolean;
    hasCondition: boolean;
    completionPercentage: number;
  } {
    const status = {
      hasRequiredPhotos: false,
      hasCategory: false,
      hasBrand: false,
      hasCondition: false,
      completionPercentage: 0,
    };

    // Check for required front photo
    if (itemData.images && itemData.images.length > 0) {
      const hasFrontPhoto = itemData.images.some((img: any) => img.type === 'front');
      status.hasRequiredPhotos = hasFrontPhoto;
    }

    // Check for complete category hierarchy
    if (itemData.category && 
        itemData.category.page && 
        itemData.category.blueSubcategory && 
        itemData.category.whiteSubcategory && 
        itemData.category.graySubcategory) {
      status.hasCategory = true;
    }

    // Check for brand information
    if (itemData.brand && itemData.brand.brand) {
      status.hasBrand = true;
    }

    // Check for condition information
    if (itemData.condition && itemData.condition.status) {
      status.hasCondition = true;
    }

    // Calculate completion percentage
    const completedFields = [
      status.hasRequiredPhotos,
      status.hasCategory,
      status.hasBrand,
      status.hasCondition,
    ].filter(Boolean).length;

    status.completionPercentage = Math.round((completedFields / 4) * 100);

    return status;
  }

  private static mapToAnteroomItem(row: any): AnteroomItem {
    const itemData = typeof row.item_data === 'string' 
      ? JSON.parse(row.item_data) 
      : row.item_data;
    
    const completionStatus = typeof row.completion_status === 'string' 
      ? JSON.parse(row.completion_status) 
      : row.completion_status;
    
    const reminders = typeof row.reminders === 'string' 
      ? JSON.parse(row.reminders) 
      : row.reminders || { lastSent: null, count: 0 };

    return {
      id: row.id,
      ownerId: row.owner_id,
      itemData,
      completionStatus,
      reminders: {
        lastSent: reminders.lastSent ? new Date(reminders.lastSent) : null,
        count: reminders.count || 0,
      },
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}