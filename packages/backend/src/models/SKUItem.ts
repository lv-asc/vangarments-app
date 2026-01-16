import { db } from '../database/connection';
import { CategoryHierarchy } from '@vangarments/shared/types/vufs';

export interface SKUItem {
    id: string;
    brandId: string;
    name: string;
    code: string;
    collection?: string;
    line?: string; // Legacy string field
    lineId?: string; // New FK
    lineInfo?: { id: string; name: string; logo?: string }; // Joined info
    category: CategoryHierarchy;
    description?: string;
    materials?: string[];
    images: Array<{
        url: string;
        isPrimary: boolean;
        labelId?: string;
    }>;
    videos?: Array<{
        url: string;
        title?: string;
        labelId?: string;
    }>;
    metadata?: Record<string, any>;
    retailPriceBrl?: number;
    retailPriceUsd?: number;
    retailPriceEur?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    parentSkuId?: string;
    releaseDate?: Date | null;
    careInstructions?: string;
    officialItemLink?: string;
    brand?: {
        name: string;
        logo?: string;
        slug?: string;
    };

}

export interface CreateSKUItemData {
    brandId: string;
    name: string;
    code: string;
    collection?: string;
    line?: string;
    lineId?: string;
    category: CategoryHierarchy;
    description?: string;
    materials?: string[];
    images?: Array<{
        url: string;
        isPrimary: boolean;
        labelId?: string;
    }>;
    videos?: Array<{
        url: string;
        title?: string;
        labelId?: string;
    }>;
    metadata?: Record<string, any>;
    retailPriceBrl?: number;
    retailPriceUsd?: number;
    retailPriceEur?: number;
    parentSkuId?: string;
    releaseDate?: Date;
    careInstructions?: string;
    officialItemLink?: string;
}

export interface UpdateSKUItemData {
    name?: string;
    code?: string;
    collection?: string;
    line?: string;
    lineId?: string;
    category?: CategoryHierarchy;
    description?: string;
    materials?: string[];
    images?: Array<{
        url: string;
        isPrimary: boolean;
        labelId?: string;
    }>;
    videos?: Array<{
        url: string;
        title?: string;
        labelId?: string;
    }>;
    metadata?: Record<string, any>;
    retailPriceBrl?: number;
    retailPriceUsd?: number;
    retailPriceEur?: number;
    releaseDate?: Date | null;
    careInstructions?: string;
    officialItemLink?: string;

}

export class SKUItemModel {
    static async create(data: CreateSKUItemData): Promise<SKUItem> {
        const query = `
            INSERT INTO sku_items(
                brand_id, name, code, collection, line, line_id,
                category, description, materials, images, videos, metadata,
                retail_price_brl, retail_price_usd, retail_price_eur, parent_sku_id, release_date, care_instructions,
                official_item_link
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `;

        const values = [
            data.brandId,
            data.name,
            data.code,
            data.collection,
            data.line,
            data.lineId,
            JSON.stringify(data.category),
            data.description,
            data.materials,
            JSON.stringify(data.images || []),
            JSON.stringify(data.videos || []),
            JSON.stringify(data.metadata || {}),
            data.retailPriceBrl,
            data.retailPriceUsd,
            data.retailPriceEur,
            data.parentSkuId || null,
            data.releaseDate || null,
            data.careInstructions || null,
            data.officialItemLink || null
        ];

        const result = await db.query(query, values);
        return this.mapRowToSKUItem(result.rows[0]);
    }

    static async findById(id: string): Promise<SKUItem | null> {
        const query = `
            SELECT si.*, bl.name as line_name, bl.logo as line_logo,
                   s.name as style_name,
                   p.name as pattern_name,
                   f.name as fit_name,
                   g.name as gender_name,
                   a.name as apparel_name,
                   m.name as material_name
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            LEFT JOIN vufs_attribute_values s ON s.id = NULLIF(si.category->>'styleId', '')::uuid
            LEFT JOIN vufs_patterns p ON p.id = NULLIF(si.category->>'patternId', '')::uuid
            LEFT JOIN vufs_fits f ON f.id = NULLIF(si.category->>'fitId', '')::uuid
            LEFT JOIN vufs_genders g ON g.id = NULLIF(si.category->>'genderId', '')::uuid
            LEFT JOIN vufs_attribute_values a ON a.id = NULLIF(si.category->>'apparelId', '')::uuid
            LEFT JOIN vufs_materials m ON m.id = NULLIF(si.category->>'materialId', '')::uuid
            WHERE si.id = $1 AND si.deleted_at IS NULL
            `;
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToSKUItem(result.rows[0]) : null;
    }

    static async findByBrandId(brandId: string, filters?: {
        collection?: string;
        line?: string; // Search legacy line string
        lineId?: string; // Filter by specific line ID
        search?: string
    }): Promise<SKUItem[]> {
        let query = `
            SELECT si.*, bl.name as line_name, bl.logo as line_logo,
                   s.name as style_name,
                   p.name as pattern_name,
                   f.name as fit_name,
                   g.name as gender_name,
                   a.name as apparel_name,
                   m.name as material_name
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            LEFT JOIN vufs_attribute_values s ON s.id = NULLIF(si.category->>'styleId', '')::uuid
            LEFT JOIN vufs_patterns p ON p.id = NULLIF(si.category->>'patternId', '')::uuid
            LEFT JOIN vufs_fits f ON f.id = NULLIF(si.category->>'fitId', '')::uuid
            LEFT JOIN vufs_genders g ON g.id = NULLIF(si.category->>'genderId', '')::uuid
            LEFT JOIN vufs_attribute_values a ON a.id = NULLIF(si.category->>'apparelId', '')::uuid
            LEFT JOIN vufs_materials m ON m.id = NULLIF(si.category->>'materialId', '')::uuid
            WHERE si.brand_id = $1 AND si.deleted_at IS NULL
        `;
        const values: any[] = [brandId];
        let paramIndex = 2;

        if (filters?.collection) {
            query += ` AND si.collection ILIKE $${paramIndex++} `;
            values.push(`%${filters.collection}%`);
        }

        if (filters?.line) {
            query += ` AND si.line ILIKE $${paramIndex++} `;
            values.push(`%${filters.line}%`);
        }

        if (filters?.lineId) {
            query += ` AND si.line_id = $${paramIndex++} `;
            values.push(filters.lineId);
        }

        if (filters?.search) {
            query += ` AND (si.name ILIKE $${paramIndex} OR si.code ILIKE $${paramIndex} OR bl.name ILIKE $${paramIndex})`;
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ' ORDER BY si.created_at DESC';

        const result = await db.query(query, values);
        return result.rows.map(row => this.mapRowToSKUItem(row));
    }

    static async search(
        queryText: string,
        limit: number = 20,
        offset: number = 0,
        filters?: {
            brandId?: string;
            styleId?: string;
            patternId?: string;
            fitId?: string;
            genderId?: string;
            apparelId?: string;
            materialId?: string;
            lineId?: string;
            collection?: string;
        }
    ): Promise<{ skus: SKUItem[], total: number }> {
        const values: any[] = [`%${queryText}%`, limit, offset];
        let paramIndex = 4;

        let whereClauses = `
            WHERE si.deleted_at IS NULL
            AND (
                si.name ILIKE $1 
                OR si.code ILIKE $1 
                OR si.collection ILIKE $1
                OR ba.brand_info->>'name' ILIKE $1
            )
        `;

        if (filters?.brandId) {
            whereClauses += ` AND si.brand_id = $${paramIndex++}`;
            values.push(filters.brandId);
        }
        if (filters?.styleId) {
            whereClauses += ` AND si.category->>'styleId' = $${paramIndex++}`;
            values.push(filters.styleId);
        }
        if (filters?.patternId) {
            whereClauses += ` AND si.category->>'patternId' = $${paramIndex++}`;
            values.push(filters.patternId);
        }
        if (filters?.fitId) {
            whereClauses += ` AND si.category->>'fitId' = $${paramIndex++}`;
            values.push(filters.fitId);
        }
        if (filters?.genderId) {
            whereClauses += ` AND si.category->>'genderId' = $${paramIndex++}`;
            values.push(filters.genderId);
        }
        if (filters?.apparelId) {
            whereClauses += ` AND si.category->>'apparelId' = $${paramIndex++}`;
            values.push(filters.apparelId);
        }
        if (filters?.materialId) {
            whereClauses += ` AND si.category->>'materialId' = $${paramIndex++}`;
            values.push(filters.materialId);
        }
        if (filters?.lineId) {
            whereClauses += ` AND si.line_id = $${paramIndex++}`;
            values.push(filters.lineId);
        }
        if (filters?.collection) {
            whereClauses += ` AND si.collection = $${paramIndex++}`;
            values.push(filters.collection);
        }

        const query = `
            SELECT si.*, 
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'logo' as brand_logo,
                   ba.brand_info->>'slug' as brand_slug,
                   bl.name as line_name, 
                   bl.logo as line_logo,
                   COUNT(*) OVER() as total_count
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            ${whereClauses}
            ORDER BY si.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, values);

        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const skus = result.rows.map(row => {
            const sku = this.mapRowToSKUItem(row);
            // Attach brand info
            sku.brand = {
                name: row.brand_name,
                logo: row.brand_logo,
                // Adding slug here as it might be useful
            };
            return sku;
        });

        return { skus, total };
    }

    static async update(id: string, data: UpdateSKUItemData): Promise<SKUItem | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++} `); values.push(data.name); }
        if (data.code !== undefined) { updates.push(`code = $${paramIndex++} `); values.push(data.code); }
        if (data.collection !== undefined) { updates.push(`collection = $${paramIndex++} `); values.push(data.collection); }
        if (data.line !== undefined) { updates.push(`line = $${paramIndex++} `); values.push(data.line); }
        if (data.lineId !== undefined) { updates.push(`line_id = $${paramIndex++} `); values.push(data.lineId); }
        if (data.category !== undefined) { updates.push(`category = $${paramIndex++} `); values.push(JSON.stringify(data.category)); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++} `); values.push(data.description); }
        if (data.materials !== undefined) { updates.push(`materials = $${paramIndex++} `); values.push(data.materials); }
        if (data.images !== undefined) { updates.push(`images = $${paramIndex++} `); values.push(JSON.stringify(data.images)); }
        if (data.videos !== undefined) { updates.push(`videos = $${paramIndex++} `); values.push(JSON.stringify(data.videos)); }
        if (data.metadata !== undefined) { updates.push(`metadata = $${paramIndex++} `); values.push(JSON.stringify(data.metadata)); }
        if (data.retailPriceBrl !== undefined) { updates.push(`retail_price_brl = $${paramIndex++} `); values.push(data.retailPriceBrl); }
        if (data.retailPriceUsd !== undefined) { updates.push(`retail_price_usd = $${paramIndex++} `); values.push(data.retailPriceUsd); }
        if (data.retailPriceEur !== undefined) { updates.push(`retail_price_eur = $${paramIndex++} `); values.push(data.retailPriceEur); }
        if (data.releaseDate !== undefined) { updates.push(`release_date = $${paramIndex++} `); values.push(data.releaseDate); }
        if (data.careInstructions !== undefined) { updates.push(`care_instructions = $${paramIndex++} `); values.push(data.careInstructions); }
        if (data.officialItemLink !== undefined) { updates.push(`official_item_link = $${paramIndex++} `); values.push(data.officialItemLink); }

        if (updates.length === 0) return this.findById(id);

        values.push(id);
        const query = `
      UPDATE sku_items 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
        RETURNING *
            `;

        const result = await db.query(query, values);
        return this.findById(id); // Re-fetch to get joined data
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'UPDATE sku_items SET deleted_at = NOW() WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    static async restore(id: string): Promise<boolean> {
        const query = 'UPDATE sku_items SET deleted_at = NULL WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    static async permanentDelete(id: string): Promise<boolean> {
        const query = 'DELETE FROM sku_items WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    static async findDeleted(filters?: { brandId?: string; search?: string }, limit = 50, offset = 0): Promise<{ skus: SKUItem[]; total: number }> {
        let query = `
            SELECT si.*,
            ba.brand_info ->> 'name' as brand_name,
            ba.brand_info ->> 'logo' as brand_logo,
            bl.name as line_name,
            bl.logo as line_logo,
            COUNT(*) OVER() as total
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            WHERE si.deleted_at IS NOT NULL
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters?.brandId) {
            query += ` AND si.brand_id = $${paramIndex++} `;
            values.push(filters.brandId);
        }

        if (filters?.search) {
            query += ` AND(si.name ILIKE $${paramIndex} OR si.code ILIKE $${paramIndex})`;
            values.push(`% ${filters.search}% `);
            paramIndex++;
        }

        query += ` ORDER BY si.deleted_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++} `;
        values.push(limit, offset);

        const result = await db.query(query, values);
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total) : 0;

        const skus = result.rows.map(row => ({
            ...this.mapRowToSKUItem(row),
            brand: { name: row.brand_name, logo: row.brand_logo }
        }));

        return { skus, total };
    }

    static async findRelated(brandId: string, excludeSkuId: string, options: {
        collection?: string;
        lineId?: string;
        excludeCollection?: string;
        limit?: number;
    }): Promise<any[]> {
        let query = `
            SELECT si.*, 
                   bl.name as line_name, bl.logo as line_logo,
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'logo' as brand_logo,
                   ba.brand_info->>'slug' as brand_slug
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            WHERE si.brand_id = $1 
            AND si.id != $2 
            AND si.deleted_at IS NULL
            AND si.parent_sku_id IS NULL
        `;
        const values: any[] = [brandId, excludeSkuId];
        let paramIndex = 3;

        if (options.collection) {
            query += ` AND si.collection = $${paramIndex++} `;
            values.push(options.collection);
        }

        if (options.lineId) {
            query += ` AND si.line_id = $${paramIndex++} `;
            values.push(options.lineId);
        }

        if (options.excludeCollection) {
            query += ` AND (si.collection IS NULL OR si.collection != $${paramIndex++}) `;
            values.push(options.excludeCollection);
        }

        query += ` ORDER BY si.created_at DESC LIMIT $${paramIndex++} `;
        values.push(options.limit || 8);

        const result = await db.query(query, values);
        return result.rows.map(row => ({
            ...this.mapRowToSKUItem(row),
            brand: {
                name: row.brand_name,
                logo: row.brand_logo,
                slug: row.brand_slug
            }
        }));
    }

    static async findByIdIncludeDeleted(id: string): Promise<SKUItem | null> {
        const query = `
            SELECT si.*, bl.name as line_name, bl.logo as line_logo
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            WHERE si.id = $1
            `;
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToSKUItem(result.rows[0]) : null;
    }

    private static mapRowToSKUItem(row: any): SKUItem {
        const item: SKUItem = {
            id: row.id,
            brandId: row.brand_id,
            name: row.name,
            code: row.code,
            collection: row.collection,
            line: row.line,
            lineId: row.line_id,
            category: typeof row.category === 'string' ? JSON.parse(row.category) : row.category,
            description: row.description,
            materials: row.materials,
            images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
            videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : row.videos || [],
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
            retailPriceBrl: row.retail_price_brl,
            retailPriceUsd: row.retail_price_usd,
            retailPriceEur: row.retail_price_eur,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            parentSkuId: row.parent_sku_id,
            releaseDate: row.release_date,
            careInstructions: row.care_instructions,
            officialItemLink: row.official_item_link
        };

        if (row.line_name || row.line_logo || row.line_id) {
            item.lineInfo = {
                id: row.line_id,
                name: row.line_name,
                logo: row.line_logo
            };
        }

        return item;
    }
}
