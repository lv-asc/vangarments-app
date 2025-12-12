import { db } from '../database/connection';

export type BrandRole = 'CEO' | 'CFO' | 'Founder' | 'CD' | 'Marketing' | 'Seller' | 'Designer' | 'Model' | 'Ambassador' | 'Other';

export interface BrandTeamMember {
    id: string;
    brandId: string;
    userId: string;
    role: BrandRole;
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
    role: BrandRole;
    title?: string;
    isPublic?: boolean;
}

export interface UpdateTeamMemberData {
    role?: BrandRole;
    title?: string;
    isPublic?: boolean;
}

export class BrandTeamModel {
    static async addMember(data: CreateTeamMemberData): Promise<BrandTeamMember> {
        const { brandId, userId, role, title, isPublic = true } = data;

        const query = `
      INSERT INTO brand_team_members (brand_id, user_id, role, title, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const result = await db.query(query, [brandId, userId, role, title, isPublic]);
        return this.mapRowToTeamMember(result.rows[0]);
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

        if (updates.role !== undefined) {
            setClauses.push(`role = $${paramIndex++}`);
            values.push(updates.role);
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

    static async getUserBrands(userId: string): Promise<Array<{ brandId: string; role: BrandRole; title?: string }>> {
        const query = `
      SELECT brand_id, role, title
      FROM brand_team_members
      WHERE user_id = $1
      ORDER BY joined_at DESC
    `;

        const result = await db.query(query, [userId]);
        return result.rows.map(row => ({
            brandId: row.brand_id,
            role: row.role,
            title: row.title || undefined
        }));
    }

    static async isMember(brandId: string, userId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM brand_team_members WHERE brand_id = $1 AND user_id = $2 LIMIT 1';
        const result = await db.query(query, [brandId, userId]);
        return result.rows.length > 0;
    }

    private static mapRowToTeamMember(row: any): BrandTeamMember {
        return {
            id: row.id,
            brandId: row.brand_id,
            userId: row.user_id,
            role: row.role,
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
