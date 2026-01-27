import { db } from '../database/connection';

export type EntityType = 'brand' | 'store' | 'supplier' | 'non_profit' | 'page' | 'user' | 'sport_org' | 'event';

export interface EntityFollow {
    id: string;
    followerId: string;
    followerType: EntityType;
    entityType: EntityType;
    entityId: string;
    createdAt: Date;
}

export interface CreateEntityFollowData {
    followerId: string;
    followerType?: EntityType; // Default 'user'
    entityType: EntityType;
    entityId: string;
}

export class EntityFollowModel {
    /**
     * Create a follow relationship between a user and an entity
     */
    static async follow(data: CreateEntityFollowData): Promise<EntityFollow> {
        const { followerId, entityType, entityId } = data;
        const followerType = data.followerType || 'user'; // Default to user if not provided

        // Check if already following
        const existing = await this.findByIds(followerId, followerType, entityType, entityId);
        if (existing) {
            throw new Error('Already following this entity');
        }

        const query = `
            INSERT INTO entity_follows (follower_id, follower_type, entity_type, entity_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await db.query(query, [followerId, followerType, entityType, entityId]);
        return this.mapRowToEntityFollow(result.rows[0]);
    }

    /**
     * Remove a follow relationship
     */
    static async unfollow(followerId: string, followerType: EntityType = 'user', entityType: EntityType, entityId: string): Promise<boolean> {
        const query = `
            DELETE FROM entity_follows 
            WHERE follower_id = $1 AND follower_type = $2 AND entity_type = $3 AND entity_id = $4
        `;
        const result = await db.query(query, [followerId, followerType, entityType, entityId]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Find a specific follow relationship
     */
    static async findByIds(followerId: string, followerType: EntityType = 'user', entityType: EntityType, entityId: string): Promise<EntityFollow | null> {
        const query = `
            SELECT * FROM entity_follows
            WHERE follower_id = $1 AND follower_type = $2 AND entity_type = $3 AND entity_id = $4
        `;
        const result = await db.query(query, [followerId, followerType, entityType, entityId]);
        return result.rows.length > 0 ? this.mapRowToEntityFollow(result.rows[0]) : null;
    }

    /**
     * Check if a user/entity is following an entity
     */
    static async isFollowing(followerId: string, followerType: EntityType = 'user', entityType: EntityType, entityId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM entity_follows 
            WHERE follower_id = $1 AND follower_type = $2 AND entity_type = $3 AND entity_id = $4
        `;
        const result = await db.query(query, [followerId, followerType, entityType, entityId]);
        return result.rows.length > 0;
    }

    /**
     * Get all followers of an entity (Users and other Entities)
     */
    static async getFollowers(
        entityType: EntityType,
        entityId: string,
        limit = 20,
        offset = 0
    ): Promise<{ followers: any[]; total: number }> {
        const query = `
            SELECT ef.*,
                   -- User Data
                   u.id as user_id, u.profile as user_profile, u.username as user_username, 
                   u.verification_status as user_verification_status,
                   (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = u.id) as user_roles,

                   -- Brand/Store/SportOrg/Event Data
                   COALESCE(ba.id, so.id, ev.id) as entity_id_derived,
                   COALESCE(ba.brand_info->>'name', so.name, ev.name) as entity_name_derived,
                   COALESCE(ba.brand_info->>'logo', so.master_logo, ev.master_logo) as entity_logo_derived,
                   COALESCE(ba.brand_info->>'slug', so.slug, ev.slug) as entity_slug_derived,
                   COALESCE(ba.verification_status, ev.verification_status, 'unverified') as entity_verification_status_derived,
                   COALESCE(ba.brand_info->>'businessType', CASE WHEN so.id IS NOT NULL THEN 'sport_org' WHEN ev.id IS NOT NULL THEN 'event' END) as entity_business_type_derived,

                   COUNT(*) OVER() as total
            FROM entity_follows ef
            LEFT JOIN users u ON ef.follower_type = 'user' AND ef.follower_id = u.id
            LEFT JOIN brand_accounts ba ON ef.follower_type IN ('brand', 'store', 'supplier', 'non_profit') AND ef.follower_id = ba.id
            LEFT JOIN sport_orgs so ON ef.follower_type = 'sport_org' AND ef.follower_id = so.id
            LEFT JOIN events ev ON ef.follower_type = 'event' AND ef.follower_id = ev.id
            WHERE ef.entity_type = $1 AND ef.entity_id = $2
            ORDER BY ef.created_at DESC
            LIMIT $3 OFFSET $4
        `;

        const result = await db.query(query, [entityType, entityId, limit, offset]);

        return {
            followers: result.rows.map(row => {
                if (row.follower_type === 'user') {
                    return {
                        type: 'user',
                        id: row.user_id,
                        username: row.user_username,
                        profile: row.user_profile,
                        followedAt: row.created_at,
                        verificationStatus: (row.user_roles && row.user_roles.includes('admin')) ? 'verified' : (row.user_verification_status || 'unverified'),
                        roles: row.user_roles || [],
                    };
                } else {
                    return {
                        type: row.follower_type,
                        id: row.entity_id_derived,
                        name: row.entity_name_derived,
                        logo: row.entity_logo_derived,
                        slug: row.entity_slug_derived,
                        businessType: row.entity_business_type_derived,
                        followedAt: row.created_at,
                        verificationStatus: row.entity_verification_status_derived,
                    };
                }
            }),
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
    }

    /**
     * Get all entities/users a user OR entity is following
     */
    static async getFollowing(
        followerId: string,
        followerType: EntityType = 'user',
        targetEntityType?: EntityType,
        limit = 50,
        offset = 0,
        search?: string
    ): Promise<{ following: any[]; total: number }> {
        let query = `
            SELECT ef.*, 
                   -- Brand/Store/SportOrg/Event Target
                   COALESCE(ba.brand_info->>'name', p.name, so.name, ev.name) as entity_name,
                   COALESCE(ba.brand_info->>'logo', p.logo_url, so.master_logo, ev.master_logo) as entity_logo,
                   COALESCE(ba.brand_info->>'slug', p.slug, so.slug, ev.slug) as entity_slug,
                   COALESCE(ba.brand_info->>'businessType', CASE WHEN so.id IS NOT NULL THEN 'sport_org' WHEN ev.id IS NOT NULL THEN 'event' END) as business_type,
                   COALESCE(ba.verification_status, ev.verification_status, 'unverified') as entity_verification_status,
 
                   -- User Target
                   u.username as user_username,
                   u.profile as user_profile,
                   u.verification_status as user_verification_status,
                   
                   COUNT(*) OVER() as total
            FROM entity_follows ef
            LEFT JOIN brand_accounts ba ON ef.entity_type IN ('brand', 'store', 'supplier', 'non_profit') AND ef.entity_id = ba.id
            LEFT JOIN pages p ON ef.entity_type = 'page' AND ef.entity_id = p.id
            LEFT JOIN users u ON ef.entity_type = 'user' AND ef.entity_id = u.id
            LEFT JOIN sport_orgs so ON ef.entity_type = 'sport_org' AND ef.entity_id = so.id
            LEFT JOIN events ev ON ef.entity_type = 'event' AND ef.entity_id = ev.id
            WHERE ef.follower_id = $1 AND ef.follower_type = $2
        `;
        const params: any[] = [followerId, followerType];

        if (targetEntityType) {
            query += ` AND ef.entity_type = $3`;
            params.push(targetEntityType);
        }

        if (search) {
            const searchParamIndex = params.length + 1;
            query += ` AND (
                COALESCE(ba.brand_info->>'name', p.name, so.name, ev.name) ILIKE $${searchParamIndex} OR
                u.username ILIKE $${searchParamIndex} OR
                (u.profile->>'name') ILIKE $${searchParamIndex}
            )`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY ef.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        return {
            following: result.rows.map(row => {
                const isUserTarget = row.entity_type === 'user';

                if (isUserTarget) {
                    return {
                        ...this.mapRowToEntityFollow(row),
                        type: 'user',
                        username: row.user_username,
                        profile: row.user_profile,
                        verificationStatus: row.user_verification_status || 'unverified'
                    };
                }

                // Determine the actual entity type based on business_type
                let actualEntityType = row.entity_type;
                if (row.business_type === 'non_profit') {
                    actualEntityType = 'non_profit';
                }

                return {
                    ...this.mapRowToEntityFollow(row),
                    entityType: actualEntityType,  // Override with actual type
                    name: row.entity_name,
                    logo: row.entity_logo,
                    slug: row.entity_slug,
                    verificationStatus: row.entity_verification_status || 'unverified'
                };
            }),
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
     * Get count of entities a user is following
     */
    static async getFollowingCount(followerId: string): Promise<number> {
        const query = `
            SELECT COUNT(*)::int as count 
            FROM entity_follows 
            WHERE follower_id = $1
        `;
        const result = await db.query(query, [followerId]);
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
            followerType: row.follower_type || 'user',
            entityType: row.entity_type,
            entityId: row.entity_id,
            createdAt: row.created_at,
        };
    }
}
