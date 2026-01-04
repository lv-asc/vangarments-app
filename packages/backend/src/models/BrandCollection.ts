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
      SELECT bci.*, 
             -- Direct VUFS Link
             vi.id as vufs_id,
             vi.metadata as vufs_metadata, 
             vi.category_hierarchy, 
             vi.brand_hierarchy,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image,
             ARRAY(SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id ORDER BY ii.is_primary DESC, ii.created_at ASC) as all_images,
             
             -- Catalog Item Link
             bcat.id as cat_id,
             bcat.official_price,
             bcat.brand_specific_data,
             
             -- VUFS linked via Catalog
             vi_cat.id as cat_vufs_id,
             vi_cat.metadata as cat_vufs_metadata,
             vi_cat.category_hierarchy as cat_category_hierarchy,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi_cat.id AND ii.is_primary = true LIMIT 1) as cat_primary_image,
             ARRAY(SELECT image_url FROM item_images ii WHERE ii.item_id = vi_cat.id ORDER BY ii.is_primary DESC, ii.created_at ASC) as cat_all_images

      FROM brand_collection_items bci
      LEFT JOIN vufs_items vi ON bci.item_id = vi.id
      LEFT JOIN brand_catalog_items bcat ON bci.item_id = bcat.id
      LEFT JOIN vufs_items vi_cat ON bcat.vufs_item_id = vi_cat.id
      WHERE bci.collection_id = $1
      ORDER BY bci.sort_order ASC
    `;

        const result = await db.query(query, [collectionId]);
        return result.rows.map(row => {
            const metadata = row.vufs_metadata ? (typeof row.vufs_metadata === 'string' ? JSON.parse(row.vufs_metadata) : row.vufs_metadata) : null;
            const catMetadata = row.cat_vufs_metadata ? (typeof row.cat_vufs_metadata === 'string' ? JSON.parse(row.cat_vufs_metadata) : row.cat_vufs_metadata) : null;

            // Construct Item object (from direct link)
            const item = metadata ? {
                id: row.vufs_id,
                name: metadata.name || 'Untitled Item',
                description: metadata.description || '',
                images: row.all_images && row.all_images.length > 0 ? row.all_images : (row.primary_image ? [row.primary_image] : []),
                metadata: metadata,
                categoryHierarchy: row.category_hierarchy,
                brandHierarchy: row.brand_hierarchy,
                primaryImage: row.primary_image
            } : undefined;

            // Construct Catalog Item object
            const catalogItem = row.cat_id ? {
                id: row.cat_id,
                vufsItemId: row.cat_vufs_id,
                name: catMetadata?.name || 'Untitled Item',
                description: catMetadata?.description || '',
                officialPrice: row.official_price,
                brandSpecificData: row.brand_specific_data,
                images: row.cat_all_images && row.cat_all_images.length > 0 ? row.cat_all_images : (row.cat_primary_image ? [row.cat_primary_image] : []),
                metadata: catMetadata,
                categoryHierarchy: row.cat_category_hierarchy,
                primaryImage: row.cat_primary_image
            } : undefined;

            // Use the catalog item's underlying item as fallback for 'item' property if direct item is missing but catalog item exists
            // This ensures frontend code using item.item works even if it's a catalog item link
            const effectiveItem = item || (catalogItem ? {
                id: catalogItem.vufsItemId,
                name: catalogItem.name,
                description: catalogItem.description,
                images: catalogItem.images,
                metadata: catalogItem.metadata,
                categoryHierarchy: catalogItem.categoryHierarchy,
                primaryImage: catalogItem.primaryImage
            } : undefined);

            return {
                collectionId: row.collection_id,
                itemId: row.item_id,
                sortOrder: row.sort_order,
                item: effectiveItem,
                catalogItem: catalogItem // Add this property to the interface below
            };
        });
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
