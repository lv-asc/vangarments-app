import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface Supplier {
    id: string;
    name: string;
    slug?: string;
    contactInfo?: string;
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class SupplierModel {
    static async findAll(): Promise<Supplier[]> {
        const query = 'SELECT * FROM suppliers WHERE deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query);
        return result.rows.map(this.mapRowToSupplier);
    }

    static async findById(id: string): Promise<Supplier | null> {
        const query = 'SELECT * FROM suppliers WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToSupplier(result.rows[0]) : null;
    }

    static async findAllByUserId(userId: string): Promise<Supplier[]> {
        const query = 'SELECT * FROM suppliers WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query, [userId]);
        return result.rows.map(this.mapRowToSupplier);
    }

    static async findBySlugOrId(identifier: string): Promise<Supplier | null> {
        // Check if identifier is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            return this.findById(identifier);
        }

        // Find by slug
        const query = 'SELECT * FROM suppliers WHERE slug = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [identifier]);
        return result.rows.length > 0 ? this.mapRowToSupplier(result.rows[0]) : null;
    }

    static async create(data: { name: string; slug?: string; contactInfo?: string; userId?: string }): Promise<Supplier> {
        // Auto-generate slug from name if not provided
        const slug = data.slug || slugify(data.name);

        const query = `
      INSERT INTO suppliers (name, slug, contact_info, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await db.query(query, [data.name, slug, data.contactInfo || null, data.userId || null]);
        return this.mapRowToSupplier(result.rows[0]);
    }

    static async update(id: string, data: { name?: string; contactInfo?: string; userId?: string | null }): Promise<Supplier | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { setClause.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.contactInfo !== undefined) { setClause.push(`contact_info = $${paramIndex++}`); values.push(data.contactInfo); }
        if (data.userId !== undefined) { setClause.push(`user_id = $${paramIndex++}`); values.push(data.userId); }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE suppliers
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToSupplier(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE suppliers SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToSupplier(row: any): Supplier {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug || undefined,
            contactInfo: row.contact_info,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}
