import { db } from '../database/connection';
import { ContentType } from './ContentPost';

export interface ContentDraft {
    id: string;
    userId: string;
    contentType: ContentType;
    draftData: {
        caption?: string;
        visibility?: string;
        audioId?: string;
        audioName?: string;
        audioArtist?: string;
        aspectRatio?: string;
        [key: string]: any;
    };
    mediaUrls: string[];
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDraftData {
    userId: string;
    contentType: ContentType;
    draftData?: ContentDraft['draftData'];
    mediaUrls?: string[];
    thumbnailUrl?: string;
}

export interface UpdateDraftData {
    draftData?: ContentDraft['draftData'];
    mediaUrls?: string[];
    thumbnailUrl?: string;
}

export class ContentDraftModel {
    /**
     * Create a new draft
     */
    static async create(data: CreateDraftData): Promise<ContentDraft> {
        const {
            userId,
            contentType,
            draftData = {},
            mediaUrls = [],
            thumbnailUrl
        } = data;

        const query = `
            INSERT INTO content_drafts (user_id, content_type, draft_data, media_urls, thumbnail_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const result = await db.query(query, [
            userId,
            contentType,
            JSON.stringify(draftData),
            mediaUrls,
            thumbnailUrl
        ]);

        return this.mapRowToContentDraft(result.rows[0]);
    }

    /**
     * Find draft by ID
     */
    static async findById(id: string): Promise<ContentDraft | null> {
        const query = 'SELECT * FROM content_drafts WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToContentDraft(result.rows[0]) : null;
    }

    /**
     * Get all drafts for a user
     */
    static async findByUser(
        userId: string,
        contentType?: ContentType,
        limit = 20,
        offset = 0
    ): Promise<{ drafts: ContentDraft[]; total: number }> {
        const whereConditions = ['user_id = $1'];
        const values: any[] = [userId];
        let paramIndex = 2;

        if (contentType) {
            whereConditions.push(`content_type = $${paramIndex++}`);
            values.push(contentType);
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const query = `
            SELECT *
            FROM content_drafts
            ${whereClause}
            ORDER BY updated_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        values.push(limit, offset);

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM content_drafts
            ${whereClause}
        `;

        const [draftsResult, countResult] = await Promise.all([
            db.query(query, values),
            db.query(countQuery, values.slice(0, -2))
        ]);

        return {
            drafts: draftsResult.rows.map(row => this.mapRowToContentDraft(row)),
            total: countResult.rows[0]?.total || 0
        };
    }

    /**
     * Update a draft
     */
    static async update(id: string, data: UpdateDraftData): Promise<ContentDraft | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.draftData !== undefined) {
            setClause.push(`draft_data = $${paramIndex++}`);
            values.push(JSON.stringify(data.draftData));
        }

        if (data.mediaUrls !== undefined) {
            setClause.push(`media_urls = $${paramIndex++}`);
            values.push(data.mediaUrls);
        }

        if (data.thumbnailUrl !== undefined) {
            setClause.push(`thumbnail_url = $${paramIndex++}`);
            values.push(data.thumbnailUrl);
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE content_drafts
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToContentDraft(result.rows[0]) : null;
    }

    /**
     * Delete a draft
     */
    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM content_drafts WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Delete all drafts for a user
     */
    static async deleteAllForUser(userId: string): Promise<number> {
        const query = 'DELETE FROM content_drafts WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        return result.rowCount || 0;
    }

    /**
     * Map database row to ContentDraft object
     */
    private static mapRowToContentDraft(row: any): ContentDraft {
        return {
            id: row.id,
            userId: row.user_id,
            contentType: row.content_type,
            draftData: row.draft_data || {},
            mediaUrls: row.media_urls || [],
            thumbnailUrl: row.thumbnail_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
