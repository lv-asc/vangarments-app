import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface Page {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class PageModel {
    static async findAll(): Promise<Page[]> {
        const query = 'SELECT * FROM pages WHERE deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query);
        return result.rows.map(this.mapRowToPage);
    }

    static async findById(id: string): Promise<Page | null> {
        const query = 'SELECT * FROM pages WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToPage(result.rows[0]) : null;
    }

    static async findBySlugOrId(identifier: string): Promise<Page | null> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            return this.findById(identifier);
        }

        const query = 'SELECT * FROM pages WHERE slug = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [identifier]);
        return result.rows.length > 0 ? this.mapRowToPage(result.rows[0]) : null;
    }

    static async findAllByUserId(userId: string): Promise<Page[]> {
        const query = 'SELECT * FROM pages WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
        const result = await db.query(query, [userId]);
        return result.rows.map(this.mapRowToPage);
    }

    static async create(data: { name: string; slug?: string; description?: string; userId?: string }): Promise<Page> {
        let slug = data.slug;
        if (!slug && data.name) {
            slug = slugify(data.name);
        }

        const query = `
      INSERT INTO pages (name, slug, description, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await db.query(query, [data.name, slug, data.description || null, data.userId || null]);
        return this.mapRowToPage(result.rows[0]);
    }

    static async update(id: string, data: { name?: string; slug?: string; description?: string; userId?: string | null }): Promise<Page | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { setClause.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.slug !== undefined) { setClause.push(`slug = $${paramIndex++}`); values.push(data.slug); }
        if (data.description !== undefined) { setClause.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.userId !== undefined) { setClause.push(`user_id = $${paramIndex++}`); values.push(data.userId); }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE pages
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToPage(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE pages SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToPage(row: any): Page {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}
