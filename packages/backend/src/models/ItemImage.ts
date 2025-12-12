import { db } from '../database/connection';

export interface ItemImage {
  id: string;
  itemId: string;
  imageUrl: string;
  imageType: 'front' | 'back' | 'detail' | 'styled';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: any;
  isProcessed: boolean;
  isPrimary: boolean;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemImageData {
  itemId: string;
  imageUrl: string;
  imageType: 'front' | 'back' | 'detail' | 'styled';
  isPrimary?: boolean;
  aiAnalysis?: any;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export class ItemImageModel {
  static async create(imageData: CreateItemImageData): Promise<ItemImage> {
    const { itemId, imageUrl, imageType, isPrimary = false, aiAnalysis, fileSize, mimeType, width, height } = imageData;

    const query = `
      INSERT INTO item_images (
        item_id, image_url, image_type, is_primary, 
        processing_status, ai_analysis, is_processed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      itemId,
      imageUrl,
      imageType,
      isPrimary,
      'completed',
      aiAnalysis ? JSON.stringify(aiAnalysis) : null,
      !!aiAnalysis,
    ];

    const result = await db.query(query, values);
    return this.mapToItemImage(result.rows[0]);
  }

  static async findByItemId(itemId: string): Promise<ItemImage[]> {
    const query = `
      SELECT * FROM item_images 
      WHERE item_id = $1 
      ORDER BY is_primary DESC, created_at ASC
    `;

    const result = await db.query(query, [itemId]);
    return result.rows.map(row => this.mapToItemImage(row));
  }

  static async findById(id: string): Promise<ItemImage | null> {
    const query = 'SELECT * FROM item_images WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToItemImage(result.rows[0]);
  }

  static async updateProcessingStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    aiAnalysis?: any
  ): Promise<ItemImage | null> {
    const query = `
      UPDATE item_images 
      SET processing_status = $1, ai_analysis = $2, is_processed = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      status,
      aiAnalysis ? JSON.stringify(aiAnalysis) : null,
      status === 'completed' && !!aiAnalysis,
      id,
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToItemImage(result.rows[0]);
  }

  static async setPrimary(itemId: string, imageId: string): Promise<boolean> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Remove primary flag from all images for this item
      await client.query(
        'UPDATE item_images SET is_primary = false WHERE item_id = $1',
        [itemId]
      );

      // Set the specified image as primary
      const result = await client.query(
        'UPDATE item_images SET is_primary = true WHERE id = $1 AND item_id = $2',
        [imageId, itemId]
      );

      await client.query('COMMIT');
      return (result.rowCount || 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM item_images WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async deleteByItemId(itemId: string): Promise<number> {
    const query = 'DELETE FROM item_images WHERE item_id = $1';
    const result = await db.query(query, [itemId]);
    return result.rowCount || 0;
  }

  private static mapToItemImage(row: any): ItemImage {
    const aiAnalysis = row.ai_analysis ?
      (typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis) :
      null;

    return {
      id: row.id,
      itemId: row.item_id,
      imageUrl: row.image_url,
      imageType: row.image_type,
      processingStatus: row.processing_status,
      aiAnalysis,
      isProcessed: row.is_processed,
      isPrimary: row.is_primary,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}