import { db } from '../database/connection';

export type BrandRole = 'CEO' | 'CFO' | 'Founder' | 'CD' | 'Marketing' | 'Seller' | 'Designer' | 'Model' | 'Ambassador' | 'Other';

export interface BrandTeamMember {
    id: string;
    brandId: string;
    userId: string;
    roles: BrandRole[];
    title?: string;
    isPublic: boolean;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    // Populated from users table
    user?: {
        id: string;
        name: string;
        avatarUrl?: string;
        username?: string;
    };
}

export interface CreateTeamMemberData {
    brandId: string;
    userId: string;
    roles: BrandRole[];
    title?: string;
    isPublic?: boolean;
}

export interface UpdateTeamMemberData {
    roles?: BrandRole[];
    title?: string;
    isPublic?: boolean;
}

export class BrandTeamModel {
    static async addMember(data: CreateTeamMemberData): Promise<BrandTeamMember> {
        const { brandId, userId, roles, title, isPublic = true } = data;

        const query = `
      INSERT INTO brand_team_members (brand_id, user_id, roles, title, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const result = await db.query(query, [brandId, userId, roles, title, isPublic]);
        const member = this.mapRowToTeamMember(result.rows[0]);

        // Auto-follow: new team member automatically follows the entity
        try {
            // Get the brand to determine its business type
            const { BrandAccountModel } = await import('./BrandAccount');
            const { EntityFollowModel } = await import('./EntityFollow');

            const brand = await BrandAccountModel.findById(brandId);
            if (brand) {
                const businessType = brand.brandInfo.businessType || 'brand';
                const entityType = businessType === 'store' ? 'store' :
                    businessType === 'supplier' ? 'supplier' : 'brand';

                // Check if already following, if not, create the follow
                const isFollowing = await EntityFollowModel.isFollowing(userId, entityType as any, brandId);
                if (!isFollowing) {
                    await EntityFollowModel.follow({
                        followerId: userId,
                        entityType: entityType as any,
                        entityId: brandId
                    });
                    console.log(`Auto-follow: User ${userId} now follows ${entityType} ${brandId}`);
                }
            }
        } catch (error) {
            // Don't fail the team member addition if auto-follow fails
            console.error('Auto-follow failed (non-critical):', error);
        }

        return member;
    }

    static async removeMember(brandId: string, userId: string): Promise<boolean> {
        const query = 'DELETE FROM brand_team_members WHERE brand_id = $1 AND user_id = $2';
        const result = await db.query(query, [brandId, userId]);
        return (result.rowCount || 0) > 0;
    }

    static async removeMemberById(memberId: string): Promise<boolean> {
        const query = 'DELETE FROM brand_team_members WHERE id = $1';
        const result = await db.query(query, [memberId]);
        return (result.rowCount || 0) > 0;
    }

    static async updateMember(memberId: string, updates: UpdateTeamMemberData): Promise<BrandTeamMember | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.roles !== undefined) {
            setClauses.push(`roles = $${paramIndex++}`);
            values.push(updates.roles);
        }
        if (updates.title !== undefined) {
            setClauses.push(`title = $${paramIndex++}`);
            values.push(updates.title);
        }
        if (updates.isPublic !== undefined) {
            setClauses.push(`is_public = $${paramIndex++}`);
            values.push(updates.isPublic);
        }

        if (setClauses.length === 0) {
            return this.findById(memberId);
        }

        setClauses.push('updated_at = NOW()');
        values.push(memberId);

        const query = `
      UPDATE brand_team_members
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    }

    static async findById(memberId: string): Promise<BrandTeamMember | null> {
        const query = `
      SELECT btm.*, 
             u.profile->>'name' as user_name,
             u.profile->>'avatarUrl' as user_avatar,
             u.username
      FROM brand_team_members btm
      LEFT JOIN users u ON btm.user_id = u.id
      WHERE btm.id = $1
    `;
        const result = await db.query(query, [memberId]);
        return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    }

    static async getTeamMembers(brandId: string, publicOnly = false): Promise<BrandTeamMember[]> {
        let query = `
      SELECT btm.*, 
             u.profile->>'name' as user_name,
             u.profile->>'avatarUrl' as user_avatar,
             u.username
      FROM brand_team_members btm
      LEFT JOIN users u ON btm.user_id = u.id
      WHERE btm.brand_id = $1
    `;

        if (publicOnly) {
            query += ' AND btm.is_public = true';
        }

        query += ' ORDER BY btm.joined_at ASC';

        const result = await db.query(query, [brandId]);
        return result.rows.map(row => this.mapRowToTeamMember(row));
    }

    static async getUserBrands(userId: string): Promise<Array<{ brandId: string; roles: BrandRole[]; title?: string }>> {
        const query = `
      SELECT brand_id, roles, title
      FROM brand_team_members
      WHERE user_id = $1
      ORDER BY joined_at DESC
    `;

        const result = await db.query(query, [userId]);
        return result.rows.map(row => ({
            brandId: row.brand_id,
            roles: row.roles, // Postgres driver should automatically parse text[] to string[]
            title: row.title || undefined
        }));
    }

    /**
     * Get user's team memberships with full brand details
     * Used by profile page to show linked entities
     */
    static async getUserMembershipsWithDetails(userId: string): Promise<Array<{
        brandId: string;
        brandName: string;
        brandSlug?: string;
        brandLogo?: string;
        businessType: string;
        roles: BrandRole[];
        title?: string;
        isOwner: boolean;
        followersCount: number;
    }>> {
        const query = `
            SELECT btm.brand_id, btm.roles, btm.title,
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'slug' as brand_slug,
                   ba.brand_info->>'logo' as brand_logo,
                   COALESCE(ba.brand_info->>'businessType', 'brand') as business_type,
                   ba.user_id as owner_id,
                   (
                       SELECT COUNT(*)::int 
                       FROM entity_follows ef 
                       WHERE ef.entity_id = ba.id 
                       AND ef.entity_type = COALESCE(ba.brand_info->>'businessType', 'brand')
                   ) as followers_count
            FROM brand_team_members btm
            JOIN brand_accounts ba ON btm.brand_id = ba.id
            WHERE btm.user_id = $1 AND ba.deleted_at IS NULL
            ORDER BY btm.joined_at DESC
        `;

        const result = await db.query(query, [userId]);
        return result.rows.map(row => ({
            brandId: row.brand_id,
            brandName: row.brand_name || 'Unnamed',
            brandSlug: row.brand_slug || undefined,
            brandLogo: row.brand_logo || undefined,
            businessType: row.business_type || 'brand',
            roles: parseRoles(row.roles, null),
            title: row.title || undefined,
            isOwner: row.owner_id === userId,
            followersCount: parseInt(row.followers_count, 10) || 0
        }));
    }

    static async isMember(brandId: string, userId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM brand_team_members WHERE brand_id = $1 AND user_id = $2 LIMIT 1';
        const result = await db.query(query, [brandId, userId]);
        return result.rows.length > 0;
    }

    /**
     * Get all team memberships with brand information
     * Used by admin dashboard to show entities linked to users
     */
    static async getAllMemberships(): Promise<Array<{
        userId: string;
        brandId: string;
        brandName: string;
        brandLogo?: string;
        businessType: string;
        roles: BrandRole[];
        title?: string;
    }>> {
        const query = `
            SELECT btm.user_id, btm.brand_id, btm.roles, btm.title,
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'logo' as brand_logo,
                   COALESCE(ba.brand_info->>'businessType', 'brand') as business_type
            FROM brand_team_members btm
            JOIN brand_accounts ba ON btm.brand_id = ba.id
            WHERE ba.deleted_at IS NULL
            ORDER BY btm.joined_at DESC
        `;

        const result = await db.query(query);
        return result.rows.map(row => ({
            userId: row.user_id,
            brandId: row.brand_id,
            brandName: row.brand_name || 'Unnamed',
            brandLogo: row.brand_logo || undefined,
            businessType: row.business_type || 'brand',
            roles: parseRoles(row.roles, null),
            title: row.title || undefined
        }));
    }

    private static mapRowToTeamMember(row: any): BrandTeamMember {
        return {
            id: row.id,
            brandId: row.brand_id,
            userId: row.user_id,
            roles: parseRoles(row.roles, row.role),
            title: row.title || undefined,
            isPublic: row.is_public,
            joinedAt: new Date(row.joined_at),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            user: row.user_name ? {
                id: row.user_id,
                name: row.user_name,
                avatarUrl: row.user_avatar || undefined,
                username: row.username || undefined
            } : undefined
        };
    }
}

// Helper to safely parse roles
function parseRoles(roles: any, legacyRole: any): BrandRole[] {
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') {
        // Handle Postgres array string format {a,b,c}
        const cleaned = roles.replace(/^\{|\}$/g, '');
        if (!cleaned) return [];
        return cleaned.split(',') as BrandRole[];
    }
    // Fallback to legacy role if available and roles is empty/null
    if (legacyRole) return [legacyRole];
    return [];
}
