import { db } from '../database/connection';

export interface MediaLabelGroup {
    id: string;
    name: string;
    representativeColor?: string;
    createdAt: Date;
    labels?: MediaLabel[]; // Optional list of labels in this group
}

export interface MediaLabel {
    id: string;
    name: string;
    groupIds?: string[]; // IDs of groups this label belongs to
    groups?: MediaLabelGroup[]; // Hydrated groups (optional)
    isActive: boolean;
    createdAt: Date;
}

export class MediaLabelModel {
    // --- Media Labels ---

    static async findAll(): Promise<MediaLabel[]> {
        const query = `
      SELECT 
        l.*,
        COALESCE(
          json_agg(
            json_build_object('id', g.id, 'name', g.name, 'representativeColor', g.representative_color)
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as groups
      FROM vufs_media_labels l
      LEFT JOIN vufs_media_label_group_memberships m ON l.id = m.label_id
      LEFT JOIN vufs_media_label_groups g ON m.group_id = g.id
      WHERE l.is_active = true
      GROUP BY l.id
      ORDER BY l.name ASC
    `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            isActive: row.is_active,
            createdAt: row.created_at,
            groups: row.groups,
            groupIds: row.groups.map((g: any) => g.id)
        }));
    }

    static async findById(id: string): Promise<MediaLabel | null> {
        const query = `
      SELECT 
        l.*,
        COALESCE(
          json_agg(
            json_build_object('id', g.id, 'name', g.name, 'representativeColor', g.representative_color)
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as groups
      FROM vufs_media_labels l
      LEFT JOIN vufs_media_label_group_memberships m ON l.id = m.label_id
      LEFT JOIN vufs_media_label_groups g ON m.group_id = g.id
      WHERE l.id = $1
      GROUP BY l.id
    `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            isActive: row.is_active,
            createdAt: row.created_at,
            groups: row.groups,
            groupIds: row.groups.map((g: any) => g.id)
        };
    }

    static async create(
        name: string,
        groupIds: string[] = []
    ): Promise<MediaLabel> {
        return db.transaction(async (client) => {
            const insertLabelQuery = `
        INSERT INTO vufs_media_labels (name)
        VALUES ($1)
        RETURNING *
      `;
            const labelRes = await client.query(insertLabelQuery, [name]);
            const label = labelRes.rows[0];

            if (groupIds.length > 0) {
                const uniqueGroupIds = [...new Set(groupIds)];
                const membershipQuery = `
           INSERT INTO vufs_media_label_group_memberships (label_id, group_id)
           SELECT $1, unnest($2::uuid[])
        `;
                await client.query(membershipQuery, [label.id, uniqueGroupIds]);
            }

            return this.findById(label.id) as Promise<MediaLabel>;
        });
    }

    static async update(
        id: string,
        name?: string,
        groupIds?: string[]
    ): Promise<MediaLabel | null> {
        return db.transaction(async (client) => {
            if (name !== undefined) {
                await client.query('UPDATE vufs_media_labels SET name = $1 WHERE id = $2', [name, id]);
            }

            if (groupIds !== undefined) {
                // Replace all memberships
                await client.query('DELETE FROM vufs_media_label_group_memberships WHERE label_id = $1', [id]);
                if (groupIds.length > 0) {
                    const uniqueGroupIds = [...new Set(groupIds)];
                    const membershipQuery = `
             INSERT INTO vufs_media_label_group_memberships (label_id, group_id)
             SELECT $1, unnest($2::uuid[])
           `;
                    await client.query(membershipQuery, [id, uniqueGroupIds]);
                }
            }

            return this.findById(id);
        });
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE vufs_media_labels SET is_active = false WHERE id = $1';
        const res = await db.query(query, [id]);
        return (res.rowCount || 0) > 0;
    }

    // --- Groups ---

    static async findAllGroups(): Promise<MediaLabelGroup[]> {
        // Fetch groups and their labels ordered by sort_order
        const query = `
            SELECT 
                g.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', l.id, 
                            'name', l.name, 
                            'isActive', l.is_active
                        ) ORDER BY m.sort_order ASC
                    ) FILTER (WHERE l.id IS NOT NULL), 
                    '[]'
                ) as labels
            FROM vufs_media_label_groups g
            LEFT JOIN vufs_media_label_group_memberships m ON g.id = m.group_id
            LEFT JOIN vufs_media_labels l ON m.label_id = l.id AND l.is_active = true
            GROUP BY g.id
            ORDER BY g.name ASC
        `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            representativeColor: row.representative_color,
            createdAt: row.created_at,
            labels: row.labels
        }));
    }

    static async createGroup(name: string, representativeColor?: string): Promise<MediaLabelGroup> {
        const query = `
      INSERT INTO vufs_media_label_groups (name, representative_color) VALUES ($1, $2) RETURNING *
    `;
        const result = await db.query(query, [name, representativeColor]);
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            representativeColor: row.representative_color,
            createdAt: row.created_at
        };
    }

    static async updateGroup(id: string, name?: string, representativeColor?: string, labelIds?: string[]): Promise<MediaLabelGroup | null> {
        return db.transaction(async (client) => {
            // Update Group Details
            if (name !== undefined || representativeColor !== undefined) {
                const updates: string[] = [];
                const values: any[] = [];
                let pIdx = 1;

                if (name !== undefined) {
                    updates.push(`name = $${pIdx++}`);
                    values.push(name);
                }
                if (representativeColor !== undefined) {
                    updates.push(`representative_color = $${pIdx++}`);
                    values.push(representativeColor);
                }

                if (updates.length > 0) {
                    values.push(id);
                    await client.query(`UPDATE vufs_media_label_groups SET ${updates.join(', ')} WHERE id = $${pIdx}`, values);
                }
            }

            // Update Labels & Order
            if (labelIds !== undefined) {
                // Delete existing memberships
                await client.query('DELETE FROM vufs_media_label_group_memberships WHERE group_id = $1', [id]);

                // Insert new memberships with order
                if (labelIds.length > 0) {
                    const values: string[] = [];
                    const params: any[] = [id];

                    labelIds.forEach((labelId, index) => {
                        params.push(labelId);
                        params.push(index);
                        values.push(`($1, $${params.length - 1}::uuid, $${params.length})`);
                    });

                    const insertQuery = `
                        INSERT INTO vufs_media_label_group_memberships (group_id, label_id, sort_order)
                        VALUES ${values.join(', ')}
                    `;
                    await client.query(insertQuery, params);
                }
            }

            // Return updated group
            const query = 'SELECT * FROM vufs_media_label_groups WHERE id = $1';
            const res = await client.query(query, [id]);
            if (res.rows.length === 0) return null;
            const row = res.rows[0];

            return {
                id: row.id,
                name: row.name,
                representativeColor: row.representative_color,
                createdAt: row.created_at
            };
        });
    }

    static async deleteGroup(id: string): Promise<boolean> {
        const query = 'DELETE FROM vufs_media_label_groups WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
}
