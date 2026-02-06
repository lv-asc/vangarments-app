import { db } from '../database/connection';

// Content types
export type ContentType = 'daily' | 'motion' | 'feed';
export type MediaType = 'image' | 'video' | 'mixed';
export type AspectRatio = '1:1' | '4:5' | '9:16';
export type Visibility = 'public' | 'followers' | 'private';

export interface ContentPost {
    id: string;
    userId: string;
    contentType: ContentType;
    mediaUrls: string[];
    mediaType: MediaType;
    thumbnailUrl?: string;
    title?: string;
    caption?: string;
    aspectRatio: AspectRatio;
    audioId?: string;
    audioName?: string;
    audioArtist?: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    visibility: Visibility;
    isArchived: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        profile: any;
        verificationStatus: string;
    };
    hasLiked?: boolean;
}

export interface CreateContentPostData {
    userId: string;
    contentType: ContentType;
    mediaUrls: string[];
    mediaType: MediaType;
    title?: string;
    thumbnailUrl?: string;
    caption?: string;
    aspectRatio?: AspectRatio;
    audioId?: string;
    audioName?: string;
    audioArtist?: string;
    visibility?: Visibility;
}

export interface UpdateContentPostData {
    title?: string;
    caption?: string;
    visibility?: Visibility;
    isArchived?: boolean;
    audioId?: string;
    audioName?: string;
    audioArtist?: string;
}

export interface ContentPostFilters {
    userId?: string;
    contentType?: ContentType;
    visibility?: Visibility;
    followingIds?: string[];
    excludeExpired?: boolean;
    includeArchived?: boolean;
}

export class ContentPostModel {
    /**
     * Create a new content post
     */
    static async create(data: CreateContentPostData): Promise<ContentPost> {
        const {
            userId,
            contentType,
            mediaUrls,
            mediaType,
            thumbnailUrl,
            title,
            caption,
            aspectRatio = contentType === 'feed' ? '1:1' : '9:16',
            audioId,
            audioName,
            audioArtist,
            visibility = 'public'
        } = data;

        // Calculate expiration for Daily posts (24 hours)
        const expiresAt = contentType === 'daily'
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null;

        const query = `
            INSERT INTO content_posts (
                user_id, content_type, media_urls, media_type, thumbnail_url,
                title, caption, aspect_ratio, audio_id, audio_name, audio_artist,
                visibility, expires_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            userId,
            contentType,
            mediaUrls,
            mediaType,
            thumbnailUrl,
            title,
            caption,
            aspectRatio,
            audioId,
            audioName,
            audioArtist,
            visibility,
            expiresAt
        ];

        const result = await db.query(query, values);
        return this.mapRowToContentPost(result.rows[0]);
    }

    /**
     * Find a content post by ID
     */
    static async findById(id: string, viewerId?: string): Promise<ContentPost | null> {
        const query = `
            SELECT cp.*,
                   u.profile as user_profile,
                   u.verification_status
                   ${viewerId ? `, EXISTS(SELECT 1 FROM content_likes WHERE content_id = cp.id AND user_id = $2) as has_liked` : ''}
            FROM content_posts cp
            LEFT JOIN users u ON cp.user_id = u.id
            WHERE cp.id = $1
        `;

        const values = viewerId ? [id, viewerId] : [id];
        const result = await db.query(query, values);

        if (result.rows.length === 0) return null;
        return this.mapRowToContentPost(result.rows[0]);
    }

    /**
     * Get feed of content posts
     */
    static async findMany(
        filters: ContentPostFilters = {},
        limit = 20,
        offset = 0,
        viewerId?: string
    ): Promise<{ posts: ContentPost[]; total: number }> {
        const whereConditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Filter by user
        if (filters.userId) {
            whereConditions.push(`cp.user_id = $${paramIndex++}`);
            values.push(filters.userId);
        }

        // Filter by content type
        if (filters.contentType) {
            whereConditions.push(`cp.content_type = $${paramIndex++}`);
            values.push(filters.contentType);
        }

        // Filter by visibility
        if (filters.visibility) {
            whereConditions.push(`cp.visibility = $${paramIndex++}`);
            values.push(filters.visibility);
        }

        // Filter by following
        if (filters.followingIds && filters.followingIds.length > 0) {
            whereConditions.push(`cp.user_id = ANY($${paramIndex++})`);
            values.push(filters.followingIds);
        }

        // Exclude expired content (for Daily)
        if (filters.excludeExpired !== false) {
            whereConditions.push(`(cp.expires_at IS NULL OR cp.expires_at > NOW())`);
        }

        // Exclude archived unless requested
        if (!filters.includeArchived) {
            whereConditions.push(`cp.is_archived = FALSE`);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Add viewer ID for has_liked check
        let hasLikedSelect = '';
        if (viewerId) {
            hasLikedSelect = `, EXISTS(SELECT 1 FROM content_likes WHERE content_id = cp.id AND user_id = $${paramIndex++}) as has_liked`;
            values.push(viewerId);
        }

        const query = `
            SELECT cp.*,
                   u.profile as user_profile,
                   u.verification_status
                   ${hasLikedSelect}
            FROM content_posts cp
            LEFT JOIN users u ON cp.user_id = u.id
            ${whereClause}
            ORDER BY cp.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        values.push(limit, offset);

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM content_posts cp
            ${whereClause}
        `;

        // Remove limit, offset, and viewerId for count
        const countValues = viewerId
            ? values.slice(0, -3)
            : values.slice(0, -2);

        const [postsResult, countResult] = await Promise.all([
            db.query(query, values),
            db.query(countQuery, countValues)
        ]);

        return {
            posts: postsResult.rows.map(row => this.mapRowToContentPost(row)),
            total: countResult.rows[0]?.total || 0
        };
    }

    /**
     * Get active Daily stories from followed users
     */
    static async getActiveStories(
        viewerId: string,
        followingIds: string[],
        limit = 50
    ): Promise<{ users: any[]; total: number }> {
        if (followingIds.length === 0) {
            return { users: [], total: 0 };
        }

        // Get users with active stories, grouped by user
        const query = `
            WITH active_stories AS (
                SELECT cp.*, 
                       u.profile as user_profile,
                       u.id as uid,
                       EXISTS(SELECT 1 FROM content_views WHERE content_id = cp.id AND viewer_id = $1) as has_viewed
                FROM content_posts cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.content_type = 'daily'
                  AND cp.expires_at > NOW()
                  AND cp.user_id = ANY($2)
                  AND cp.is_archived = FALSE
                ORDER BY cp.created_at DESC
            )
            SELECT 
                uid as user_id,
                user_profile,
                json_agg(
                    json_build_object(
                        'id', id,
                        'mediaUrls', media_urls,
                        'mediaType', media_type,
                        'thumbnailUrl', thumbnail_url,
                        'caption', caption,
                        'createdAt', created_at,
                        'expiresAt', expires_at,
                        'hasViewed', has_viewed
                    ) ORDER BY created_at ASC
                ) as stories,
                bool_and(has_viewed) as all_viewed
            FROM active_stories
            GROUP BY uid, user_profile
            ORDER BY all_viewed ASC, MAX(created_at) DESC
            LIMIT $3
        `;

        const result = await db.query(query, [viewerId, followingIds, limit]);

        return {
            users: result.rows.map(row => ({
                userId: row.user_id,
                profile: row.user_profile,
                stories: row.stories,
                allViewed: row.all_viewed
            })),
            total: result.rows.length
        };
    }

    /**
     * Update a content post
     */
    static async update(id: string, data: UpdateContentPostData): Promise<ContentPost | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            setClause.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }

        if (data.caption !== undefined) {
            setClause.push(`caption = $${paramIndex++}`);
            values.push(data.caption);
        }

        if (data.visibility) {
            setClause.push(`visibility = $${paramIndex++}`);
            values.push(data.visibility);
        }

        if (data.isArchived !== undefined) {
            setClause.push(`is_archived = $${paramIndex++}`);
            values.push(data.isArchived);
        }

        if (data.audioId !== undefined) {
            setClause.push(`audio_id = $${paramIndex++}`);
            values.push(data.audioId);
        }

        if (data.audioName !== undefined) {
            setClause.push(`audio_name = $${paramIndex++}`);
            values.push(data.audioName);
        }

        if (data.audioArtist !== undefined) {
            setClause.push(`audio_artist = $${paramIndex++}`);
            values.push(data.audioArtist);
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE content_posts
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToContentPost(result.rows[0]) : null;
    }

    /**
     * Delete a content post
     */
    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM content_posts WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Toggle like on a content post
     */
    static async toggleLike(contentId: string, userId: string): Promise<{ liked: boolean }> {
        const checkQuery = 'SELECT 1 FROM content_likes WHERE content_id = $1 AND user_id = $2';
        const checkResult = await db.query(checkQuery, [contentId, userId]);

        if (checkResult.rows.length > 0) {
            await db.query('DELETE FROM content_likes WHERE content_id = $1 AND user_id = $2', [contentId, userId]);
            return { liked: false };
        } else {
            await db.query('INSERT INTO content_likes (content_id, user_id) VALUES ($1, $2)', [contentId, userId]);
            return { liked: true };
        }
    }

    /**
     * Check if user has liked content
     */
    static async hasLiked(contentId: string, userId: string): Promise<boolean> {
        const query = 'SELECT 1 FROM content_likes WHERE content_id = $1 AND user_id = $2';
        const result = await db.query(query, [contentId, userId]);
        return result.rows.length > 0;
    }

    /**
     * Map database row to ContentPost object
     */
    private static mapRowToContentPost(row: any): ContentPost {
        return {
            id: row.id,
            userId: row.user_id,
            contentType: row.content_type,
            mediaUrls: row.media_urls || [],
            mediaType: row.media_type,
            thumbnailUrl: row.thumbnail_url,
            title: row.title,
            caption: row.caption,
            aspectRatio: row.aspect_ratio,
            audioId: row.audio_id,
            audioName: row.audio_name,
            audioArtist: row.audio_artist,
            likesCount: row.likes_count || 0,
            commentsCount: row.comments_count || 0,
            sharesCount: row.shares_count || 0,
            viewsCount: row.views_count || 0,
            visibility: row.visibility,
            isArchived: row.is_archived,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            user: row.user_profile ? {
                id: row.user_id,
                profile: row.user_profile,
                verificationStatus: row.verification_status || 'unverified'
            } : undefined,
            hasLiked: row.has_liked || false
        };
    }
}
