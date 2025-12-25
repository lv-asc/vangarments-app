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
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    foundedBy?: string;
    foundedDate?: string;
    foundedDatePrecision?: 'year' | 'month' | 'day';
    isVerified: boolean;
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
        websiteUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        facebookUrl?: string;
        foundedBy?: string;
        foundedDate?: string;
        foundedDatePrecision?: 'year' | 'month' | 'day';
        isVerified?: boolean;
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
          is_verified, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
            data.isVerified ?? false,
            data.isActive ?? true
        ]);
        return this.mapRowToPage(result.rows[0]);
    }

    static async update(id: string, data: {
        name?: string;
        slug?: string;
        description?: string;
        userId?: string | null;
        logoUrl?: string;
        bannerUrl?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        facebookUrl?: string;
        foundedBy?: string;
        foundedDate?: string;
        foundedDatePrecision?: 'year' | 'month' | 'day';
        isVerified?: boolean;
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
        if (data.websiteUrl !== undefined) { setClause.push(`website_url = $${paramIndex++}`); values.push(data.websiteUrl); }
        if (data.instagramUrl !== undefined) { setClause.push(`instagram_url = $${paramIndex++}`); values.push(data.instagramUrl); }
        if (data.twitterUrl !== undefined) { setClause.push(`twitter_url = $${paramIndex++}`); values.push(data.twitterUrl); }
        if (data.facebookUrl !== undefined) { setClause.push(`facebook_url = $${paramIndex++}`); values.push(data.facebookUrl); }
        if (data.foundedBy !== undefined) { setClause.push(`founded_by = $${paramIndex++}`); values.push(data.foundedBy); }
        if (data.foundedDate !== undefined) { setClause.push(`founded_date = $${paramIndex++}`); values.push(data.foundedDate); }
        if (data.foundedDatePrecision !== undefined) { setClause.push(`founded_date_precision = $${paramIndex++}`); values.push(data.foundedDatePrecision); }
        if (data.isVerified !== undefined) { setClause.push(`is_verified = $${paramIndex++}`); values.push(data.isVerified); }
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
            websiteUrl: row.website_url,
            instagramUrl: row.instagram_url,
            twitterUrl: row.twitter_url,
            facebookUrl: row.facebook_url,
            foundedBy: row.founded_by,
            foundedDate: row.founded_date,
            foundedDatePrecision: row.founded_date_precision,
            isVerified: row.is_verified,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}

