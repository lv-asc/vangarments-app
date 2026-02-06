import { db } from '../database/connection';
import { VUFSItemModel } from './VUFSItem';

export interface OutfitItem {
    id: string;
    outfitId: string;
    itemId: string;
    positionX: number;
    positionY: number;
    rotation: number;
    scale: number;
    zIndex: number;
    itemType: 'vufs' | 'sku';
    createdAt: Date;
    // Enriched
    itemData?: any;
}

export interface Outfit {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    description?: string;
    previewUrl?: string;
    items: OutfitItem[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;  // Soft delete timestamp
}

export interface CreateOutfitData {
    ownerId: string;
    name: string;
    description?: string;
    previewUrl?: string;
    items: Array<{
        itemId: string;
        positionX?: number;
        positionY?: number;
        rotation?: number;
        scale?: number;
        zIndex?: number;
        itemType?: 'vufs' | 'sku';
    }>;
}

export interface UpdateOutfitData {
    name?: string;
    description?: string;
    previewUrl?: string;
    items?: Array<{
        itemId: string;
        positionX: number;
        positionY: number;
        rotation: number;
        scale: number;
        zIndex: number;
        itemType?: 'vufs' | 'sku';
    }>;
}

export class OutfitModel {
    // Generate slug from name
    private static generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static async create(data: CreateOutfitData): Promise<Outfit> {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            const slug = this.generateSlug(data.name);

            // Create outfit
            const outfitQuery = `
        INSERT INTO outfits (owner_id, name, slug, description, preview_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const outfitRes = await client.query(outfitQuery, [
                data.ownerId,
                data.name,
                slug,
                data.description || '',
                data.previewUrl
            ]);
            const outfit = outfitRes.rows[0];

            // Create outfit items
            const items: OutfitItem[] = [];
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const itemQuery = `
            INSERT INTO outfit_items (
              outfit_id, item_id, position_x, position_y, 
              rotation, scale, z_index, item_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `;
                    // Determine item type if not provided (assume 'vufs' for legacy)
                    // But wait, the frontend doesn't send itemType yet. 
                    // We need to infer it or update frontend.
                    // For now, let's assume 'sku' if it's a SKU uuid? No, both are UUIDs.
                    // We need to update frontend to send itemType, OR infer it here by checking tables.
                    // To keep it fast, let's update frontend to send it.
                    // But first, let's default to item.itemType || 'vufs'

                    const itemType = item.itemType || 'vufs';

                    const itemRes = await client.query(itemQuery, [
                        outfit.id,
                        item.itemId,
                        item.positionX || 0,
                        item.positionY || 0,
                        item.rotation || 0,
                        item.scale || 1,
                        item.zIndex || 0,
                        itemType
                    ]);
                    items.push(this.mapToOutfitItem(itemRes.rows[0]));
                }
            }

            await client.query('COMMIT');

            return {
                ...this.mapToOutfit(outfit),
                items
            };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async findById(id: string): Promise<Outfit | null> {
        const outfitQuery = `SELECT * FROM outfits WHERE id = $1`;
        const outfitRes = await db.query(outfitQuery, [id]);

        if (outfitRes.rows.length === 0) {
            return null;
        }

        const outfit = this.mapToOutfit(outfitRes.rows[0]);

        // Fetch items
        const itemsQuery = `
      SELECT oi.* 
      FROM outfit_items oi
      WHERE oi.outfit_id = $1
      ORDER BY oi.z_index ASC
    `;
        const itemsRes = await db.query(itemsQuery, [id]);
        outfit.items = itemsRes.rows.map(row => this.mapToOutfitItem(row));

        // Enrich items with VUFS Item data
        // Optimisation: We could do a join, but VUFSItemModel typically handles complex logic/joins itself.
        // For now, let's just fetch them differently or reuse logic.
        // Actually, join is better for performance.

        // Let's manually fetch item data for now to ensure we get the images etc correctly via VUFSItemModel logic
        // Or we can do a bulk fetch if VUFSItemModel supports it.
        // VUFSItemModel doesn't seem to have bulk fetch by IDs easily exposed except via search/filter hacks.
        // We'll iterate for now, or implement a simple bulk fetch here.

        const vufsItemIds = outfit.items.filter(i => i.itemType === 'vufs').map(i => i.itemId);
        const skuItemIds = outfit.items.filter(i => i.itemType === 'sku').map(i => i.itemId);

        const dataMap = new Map();

        // 1. Fetch VUFS Items
        if (vufsItemIds.length > 0) {
            const vufsItemsQuery = `
         SELECT v.*, 
             b.brand_info->>'name' as brand_account_name, 
             b.brand_info->>'logo' as brand_logo
         FROM vufs_items v
         LEFT JOIN brand_accounts b ON (v.brand_hierarchy->>'brand' ILIKE (b.brand_info->>'name'))
         WHERE v.id = ANY($1)
       `;
            const vufsRes = await db.query(vufsItemsQuery, [vufsItemIds]);
            vufsRes.rows.forEach(r => dataMap.set(r.id, r));

            // Also need images for VUFS items
            const imagesQuery = `SELECT * FROM item_images WHERE item_id = ANY($1)`;
            const imagesRes = await db.query(imagesQuery, [vufsItemIds]);
            const imagesMap = new Map();
            imagesRes.rows.forEach((r: any) => {
                if (!imagesMap.has(r.item_id)) imagesMap.set(r.item_id, []);
                imagesMap.get(r.item_id).push({
                    url: r.image_url,
                    type: r.image_type,
                    isPrimary: r.is_primary
                });
            });

            // Attach images to dataMap
            vufsRes.rows.forEach(r => {
                const itemData = dataMap.get(r.id);
                if (itemData) {
                    itemData.images = imagesMap.get(r.id) || [];
                }
            });
        }

        // 2. Fetch SKU Items
        if (skuItemIds.length > 0) {
            const skusQuery = `
                SELECT s.*,
                    ba.brand_info->>'name' as brand_name,
                    ba.brand_info->>'logo' as brand_logo
                FROM sku_items s
                LEFT JOIN brand_accounts ba ON s.brand_id = ba.id
                WHERE s.id = ANY($1)
            `;
            const skusRes = await db.query(skusQuery, [skuItemIds]);

            skusRes.rows.forEach(r => {
                // Ensure images format matches what frontend expects 
                // SKU images are typically stored as JSON/array in the 'images' column or 'images' string
                let images = [];
                if (typeof r.images === 'string') {
                    try { images = JSON.parse(r.images); } catch (e) { }
                } else if (Array.isArray(r.images)) {
                    images = r.images;
                }

                // Map SKU to compatible itemData structure
                dataMap.set(r.id, {
                    ...r,
                    images: images,
                    brand_account_name: r.brand_name,
                    brand_logo: r.brand_logo
                });
            });
        }

        // 3. Enrich items
        outfit.items.forEach(item => {
            const data = dataMap.get(item.itemId);
            if (data) {
                item.itemData = data;
            }
        });

        return outfit;
    }

    static async findByOwner(ownerId: string): Promise<Outfit[]> {
        const query = `
      SELECT * FROM outfits 
      WHERE owner_id = $1 AND deleted_at IS NULL
      ORDER BY updated_at DESC
    `;
        const result = await db.query(query, [ownerId]);

        // We intentionally don't fetch all items for the list view to save performance
        // unless required. But usually we want a preview.
        // Let's return the outfits without items array populated, or maybe just a count/preview.

        return result.rows.map(row => ({
            ...this.mapToOutfit(row),
            items: [] // Populated only in detail view
        }));
    }

    // Soft delete - sets deleted_at timestamp
    static async delete(id: string): Promise<boolean> {
        const query = `UPDATE outfits SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Restore from trash - clears deleted_at
    static async restore(id: string): Promise<boolean> {
        const query = `UPDATE outfits SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`;
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Find deleted outfits (trash)
    static async findDeleted(ownerId: string): Promise<Outfit[]> {
        const query = `
            SELECT * FROM outfits 
            WHERE owner_id = $1 AND deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
        `;
        const result = await db.query(query, [ownerId]);
        return result.rows.map(row => ({
            ...this.mapToOutfit(row),
            items: []
        }));
    }

    // Permanently delete from database
    static async permanentDelete(id: string): Promise<boolean> {
        const query = `DELETE FROM outfits WHERE id = $1`;
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    static async update(id: string, data: UpdateOutfitData): Promise<Outfit | null> {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // Update outfit details
            if (data.name !== undefined || data.description !== undefined || data.previewUrl !== undefined) {
                const updates = [];
                const values = [];
                let idx = 1;

                if (data.name !== undefined) {
                    updates.push(`name = $${idx}`);
                    values.push(data.name);
                    idx++;
                }
                if (data.description !== undefined) {
                    updates.push(`description = $${idx}`);
                    values.push(data.description);
                    idx++;
                }
                if (data.previewUrl !== undefined) {
                    updates.push(`preview_url = $${idx}`);
                    values.push(data.previewUrl);
                    idx++;
                }

                if (updates.length > 0) {
                    values.push(id);
                    await client.query(`
                UPDATE outfits 
                SET ${updates.join(', ')}, updated_at = NOW() 
                WHERE id = $${idx}
              `, values);
                }
            }

            // Update Items: Full replacement strategy is easiest for canvas state
            if (data.items) {
                // Delete existing
                await client.query(`DELETE FROM outfit_items WHERE outfit_id = $1`, [id]);

                // Insert new
                for (const item of data.items) {
                    await client.query(`
                INSERT INTO outfit_items (
                  outfit_id, item_id, position_x, position_y, 
                  rotation, scale, z_index, item_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `, [
                        id, item.itemId, item.positionX, item.positionY,
                        item.rotation, item.scale, item.zIndex, item.itemType || 'vufs'
                    ]);
                }
            }

            await client.query('COMMIT');

            return this.findById(id);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    private static mapToOutfit(row: any): Outfit {
        return {
            id: row.id,
            ownerId: row.owner_id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            previewUrl: row.preview_url,
            items: [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }

    private static mapToOutfitItem(row: any): OutfitItem {
        return {
            id: row.id,
            outfitId: row.outfit_id,
            itemId: row.item_id,
            positionX: row.position_x,
            positionY: row.position_y,
            rotation: row.rotation,
            scale: row.scale,
            zIndex: row.z_index,
            itemType: row.item_type || 'vufs',
            createdAt: row.created_at
        };
    }

    // Find outfit by owner and slug
    static async findBySlug(ownerId: string, slug: string): Promise<Outfit | null> {
        const query = `SELECT * FROM outfits WHERE owner_id = $1 AND slug = $2`;
        const result = await db.query(query, [ownerId, slug]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.findById(result.rows[0].id);
    }

    // Find outfits by username (for public profile)
    static async findByUsername(username: string): Promise<Outfit[]> {
        const query = `
            SELECT o.* FROM outfits o
            JOIN users u ON o.owner_id = u.id
            WHERE u.username = $1 AND o.deleted_at IS NULL
            ORDER BY o.updated_at DESC
        `;
        const result = await db.query(query, [username]);

        return result.rows.map(row => ({
            ...this.mapToOutfit(row),
            items: []
        }));
    }

    // Find outfit by username and slug (for public single outfit view)
    static async findByUsernameAndSlug(username: string, slug: string): Promise<Outfit | null> {
        const query = `
            SELECT o.* FROM outfits o
            JOIN users u ON o.owner_id = u.id
            WHERE u.username = $1 AND o.slug = $2
        `;
        const result = await db.query(query, [username, slug]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.findById(result.rows[0].id);
    }
}
