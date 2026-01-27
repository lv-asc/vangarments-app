import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface BrandLine {
    id: string;
    brandId: string;
    name: string;
    slug?: string;
    logo?: string;
    description?: string;
    collabBrandId?: string;
    designerId?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface CreateBrandLineData {
    brandId: string;
    name: string;
    slug?: string;
    logo?: string;
    description?: string;
    collabBrandId?: string;
    designerId?: string;
    tags?: string[];
}

export interface UpdateBrandLineData {
    name?: string;
    slug?: string;
    logo?: string;
    description?: string;
    collabBrandId?: string;
    designerId?: string;
    tags?: string[];
}

export class BrandLineModel {
    static async create(data: CreateBrandLineData): Promise<BrandLine> {
        // Auto-generate slug from name if not provided
        const slug = data.slug || slugify(data.name);

        const query = `
      INSERT INTO brand_lines (brand_id, name, slug, logo, description, collab_brand_id, designer_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [
            data.brandId,
            data.name,
            slug,
            data.logo ?? null,
            data.description ?? null,
            data.collabBrandId ?? null,
            data.designerId ?? null,
            data.tags ?? null
        ];
        const result = await db.query(query, values);
        return this.mapRowToBrandLine(result.rows[0]);
    }

    static async findById(id: string): Promise<BrandLine | null> {
        const query = 'SELECT * FROM brand_lines WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToBrandLine(result.rows[0]) : null;
    }

    static async findBySlugOrId(identifier: string, brandId: string): Promise<BrandLine | null> {
        // Check if identifier is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            return this.findById(identifier);
        }

        // Find by slug within the brand (check both account ID and direct brand/vufs ID)
        const query = `
            SELECT bl.* 
            FROM brand_lines bl
            LEFT JOIN brand_accounts ba ON bl.brand_id = ba.vufs_brand_id OR bl.brand_id = ba.id
            WHERE (bl.brand_id = $1 OR ba.id = $1 OR ba.vufs_brand_id = $1)
            AND bl.slug = $2 AND bl.deleted_at IS NULL
            LIMIT 1
        `;
        const result = await db.query(query, [brandId, identifier]);
        return result.rows.length > 0 ? this.mapRowToBrandLine(result.rows[0]) : null;
    }

    static async findByBrandId(brandId: string): Promise<BrandLine[]> {
        const query = `
            SELECT DISTINCT bl.* FROM brand_lines bl
            LEFT JOIN brand_accounts ba ON bl.brand_id = ba.vufs_brand_id OR bl.brand_id = ba.id
            WHERE (bl.brand_id = $1 OR ba.id = $1 OR ba.vufs_brand_id = $1)
            AND bl.deleted_at IS NULL
            ORDER BY bl.name ASC
        `;
        const result = await db.query(query, [brandId]);
        return result.rows.map(row => this.mapRowToBrandLine(row));
    }

    /**
     * Find brand lines by VUFS brand ID
     * Looks up brand_accounts that are linked to the given VUFS brand and returns their lines
     */
    static async findByVufsBrandId(vufsBrandId: string): Promise<BrandLine[]> {
        const query = `
      SELECT DISTINCT bl.* FROM brand_lines bl
      JOIN brand_accounts ba ON bl.brand_id = ba.id
      WHERE ba.vufs_brand_id = $1 AND bl.deleted_at IS NULL
      ORDER BY bl.name ASC
    `;
        const result = await db.query(query, [vufsBrandId]);
        return result.rows.map(row => this.mapRowToBrandLine(row));
    }

    static async update(id: string, data: UpdateBrandLineData): Promise<BrandLine | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.logo !== undefined) { updates.push(`logo = $${paramIndex++}`); values.push(data.logo); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.collabBrandId !== undefined) { updates.push(`collab_brand_id = $${paramIndex++}`); values.push(data.collabBrandId); }
        if (data.designerId !== undefined) { updates.push(`designer_id = $${paramIndex++}`); values.push(data.designerId); }
        if (data.tags !== undefined) { updates.push(`tags = $${paramIndex++}`); values.push(data.tags); }

        if (updates.length === 0) return this.findById(id);

        values.push(id);
        const query = `
        UPDATE brand_lines
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToBrandLine(result.rows[0]) : null;
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE brand_lines SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    private static mapRowToBrandLine(row: any): BrandLine {
        return {
            id: row.id,
            brandId: row.brand_id,
            name: row.name,
            slug: row.slug || undefined,
            logo: row.logo,
            description: row.description,
            collabBrandId: row.collab_brand_id,
            designerId: row.designer_id,
            tags: row.tags,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    }
}
