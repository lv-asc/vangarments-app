import { db } from '../database/connection';

export interface Wishlist {
    id: string;
    userId: string;
    name: string;
    isDefault: boolean;
    visibility: 'public' | 'friends' | 'private';
    createdAt: Date;
    items?: WishlistItem[];
    itemsCount?: number;
}

export interface WishlistItem {
    wishlistId: string;
    skuItemId: string;
    addedAt: Date;
    notes?: string;
    item?: any; // SKU Item details
}

export class WishlistModel {
    static async getByUserId(userId: string): Promise<Wishlist[]> {
        const query = `
            SELECT w.*,
                   (SELECT COUNT(*) FROM wishlist_items wi WHERE wi.wishlist_id = w.id) as items_count
            FROM user_wishlists w
            WHERE w.user_id = $1
            ORDER BY w.is_default DESC, w.created_at DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows.map(this.mapRowToWishlist);
    }

    static async findById(wishlistId: string): Promise<Wishlist | null> {
        const query = `SELECT * FROM user_wishlists WHERE id = $1`;
        const result = await db.query(query, [wishlistId]);
        return result.rows.length > 0 ? this.mapRowToWishlist(result.rows[0]) : null;
    }

    static async getOrCreateDefault(userId: string): Promise<Wishlist> {
        let wishlist = await this.getDefault(userId);
        if (!wishlist) {
            wishlist = await this.create(userId, 'Wishlist', true);
        }
        return wishlist;
    }

    static async getDefault(userId: string): Promise<Wishlist | null> {
        const query = `SELECT * FROM user_wishlists WHERE user_id = $1 AND is_default = TRUE`;
        const result = await db.query(query, [userId]);
        return result.rows.length > 0 ? this.mapRowToWishlist(result.rows[0]) : null;
    }

    static async create(userId: string, name: string, isDefault = false): Promise<Wishlist> {
        const query = `
            INSERT INTO user_wishlists (user_id, name, is_default)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [userId, name, isDefault]);
        return this.mapRowToWishlist(result.rows[0]);
    }

    static async addItem(wishlistId: string, skuItemId: string): Promise<void> {
        const query = `
            INSERT INTO wishlist_items (wishlist_id, sku_item_id)
            VALUES ($1, $2)
            ON CONFLICT (wishlist_id, sku_item_id) DO NOTHING
        `;
        await db.query(query, [wishlistId, skuItemId]);
    }

    static async removeItem(wishlistId: string, skuItemId: string): Promise<void> {
        const query = `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND sku_item_id = $2`;
        await db.query(query, [wishlistId, skuItemId]);
    }

    static async getItems(wishlistId: string): Promise<WishlistItem[]> {
        const query = `
            SELECT wi.*, si.id as item_id, si.name, si.code, si.retail_price_brl, si.images
            FROM wishlist_items wi
            JOIN sku_items si ON wi.sku_item_id = si.id
            WHERE wi.wishlist_id = $1
            ORDER BY wi.added_at DESC
        `;
        const result = await db.query(query, [wishlistId]);
        return result.rows.map(row => ({
            wishlistId: row.wishlist_id,
            skuItemId: row.sku_item_id,
            addedAt: row.added_at,
            notes: row.notes,
            item: {
                id: row.item_id,
                name: row.name,
                code: row.code,
                retailPriceBrl: row.retail_price_brl ? Number(row.retail_price_brl) : null,
                images: row.images
            }
        }));
    }

    // Helper check if item is in ANY of user's wishlists
    static async isItemInUserWishlist(userId: string, skuItemId: string): Promise<boolean> {
        const query = `
            SELECT 1 
            FROM wishlist_items wi
            JOIN user_wishlists w ON wi.wishlist_id = w.id
            WHERE w.user_id = $1 AND wi.sku_item_id = $2
            LIMIT 1
        `;
        const result = await db.query(query, [userId, skuItemId]);
        return result.rows.length > 0;
    }

    static async update(wishlistId: string, userId: string, data: { name?: string, visibility?: string }): Promise<Wishlist | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }

        if (data.visibility) {
            updates.push(`visibility = $${paramCount++}`);
            values.push(data.visibility);
        }

        if (updates.length === 0) return null;

        values.push(wishlistId, userId);
        const query = `
            UPDATE user_wishlists
            SET ${updates.join(', ')}
            WHERE id = $${paramCount++} AND user_id = $${paramCount++}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToWishlist(result.rows[0]) : null;
    }

    static async delete(wishlistId: string, userId: string): Promise<boolean> {
        // Cannot delete default wishlist
        const query = `DELETE FROM user_wishlists WHERE id = $1 AND user_id = $2 AND is_default = FALSE`;
        const result = await db.query(query, [wishlistId, userId]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToWishlist(row: any): Wishlist {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            isDefault: row.is_default,
            visibility: row.visibility,
            createdAt: row.created_at,
            itemsCount: row.items_count ? parseInt(row.items_count) : 0
        };
    }
}
