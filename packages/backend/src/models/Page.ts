import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface Page {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    userId?: string;
    logoUrl?: string;
    bannerUrl?: string;
    logoMetadata?: Array<{ url: string; name: string }>;
    bannerMetadata?: Array<{ url: string; positionY?: number }>;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    foundedBy?: string;
    foundedDate?: string;
    foundedDatePrecision?: 'year' | 'month' | 'day';
    socialLinks?: Array<{ platform: string; url: string }>;
    email?: string;
    telephone?: string;
    isVerified: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    isActive: boolean;
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

    static async findMany(filters: { search?: string; isVerified?: boolean; limit?: number; offset?: number } = {}): Promise<{ pages: Page[]; total: number }> {
        const { search, isVerified, limit = 20, offset = 0 } = filters;
        const whereConditions: string[] = ['deleted_at IS NULL'];
        const values: any[] = [];
        let paramIndex = 1;

        if (isVerified !== undefined) {
            whereConditions.push(`is_verified = $${paramIndex++}`);
            values.push(isVerified);
        }

        if (search) {
            whereConditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT *, COUNT(*) OVER() as total
            FROM pages
            ${whereClause}
            ORDER BY (NULLIF(logo_url, '') IS NOT NULL OR NULLIF(banner_url, '') IS NOT NULL) DESC, name ASC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        values.push(limit, offset);

        const result = await db.query(query, values);

        return {
            pages: result.rows.map(this.mapRowToPage),
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
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

    static async create(data: {
        name: string;
        slug?: string;
        description?: string;
        userId?: string;
        logoUrl?: string;
        bannerUrl?: string;
        logoMetadata?: Array<{ url: string; name: string }>;
        bannerMetadata?: Array<{ url: string; positionY?: number }>;
        websiteUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        facebookUrl?: string;
        foundedBy?: string;
        foundedDate?: string;
        foundedDatePrecision?: 'year' | 'month' | 'day';
        socialLinks?: Array<{ platform: string; url: string }>;
        email?: string;
        telephone?: string;
        isVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
        isActive?: boolean;
    }): Promise<Page> {
        let slug = data.slug;
        if (!slug && data.name) {
            slug = slugify(data.name);
        }

        const query = `
      INSERT INTO pages (
          name, slug, description, user_id, 
          logo_url, banner_url, website_url, 
          instagram_url, twitter_url, facebook_url, 
          founded_by, founded_date, founded_date_precision,
          social_links, email, telephone, is_verified, is_active,
          logo_metadata, banner_metadata, verification_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;
        const result = await db.query(query, [
            data.name,
            slug,
            data.description || null,
            data.userId || null,
            data.logoUrl || null,
            data.bannerUrl || null,
            data.websiteUrl || null,
            data.instagramUrl || null,
            data.twitterUrl || null,
            data.facebookUrl || null,
            data.foundedBy || null,
            data.foundedDate || null,
            data.foundedDatePrecision || null,
            JSON.stringify(data.socialLinks || []),
            data.email || null,
            data.telephone || null,
            data.isVerified ?? false,
            data.isActive ?? true,
            JSON.stringify(data.logoMetadata || []),
            JSON.stringify(data.bannerMetadata || []),
            data.verificationStatus || 'unverified'
        ]);
        const page = this.mapRowToPage(result.rows[0]);

        // Ensure owner follows @v
        if (data.userId) {
            try {
                const vRes = await db.query("SELECT id FROM users WHERE username = 'v'");
                if (vRes.rows.length > 0) {
                    const vId = vRes.rows[0].id;
                    if (data.userId !== vId) {
                        await db.query(`
                            INSERT INTO user_follows (follower_id, following_id, status)
                            VALUES ($1, $2, 'accepted')
                            ON CONFLICT (follower_id, following_id) DO NOTHING
                        `, [data.userId, vId]);
                    }
                }
            } catch (e) {
                console.error('Error auto-following @v from page creation:', e);
            }
        }

        return page;
    }

    static async update(id: string, data: {
        name?: string;
        slug?: string;
        description?: string;
        userId?: string | null;
        logoUrl?: string;
        bannerUrl?: string;
        logoMetadata?: Array<{ url: string; name: string }>;
        bannerMetadata?: Array<{ url: string; positionY?: number }>;
        websiteUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        facebookUrl?: string;
        foundedBy?: string;
        foundedDate?: string;
        foundedDatePrecision?: 'year' | 'month' | 'day';
        socialLinks?: Array<{ platform: string; url: string }>;
        email?: string;
        telephone?: string;
        isVerified?: boolean;
        verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
        isActive?: boolean;
    }): Promise<Page | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { setClause.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.slug !== undefined) { setClause.push(`slug = $${paramIndex++}`); values.push(data.slug); }
        if (data.description !== undefined) { setClause.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.userId !== undefined) { setClause.push(`user_id = $${paramIndex++}`); values.push(data.userId); }
        if (data.logoUrl !== undefined) { setClause.push(`logo_url = $${paramIndex++}`); values.push(data.logoUrl); }
        if (data.bannerUrl !== undefined) { setClause.push(`banner_url = $${paramIndex++}`); values.push(data.bannerUrl); }
        if (data.logoMetadata !== undefined) { setClause.push(`logo_metadata = $${paramIndex++}`); values.push(JSON.stringify(data.logoMetadata)); }
        if (data.bannerMetadata !== undefined) { setClause.push(`banner_metadata = $${paramIndex++}`); values.push(JSON.stringify(data.bannerMetadata)); }
        if (data.websiteUrl !== undefined) { setClause.push(`website_url = $${paramIndex++}`); values.push(data.websiteUrl); }
        if (data.instagramUrl !== undefined) { setClause.push(`instagram_url = $${paramIndex++}`); values.push(data.instagramUrl); }
        if (data.twitterUrl !== undefined) { setClause.push(`twitter_url = $${paramIndex++}`); values.push(data.twitterUrl); }
        if (data.facebookUrl !== undefined) { setClause.push(`facebook_url = $${paramIndex++}`); values.push(data.facebookUrl); }
        if (data.foundedBy !== undefined) { setClause.push(`founded_by = $${paramIndex++}`); values.push(data.foundedBy); }
        if (data.foundedDate !== undefined) { setClause.push(`founded_date = $${paramIndex++}`); values.push(data.foundedDate); }
        if (data.foundedDatePrecision !== undefined) { setClause.push(`founded_date_precision = $${paramIndex++}`); values.push(data.foundedDatePrecision); }
        if (data.socialLinks !== undefined) { setClause.push(`social_links = $${paramIndex++}`); values.push(JSON.stringify(data.socialLinks)); }
        if (data.email !== undefined) { setClause.push(`email = $${paramIndex++}`); values.push(data.email); }
        if (data.telephone !== undefined) { setClause.push(`telephone = $${paramIndex++}`); values.push(data.telephone); }
        if (data.isVerified !== undefined) { setClause.push(`is_verified = $${paramIndex++}`); values.push(data.isVerified); }
        if (data.verificationStatus !== undefined) { setClause.push(`verification_status = $${paramIndex++}`); values.push(data.verificationStatus); }
        if (data.isActive !== undefined) { setClause.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

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
            logoUrl: row.logo_url,
            bannerUrl: row.banner_url,
            logoMetadata: row.logo_metadata || [],
            bannerMetadata: row.banner_metadata || [],
            websiteUrl: row.website_url,
            instagramUrl: row.instagram_url,
            twitterUrl: row.twitter_url,
            facebookUrl: row.facebook_url,
            foundedBy: row.founded_by,
            foundedDate: row.founded_date,
            foundedDatePrecision: row.founded_date_precision,
            socialLinks: row.social_links || [],
            email: row.email || undefined,
            telephone: row.telephone || undefined,
            isVerified: row.is_verified,
            verificationStatus: row.verification_status || (row.is_verified ? 'verified' : 'unverified'),
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}

