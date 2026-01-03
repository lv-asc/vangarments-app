import { db } from '../database/connection';

export interface Condition {
    id: string;
    name: string;
    rating: number;
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
            ORDER BY rating DESC, name ASC
        `;
        const result = await db.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
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
            group: row.group,
            isActive: row.is_active,
            skuRef: row.sku_ref,
            createdAt: row.created_at
        };
    }

    static async create(name: string, rating: number, group: 'new' | 'used'): Promise<Condition> {
        const query = `
            INSERT INTO wardrobe_conditions (name, rating, "group")
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [name, rating, group]);
        const row = result.rows[0];

        return {
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
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
        group?: 'new' | 'used'
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

        const result = await db.query(query, values);

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            rating: parseFloat(row.rating),
            group: row.group,
            isActive: row.is_active,
            createdAt: row.created_at
        };
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE wardrobe_conditions SET is_active = false WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
}
