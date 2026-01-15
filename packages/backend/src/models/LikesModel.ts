import { db } from '../database/connection';
import { DATA_DRIVEN_FEATURES } from './DataDrivenFeatures';

export interface UserLike {
    id: string;
    userId: string;
    skuItemId: string;
    createdAt: Date;
    item?: any; // To store joined item data
}

export class LikesModel {
    static async toggle(userId: string, skuItemId: string): Promise<{ liked: boolean }> {
        const existing = await this.hasUserLiked(userId, skuItemId);

        if (existing) {
            await this.delete(userId, skuItemId);
            return { liked: false };
        } else {
            await this.create(userId, skuItemId);
            return { liked: true };
        }
    }

    static async create(userId: string, skuItemId: string): Promise<UserLike> {
        const query = `
            INSERT INTO user_likes (user_id, sku_item_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await db.query(query, [userId, skuItemId]);

        // Track analytics
        // We could track 'like_item' event here if we have an analytics system

        return this.mapRowToUserLike(result.rows[0]);
    }

    static async delete(userId: string, skuItemId: string): Promise<boolean> {
        const query = 'DELETE FROM user_likes WHERE user_id = $1 AND sku_item_id = $2';
        const result = await db.query(query, [userId, skuItemId]);
        return (result.rowCount || 0) > 0;
    }

    static async hasUserLiked(userId: string, skuItemId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM user_likes WHERE user_id = $1 AND sku_item_id = $2';
        const result = await db.query(query, [userId, skuItemId]);
        return result.rows.length > 0;
    }

    static async getUserLikedItems(userId: string, limit = 20, offset = 0): Promise<{ items: any[]; total: number }> {
        const query = `
            SELECT ul.*, 
                   si.id as item_id, si.name, si.code, si.description, 
                   si.retail_price_brl, si.retail_price_usd, si.retail_price_eur,
                   si.images, si.brand_id,
                   COUNT(*) OVER() as total
            FROM user_likes ul
            JOIN sku_items si ON ul.sku_item_id = si.id
            WHERE ul.user_id = $1
            ORDER BY ul.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [userId, limit, offset]);

        const items = result.rows.map(row => ({
            likeId: row.id,
            likedAt: row.created_at,
            skuItem: {
                id: row.item_id,
                name: row.name,
                code: row.code,
                description: row.description,
                retailPriceBrl: row.retail_price_brl ? Number(row.retail_price_brl) : null,
                retailPriceUsd: row.retail_price_usd ? Number(row.retail_price_usd) : null,
                retailPriceEur: row.retail_price_eur ? Number(row.retail_price_eur) : null,
                images: row.images || []
            }
        }));

        return {
            items,
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0
        };
    }

    static async getLikeCount(skuItemId: string): Promise<number> {
        const query = 'SELECT COUNT(*)::int as count FROM user_likes WHERE sku_item_id = $1';
        const result = await db.query(query, [skuItemId]);
        return result.rows[0].count || 0;
    }

    private static mapRowToUserLike(row: any): UserLike {
        return {
            id: row.id,
            userId: row.user_id,
            skuItemId: row.sku_item_id,
            createdAt: row.created_at
        };
    }
}
