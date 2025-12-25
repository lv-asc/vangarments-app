import { db } from '../database/connection';

export interface SizeConversion {
    standard: string; // 'BR', 'US', etc.
    value: string; // 'S', 'P', '40'
}

export interface Size {
    id: string;
    name: string;
    sortOrder?: number;
    conversions: SizeConversion[]; // Hydrated
    validCategoryIds: number[]; // Integer IDs from vufs_categories
    isActive: boolean;
    createdAt: Date;
}

export class SizeModel {
    static async findAll(): Promise<Size[]> {
        // We need to aggregate conversions and validity
        // To minimize query complexity, maybe fetches separately or aggregate?
        // Aggregate is better for list views.
        const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('standard', sc.standard, 'value', sc.value))
          FILTER (WHERE sc.standard IS NOT NULL),
          '[]'
        ) as conversions,
        COALESCE(
          array_agg(DISTINCT cs.category_id) FILTER (WHERE cs.category_id IS NOT NULL),
          '{}'
        ) as valid_categories
      FROM vufs_sizes s
      LEFT JOIN vufs_size_conversions sc ON s.id = sc.size_id
      LEFT JOIN vufs_category_sizes cs ON s.id = cs.size_id
      WHERE s.is_active = true
      GROUP BY s.id
      ORDER BY s.sort_order ASC, s.name ASC
    `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            createdAt: row.created_at,
            conversions: row.conversions,
            validCategoryIds: row.valid_categories
        }));
    }

    static async findById(id: string): Promise<Size | null> {
        const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('standard', sc.standard, 'value', sc.value))
          FILTER (WHERE sc.standard IS NOT NULL),
          '[]'
        ) as conversions,
        COALESCE(
          array_agg(DISTINCT cs.category_id) FILTER (WHERE cs.category_id IS NOT NULL),
          '{}'
        ) as valid_categories
      FROM vufs_sizes s
      LEFT JOIN vufs_size_conversions sc ON s.id = sc.size_id
      LEFT JOIN vufs_category_sizes cs ON s.id = cs.size_id
      WHERE s.id = $1
      GROUP BY s.id
    `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            createdAt: row.created_at,
            conversions: row.conversions,
            validCategoryIds: row.valid_categories
        };
    }

    static async create(name: string, sortOrder?: number, conversions: SizeConversion[] = [], validCategoryIds: number[] = []): Promise<Size> {
        return db.transaction(async (client) => {
            const insertQuery = `
        INSERT INTO vufs_sizes (name, sort_order) VALUES ($1, $2) RETURNING *
      `;
            const sizeRes = await client.query(insertQuery, [name, sortOrder || 0]);
            const size = sizeRes.rows[0];

            if (conversions.length > 0) {
                const convQuery = `
          INSERT INTO vufs_size_conversions (size_id, standard, value)
          SELECT $1, (c->>'standard'), (c->>'value')
          FROM jsonb_array_elements($2::jsonb) as c
        `;
                await client.query(convQuery, [size.id, JSON.stringify(conversions)]);
            }

            if (validCategoryIds.length > 0) {
                const uniqueCatIds = [...new Set(validCategoryIds)];
                const catQuery = `
          INSERT INTO vufs_category_sizes (category_id, size_id)
          SELECT unnest($2::int[]), $1
        `;
                await client.query(catQuery, [size.id, uniqueCatIds]);
            }

            return this.findById(size.id) as Promise<Size>;
        });
    }

    static async update(
        id: string,
        name?: string,
        sortOrder?: number,
        conversions?: SizeConversion[],
        validCategoryIds?: number[]
    ): Promise<Size | null> {
        return db.transaction(async (client) => {
            // Update base fields
            console.log('[SizeModel.update] Input:', { id, name, sortOrder, conversions, validCategoryIds });
            if (name !== undefined || sortOrder !== undefined) {
                const updates: string[] = [];
                const values: any[] = [];
                let pIdx = 1;
                if (name !== undefined) {
                    updates.push(`name = $${pIdx++}`);
                    values.push(name);
                }
                if (sortOrder !== undefined) {
                    updates.push(`sort_order = $${pIdx++}`);
                    values.push(sortOrder);
                }
                if (updates.length > 0) {
                    values.push(id);
                    const query = `UPDATE vufs_sizes SET ${updates.join(', ')} WHERE id = $${pIdx}`;
                    console.log('[SizeModel.update] Running query:', query, 'with values:', values);
                    const result = await client.query(query, values);
                    console.log('[SizeModel.update] Rows updated:', result.rowCount);
                }
            }

            // Update conversions (replace all)
            if (conversions !== undefined) {
                await client.query('DELETE FROM vufs_size_conversions WHERE size_id = $1', [id]);
                if (conversions.length > 0) {
                    const convQuery = `
                INSERT INTO vufs_size_conversions (size_id, standard, value)
                SELECT $1, (c->>'standard'), (c->>'value')
                FROM jsonb_array_elements($2::jsonb) as c
               `;
                    await client.query(convQuery, [id, JSON.stringify(conversions)]);
                }
            }

            // Update categories (replace all)
            if (validCategoryIds !== undefined) {
                await client.query('DELETE FROM vufs_category_sizes WHERE size_id = $1', [id]);
                if (validCategoryIds.length > 0) {
                    const uniqueCatIds = [...new Set(validCategoryIds)];
                    const catQuery = `
               INSERT INTO vufs_category_sizes (category_id, size_id)
               SELECT unnest($2::int[]), $1
             `;
                    await client.query(catQuery, [id, uniqueCatIds]);
                }
            }

            return this.findById(id);
        });
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE vufs_sizes SET is_active = false WHERE id = $1';
        const res = await db.query(query, [id]);
        return (res.rowCount || 0) > 0;
    }

    static async updateOrder(orders: { id: string, sortOrder: number }[]): Promise<void> {
        console.log(`[SizeModel] Updating order for ${orders.length} items`);
        try {
            await db.transaction(async (client) => {
                const query = 'UPDATE vufs_sizes SET sort_order = $1 WHERE id = $2';
                for (const item of orders) {
                    console.log(`[SizeModel] Executing: UPDATE vufs_sizes SET sort_order = ${item.sortOrder} WHERE id = ${item.id}`);
                    const result = await client.query(query, [item.sortOrder, item.id]);
                    console.log(`[SizeModel] Rows affected: ${result.rowCount}`);
                }
            });
            console.log('[SizeModel] Transaction committed successfully');
        } catch (error: any) {
            console.error('[SizeModel] Update status failed:', error.message);
            throw error;
        }
    }
}
