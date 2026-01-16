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
    catalogItem?: any; // Brand Catalog item details populated on fetch
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

        // Find by slug within the brand (check both account ID and vufs ID)
        const query = `
      SELECT bc.*, 
             (SELECT COUNT(*) FROM (
               SELECT item_id FROM brand_collection_items WHERE collection_id = bc.id
               UNION
               SELECT id FROM sku_items WHERE brand_id = bc.brand_id AND collection = bc.name AND parent_sku_id IS NULL AND deleted_at IS NULL
             ) as distinct_parents) as item_count
      FROM brand_collections bc
      LEFT JOIN brand_accounts ba ON bc.brand_id = ba.vufs_brand_id OR bc.brand_id = ba.id
      WHERE (bc.brand_id = $1 OR ba.id = $1 OR ba.vufs_brand_id = $1) 
      AND (bc.slug = $2 OR bc.id::text = $2)
      LIMIT 1
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
         OR bc.brand_id IN (SELECT id FROM brand_accounts WHERE vufs_brand_id = $1)
         OR bc.brand_id IN (SELECT id FROM brand_accounts WHERE id = $1)
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
      LEFT JOIN brand_accounts ba ON bc.brand_id = ba.id
      WHERE ba.vufs_brand_id = $1 OR bc.brand_id = $1
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

    static async getItems(collectionId: string): Promise<any[]> {
        // First get the collection name and brand info to find tagged items
        // Support collections linked via vufs_brand_id or direct brand account id
        const collResult = await db.query(`
            SELECT bc.name, bc.brand_id, ba.id as account_id, ba.brand_info 
            FROM brand_collections bc
            LEFT JOIN brand_accounts ba ON bc.brand_id = ba.id OR bc.brand_id = ba.vufs_brand_id
            WHERE bc.id = $1
        `, [collectionId]);

        if (collResult.rows.length === 0) return [];
        const collectionName = collResult.rows[0].name;
        // Use the account ID for querying SKUs, not the collection's brand_id
        const brandId = collResult.rows[0].account_id || collResult.rows[0].brand_id;
        const brandInfo = typeof collResult.rows[0].brand_info === 'string'
            ? JSON.parse(collResult.rows[0].brand_info)
            : collResult.rows[0].brand_info;

        // Fetch all SKUs for this brand that might be in this collection
        // We fetch ALL variants so we can group them correctly
        const query = `
            SELECT 
                si.id, si.parent_sku_id, si.name, si.code, si.collection, si.metadata, 
                si.retail_price_brl, si.retail_price_usd, si.retail_price_eur,
                si.images, si.category, si.line, si.line_id,
                bl.name as line_name, bl.logo as line_logo,
                EXISTS(SELECT 1 FROM brand_collection_items bci WHERE bci.collection_id = $1 AND bci.item_id = si.id) as in_collection_items
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            WHERE si.brand_id = $2 AND si.deleted_at IS NULL
            AND (
                si.collection = $3 
                OR si.id IN (SELECT item_id FROM brand_collection_items WHERE collection_id = $1)
                OR si.parent_sku_id IN (SELECT item_id FROM brand_collection_items WHERE collection_id = $1)
                OR si.parent_sku_id IN (SELECT id FROM sku_items WHERE brand_id = $2 AND collection = $3)
            )
            ORDER BY si.created_at DESC
        `;

        const result = await db.query(query, [collectionId, brandId, collectionName]);
        const allSkus = result.rows;

        // Group by parent_sku_id
        const childrenByParentId: Record<string, any[]> = {};
        const childSkuIds = new Set<string>();

        allSkus.forEach((sku: any) => {
            if (sku.parent_sku_id) {
                childSkuIds.add(sku.id);
                if (!childrenByParentId[sku.parent_sku_id]) {
                    childrenByParentId[sku.parent_sku_id] = [];
                }
                childrenByParentId[sku.parent_sku_id].push(sku);
            }
        });

        // Construct parent items
        const groupedItems = allSkus
            .filter((sku: any) => !childSkuIds.has(sku.id))
            .map((sku: any) => {
                const rawVariants = childrenByParentId[sku.id] || [];
                const variants = rawVariants.map((v: any) => {
                    const vMetadata = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata;
                    return {
                        id: v.id,
                        name: v.name,
                        code: v.code,
                        size: vMetadata?.sizeName || vMetadata?.size || '',
                        sizeId: vMetadata?.sizeId,
                        color: vMetadata?.colorName || vMetadata?.color,
                        retailPriceBrl: v.retail_price_brl,
                        images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images || []
                    };
                });

                const skuMetadata = typeof sku.metadata === 'string' ? JSON.parse(sku.metadata) : sku.metadata;

                return {
                    id: sku.id,
                    itemId: sku.id,
                    name: sku.name,
                    code: sku.code,
                    collection: sku.collection,
                    retailPriceBrl: sku.retail_price_brl,
                    description: skuMetadata?.description || '',
                    images: typeof sku.images === 'string' ? JSON.parse(sku.images) : sku.images || [],
                    category: typeof sku.category === 'string' ? JSON.parse(sku.category) : sku.category,
                    brand: {
                        id: brandId,
                        name: brandInfo?.name || 'Unknown',
                        slug: brandInfo?.slug,
                        logo: brandInfo?.logo
                    },
                    lineInfo: sku.line_id ? {
                        id: sku.line_id,
                        name: sku.line_name,
                        logo: sku.line_logo
                    } : (sku.line ? { name: sku.line } : undefined),
                    variants
                };
            });

        return groupedItems;
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
            slug: row.slug || slugify(row.name),
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
