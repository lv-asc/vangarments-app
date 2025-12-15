import { db } from '../database/connection';

export interface ColorGroup {
    id: string;
    name: string;
    createdAt: Date;
}

export interface Color {
    id: string;
    name: string;
    hexCode?: string;
    groupIds?: string[]; // IDs of groups this color belongs to
    groups?: ColorGroup[]; // Hydrated groups (optional)
    isActive: boolean;
    createdAt: Date;
}

export class ColorModel {
    // --- Colors ---

    static async findAll(): Promise<Color[]> {
        const query = `
      SELECT 
        c.*,
        COALESCE(
          json_agg(
            json_build_object('id', g.id, 'name', g.name)
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as groups
      FROM vufs_colors c
      LEFT JOIN vufs_color_group_memberships m ON c.id = m.color_id
      LEFT JOIN vufs_color_groups g ON m.group_id = g.id
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            hexCode: row.hex_code,
            isActive: row.is_active,
            createdAt: row.created_at,
            groups: row.groups,
            groupIds: row.groups.map((g: any) => g.id)
        }));
    }

    static async findById(id: string): Promise<Color | null> {
        const query = `
      SELECT 
        c.*,
        COALESCE(
          json_agg(
            json_build_object('id', g.id, 'name', g.name)
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as groups
      FROM vufs_colors c
      LEFT JOIN vufs_color_group_memberships m ON c.id = m.color_id
      LEFT JOIN vufs_color_groups g ON m.group_id = g.id
      WHERE c.id = $1
      GROUP BY c.id
    `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            hexCode: row.hex_code,
            isActive: row.is_active,
            createdAt: row.created_at,
            groups: row.groups,
            groupIds: row.groups.map((g: any) => g.id)
        };
    }

    static async create(name: string, hexCode?: string, groupIds: string[] = []): Promise<Color> {
        return db.transaction(async (client) => {
            const insertColorQuery = `
        INSERT INTO vufs_colors (name, hex_code)
        VALUES ($1, $2)
        RETURNING *
      `;
            const colorRes = await client.query(insertColorQuery, [name, hexCode]);
            const color = colorRes.rows[0];

            if (groupIds.length > 0) {
                const uniqueGroupIds = [...new Set(groupIds)];
                const membershipQuery = `
           INSERT INTO vufs_color_group_memberships (color_id, group_id)
           SELECT $1, unnest($2::uuid[])
        `;
                await client.query(membershipQuery, [color.id, uniqueGroupIds]);
            }

            return this.findById(color.id) as Promise<Color>;
        });
    }

    static async update(id: string, name?: string, hexCode?: string, groupIds?: string[]): Promise<Color | null> {
        return db.transaction(async (client) => {
            if (name !== undefined || hexCode !== undefined) {
                const updates: string[] = [];
                const values: any[] = [];
                let pIdx = 1;

                if (name !== undefined) {
                    updates.push(`name = $${pIdx++}`);
                    values.push(name);
                }
                if (hexCode !== undefined) {
                    updates.push(`hex_code = $${pIdx++}`);
                    values.push(hexCode);
                }

                if (updates.length > 0) {
                    values.push(id);
                    await client.query(`UPDATE vufs_colors SET ${updates.join(', ')} WHERE id = $${pIdx}`, values);
                }
            }

            if (groupIds !== undefined) {
                // Replace all memberships
                await client.query('DELETE FROM vufs_color_group_memberships WHERE color_id = $1', [id]);
                if (groupIds.length > 0) {
                    const uniqueGroupIds = [...new Set(groupIds)];
                    const membershipQuery = `
             INSERT INTO vufs_color_group_memberships (color_id, group_id)
             SELECT $1, unnest($2::uuid[])
           `;
                    await client.query(membershipQuery, [id, uniqueGroupIds]);
                }
            }

            return this.findById(id);
        });
    }

    static async delete(id: string): Promise<boolean> {
        // Hard delete or soft delete? Implementation plan didn't specify, but vufs_colors has is_active, no deleted_at?
        // Existing table vufs_colors (from previous exploration) only has is_active.
        // But VUFSItem model has deleted_at logic.
        // The migration for vufs_attributes tables didn't show deleted_at.
        // Let's assume hard delete or set is_active=false. 
        // For now, I'll delete if forced, or set is_active=false.
        // The prompt implies straightforward management.
        // But references might exist.
        // Let's stick to simple DELETE which might fail if FK constraints (like items using it).
        // Wait, vufs_colors is just a dictionary. VUFSItem uses "color: VUFSColor" which is a string union in types,
        // but in DB vufs_items stores JSON metadata. It doesn't seem to have a FK to vufs_colors table directly?
        // Actually looking at `VUFSItem.ts`, it stores hierarchies as JSON.
        // So `vufs_colors` is likely a source of truth for dropdowns.
        // I'll implement soft delete by setting is_active = false.
        const query = 'UPDATE vufs_colors SET is_active = false WHERE id = $1';
        const res = await db.query(query, [id]);
        return (res.rowCount || 0) > 0;
    }

    // --- Groups ---

    static async findAllGroups(): Promise<ColorGroup[]> {
        const query = 'SELECT * FROM vufs_color_groups ORDER BY name ASC';
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at
        }));
    }

    static async createGroup(name: string): Promise<ColorGroup> {
        const query = `
      INSERT INTO vufs_color_groups (name) VALUES ($1) RETURNING *
    `;
        const result = await db.query(query, [name]);
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            createdAt: row.created_at
        };
    }

    static async updateGroup(id: string, name: string): Promise<ColorGroup | null> {
        const query = 'UPDATE vufs_color_groups SET name = $1 WHERE id = $2 RETURNING *';
        const result = await db.query(query, [name, id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            createdAt: row.created_at
        };
    }

    static async deleteGroup(id: string): Promise<boolean> {
        const query = 'DELETE FROM vufs_color_groups WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
}
