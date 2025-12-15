import { db } from '../database/connection';

export interface MediaItem {
    url: string;
    isPrimary?: boolean;
    title?: string;
    type: 'image' | 'video';
}

export interface Attachment {
    name: string;
    url: string;
    size: number;
    type: string;
}

export interface Journalism {
    id: string;
    title: string;
    content: string;
    type: 'News' | 'Column' | 'Article';
    images: MediaItem[];
    videos: MediaItem[];
    attachments: Attachment[];
    authorIds: string[];
    pageIds: string[];
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class JournalismModel {
    static async findAll(filters: { type?: string; published?: boolean } = {}): Promise<Journalism[]> {
        let query = 'SELECT * FROM journalism WHERE deleted_at IS NULL';
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.type) {
            query += ` AND type = $${paramIndex++}`;
            values.push(filters.type);
        }

        if (filters.published !== undefined) {
            query += ` AND published = $${paramIndex++}`;
            values.push(filters.published);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, values);
        return result.rows.map(this.mapRowToJournalism);
    }

    static async findById(id: string): Promise<Journalism | null> {
        const query = 'SELECT * FROM journalism WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToJournalism(result.rows[0]) : null;
    }

    static async create(data: Partial<Journalism>): Promise<Journalism> {
        const query = `
      INSERT INTO journalism (
        title, content, type, images, videos, attachments, author_ids, page_ids, published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
        const values = [
            data.title,
            data.content,
            data.type,
            JSON.stringify(data.images || []),
            JSON.stringify(data.videos || []),
            JSON.stringify(data.attachments || []),
            data.authorIds || [],
            data.pageIds || [],
            data.published || false
        ];

        const result = await db.query(query, values);
        return this.mapRowToJournalism(result.rows[0]);
    }

    static async update(id: string, data: Partial<Journalism>): Promise<Journalism | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) { setClause.push(`title = $${paramIndex++}`); values.push(data.title); }
        if (data.content !== undefined) { setClause.push(`content = $${paramIndex++}`); values.push(data.content); }
        if (data.type !== undefined) { setClause.push(`type = $${paramIndex++}`); values.push(data.type); }
        if (data.images !== undefined) { setClause.push(`images = $${paramIndex++}`); values.push(JSON.stringify(data.images)); }
        if (data.videos !== undefined) { setClause.push(`videos = $${paramIndex++}`); values.push(JSON.stringify(data.videos)); }
        if (data.attachments !== undefined) { setClause.push(`attachments = $${paramIndex++}`); values.push(JSON.stringify(data.attachments)); }
        if (data.authorIds !== undefined) { setClause.push(`author_ids = $${paramIndex++}`); values.push(data.authorIds); }
        if (data.pageIds !== undefined) { setClause.push(`page_ids = $${paramIndex++}`); values.push(data.pageIds); }
        if (data.published !== undefined) { setClause.push(`published = $${paramIndex++}`); values.push(data.published); }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE journalism
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToJournalism(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE journalism SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToJournalism(row: any): Journalism {
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            type: row.type,
            images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
            videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : row.videos || [],
            attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments || [],
            authorIds: row.author_ids || [],
            pageIds: row.page_ids || [],
            published: row.published,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}
