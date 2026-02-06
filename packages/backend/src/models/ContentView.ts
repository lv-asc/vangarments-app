import { db } from '../database/connection';

export interface ContentView {
    id: string;
    contentId: string;
    viewerId: string;
    viewedAt: Date;
}

export interface ViewerInfo {
    viewerId: string;
    viewedAt: Date;
    profile?: any;
}

export class ContentViewModel {
    /**
     * Record that a user has viewed content
     */
    static async recordView(contentId: string, viewerId: string): Promise<ContentView | null> {
        // Use upsert to avoid duplicates
        const query = `
            INSERT INTO content_views (content_id, viewer_id)
            VALUES ($1, $2)
            ON CONFLICT (content_id, viewer_id) DO UPDATE SET viewed_at = NOW()
            RETURNING *
        `;

        const result = await db.query(query, [contentId, viewerId]);
        return result.rows.length > 0 ? this.mapRowToContentView(result.rows[0]) : null;
    }

    /**
     * Check if user has viewed content
     */
    static async hasViewed(contentId: string, viewerId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM content_views WHERE content_id = $1 AND viewer_id = $2';
        const result = await db.query(query, [contentId, viewerId]);
        return result.rows.length > 0;
    }

    /**
     * Get viewers of a specific content post
     */
    static async getViewers(
        contentId: string,
        limit = 50,
        offset = 0
    ): Promise<{ viewers: ViewerInfo[]; total: number }> {
        const query = `
            SELECT cv.viewer_id, cv.viewed_at, u.profile
            FROM content_views cv
            LEFT JOIN users u ON cv.viewer_id = u.id
            WHERE cv.content_id = $1
            ORDER BY cv.viewed_at DESC
            LIMIT $2 OFFSET $3
        `;

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM content_views
            WHERE content_id = $1
        `;

        const [viewersResult, countResult] = await Promise.all([
            db.query(query, [contentId, limit, offset]),
            db.query(countQuery, [contentId])
        ]);

        return {
            viewers: viewersResult.rows.map(row => ({
                viewerId: row.viewer_id,
                viewedAt: row.viewed_at,
                profile: row.profile
            })),
            total: countResult.rows[0]?.total || 0
        };
    }

    /**
     * Get view count for content
     */
    static async getViewCount(contentId: string): Promise<number> {
        const query = 'SELECT COUNT(*)::int as count FROM content_views WHERE content_id = $1';
        const result = await db.query(query, [contentId]);
        return result.rows[0]?.count || 0;
    }

    /**
     * Get which content items a user has viewed (for filtering seen stories)
     */
    static async getViewedContentIds(viewerId: string, contentIds: string[]): Promise<string[]> {
        if (contentIds.length === 0) return [];

        const query = `
            SELECT content_id
            FROM content_views
            WHERE viewer_id = $1 AND content_id = ANY($2)
        `;

        const result = await db.query(query, [viewerId, contentIds]);
        return result.rows.map(row => row.content_id);
    }

    /**
     * Map database row to ContentView object
     */
    private static mapRowToContentView(row: any): ContentView {
        return {
            id: row.id,
            contentId: row.content_id,
            viewerId: row.viewer_id,
            viewedAt: row.viewed_at
        };
    }
}
