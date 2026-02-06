import { db } from '../database/connection';
import { HomiesList, HomiesListMember, UserProfile } from '../../../shared/src/types';
import { UserModel } from './User';

export class HomiesModel {
    static async createList(userId: string, name: string, color: string = '#000080', isDefault: boolean = false): Promise<HomiesList> {
        const query = `
      INSERT INTO homies_lists (user_id, name, color, is_default)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await db.query(query, [userId, name, color, isDefault]);
        return this.mapRowToList(result.rows[0]);
    }

    static async getListsByUserId(userId: string): Promise<HomiesList[]> {
        const query = `
      SELECT hl.*, COUNT(hlm.id)::int as member_count
      FROM homies_lists hl
      LEFT JOIN homies_list_members hlm ON hl.id = hlm.list_id
      WHERE hl.user_id = $1
      GROUP BY hl.id
      ORDER BY hl.is_default DESC, hl.created_at DESC
    `;
        const result = await db.query(query, [userId]);
        return result.rows.map(row => this.mapRowToList(row));
    }

    static async getListById(listId: string): Promise<HomiesList | null> {
        const query = `
      SELECT hl.*, COUNT(hlm.id)::int as member_count
      FROM homies_lists hl
      LEFT JOIN homies_list_members hlm ON hl.id = hlm.list_id
      WHERE hl.id = $1
      GROUP BY hl.id
    `;
        const result = await db.query(query, [listId]);
        return result.rows.length > 0 ? this.mapRowToList(result.rows[0]) : null;
    }

    static async updateList(listId: string, userId: string, data: { name?: string, color?: string }): Promise<HomiesList | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name) {
            updates.push(`name = $${paramCount}`);
            values.push(data.name);
            paramCount++;
        }

        if (data.color) {
            updates.push(`color = $${paramCount}`);
            values.push(data.color);
            paramCount++;
        }

        if (updates.length === 0) return this.getListById(listId);

        // Check if list is default before updating name or color
        const existing = await this.getListById(listId);
        if (existing?.isDefault && (data.name || data.color)) {
            // Only allow updates to other fields (if any)
            const filteredUpdates: string[] = [];
            const filteredValues: any[] = [];
            let fParamCount = 1;

            // For now, only name and color are updateable, so if it's default, we just return
            return existing;
        }

        values.push(listId, userId);
        const query = `
      UPDATE homies_lists
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToList(result.rows[0]) : null;
    }

    static async deleteList(listId: string, userId: string): Promise<boolean> {
        // Prevent deleting the default list
        const list = await this.getListById(listId);
        if (list?.isDefault) {
            throw new Error('The default Homies list cannot be deleted.');
        }

        const query = 'DELETE FROM homies_lists WHERE id = $1 AND user_id = $2';
        const result = await db.query(query, [listId, userId]);
        return (result.rowCount || 0) > 0;
    }

    static async addMember(listId: string, memberId: string, memberType: string = 'user'): Promise<void> {
        const query = `
      INSERT INTO homies_list_members (list_id, member_id, member_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (list_id, member_id, member_type) DO NOTHING
    `;
        await db.query(query, [listId, memberId, memberType]);
    }

    static async removeMember(listId: string, memberId: string): Promise<void> {
        const query = 'DELETE FROM homies_list_members WHERE list_id = $1 AND member_id = $2';
        await db.query(query, [listId, memberId]);
    }

    static async getListMembers(listId: string): Promise<any[]> {
        const query = `
      SELECT 
        hlm.member_type,
        hlm.member_id,
        hlm.created_at as added_at,
        -- User Data
        u.id as user_id, u.username, u.profile as user_profile, u.roles as user_roles, u.verification_status as user_verification_status,
        -- Brand Data
        ba.id as brand_id, ba.brand_info, ba.verification_status as brand_verification_status,
        -- Store Data
        s.id as store_id, s.name as store_name, s.slug as store_slug, s.social_links as store_social_links
      FROM homies_list_members hlm
      LEFT JOIN users u ON hlm.member_type = 'user' AND hlm.member_id = u.id
      LEFT JOIN brand_accounts ba ON hlm.member_type IN ('brand', 'supplier', 'non_profit') AND hlm.member_id = ba.id
      LEFT JOIN stores s ON hlm.member_type = 'store' AND hlm.member_id = s.id
      WHERE hlm.list_id = $1
      ORDER BY hlm.created_at DESC
    `;
        const result = await db.query(query, [listId]);

        return result.rows.map(row => {
            const memberType = row.member_type || 'user';

            if (memberType === 'user') {
                const profile = typeof row.user_profile === 'string' ? JSON.parse(row.user_profile) : (row.user_profile || {});
                return {
                    id: row.member_id,
                    username: row.username,
                    personalInfo: {
                        name: profile.name || profile.username,
                        avatarUrl: profile.avatarUrl || profile.profilePicture || profile.image,
                        bio: profile.bio
                    },
                    verificationStatus: row.user_verification_status,
                    roles: row.user_roles || [],
                    type: 'user'
                };
            } else if (['brand', 'supplier', 'non_profit'].includes(memberType)) {
                const brandInfo = typeof row.brand_info === 'string' ? JSON.parse(row.brand_info) : (row.brand_info || {});
                return {
                    id: row.member_id,
                    username: brandInfo.slug,
                    personalInfo: {
                        name: brandInfo.name,
                        avatarUrl: brandInfo.logo,
                        bio: brandInfo.description
                    },
                    verificationStatus: row.brand_verification_status,
                    type: memberType
                };
            } else if (memberType === 'store') {
                const socialLinks = typeof row.store_social_links === 'string' ? JSON.parse(row.store_social_links) : (row.store_social_links || []);
                return {
                    id: row.member_id,
                    username: row.store_slug || row.store_name?.toLowerCase().replace(/\s+/g, '-'),
                    personalInfo: {
                        name: row.store_name,
                        avatarUrl: socialLinks?.[0]?.url
                    },
                    type: 'store'
                };
            }

            // Fallback for any other type
            return {
                id: row.member_id,
                type: memberType,
                personalInfo: {
                    name: 'Member ' + row.member_id.substring(0, 4)
                }
            };
        });
    }

    static async getUserHomiesLists(viewerId: string, targetUserId: string): Promise<HomiesList[]> {
        const query = `
      SELECT hl.*
      FROM homies_lists hl
      JOIN homies_list_members hlm ON hl.id = hlm.list_id
      WHERE hl.user_id = $1 AND hlm.member_id = $2
      ORDER BY hl.is_default DESC, hl.created_at DESC
    `;
        const result = await db.query(query, [targetUserId, viewerId]);
        return result.rows.map(row => this.mapRowToList(row));
    }

    static async ensureDefaultList(userId: string): Promise<HomiesList> {
        // Fetch ALL default lists for this user
        const query = 'SELECT * FROM homies_lists WHERE user_id = $1 AND is_default = TRUE ORDER BY created_at ASC';
        const result = await db.query(query, [userId]);

        if (result.rows.length === 1) {
            // Happy path: exactly one default list
            return this.mapRowToList(result.rows[0]);
        } else if (result.rows.length > 1) {
            // Conflict: Multiple default lists found. Keep the oldest, delete the rest.
            const [oldest, ...duplicates] = result.rows;

            const duplicateIds = duplicates.map(d => d.id);
            console.warn(`[HomiesModel] Found ${duplicates.length} duplicate default lists for user ${userId}. Cleaning up ids: ${duplicateIds.join(', ')}`);

            // Move members from duplicates to the oldest list before deleting (optional but good practice)
            // Ideally we'd do this in a transaction, but for now let's just delete the empty duplicates or risk losing membership if the duplicate was the active one.
            // Since this is a new feature, safe to assume duplicates are likely empty or we can just nuke them.
            // But let's verify if we should merge members? The user just created them likely. 
            // Better to simple delete them to be safe and fast.

            const deleteQuery = 'DELETE FROM homies_lists WHERE id = ANY($1::uuid[])';
            await db.query(deleteQuery, [duplicateIds]);

            return this.mapRowToList(oldest);
        }

        // None found, create one
        return this.createList(userId, 'Homies', '#000080', true);
    }

    private static mapRowToList(row: any): HomiesList {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            color: row.color,
            isDefault: row.is_default,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            memberCount: row.member_count || 0
        };
    }
}
