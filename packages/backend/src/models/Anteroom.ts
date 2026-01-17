import { db } from '../database/connection';

// Constants for anteroom limits
export const ANTEROOM_LIMITS = {
  MAX_BATCH_UPLOAD: 10,
  MAX_TOTAL_ITEMS: 50,
  EXPIRY_DAYS: 14,
};

export interface CompletionStatus {
  hasRequiredPhotos: boolean;
  hasCategory: boolean;
  hasBrand: boolean;
  hasCondition: boolean;
  hasColor: boolean;
  hasMaterial: boolean;
  completionPercentage: number;
}

export interface AnteroomItem {
  id: string;
  ownerId: string;
  itemData: any; // Partial VUFS item data
  images: Array<{
    url: string;
    type: string;
    isPrimary: boolean;
  }>;
  completionStatus: CompletionStatus;
  reminders: {
    lastSent: Date | null;
    count: number;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchItemInput {
  images?: Array<{ url: string; type: string; isPrimary: boolean }>;
  itemData?: any;
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
    return (result.rowCount || 0) > 0;
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
    return result.rowCount || 0;
  }

  /**
   * Get user's current anteroom item count
   */
  static async getUserItemCount(ownerId: string): Promise<{ current: number; max: number }> {
    const query = `
      SELECT COUNT(*) as count FROM anteroom_items 
      WHERE owner_id = $1 AND expires_at > NOW()
    `;
    const result = await db.query(query, [ownerId]);
    return {
      current: parseInt(result.rows[0].count, 10),
      max: ANTEROOM_LIMITS.MAX_TOTAL_ITEMS,
    };
  }

  /**
   * Add multiple items in batch (up to 10 at once)
   */
  static async addBatchItems(
    ownerId: string,
    items: BatchItemInput[]
  ): Promise<{ added: AnteroomItem[]; errors: string[] }> {
    const errors: string[] = [];
    const added: AnteroomItem[] = [];

    // Validate batch size
    if (items.length > ANTEROOM_LIMITS.MAX_BATCH_UPLOAD) {
      errors.push(`Maximum ${ANTEROOM_LIMITS.MAX_BATCH_UPLOAD} items per batch upload`);
      return { added, errors };
    }

    // Check user's current item count
    const currentCount = await this.getUserItemCount(ownerId);
    const availableSlots = ANTEROOM_LIMITS.MAX_TOTAL_ITEMS - currentCount.current;

    if (availableSlots <= 0) {
      errors.push(`Maximum ${ANTEROOM_LIMITS.MAX_TOTAL_ITEMS} items in anteroom reached`);
      return { added, errors };
    }

    const itemsToAdd = items.slice(0, availableSlots);
    if (itemsToAdd.length < items.length) {
      errors.push(`Only ${itemsToAdd.length} of ${items.length} items added due to limit`);
    }

    for (const item of itemsToAdd) {
      try {
        const innerItemData = {
          ...item.itemData,
          images: item.images || [],
        };
        const addedItem = await this.addItem(ownerId, innerItemData);
        added.push(addedItem);
      } catch (error) {
        errors.push(`Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { added, errors };
  }

  /**
   * Apply a quality value to multiple items at once
   */
  static async applyQualityToMultiple(
    itemIds: string[],
    quality: string,
    value: any,
    ownerId: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    for (const itemId of itemIds) {
      try {
        const item = await this.findById(itemId);
        if (!item) {
          errors.push(`Item ${itemId} not found`);
          continue;
        }
        if (item.ownerId !== ownerId) {
          errors.push(`Item ${itemId} does not belong to user`);
          continue;
        }

        // Build the updated item data based on quality type
        const updatedItemData = { ...item.itemData };

        switch (quality) {
          case 'color':
            updatedItemData.metadata = updatedItemData.metadata || {};
            updatedItemData.metadata.colors = [{ primary: value, undertones: [] }];
            break;
          case 'brand':
            updatedItemData.brand = { ...updatedItemData.brand, brand: value };
            break;
          case 'material':
            updatedItemData.metadata = updatedItemData.metadata || {};
            updatedItemData.metadata.composition = [{ material: value, percentage: 100 }];
            break;
          case 'condition':
            updatedItemData.condition = { ...updatedItemData.condition, status: value };
            break;
          case 'category':
            updatedItemData.category = { ...updatedItemData.category, ...value };
            break;
          default:
            errors.push(`Unknown quality type: ${quality}`);
            continue;
        }

        await this.updateItem(itemId, updatedItemData);
        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated: updatedCount, errors };
  }

  /**
   * Reset expiry timer when item is updated (extends 14 days from now)
   */
  static async resetExpiry(id: string): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ANTEROOM_LIMITS.EXPIRY_DAYS);

    const query = `
      UPDATE anteroom_items 
      SET expires_at = $1, updated_at = NOW()
      WHERE id = $2
    `;
    const result = await db.query(query, [expiresAt, id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Calculate completion status of an item
   */
  private static calculateCompletionStatus(itemData: any, images?: any[]): CompletionStatus {
    const status: CompletionStatus = {
      hasRequiredPhotos: false,
      hasCategory: false,
      hasBrand: false,
      hasCondition: false,
      hasColor: false,
      hasMaterial: false,
      completionPercentage: 0,
    };

    // Check for required front photo
    const allImages = images || itemData.images || [];
    if (allImages.length > 0) {
      const hasFrontPhoto = allImages.some((img: any) => img.type === 'front');
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

    // Check for color information
    if (itemData.metadata?.colors && itemData.metadata.colors.length > 0) {
      status.hasColor = true;
    }

    // Check for material/composition information
    if (itemData.metadata?.composition && itemData.metadata.composition.length > 0) {
      status.hasMaterial = true;
    }

    // Calculate completion percentage (4 required fields for wardrobe move)
    const requiredFields = [
      status.hasRequiredPhotos,
      status.hasCategory,
      status.hasBrand,
      status.hasCondition,
    ];
    const completedRequired = requiredFields.filter(Boolean).length;
    status.completionPercentage = Math.round((completedRequired / requiredFields.length) * 100);

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

    const images = typeof row.images === 'string'
      ? JSON.parse(row.images)
      : row.images || [];

    return {
      id: row.id,
      ownerId: row.owner_id,
      itemData,
      images,
      completionStatus: {
        hasRequiredPhotos: completionStatus?.hasRequiredPhotos || false,
        hasCategory: completionStatus?.hasCategory || false,
        hasBrand: completionStatus?.hasBrand || false,
        hasCondition: completionStatus?.hasCondition || false,
        hasColor: completionStatus?.hasColor || false,
        hasMaterial: completionStatus?.hasMaterial || false,
        completionPercentage: completionStatus?.completionPercentage || 0,
      },
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