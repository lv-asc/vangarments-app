import { db } from '../database/connection';

export interface BrandLookbook {
    id: string;
    brandId: string;
    collectionId?: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    images?: string[];
    season?: string;
    year?: number;
    isPublished: boolean;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    itemCount?: number;
}

export interface BrandLookbookItem {
    lookbookId: string;
    itemId: string;
    sortOrder: number;
    item?: any; // VUFS item details populated on fetch
}

export interface CreateLookbookData {
    brandId: string;
    collectionId?: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    images?: string[];
    season?: string;
    year?: number;
}

export interface UpdateLookbookData {
    collectionId?: string;
    name?: string;
    description?: string;
    coverImageUrl?: string;
    images?: string[];
    season?: string;
    year?: number;
    isPublished?: boolean;
}

export class BrandLookbookModel {
    static async create(data: CreateLookbookData): Promise<BrandLookbook> {
        const { brandId, collectionId, name, description, coverImageUrl, images, season, year } = data;

        const query = `
      INSERT INTO brand_lookbooks (brand_id, collection_id, name, description, cover_image_url, images, season, year)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const result = await db.query(query, [brandId, collectionId, name, description, coverImageUrl, images || [], season, year]);
        return this.mapRowToLookbook(result.rows[0]);
    }

    static async findById(id: string): Promise<BrandLookbook | null> {
        const query = `
      SELECT lb.*, 
             (SELECT COUNT(*) FROM brand_lookbook_items bli WHERE bli.lookbook_id = lb.id) as item_count
      FROM brand_lookbooks lb
      WHERE lb.id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToLookbook(result.rows[0]) : null;
    }

    static async findByBrand(brandId: string, publishedOnly = false): Promise<BrandLookbook[]> {
        let query = `
      SELECT lb.*, 
             (SELECT COUNT(*) FROM brand_lookbook_items bli WHERE bli.lookbook_id = lb.id) as item_count
      FROM brand_lookbooks lb
      WHERE lb.brand_id = $1
    `;

        if (publishedOnly) {
            query += ' AND lb.is_published = true';
        }

        query += ' ORDER BY lb.year DESC NULLS LAST, lb.created_at DESC';

        const result = await db.query(query, [brandId]);
        return result.rows.map(row => this.mapRowToLookbook(row));
    }

    static async update(id: string, updates: UpdateLookbookData): Promise<BrandLookbook | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.collectionId !== undefined) {
            setClauses.push(`collection_id = $${paramIndex++}`);
            values.push(updates.collectionId);
        }
        if (updates.name !== undefined) {
            setClauses.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${paramIndex++}`);
            values.push(updates.description);
        }
        if (updates.coverImageUrl !== undefined) {
            setClauses.push(`cover_image_url = $${paramIndex++}`);
            values.push(updates.coverImageUrl);
        }
        if (updates.images !== undefined) {
            setClauses.push(`images = $${paramIndex++}`);
            values.push(updates.images);
        }
        if (updates.season !== undefined) {
            setClauses.push(`season = $${paramIndex++}`);
            values.push(updates.season);
        }
        if (updates.year !== undefined) {
            setClauses.push(`year = $${paramIndex++}`);
            values.push(updates.year);
        }
        if (updates.isPublished !== undefined) {
            setClauses.push(`is_published = $${paramIndex++}`);
            values.push(updates.isPublished);
            if (updates.isPublished) {
                setClauses.push('published_at = NOW()');
            }
        }

        if (setClauses.length === 0) {
            return this.findById(id);
        }

        setClauses.push('updated_at = NOW()');
        values.push(id);

        const query = `
      UPDATE brand_lookbooks
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToLookbook(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM brand_lookbooks WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Item Management
    static async addItem(lookbookId: string, itemId: string, sortOrder = 0): Promise<void> {
        const query = `
      INSERT INTO brand_lookbook_items (lookbook_id, item_id, sort_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (lookbook_id, item_id) DO UPDATE SET sort_order = $3
    `;
        await db.query(query, [lookbookId, itemId, sortOrder]);
    }

    static async removeItem(lookbookId: string, itemId: string): Promise<boolean> {
        const query = 'DELETE FROM brand_lookbook_items WHERE lookbook_id = $1 AND item_id = $2';
        const result = await db.query(query, [lookbookId, itemId]);
        return (result.rowCount || 0) > 0;
    }

    static async getItems(lookbookId: string): Promise<BrandLookbookItem[]> {
        const query = `
      SELECT bli.*, vi.metadata, vi.category_hierarchy, vi.brand_hierarchy,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image
      FROM brand_lookbook_items bli
      LEFT JOIN vufs_items vi ON bli.item_id = vi.id
      WHERE bli.lookbook_id = $1
      ORDER BY bli.sort_order ASC
    `;

        const result = await db.query(query, [lookbookId]);
        return result.rows.map(row => ({
            lookbookId: row.lookbook_id,
            itemId: row.item_id,
            sortOrder: row.sort_order,
            item: row.metadata ? {
                id: row.item_id,
                metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
                categoryHierarchy: row.category_hierarchy,
                brandHierarchy: row.brand_hierarchy,
                primaryImage: row.primary_image
            } : undefined
        }));
    }

    static async updateItemOrder(lookbookId: string, items: Array<{ itemId: string; sortOrder: number }>): Promise<void> {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            for (const item of items) {
                await client.query(
                    'UPDATE brand_lookbook_items SET sort_order = $1 WHERE lookbook_id = $2 AND item_id = $3',
                    [item.sortOrder, lookbookId, item.itemId]
                );
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private static mapRowToLookbook(row: any): BrandLookbook {
        return {
            id: row.id,
            brandId: row.brand_id,
            collectionId: row.collection_id || undefined,
            name: row.name,
            description: row.description || undefined,
            coverImageUrl: row.cover_image_url || undefined,
            images: row.images || [],
            season: row.season || undefined,
            year: row.year || undefined,
            isPublished: row.is_published,
            publishedAt: row.published_at ? new Date(row.published_at) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            itemCount: row.item_count !== undefined ? parseInt(row.item_count) : undefined
        };
    }
}
