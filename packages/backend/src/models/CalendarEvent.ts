import { db } from '../database/connection';

export type CalendarEventType = string;

export interface CalendarEvent {
    id: string;
    eventType: CalendarEventType;
    title: string;
    description?: string;
    eventDate: Date;
    eventTime?: string;
    endDate?: Date;
    skuItemId?: string;
    brandId?: string;
    collectionId?: string;
    location?: string;
    imageUrl?: string; // Kept for backward compatibility
    images: Array<{
        url: string;
        isPrimary: boolean;
        labelId?: string;
    }>;
    videos: Array<{
        url: string;
        title?: string;
        labelId?: string;
    }>;
    attachments: Array<{
        url: string;
        name: string;
        type: string;
    }>;
    taggedEntities: Array<{
        type: 'user' | 'brand' | 'store' | 'page' | 'supplier' | 'item' | 'location' | 'non_profit';
        id: string;
        name?: string;
        logoUrl?: string;
        slug?: string;
    }>;
    externalUrl?: string;
    isFeatured: boolean;
    isPublished: boolean;
    region: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    // Joined data
    skuItem?: any;
    brand?: any;
    collection?: any;
}

export interface CreateCalendarEventData {
    eventType: CalendarEventType;
    title: string;
    description?: string;
    eventDate: Date;
    eventTime?: string;
    endDate?: Date;
    skuItemId?: string;
    brandId?: string;
    collectionId?: string;
    location?: string;
    imageUrl?: string;
    externalUrl?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    region?: string;
    createdBy?: string;
    images?: Array<{ url: string; isPrimary: boolean; labelId?: string }>;
    videos?: Array<{ url: string; title?: string; labelId?: string }>;
    attachments?: Array<{ url: string; name: string; type: string }>;
    taggedEntities?: Array<{ type: string; id: string; name?: string; logoUrl?: string; slug?: string }>;
}

export interface UpdateCalendarEventData {
    eventType?: CalendarEventType;
    title?: string;
    description?: string;
    eventDate?: Date;
    eventTime?: string;
    endDate?: Date;
    skuItemId?: string;
    brandId?: string;
    collectionId?: string;
    location?: string;
    imageUrl?: string;
    externalUrl?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    region?: string;
    images?: Array<{ url: string; isPrimary: boolean; labelId?: string }>;
    videos?: Array<{ url: string; title?: string; labelId?: string }>;
    attachments?: Array<{ url: string; name: string; type: string }>;
    taggedEntities?: Array<{ type: string; id: string; name?: string; logoUrl?: string; slug?: string }>;
}

export interface CalendarEventFilters {
    year?: number;
    month?: number; // 1-12
    eventType?: CalendarEventType;
    brandId?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    region?: string;
    entityId?: string;
    entityType?: string;
}

export interface CalendarEventTypeRecord {
    id: string;
    value: string;
    label: string;
    icon: string;
    color?: string;
    is_system: boolean;
    created_at: Date;
    updated_at: Date;
}

export const CalendarEventModel = {
    async create(data: CreateCalendarEventData): Promise<CalendarEvent> {
        const result = await db.query(
            `INSERT INTO calendar_events (
                event_type, title, description, event_date, event_time, end_date,
                sku_item_id, brand_id, collection_id, location, image_url,
                images, videos, attachments, tagged_entities,
                external_url, is_featured, is_published, created_by,
                region
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
            [
                data.eventType,
                data.title,
                data.description || null,
                data.eventDate,
                data.eventTime || null,
                data.endDate || null,
                data.skuItemId || null,
                data.brandId || null,
                data.collectionId || null,
                data.location || null,
                data.imageUrl || null,
                JSON.stringify(data.images || []),
                JSON.stringify(data.videos || []),
                JSON.stringify(data.attachments || []),
                JSON.stringify(data.taggedEntities || []),
                data.externalUrl || null,
                data.isFeatured ?? false,
                data.isPublished ?? true,
                data.createdBy || null,
                data.region || 'Global'
            ]
        );
        return await this.mapRowToEvent(result.rows[0]);
    },

    async findById(id: string): Promise<CalendarEvent | null> {
        const result = await db.query(
            `SELECT ce.*,
        row_to_json(s.*) as sku_item,
        row_to_json(b.*) as brand,
        row_to_json(c.*) as collection
      FROM calendar_events ce
      LEFT JOIN sku_items s ON ce.sku_item_id = s.id
      LEFT JOIN brand_accounts b ON ce.brand_id = b.id
      LEFT JOIN brand_collections c ON ce.collection_id = c.id
      WHERE ce.id = $1`,
            [id]
        );
        return result.rows[0] ? await this.mapRowToEvent(result.rows[0]) : null;
    },

    async findByMonth(year: number, month?: number, filters: CalendarEventFilters = {}): Promise<CalendarEvent[]> {
        let query = `
      SELECT ce.*,
        row_to_json(s.*) as sku_item,
        row_to_json(b.*) as brand,
        row_to_json(c.*) as collection
      FROM calendar_events ce
      LEFT JOIN sku_items s ON ce.sku_item_id = s.id
      LEFT JOIN brand_accounts b ON ce.brand_id = b.id
      LEFT JOIN brand_collections c ON ce.collection_id = c.id
      WHERE EXTRACT(YEAR FROM ce.event_date) = $1
    `;
        const params: any[] = [year];
        let paramIndex = 2;

        if (month && month >= 1 && month <= 12) {
            query += ` AND EXTRACT(MONTH FROM ce.event_date) = $${paramIndex}`;
            params.push(month);
            paramIndex++;
        }

        if (filters.eventType) {
            query += ` AND ce.event_type = $${paramIndex}`;
            params.push(filters.eventType);
            paramIndex++;
        }

        if (filters.brandId) {
            query += ` AND ce.brand_id = $${paramIndex}`;
            params.push(filters.brandId);
            paramIndex++;
        }

        if (filters.isFeatured !== undefined) {
            query += ` AND ce.is_featured = $${paramIndex}`;
            params.push(filters.isFeatured);
            paramIndex++;
        }

        if (filters.isPublished !== undefined) {
            query += ` AND ce.is_published = $${paramIndex}`;
            params.push(filters.isPublished);
            paramIndex++;
        }
        if (filters.region) {
            query += ` AND ce.region = $${paramIndex}`;
            params.push(filters.region);
            paramIndex++;
        }

        if (filters.entityId && filters.entityType) {
            query += ` AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(ce.tagged_entities) AS entity
                WHERE entity->>'id' = $${paramIndex} AND entity->>'type' = $${paramIndex + 1}
            )`;
            params.push(filters.entityId);
            params.push(filters.entityType);
            paramIndex += 2;
        }

        query += ` ORDER BY ce.event_date ASC, ce.event_time ASC NULLS LAST`;

        const result = await db.query(query, params);
        return Promise.all(result.rows.map(row => this.mapRowToEvent(row)));
    },

    async findByDateRange(startDate: Date, endDate: Date, filters: CalendarEventFilters = {}): Promise<CalendarEvent[]> {
        let query = `
      SELECT ce.*,
        row_to_json(s.*) as sku_item,
        row_to_json(b.*) as brand,
        row_to_json(c.*) as collection
      FROM calendar_events ce
      LEFT JOIN sku_items s ON ce.sku_item_id = s.id
      LEFT JOIN brand_accounts b ON ce.brand_id = b.id
      LEFT JOIN brand_collections c ON ce.collection_id = c.id
      WHERE ce.event_date >= $1 AND ce.event_date <= $2
    `;
        const params: any[] = [startDate, endDate];
        let paramIndex = 3;

        if (filters.eventType) {
            query += ` AND ce.event_type = $${paramIndex}`;
            params.push(filters.eventType);
            paramIndex++;
        }

        if (filters.brandId) {
            query += ` AND ce.brand_id = $${paramIndex}`;
            params.push(filters.brandId);
            paramIndex++;
        }

        if (filters.isPublished !== undefined) {
            query += ` AND ce.is_published = $${paramIndex}`;
            params.push(filters.isPublished);
            paramIndex++;
        }

        query += ` ORDER BY ce.event_date ASC, ce.event_time ASC NULLS LAST`;

        const result = await db.query(query, params);
        return Promise.all(result.rows.map(row => this.mapRowToEvent(row)));
    },

    async findByType(eventType: CalendarEventType, limit = 50): Promise<CalendarEvent[]> {
        const result = await db.query(
            `SELECT ce.*,
        row_to_json(s.*) as sku_item,
        row_to_json(b.*) as brand,
        row_to_json(c.*) as collection
      FROM calendar_events ce
      LEFT JOIN sku_items s ON ce.sku_item_id = s.id
      LEFT JOIN brand_accounts b ON ce.brand_id = b.id
      LEFT JOIN brand_collections c ON ce.collection_id = c.id
      WHERE ce.event_type = $1 AND ce.is_published = true
      ORDER BY ce.event_date ASC
      LIMIT $2`,
            [eventType, limit]
        );
        return Promise.all(result.rows.map(row => this.mapRowToEvent(row)));
    },

    async update(id: string, data: UpdateCalendarEventData): Promise<CalendarEvent | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.eventType !== undefined) {
            updates.push(`event_type = $${paramIndex++}`);
            values.push(data.eventType);
        }
        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.eventDate !== undefined) {
            updates.push(`event_date = $${paramIndex++}`);
            values.push(data.eventDate);
        }
        if (data.eventTime !== undefined) {
            updates.push(`event_time = $${paramIndex++}`);
            values.push(data.eventTime);
        }
        if (data.endDate !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            values.push(data.endDate);
        }
        if (data.skuItemId !== undefined) {
            updates.push(`sku_item_id = $${paramIndex++}`);
            values.push(data.skuItemId);
        }
        if (data.brandId !== undefined) {
            updates.push(`brand_id = $${paramIndex++}`);
            values.push(data.brandId);
        }
        if (data.collectionId !== undefined) {
            updates.push(`collection_id = $${paramIndex++}`);
            values.push(data.collectionId);
        }
        if (data.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(data.location);
        }
        if (data.imageUrl !== undefined) {
            updates.push(`image_url = $${paramIndex++}`);
            values.push(data.imageUrl);
        }
        if (data.images !== undefined) {
            updates.push(`images = $${paramIndex++}`);
            values.push(JSON.stringify(data.images));
        }
        if (data.videos !== undefined) {
            updates.push(`videos = $${paramIndex++}`);
            values.push(JSON.stringify(data.videos));
        }
        if (data.attachments !== undefined) {
            updates.push(`attachments = $${paramIndex++}`);
            values.push(JSON.stringify(data.attachments));
        }
        if (data.taggedEntities !== undefined) {
            updates.push(`tagged_entities = $${paramIndex++}`);
            values.push(JSON.stringify(data.taggedEntities));
        }
        if (data.externalUrl !== undefined) {
            updates.push(`external_url = $${paramIndex++}`);
            values.push(data.externalUrl);
        }
        if (data.isFeatured !== undefined) {
            updates.push(`is_featured = $${paramIndex++}`);
            values.push(data.isFeatured);
        }
        if (data.isPublished !== undefined) {
            updates.push(`is_published = $${paramIndex++}`);
            values.push(data.isPublished);
        }
        if (data.region !== undefined) {
            updates.push(`region = $${paramIndex++}`);
            values.push(data.region);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await db.query(
            `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0] ? this.mapRowToEvent(result.rows[0]) : null;
    },

    async delete(id: string): Promise<boolean> {
        const result = await db.query('DELETE FROM calendar_events WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    },

    async getAvailableYears(): Promise<number[]> {
        const result = await db.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM event_date)::integer as year
      FROM calendar_events
      WHERE is_published = true
      ORDER BY year DESC
    `);
        return result.rows.map(row => row.year);
    },

    async enrichTaggedEntities(entities: Array<{ type: string; id: string; name?: string; logoUrl?: string; slug?: string }>): Promise<Array<{ type: 'user' | 'brand' | 'store' | 'page' | 'supplier' | 'item' | 'location' | 'non_profit'; id: string; name?: string; logoUrl?: string; slug?: string }>> {
        if (!entities || entities.length === 0) return [] as any;

        // Group entities by type
        const byType: Record<string, string[]> = {};
        entities.forEach(entity => {
            if (!byType[entity.type]) byType[entity.type] = [];
            byType[entity.type].push(entity.id);
        });

        // Fetch logos and slugs for each type
        const logoMap: Record<string, string> = {};
        const slugMap: Record<string, string> = {};

        // Brand and Non-Profit - check both brand_accounts.id and vufs_brand_id
        const brandIds = [...(byType.brand || []), ...(byType.non_profit || [])];
        if (brandIds.length > 0) {
            const result = await db.query(
                `SELECT 
                    COALESCE(ba.vufs_brand_id::text, ba.id::text) as entity_id,
                    ba.brand_info->>'logo' as logo,
                    ba.brand_info->>'slug' as slug
                FROM brand_accounts ba 
                WHERE ba.id = ANY($1) OR ba.vufs_brand_id = ANY($1::uuid[])`,
                [brandIds]
            );
            result.rows.forEach(row => {
                if (row.logo && row.entity_id) logoMap[row.entity_id] = row.logo;
                if (row.slug && row.entity_id) slugMap[row.entity_id] = row.slug;
            });
        }

        // User profile pictures and usernames
        if (byType.user?.length > 0) {
            const result = await db.query(
                `SELECT id, username as slug, profile->>'avatarUrl' as logo FROM users WHERE id = ANY($1)`,
                [byType.user]
            );
            result.rows.forEach(row => {
                if (row.logo) logoMap[row.id] = row.logo;
                if (row.slug) slugMap[row.id] = row.slug;
            });
        }

        // Store logos and slugs
        if (byType.store?.length > 0) {
            const result = await db.query(
                `SELECT 
                    COALESCE(s.vufs_store_id::text, s.id::text) as entity_id,
                    s.logo_url as logo,
                    s.slug
                FROM stores s 
                WHERE s.id = ANY($1) OR s.vufs_store_id = ANY($1::uuid[])`,
                [byType.store]
            );
            result.rows.forEach(row => {
                if (row.logo && row.entity_id) logoMap[row.entity_id] = row.logo;
                if (row.slug && row.entity_id) slugMap[row.entity_id] = row.slug;
            });
        }

        // Supplier logos and slugs
        if (byType.supplier?.length > 0) {
            const result = await db.query(
                `SELECT 
                    COALESCE(s.vufs_supplier_id::text, s.id::text) as entity_id,
                    s.logo_url as logo,
                    s.slug
                FROM suppliers s 
                WHERE s.id = ANY($1) OR s.vufs_supplier_id = ANY($1::uuid[])`,
                [byType.supplier]
            );
            result.rows.forEach(row => {
                if (row.logo && row.entity_id) logoMap[row.entity_id] = row.logo;
                if (row.slug && row.entity_id) slugMap[row.entity_id] = row.slug;
            });
        }

        // Page logos and slugs
        if (byType.page?.length > 0) {
            const result = await db.query(
                `SELECT id, logo_url as logo, slug FROM pages WHERE id = ANY($1)`,
                [byType.page]
            );
            result.rows.forEach(row => {
                if (row.logo) logoMap[row.id] = row.logo;
                if (row.slug) slugMap[row.id] = row.slug;
            });
        }

        // Item images
        if (byType.item?.length > 0) {
            const result = await db.query(
                `SELECT id, images FROM sku_items WHERE id = ANY($1)`,
                [byType.item]
            );
            result.rows.forEach(row => {
                const images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
                const primary = images?.find((img: any) => img.isPrimary)?.url || images?.[0]?.url;
                if (primary) logoMap[row.id] = primary;
            });
        }

        // Enrich entities with logos and slugs
        return entities.map(entity => ({
            ...entity,
            type: entity.type as any,
            logoUrl: entity.logoUrl || logoMap[entity.id] || undefined,
            slug: entity.slug || slugMap[entity.id] || undefined
        }));
    },

    async mapRowToEvent(row: any): Promise<CalendarEvent> {
        const taggedEntities = typeof row.tagged_entities === 'string'
            ? JSON.parse(row.tagged_entities)
            : row.tagged_entities || [];

        const enrichedEntities = await this.enrichTaggedEntities(taggedEntities);

        return {
            id: row.id,
            eventType: row.event_type,
            title: row.title,
            description: row.description,
            eventDate: new Date(row.event_date),
            eventTime: row.event_time,
            endDate: row.end_date ? new Date(row.end_date) : undefined,
            skuItemId: row.sku_item_id,
            brandId: row.brand_id,
            collectionId: row.collection_id,
            location: row.location,
            imageUrl: row.image_url,
            images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
            videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : row.videos || [],
            attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments || [],
            taggedEntities: enrichedEntities,
            externalUrl: row.external_url,
            isFeatured: row.is_featured,
            isPublished: row.is_published,
            region: row.region || 'Global',
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            skuItem: row.sku_item?.id ? row.sku_item : undefined,
            brand: row.brand?.id ? row.brand : undefined,
            collection: row.collection?.id ? row.collection : undefined,
        };
    }
};

export const CalendarEventTypeModel = {
    async findAll(): Promise<CalendarEventTypeRecord[]> {
        const result = await db.query('SELECT * FROM calendar_event_types ORDER BY label ASC');
        return result.rows;
    },

    async findByValue(value: string): Promise<CalendarEventTypeRecord | null> {
        const result = await db.query('SELECT * FROM calendar_event_types WHERE value = $1', [value]);
        return result.rows[0] || null;
    },

    async create(data: Partial<CalendarEventTypeRecord>): Promise<CalendarEventTypeRecord> {
        const result = await db.query(
            'INSERT INTO calendar_event_types (value, label, icon, color, is_system) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data.value, data.label, data.icon, data.color, data.is_system ?? false]
        );
        return result.rows[0];
    },

    async update(id: string, data: Partial<CalendarEventTypeRecord>): Promise<CalendarEventTypeRecord | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.value !== undefined) {
            updates.push(`value = $${paramIndex++}`);
            values.push(data.value);
        }
        if (data.label !== undefined) {
            updates.push(`label = $${paramIndex++}`);
            values.push(data.label);
        }
        if (data.icon !== undefined) {
            updates.push(`icon = $${paramIndex++}`);
            values.push(data.icon);
        }
        if (data.color !== undefined) {
            updates.push(`color = $${paramIndex++}`);
            values.push(data.color);
        }

        if (updates.length === 0) return null;

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await db.query(
            `UPDATE calendar_event_types SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },

    async delete(id: string): Promise<boolean> {
        const result = await db.query('DELETE FROM calendar_event_types WHERE id = $1 AND is_system = false', [id]);
        return (result.rowCount ?? 0) > 0;
    }
};
