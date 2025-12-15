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
    }>;
    videos?: Array<{
        url: string;
        title?: string;
    }>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
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
    }>;
    videos?: Array<{
        url: string;
        title?: string;
    }>;
    metadata?: Record<string, any>;
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
    }>;
    videos?: Array<{
        url: string;
        title?: string;
    }>;
    metadata?: Record<string, any>;
}

export class SKUItemModel {
    static async create(data: CreateSKUItemData): Promise<SKUItem> {
        const query = `
      INSERT INTO sku_items (
        brand_id, name, code, collection, line, line_id,
        category, description, materials, images, videos, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
            JSON.stringify(data.metadata || {})
        ];

        const result = await db.query(query, values);
        return this.mapRowToSKUItem(result.rows[0]);
    }

    static async findById(id: string): Promise<SKUItem | null> {
        const query = `
            SELECT si.*, bl.name as line_name, bl.logo as line_logo
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
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
            SELECT si.*, bl.name as line_name, bl.logo as line_logo
            FROM sku_items si
            LEFT JOIN brand_lines bl ON si.line_id = bl.id
            WHERE si.brand_id = $1 AND si.deleted_at IS NULL
        `;
        const values: any[] = [brandId];
        let paramIndex = 2;

        if (filters?.collection) {
            query += ` AND si.collection ILIKE $${paramIndex++}`;
            values.push(`%${filters.collection}%`);
        }

        if (filters?.line) {
            query += ` AND si.line ILIKE $${paramIndex++}`;
            values.push(`%${filters.line}%`);
        }

        if (filters?.lineId) {
            query += ` AND si.line_id = $${paramIndex++}`;
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

    static async update(id: string, data: UpdateSKUItemData): Promise<SKUItem | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.code !== undefined) { updates.push(`code = $${paramIndex++}`); values.push(data.code); }
        if (data.collection !== undefined) { updates.push(`collection = $${paramIndex++}`); values.push(data.collection); }
        if (data.line !== undefined) { updates.push(`line = $${paramIndex++}`); values.push(data.line); }
        if (data.lineId !== undefined) { updates.push(`line_id = $${paramIndex++}`); values.push(data.lineId); }
        if (data.category !== undefined) { updates.push(`category = $${paramIndex++}`); values.push(JSON.stringify(data.category)); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.materials !== undefined) { updates.push(`materials = $${paramIndex++}`); values.push(data.materials); }
        if (data.images !== undefined) { updates.push(`images = $${paramIndex++}`); values.push(JSON.stringify(data.images)); }
        if (data.videos !== undefined) { updates.push(`videos = $${paramIndex++}`); values.push(JSON.stringify(data.videos)); }
        if (data.metadata !== undefined) { updates.push(`metadata = $${paramIndex++}`); values.push(JSON.stringify(data.metadata)); }

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
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
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
