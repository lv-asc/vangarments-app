import { db } from '../database/connection';
import {
  Outfit,
  OutfitItem,
  OutfitFilters,
  OutfitCreationSession,
  OutfitPhoto
} from '@vangarments/shared/types/outfit';

export interface CreateOutfitData {
  userId: string;
  name: string;
  description?: string;
  items: OutfitItem[];
  occasion: string;
  season: string;
  style: string[];
  isPublic?: boolean;
}

export class OutfitModel {
  /**
   * Create new outfit
   */
  static async create(data: CreateOutfitData): Promise<Outfit> {
    // Extract color palette from items
    const colorPalette = await this.extractColorPalette(data.items);

    const query = `
      INSERT INTO outfits (
        user_id, name, description, items, occasion, season, 
        style, color_palette, is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.userId,
      data.name,
      data.description || null,
      JSON.stringify(data.items),
      data.occasion,
      data.season,
      data.style,
      colorPalette,
      data.isPublic || false,
    ];

    const result = await db.query(query, values);
    return this.mapToOutfit(result.rows[0]);
  }

  /**
   * Find outfit by ID
   */
  static async findById(id: string): Promise<Outfit | null> {
    const query = 'SELECT * FROM outfits WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToOutfit(result.rows[0]);
  }

  /**
   * Get user's outfits with filters
   */
  static async getUserOutfits(userId: string, filters?: OutfitFilters): Promise<Outfit[]> {
    let query = 'SELECT * FROM outfits WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    // Apply filters
    if (filters?.occasion) {
      query += ` AND occasion = $${paramCount}`;
      values.push(filters.occasion);
      paramCount++;
    }

    if (filters?.season) {
      query += ` AND season = $${paramCount}`;
      values.push(filters.season);
      paramCount++;
    }

    if (filters?.style && filters.style.length > 0) {
      query += ` AND style && $${paramCount}`;
      values.push(filters.style);
      paramCount++;
    }

    if (filters?.colors && filters.colors.length > 0) {
      query += ` AND color_palette && $${paramCount}`;
      values.push(filters.colors);
      paramCount++;
    }

    if (filters?.hasItem) {
      query += ` AND items::text LIKE $${paramCount}`;
      values.push(`%${filters.hasItem}%`);
      paramCount++;
    }

    if (filters?.isFavorite !== undefined) {
      query += ` AND is_favorite = $${paramCount}`;
      values.push(filters.isFavorite);
      paramCount++;
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY updated_at DESC';

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToOutfit(row));
  }

  /**
   * Search public outfits
   */
  static async searchPublicOutfits(filters?: OutfitFilters, limit: number = 50): Promise<Outfit[]> {
    let query = 'SELECT * FROM outfits WHERE is_public = true';
    const values: any[] = [];
    let paramCount = 1;

    // Apply filters (similar to getUserOutfits but for public outfits)
    if (filters?.occasion) {
      query += ` AND occasion = $${paramCount}`;
      values.push(filters.occasion);
      paramCount++;
    }

    if (filters?.season) {
      query += ` AND season = $${paramCount}`;
      values.push(filters.season);
      paramCount++;
    }

    if (filters?.style && filters.style.length > 0) {
      query += ` AND style && $${paramCount}`;
      values.push(filters.style);
      paramCount++;
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${paramCount}`;
    values.push(limit);

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToOutfit(row));
  }

  /**
   * Update outfit
   */
  static async update(id: string, updateData: Partial<CreateOutfitData>): Promise<Outfit | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name) {
      updates.push(`name = $${paramCount}`);
      values.push(updateData.name);
      paramCount++;
    }

    if (updateData.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(updateData.description);
      paramCount++;
    }

    if (updateData.items) {
      updates.push(`items = $${paramCount}`);
      values.push(JSON.stringify(updateData.items));
      paramCount++;

      // Update color palette when items change
      const colorPalette = await this.extractColorPalette(updateData.items);
      updates.push(`color_palette = $${paramCount}`);
      values.push(colorPalette);
      paramCount++;
    }

    if (updateData.occasion) {
      updates.push(`occasion = $${paramCount}`);
      values.push(updateData.occasion);
      paramCount++;
    }

    if (updateData.season) {
      updates.push(`season = $${paramCount}`);
      values.push(updateData.season);
      paramCount++;
    }

    if (updateData.style) {
      updates.push(`style = $${paramCount}`);
      values.push(updateData.style);
      paramCount++;
    }

    if (updateData.isPublic !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(updateData.isPublic);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE outfits 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToOutfit(result.rows[0]);
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<Outfit | null> {
    const query = `
      UPDATE outfits 
      SET is_favorite = NOT is_favorite, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToOutfit(result.rows[0]);
  }

  /**
   * Record outfit wear
   */
  static async recordWear(id: string): Promise<Outfit | null> {
    const query = `
      UPDATE outfits 
      SET wear_count = wear_count + 1, last_worn = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToOutfit(result.rows[0]);
  }

  /**
   * Delete outfit
   */
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM outfits WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get outfit statistics for user
   */
  static async getUserOutfitStats(userId: string): Promise<{
    totalOutfits: number;
    favoriteOutfits: number;
    totalWears: number;
    mostWornOutfit: Outfit | null;
    outfitsByOccasion: Record<string, number>;
    outfitsBySeason: Record<string, number>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_outfits,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_outfits,
        SUM(wear_count) as total_wears,
        occasion,
        season,
        wear_count
      FROM outfits 
      WHERE user_id = $1
      GROUP BY occasion, season, wear_count, id
      ORDER BY wear_count DESC
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return {
        totalOutfits: 0,
        favoriteOutfits: 0,
        totalWears: 0,
        mostWornOutfit: null,
        outfitsByOccasion: {},
        outfitsBySeason: {},
      };
    }

    // Get most worn outfit
    const mostWornQuery = `
      SELECT * FROM outfits 
      WHERE user_id = $1 
      ORDER BY wear_count DESC 
      LIMIT 1
    `;
    const mostWornResult = await db.query(mostWornQuery, [userId]);
    const mostWornOutfit = mostWornResult.rows.length > 0
      ? this.mapToOutfit(mostWornResult.rows[0])
      : null;

    // Aggregate stats
    const stats = result.rows.reduce((acc, row) => {
      acc.totalOutfits = Math.max(acc.totalOutfits, parseInt(row.total_outfits));
      acc.favoriteOutfits = Math.max(acc.favoriteOutfits, parseInt(row.favorite_outfits));
      acc.totalWears = Math.max(acc.totalWears, parseInt(row.total_wears) || 0);

      if (row.occasion) {
        acc.outfitsByOccasion[row.occasion] = (acc.outfitsByOccasion[row.occasion] || 0) + 1;
      }

      if (row.season) {
        acc.outfitsBySeason[row.season] = (acc.outfitsBySeason[row.season] || 0) + 1;
      }

      return acc;
    }, {
      totalOutfits: 0,
      favoriteOutfits: 0,
      totalWears: 0,
      outfitsByOccasion: {} as Record<string, number>,
      outfitsBySeason: {} as Record<string, number>,
    });

    return {
      ...stats,
      mostWornOutfit,
    };
  }

  /**
   * Extract color palette from outfit items
   */
  private static async extractColorPalette(items: OutfitItem[]): Promise<string[]> {
    if (items.length === 0) return [];

    const itemIds = items.map(item => item.vufsItemId);
    const query = `
      SELECT item_data->>'color' as color
      FROM vufs_catalog 
      WHERE id = ANY($1)
    `;

    const result = await db.query(query, [itemIds]);
    const colors = result.rows
      .map(row => row.color)
      .filter(color => color && color !== 'null');

    return [...new Set(colors)]; // Remove duplicates
  }

  /**
   * Map database row to Outfit object
   */
  private static mapToOutfit(row: any): Outfit {
    const items = typeof row.items === 'string'
      ? JSON.parse(row.items)
      : row.items;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      items: items || [],
      occasion: row.occasion,
      season: row.season,
      style: row.style || [],
      colorPalette: row.color_palette || [],
      isPublic: row.is_public,
      isFavorite: row.is_favorite,
      wearCount: row.wear_count || 0,
      lastWorn: row.last_worn ? new Date(row.last_worn) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}