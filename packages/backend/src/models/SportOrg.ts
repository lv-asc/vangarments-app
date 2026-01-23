import { db } from '../database/connection';
import { SportOrg, SportOrgType, SocialLink } from '@vangarments/shared/types';

interface ContactInfo {
    email?: string;
    phone?: string;
    address?: string;
}

interface LogoMetadata {
    url: string;
    name?: string;
}

interface BannerItem {
    url: string;
    positionY?: number;
}

export class SportOrgModel {
    static async create(data: {
        name: string;
        slug: string;
        orgType: SportOrgType;
        masterLogo?: string;
        logoMetadata?: LogoMetadata[];
        banner?: string;
        banners?: BannerItem[];
        primaryColor?: string;
        secondaryColor?: string;
        foundedCountry?: string;
        foundedDate?: string;
        foundedBy?: string;
        website?: string;
        description?: string;
        contactInfo?: ContactInfo;
        socialLinks?: SocialLink[];
    }): Promise<SportOrg> {
        const query = `
            INSERT INTO sport_orgs (
                name, slug, org_type, master_logo, logo_metadata, banner, banners,
                primary_color, secondary_color, founded_country, founded_date, 
                founded_by, website, description, contact_info, social_links
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;
        const values = [
            data.name, data.slug, data.orgType, data.masterLogo,
            JSON.stringify(data.logoMetadata || []),
            data.banner, JSON.stringify(data.banners || []),
            data.primaryColor, data.secondaryColor, data.foundedCountry, data.foundedDate,
            data.foundedBy, data.website, data.description,
            JSON.stringify(data.contactInfo || {}), JSON.stringify(data.socialLinks || [])
        ];
        const { rows } = await db.query(query, values);
        return this.mapRowToSportOrg(rows[0]);
    }

    static async findById(id: string): Promise<SportOrg | null> {
        const { rows } = await db.query('SELECT * FROM sport_orgs WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return null;
        return this.mapRowToSportOrg(rows[0]);
    }

    static async findBySlug(slug: string): Promise<SportOrg | null> {
        const { rows } = await db.query('SELECT * FROM sport_orgs WHERE slug = $1 AND deleted_at IS NULL', [slug]);
        if (rows.length === 0) return null;
        return this.mapRowToSportOrg(rows[0]);
    }

    static async findMany(filters: { orgType?: SportOrgType; search?: string } = {}): Promise<SportOrg[]> {
        let query = 'SELECT * FROM sport_orgs WHERE deleted_at IS NULL';
        const values: any[] = [];

        if (filters.orgType) {
            values.push(filters.orgType);
            query += ` AND org_type = $${values.length}`;
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            query += ` AND name ILIKE $${values.length}`;
        }

        query += ' ORDER BY name ASC';
        const { rows } = await db.query(query, values);
        return rows.map(row => this.mapRowToSportOrg(row));
    }

    static async update(id: string, data: Partial<SportOrg & { logoMetadata?: LogoMetadata[] }>): Promise<SportOrg | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.slug) { fields.push(`slug = $${i++}`); values.push(data.slug); }
        if (data.orgType) { fields.push(`org_type = $${i++}`); values.push(data.orgType); }
        if (data.masterLogo !== undefined) { fields.push(`master_logo = $${i++}`); values.push(data.masterLogo); }
        if (data.logoMetadata !== undefined) { fields.push(`logo_metadata = $${i++}`); values.push(JSON.stringify(data.logoMetadata)); }
        if (data.banner !== undefined) { fields.push(`banner = $${i++}`); values.push(data.banner); }
        if (data.banners !== undefined) { fields.push(`banners = $${i++}`); values.push(JSON.stringify(data.banners)); }
        if (data.primaryColor !== undefined) { fields.push(`primary_color = $${i++}`); values.push(data.primaryColor); }
        if (data.secondaryColor !== undefined) { fields.push(`secondary_color = $${i++}`); values.push(data.secondaryColor); }
        if (data.foundedCountry !== undefined) { fields.push(`founded_country = $${i++}`); values.push(data.foundedCountry); }
        if (data.foundedDate !== undefined) { fields.push(`founded_date = $${i++}`); values.push(data.foundedDate); }
        if (data.foundedBy !== undefined) { fields.push(`founded_by = $${i++}`); values.push(data.foundedBy); }
        if (data.website !== undefined) { fields.push(`website = $${i++}`); values.push(data.website); }
        if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
        if (data.contactInfo !== undefined) { fields.push(`contact_info = $${i++}`); values.push(JSON.stringify(data.contactInfo)); }
        if (data.socialLinks !== undefined) { fields.push(`social_links = $${i++}`); values.push(JSON.stringify(data.socialLinks)); }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE sport_orgs 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${i} AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return null;
        return this.mapRowToSportOrg(rows[0]);
    }

    static async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query('UPDATE sport_orgs SET deleted_at = NOW() WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }

    static mapRowToSportOrg(row: any): SportOrg {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            orgType: row.org_type,
            masterLogo: row.master_logo,
            logoMetadata: row.logo_metadata || [],
            banner: row.banner,
            banners: row.banners || [],
            primaryColor: row.primary_color,
            secondaryColor: row.secondary_color,
            foundedCountry: row.founded_country,
            foundedDate: row.founded_date ? (typeof row.founded_date === 'string' ? row.founded_date : row.founded_date.toISOString().split('T')[0]) : undefined,
            foundedBy: row.founded_by,
            website: row.website,
            description: row.description,
            contactInfo: row.contact_info || {},
            socialLinks: row.social_links || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
