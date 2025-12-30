import { db } from '../database/connection';

// Reusing BrandRole for consistency, or defining PageRole if needed. 
// For now, let's use the same roles as they are generic enough, or replicate them.
export type PageRole = 'CEO' | 'CFO' | 'Founder' | 'CD' | 'Marketing' | 'Seller' | 'Designer' | 'Model' | 'Ambassador' | 'Other';

export interface PageTeamMember {
    id: string;
    pageId: string;
    userId: string;
    roles: PageRole[];
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

export interface CreatePageTeamMemberData {
    pageId: string;
    userId: string;
    roles: PageRole[];
    title?: string;
    isPublic?: boolean;
}

export interface UpdatePageTeamMemberData {
    roles?: PageRole[];
    title?: string;
    isPublic?: boolean;
}

export class PageTeamModel {
    static async addMember(data: CreatePageTeamMemberData): Promise<PageTeamMember> {
        const { pageId, userId, roles, title, isPublic = true } = data;

        const query = `
      INSERT INTO page_team_members (page_id, user_id, roles, title, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const result = await db.query(query, [pageId, userId, roles, title, isPublic]);
        return this.mapRowToTeamMember(result.rows[0]);
    }

    static async removeMember(pageId: string, userId: string): Promise<boolean> {
        const query = 'DELETE FROM page_team_members WHERE page_id = $1 AND user_id = $2';
        const result = await db.query(query, [pageId, userId]);
        return (result.rowCount || 0) > 0;
    }

    static async removeMemberById(memberId: string): Promise<boolean> {
        const query = 'DELETE FROM page_team_members WHERE id = $1';
        const result = await db.query(query, [memberId]);
        return (result.rowCount || 0) > 0;
    }

    static async updateMember(memberId: string, updates: UpdatePageTeamMemberData): Promise<PageTeamMember | null> {
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
      UPDATE page_team_members
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    }

    static async findById(memberId: string): Promise<PageTeamMember | null> {
        const query = `
      SELECT ptm.*, 
             u.profile->>'name' as user_name,
             u.profile->>'avatarUrl' as user_avatar,
             u.username
      FROM page_team_members ptm
      LEFT JOIN users u ON ptm.user_id = u.id
      WHERE ptm.id = $1
    `;
        const result = await db.query(query, [memberId]);
        return result.rows.length > 0 ? this.mapRowToTeamMember(result.rows[0]) : null;
    }

    static async getTeamMembers(pageId: string, publicOnly = false): Promise<PageTeamMember[]> {
        let query = `
      SELECT ptm.*, 
             u.profile->>'name' as user_name,
             u.profile->>'avatarUrl' as user_avatar,
             u.username
      FROM page_team_members ptm
      LEFT JOIN users u ON ptm.user_id = u.id
      WHERE ptm.page_id = $1
    `;

        if (publicOnly) {
            query += ' AND ptm.is_public = true';
        }

        query += ' ORDER BY ptm.joined_at ASC';

        const result = await db.query(query, [pageId]);
        return result.rows.map(row => this.mapRowToTeamMember(row));
    }

    static async isMember(pageId: string, userId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM page_team_members WHERE page_id = $1 AND user_id = $2 LIMIT 1';
        const result = await db.query(query, [pageId, userId]);
        return result.rows.length > 0;
    }

    private static mapRowToTeamMember(row: any): PageTeamMember {
        return {
            id: row.id,
            pageId: row.page_id,
            userId: row.user_id,
            roles: parseRoles(row.roles),
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
function parseRoles(roles: any): PageRole[] {
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') {
        const cleaned = roles.replace(/^\{|\}$/g, '');
        if (!cleaned) return [];
        return cleaned.split(',') as PageRole[];
    }
    return [];
}
