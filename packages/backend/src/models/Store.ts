import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface Store {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    location?: string;
    userId?: string;
    socialLinks?: Array<{ platform: string; url: string }>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class StoreModel {
    static async findAll(): Promise<Store[]> {
        const query = 'SELECT * FROM stores WHERE deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query);
        return result.rows.map(this.mapRowToStore);
    }

    static async findById(id: string): Promise<Store | null> {
        const query = 'SELECT * FROM stores WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToStore(result.rows[0]) : null;
    }

    static async findAllByUserId(userId: string): Promise<Store[]> {
        const query = 'SELECT * FROM stores WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query, [userId]);
        return result.rows.map(this.mapRowToStore);
    }

    static async findBySlugOrId(identifier: string): Promise<Store | null> {
        // Check if identifier is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            return this.findById(identifier);
        }

        // Find by slug
        const query = 'SELECT * FROM stores WHERE slug = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [identifier]);
        return result.rows.length > 0 ? this.mapRowToStore(result.rows[0]) : null;
    }

    static async create(data: { name: string; slug?: string; description?: string; location?: string; userId?: string; socialLinks?: Array<{ platform: string; url: string }> }): Promise<Store> {
        // Auto-generate slug from name if not provided
        const slug = data.slug || slugify(data.name);

        const query = `
      INSERT INTO stores (name, slug, description, location, user_id, social_links)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const result = await db.query(query, [data.name, slug, data.description || null, data.location || null, data.userId || null, JSON.stringify(data.socialLinks || [])]);
        return this.mapRowToStore(result.rows[0]);
    }

    static async update(id: string, data: { name?: string; description?: string; location?: string; userId?: string | null; socialLinks?: Array<{ platform: string; url: string }> }): Promise<Store | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { setClause.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.description !== undefined) { setClause.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.location !== undefined) { setClause.push(`location = $${paramIndex++}`); values.push(data.location); }
        if (data.userId !== undefined) { setClause.push(`user_id = $${paramIndex++}`); values.push(data.userId); }
        if (data.socialLinks !== undefined) { setClause.push(`social_links = $${paramIndex++}`); values.push(JSON.stringify(data.socialLinks)); }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE stores
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToStore(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE stores SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToStore(row: any): Store {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug || undefined,
            description: row.description,
            location: row.location,
            userId: row.user_id,
            socialLinks: row.social_links || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}
