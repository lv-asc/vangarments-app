import { db } from '../database/connection';

export type EntityType = 'brand' | 'store' | 'supplier' | 'page';

export interface EntityFollow {
    id: string;
    followerId: string;
    entityType: EntityType;
    entityId: string;
    createdAt: Date;
}

export interface CreateEntityFollowData {
    followerId: string;
    entityType: EntityType;
    entityId: string;
}

export class EntityFollowModel {
    /**
     * Create a follow relationship between a user and an entity
     */
    static async follow(data: CreateEntityFollowData): Promise<EntityFollow> {
        const { followerId, entityType, entityId } = data;

        // Check if already following
        const existing = await this.findByIds(followerId, entityType, entityId);
        if (existing) {
            throw new Error('Already following this entity');
        }

        const query = `
            INSERT INTO entity_follows (follower_id, entity_type, entity_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await db.query(query, [followerId, entityType, entityId]);
        return this.mapRowToEntityFollow(result.rows[0]);
    }

    /**
     * Remove a follow relationship
     */
    static async unfollow(followerId: string, entityType: EntityType, entityId: string): Promise<boolean> {
        const query = `
            DELETE FROM entity_follows 
            WHERE follower_id = $1 AND entity_type = $2 AND entity_id = $3
        `;
        const result = await db.query(query, [followerId, entityType, entityId]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Find a specific follow relationship
     */
    static async findByIds(followerId: string, entityType: EntityType, entityId: string): Promise<EntityFollow | null> {
        const query = `
            SELECT * FROM entity_follows
            WHERE follower_id = $1 AND entity_type = $2 AND entity_id = $3
        `;
        const result = await db.query(query, [followerId, entityType, entityId]);
        return result.rows.length > 0 ? this.mapRowToEntityFollow(result.rows[0]) : null;
    }

    /**
     * Check if a user is following an entity
     */
    static async isFollowing(followerId: string, entityType: EntityType, entityId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM entity_follows 
            WHERE follower_id = $1 AND entity_type = $2 AND entity_id = $3
        `;
        const result = await db.query(query, [followerId, entityType, entityId]);
        return result.rows.length > 0;
    }

    /**
     * Get all followers of an entity
     */
    static async getFollowers(
        entityType: EntityType,
        entityId: string,
        limit = 20,
        offset = 0
    ): Promise<{ followers: any[]; total: number }> {
        const query = `
            SELECT ef.*, u.id as user_id, u.profile, u.username,
                   COUNT(*) OVER() as total
            FROM entity_follows ef
            JOIN users u ON ef.follower_id = u.id
            WHERE ef.entity_type = $1 AND ef.entity_id = $2
            ORDER BY ef.created_at DESC
            LIMIT $3 OFFSET $4
        `;

        const result = await db.query(query, [entityType, entityId, limit, offset]);

        return {
            followers: result.rows.map(row => ({
                id: row.user_id,
                username: row.username,
                profile: row.profile,
                followedAt: row.created_at,
            })),
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
    }

    /**
     * Get all entities a user is following
     */
    static async getFollowing(
        followerId: string,
        entityType?: EntityType,
        limit = 50,
        offset = 0
    ): Promise<{ entities: EntityFollow[]; total: number }> {
        let query = `
            SELECT *, COUNT(*) OVER() as total
            FROM entity_follows
            WHERE follower_id = $1
        `;
        const params: any[] = [followerId];

        if (entityType) {
            query += ` AND entity_type = $2`;
            params.push(entityType);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        return {
            entities: result.rows.map(row => this.mapRowToEntityFollow(row)),
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
    }

    /**
     * Get follower count for an entity
     */
    static async getFollowerCount(entityType: EntityType, entityId: string): Promise<number> {
        const query = `
            SELECT COUNT(*)::int as count 
            FROM entity_follows 
            WHERE entity_type = $1 AND entity_id = $2
        `;
        const result = await db.query(query, [entityType, entityId]);
        return result.rows[0].count;
    }

    /**
     * Get all entity IDs a user is following (for a specific type)
     */
    static async getFollowingIds(followerId: string, entityType: EntityType): Promise<string[]> {
        const query = `
            SELECT entity_id FROM entity_follows 
            WHERE follower_id = $1 AND entity_type = $2
        `;
        const result = await db.query(query, [followerId, entityType]);
        return result.rows.map(row => row.entity_id);
    }

    /**
     * Batch check if user is following multiple entities
     */
    static async isFollowingBatch(
        followerId: string,
        entityType: EntityType,
        entityIds: string[]
    ): Promise<Record<string, boolean>> {
        if (entityIds.length === 0) return {};

        const query = `
            SELECT entity_id FROM entity_follows 
            WHERE follower_id = $1 AND entity_type = $2 AND entity_id = ANY($3)
        `;
        const result = await db.query(query, [followerId, entityType, entityIds]);

        const followingSet = new Set(result.rows.map(row => row.entity_id));
        const resultMap: Record<string, boolean> = {};

        for (const id of entityIds) {
            resultMap[id] = followingSet.has(id);
        }

        return resultMap;
    }

    private static mapRowToEntityFollow(row: any): EntityFollow {
        return {
            id: row.id,
            followerId: row.follower_id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            createdAt: row.created_at,
        };
    }
}
