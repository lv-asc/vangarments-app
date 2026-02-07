import { db } from '../database/connection';

export interface Condition {
    id: string;
    name: string;
    rating: number;
    sortOrder: number;
    group: 'new' | 'used';
    isActive: boolean;
    skuRef?: string;
    createdAt: Date;
}

export class ConditionModel {
    static async findAll(): Promise<Condition[]> {
        const query = `
            SELECT * FROM wardrobe_conditions
            WHERE is_active = true
            ORDER BY sort_order ASC, rating DESC, name ASC
        `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
            sortOrder: row.sort_order || 0,
            group: row.group,
            isActive: row.is_active,
            skuRef: row.sku_ref,
            createdAt: row.created_at
        }));
    }

    static async findById(id: string): Promise<Condition | null> {
        const query = 'SELECT * FROM wardrobe_conditions WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
            sortOrder: row.sort_order || 0,
            group: row.group,
            isActive: row.is_active,
            skuRef: row.sku_ref,
            createdAt: row.created_at
        };
    }

    static async create(name: string, rating: number, group: 'new' | 'used', sortOrder: number = 0): Promise<Condition> {
        const query = `
            INSERT INTO wardrobe_conditions (name, rating, "group", sort_order)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [name, rating, group, sortOrder]);
        const row = result.rows[0];

        return {
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
            sortOrder: row.sort_order || 0,
            group: row.group,
            isActive: row.is_active,
            skuRef: row.sku_ref,
            createdAt: row.created_at
        };
    }

    static async update(
        id: string,
        name?: string,
        rating?: number,
        group?: 'new' | 'used',
        sortOrder?: number
    ): Promise<Condition | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (rating !== undefined) {
            updates.push(`rating = $${paramIndex++}`);
            values.push(rating);
        }
        if (group !== undefined) {
            updates.push(`"group" = $${paramIndex++}`);
            values.push(group);
        }
        if (sortOrder !== undefined) {
            updates.push(`sort_order = $${paramIndex++}`);
            values.push(sortOrder);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const query = `
            UPDATE wardrobe_conditions
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        try {
            const result = await db.query(query, values);

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                rating: parseFloat(row.rating),
                sortOrder: row.sort_order || 0,
                group: row.group as 'new' | 'used',
                isActive: row.is_active,
                skuRef: row.sku_ref,
                createdAt: row.created_at
            };
        } catch (error) {
            console.error('Error in ConditionModel.update:', error);
            throw error;
        }
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE wardrobe_conditions SET is_active = false WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
}
