import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export type CollectionType = 'Seasonal' | 'Capsule' | 'Collaboration' | 'Limited' | 'Core' | 'Other';

export interface BrandCollection {
    id: string;
    brandId: string;
    name: string;
    slug?: string;
    description?: string;
    coverImageUrl?: string;
    collectionType?: CollectionType;
    season?: string;
    year?: number;
    isPublished: boolean;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    itemCount?: number;
}

export interface BrandCollectionItem {
    collectionId: string;
    itemId: string;
    sortOrder: number;
    item?: any; // VUFS item details populated on fetch
}

export interface CreateCollectionData {
    brandId: string;
    name: string;
    slug?: string;
    description?: string;
    coverImageUrl?: string;
    collectionType?: CollectionType;
    season?: string;
    year?: number;
    isPublished?: boolean;
}

export interface UpdateCollectionData {
    name?: string;
    slug?: string;
    description?: string;
    coverImageUrl?: string;
    collectionType?: CollectionType;
    season?: string;
    year?: number;
    isPublished?: boolean;
}

export class BrandCollectionModel {
    static async create(data: CreateCollectionData): Promise<BrandCollection> {
        const { brandId, name, description, coverImageUrl, collectionType, season, year, isPublished } = data;

        // Auto-generate slug from name if not provided
        const slug = data.slug || slugify(name);

        const query = `
      INSERT INTO brand_collections (brand_id, name, slug, description, cover_image_url, collection_type, season, year, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

        const result = await db.query(query, [brandId, name, slug, description, coverImageUrl, collectionType, season, year, isPublished ?? false]);
        return this.mapRowToCollection(result.rows[0]);
    }

    static async findById(id: string): Promise<BrandCollection | null> {
        const query = `
      SELECT bc.*, 
             (SELECT COUNT(*) FROM brand_collection_items bci WHERE bci.collection_id = bc.id) as item_count
      FROM brand_collections bc
      WHERE bc.id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToCollection(result.rows[0]) : null;
    }

    static async findBySlugOrId(identifier: string, brandId: string): Promise<BrandCollection | null> {
        // Check if identifier is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            return this.findById(identifier);
        }

        // Find by slug within the brand
        const query = `
      SELECT bc.*, 
             (SELECT COUNT(*) FROM brand_collection_items bci WHERE bci.collection_id = bc.id) as item_count
      FROM brand_collections bc
      WHERE bc.brand_id = $1 AND bc.slug = $2
    `;
        const result = await db.query(query, [brandId, identifier]);
        return result.rows.length > 0 ? this.mapRowToCollection(result.rows[0]) : null;
    }

    static async findByBrand(brandId: string, publishedOnly = false): Promise<BrandCollection[]> {
        let query = `
      SELECT bc.*, 
             (SELECT COUNT(*) FROM brand_collection_items bci WHERE bci.collection_id = bc.id) as item_count
      FROM brand_collections bc
      WHERE bc.brand_id = $1
    `;

        if (publishedOnly) {
            query += ' AND bc.is_published = true';
        }

        query += ' ORDER BY bc.year DESC NULLS LAST, bc.created_at DESC';

        const result = await db.query(query, [brandId]);
        return result.rows.map(row => this.mapRowToCollection(row));
    }

    /**
     * Find collections by VUFS brand ID
     * Looks up brand_accounts that are linked to the given VUFS brand and returns their collections
     */
    static async findByVufsBrandId(vufsBrandId: string, publishedOnly = false): Promise<BrandCollection[]> {
        let query = `
      SELECT bc.*, 
             (SELECT COUNT(*) FROM brand_collection_items bci WHERE bci.collection_id = bc.id) as item_count
      FROM brand_collections bc
      JOIN brand_accounts ba ON bc.brand_id = ba.id
      WHERE ba.vufs_brand_id = $1
    `;

        if (publishedOnly) {
            query += ' AND bc.is_published = true';
        }

        query += ' ORDER BY bc.year DESC NULLS LAST, bc.created_at DESC';

        const result = await db.query(query, [vufsBrandId]);
        return result.rows.map(row => this.mapRowToCollection(row));
    }

    static async update(id: string, updates: UpdateCollectionData): Promise<BrandCollection | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

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
        if (updates.collectionType !== undefined) {
            setClauses.push(`collection_type = $${paramIndex++}`);
            values.push(updates.collectionType);
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
      UPDATE brand_collections
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToCollection(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM brand_collections WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Item Management
    static async addItem(collectionId: string, itemId: string, sortOrder = 0): Promise<void> {
        const query = `
      INSERT INTO brand_collection_items (collection_id, item_id, sort_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (collection_id, item_id) DO UPDATE SET sort_order = $3
    `;
        await db.query(query, [collectionId, itemId, sortOrder]);
    }

    static async removeItem(collectionId: string, itemId: string): Promise<boolean> {
        const query = 'DELETE FROM brand_collection_items WHERE collection_id = $1 AND item_id = $2';
        const result = await db.query(query, [collectionId, itemId]);
        return (result.rowCount || 0) > 0;
    }

    static async getItems(collectionId: string): Promise<BrandCollectionItem[]> {
        const query = `
      SELECT bci.*, vi.metadata, vi.category_hierarchy, vi.brand_hierarchy,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image
      FROM brand_collection_items bci
      LEFT JOIN vufs_items vi ON bci.item_id = vi.id
      WHERE bci.collection_id = $1
      ORDER BY bci.sort_order ASC
    `;

        const result = await db.query(query, [collectionId]);
        return result.rows.map(row => ({
            collectionId: row.collection_id,
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

    static async updateItemOrder(collectionId: string, items: Array<{ itemId: string; sortOrder: number }>): Promise<void> {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            for (const item of items) {
                await client.query(
                    'UPDATE brand_collection_items SET sort_order = $1 WHERE collection_id = $2 AND item_id = $3',
                    [item.sortOrder, collectionId, item.itemId]
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

    private static mapRowToCollection(row: any): BrandCollection {
        return {
            id: row.id,
            brandId: row.brand_id,
            name: row.name,
            slug: row.slug || undefined,
            description: row.description || undefined,
            coverImageUrl: row.cover_image_url || undefined,
            collectionType: row.collection_type || undefined,
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
