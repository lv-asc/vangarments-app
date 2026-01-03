import { db } from '../database/connection';
import {
    MediaTag,
    TagSourceType,
    TagType,
    CreateMediaTagRequest,
    UpdateMediaTagRequest,
    TaggedContentItem,
    TaggedContentResponse,
    TagSearchResult,
    TaggedEntityInfo,
    TaggedItemInfo,
} from '@vangarments/shared';

export interface CreateMediaTagData extends CreateMediaTagRequest {
    createdBy: string;
}

export class MediaTagModel {
    /**
     * Create a new media tag
     */
    static async create(data: CreateMediaTagData): Promise<MediaTag> {
        const query = `
      INSERT INTO media_tags (
        source_type, source_id, image_url,
        position_x, position_y,
        tag_type, tagged_entity_id, tagged_item_id,
        location_name, location_address, location_lat, location_lng,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

        const values = [
            data.sourceType,
            data.sourceId,
            data.imageUrl,
            data.positionX,
            data.positionY,
            data.tagType,
            data.taggedEntityId || null,
            data.taggedItemId || null,
            data.locationName || null,
            data.locationAddress || null,
            data.locationLat || null,
            data.locationLng || null,
            data.createdBy,
        ];

        const result = await db.query(query, values);
        return this.mapRowToMediaTag(result.rows[0]);
    }

    /**
     * Find a tag by ID
     */
    static async findById(id: string): Promise<MediaTag | null> {
        const query = 'SELECT * FROM media_tags WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToMediaTag(result.rows[0]) : null;
    }

    /**
     * Find all tags for a specific source (lookbook, post, etc.)
     */
    static async findBySource(sourceType: TagSourceType, sourceId: string): Promise<MediaTag[]> {
        const query = `
      SELECT * FROM media_tags
      WHERE source_type = $1 AND source_id = $2
      ORDER BY created_at ASC
    `;
        const result = await db.query(query, [sourceType, sourceId]);

        // Populate entity info for all tags
        const tags = result.rows.map(row => this.mapRowToMediaTag(row));
        return this.populateTagEntities(tags);
    }

    /**
     * Find all tags for a specific image URL within a source
     */
    static async findByImage(sourceType: TagSourceType, sourceId: string, imageUrl: string): Promise<MediaTag[]> {
        const query = `
      SELECT * FROM media_tags
      WHERE source_type = $1 AND source_id = $2 AND image_url = $3
      ORDER BY created_at ASC
    `;
        const result = await db.query(query, [sourceType, sourceId, imageUrl]);

        const tags = result.rows.map(row => this.mapRowToMediaTag(row));
        return this.populateTagEntities(tags);
    }

    /**
     * Find all content where an entity is tagged
     */
    static async findByTaggedEntity(
        tagType: TagType,
        entityId: string,
        limit = 20,
        offset = 0
    ): Promise<{ tags: MediaTag[]; total: number }> {
        const countQuery = `
      SELECT COUNT(*)::int as total
      FROM media_tags
      WHERE tag_type = $1 AND tagged_entity_id = $2 AND is_approved = true
    `;

        const query = `
      SELECT * FROM media_tags
      WHERE tag_type = $1 AND tagged_entity_id = $2 AND is_approved = true
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

        const [countResult, tagsResult] = await Promise.all([
            db.query(countQuery, [tagType, entityId]),
            db.query(query, [tagType, entityId, limit, offset]),
        ]);

        return {
            tags: tagsResult.rows.map(row => this.mapRowToMediaTag(row)),
            total: countResult.rows[0].total,
        };
    }

    /**
     * Find all content where an item is tagged
     */
    static async findByTaggedItem(
        itemId: string,
        limit = 20,
        offset = 0
    ): Promise<{ tags: MediaTag[]; total: number }> {
        const countQuery = `
      SELECT COUNT(*)::int as total
      FROM media_tags
      WHERE tagged_item_id = $1 AND is_approved = true
    `;

        const query = `
      SELECT * FROM media_tags
      WHERE tagged_item_id = $1 AND is_approved = true
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

        const [countResult, tagsResult] = await Promise.all([
            db.query(countQuery, [itemId]),
            db.query(query, [itemId, limit, offset]),
        ]);

        return {
            tags: tagsResult.rows.map(row => this.mapRowToMediaTag(row)),
            total: countResult.rows[0].total,
        };
    }

    /**
     * Get tagged content for an entity with full source details
     */
    static async getTaggedContent(
        tagType: TagType,
        entityId: string,
        page = 1,
        limit = 20
    ): Promise<TaggedContentResponse> {
        const offset = (page - 1) * limit;

        // Get tags for this entity
        const { tags, total } = await this.findByTaggedEntity(tagType, entityId, limit, offset);

        // Build content items with source details
        const items: TaggedContentItem[] = [];

        for (const tag of tags) {
            let source: TaggedContentItem['source'] | null = null;

            if (tag.sourceType === 'lookbook_image') {
                // Get lookbook info
                const lookbookQuery = `
          SELECT lb.id, lb.name, lb.brand_id, ba.brand_info
          FROM brand_lookbooks lb
          LEFT JOIN brand_accounts ba ON lb.brand_id = ba.id
          WHERE lb.id = $1
        `;
                const result = await db.query(lookbookQuery, [tag.sourceId]);
                if (result.rows.length > 0) {
                    const lb = result.rows[0];
                    const brandInfo = lb.brand_info || {};
                    source = {
                        type: tag.sourceType,
                        id: tag.sourceId,
                        imageUrl: tag.imageUrl,
                        title: lb.name,
                        owner: {
                            id: lb.brand_id,
                            name: brandInfo.name || 'Unknown Brand',
                            imageUrl: brandInfo.logo,
                            type: 'brand',
                        },
                    };
                }
            } else if (tag.sourceType === 'post_image') {
                // Get post info
                const postQuery = `
          SELECT sp.id, sp.content, sp.user_id, u.profile
          FROM social_posts sp
          LEFT JOIN users u ON sp.user_id = u.id
          WHERE sp.id = $1
        `;
                const result = await db.query(postQuery, [tag.sourceId]);
                if (result.rows.length > 0) {
                    const post = result.rows[0];
                    const content = post.content || {};
                    const profile = post.profile || {};
                    source = {
                        type: tag.sourceType,
                        id: tag.sourceId,
                        imageUrl: tag.imageUrl,
                        title: content.title,
                        owner: {
                            id: post.user_id,
                            name: profile.name || 'Unknown User',
                            imageUrl: profile.profilePicture,
                            type: 'user',
                        },
                    };
                }
            } else if (tag.sourceType === 'wardrobe_image') {
                // Get wardrobe item info
                const itemQuery = `
          SELECT vi.id, vi.metadata, vi.owner_id, u.profile
          FROM vufs_items vi
          LEFT JOIN users u ON vi.owner_id = u.id
          WHERE vi.id = $1
        `;
                const result = await db.query(itemQuery, [tag.sourceId]);
                if (result.rows.length > 0) {
                    const item = result.rows[0];
                    const metadata = item.metadata || {};
                    const profile = item.profile || {};
                    source = {
                        type: tag.sourceType,
                        id: tag.sourceId,
                        imageUrl: tag.imageUrl,
                        title: metadata.name,
                        owner: {
                            id: item.owner_id,
                            name: profile.name || 'Unknown User',
                            imageUrl: profile.profilePicture,
                            type: 'user',
                        },
                    };
                }
            }

            if (source) {
                items.push({ tag, source });
            }
        }

        return {
            items,
            total,
            page,
            limit,
            hasMore: offset + items.length < total,
        };
    }

    /**
     * Update a tag's position or approval status
     */
    static async update(id: string, updates: UpdateMediaTagRequest): Promise<MediaTag | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.positionX !== undefined) {
            setClause.push(`position_x = $${paramIndex++}`);
            values.push(updates.positionX);
        }
        if (updates.positionY !== undefined) {
            setClause.push(`position_y = $${paramIndex++}`);
            values.push(updates.positionY);
        }
        if (updates.isApproved !== undefined) {
            setClause.push(`is_approved = $${paramIndex++}`);
            values.push(updates.isApproved);
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        setClause.push('updated_at = NOW()');
        values.push(id);

        const query = `
      UPDATE media_tags
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToMediaTag(result.rows[0]) : null;
    }

    /**
     * Delete a tag
     */
    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM media_tags WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Delete all tags for a source
     */
    static async deleteBySource(sourceType: TagSourceType, sourceId: string): Promise<number> {
        const query = 'DELETE FROM media_tags WHERE source_type = $1 AND source_id = $2';
        const result = await db.query(query, [sourceType, sourceId]);
        return result.rowCount || 0;
    }

    /**
     * Search for taggable entities
     */
    static async searchEntities(
        query: string,
        types: TagType[] = ['user', 'brand', 'store', 'page', 'supplier'],
        limit = 10
    ): Promise<TagSearchResult[]> {
        const results: TagSearchResult[] = [];
        const searchPattern = `%${query.toLowerCase()}%`;

        // Search users
        if (types.includes('user')) {
            const userQuery = `
        SELECT id, username, profile
        FROM users
        WHERE status = 'active'
          AND (LOWER(profile->>'name') LIKE $1 OR LOWER(username) LIKE $1)
        ORDER BY 
          CASE WHEN LOWER(username) = $2 THEN 0 ELSE 1 END,
          CASE WHEN LOWER(profile->>'name') LIKE $3 THEN 0 ELSE 1 END
        LIMIT $4
      `;
            const userResult = await db.query(userQuery, [searchPattern, query.toLowerCase(), `${query.toLowerCase()}%`, limit]);
            for (const row of userResult.rows) {
                const profile = row.profile || {};
                results.push({
                    id: row.id,
                    type: 'user',
                    name: profile.name || row.username,
                    slug: row.username,
                    imageUrl: profile.profilePicture,
                    subtitle: `@${row.username}`,
                });
            }
        }

        // Search brands
        if (types.includes('brand')) {
            const brandQuery = `
        SELECT id, brand_info, (brand_info->>'slug') as slug
        FROM brand_accounts
        WHERE deleted_at IS NULL
          AND LOWER(brand_info->>'name') LIKE $1
        ORDER BY CASE WHEN LOWER(brand_info->>'name') LIKE $2 THEN 0 ELSE 1 END
        LIMIT $3
      `;
            const brandResult = await db.query(brandQuery, [searchPattern, `${query.toLowerCase()}%`, limit]);
            for (const row of brandResult.rows) {
                const brandInfo = row.brand_info || {};
                results.push({
                    id: row.id,
                    type: 'brand',
                    name: brandInfo.name || 'Unknown Brand',
                    slug: row.slug,
                    imageUrl: brandInfo.logo,
                    subtitle: 'Brand',
                });
            }
        }

        // Search stores
        if (types.includes('store')) {
            const storeQuery = `
        SELECT id, name, slug
        FROM stores
        WHERE deleted_at IS NULL AND LOWER(name) LIKE $1
        ORDER BY CASE WHEN LOWER(name) LIKE $2 THEN 0 ELSE 1 END
        LIMIT $3
      `;
            const storeResult = await db.query(storeQuery, [searchPattern, `${query.toLowerCase()}%`, limit]);
            for (const row of storeResult.rows) {
                results.push({
                    id: row.id,
                    type: 'store',
                    name: row.name,
                    slug: row.slug,
                    subtitle: 'Store',
                });
            }
        }

        // Search pages
        if (types.includes('page')) {
            const pageQuery = `
        SELECT id, name, slug, logo_url
        FROM pages
        WHERE deleted_at IS NULL AND LOWER(name) LIKE $1
        ORDER BY CASE WHEN LOWER(name) LIKE $2 THEN 0 ELSE 1 END
        LIMIT $3
      `;
            const pageResult = await db.query(pageQuery, [searchPattern, `${query.toLowerCase()}%`, limit]);
            for (const row of pageResult.rows) {
                results.push({
                    id: row.id,
                    type: 'page',
                    name: row.name,
                    slug: row.slug,
                    imageUrl: row.logo_url,
                    subtitle: 'Page',
                });
            }
        }

        // Search suppliers
        if (types.includes('supplier')) {
            const supplierQuery = `
        SELECT id, name, slug
        FROM suppliers
        WHERE deleted_at IS NULL AND LOWER(name) LIKE $1
        ORDER BY CASE WHEN LOWER(name) LIKE $2 THEN 0 ELSE 1 END
        LIMIT $3
      `;
            const supplierResult = await db.query(supplierQuery, [searchPattern, `${query.toLowerCase()}%`, limit]);
            for (const row of supplierResult.rows) {
                results.push({
                    id: row.id,
                    type: 'supplier',
                    name: row.name,
                    slug: row.slug,
                    subtitle: 'Supplier',
                });
            }
        }

        // Sort combined results by relevance and limit
        return results
            .sort((a, b) => {
                const aExact = a.name.toLowerCase() === query.toLowerCase() ? 0 : 1;
                const bExact = b.name.toLowerCase() === query.toLowerCase() ? 0 : 1;
                return aExact - bExact;
            })
            .slice(0, limit);
    }

    /**
     * Search for items to tag
     */
    static async searchItems(query: string, limit = 10): Promise<TagSearchResult[]> {
        const searchPattern = `%${query.toLowerCase()}%`;

        const itemQuery = `
      SELECT vi.id, vi.metadata, vi.brand_hierarchy,
             (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image
      FROM vufs_items vi
      WHERE LOWER(vi.metadata->>'name') LIKE $1
         OR LOWER(vi.brand_hierarchy->>'brand') LIKE $1
      ORDER BY CASE WHEN LOWER(vi.metadata->>'name') LIKE $2 THEN 0 ELSE 1 END
      LIMIT $3
    `;

        const result = await db.query(itemQuery, [searchPattern, `${query.toLowerCase()}%`, limit]);

        return result.rows.map(row => {
            const metadata = row.metadata || {};
            const brandHierarchy = row.brand_hierarchy || {};
            return {
                id: row.id,
                type: 'item' as TagType,
                name: metadata.name || 'Unnamed Item',
                imageUrl: row.primary_image,
                subtitle: brandHierarchy.brand || 'Unknown Brand',
            };
        });
    }

    /**
     * Populate entity information for tags
     */
    private static async populateTagEntities(tags: MediaTag[]): Promise<MediaTag[]> {
        for (const tag of tags) {
            if (tag.tagType === 'location') {
                // Location tags already have all info
                continue;
            }

            if (tag.tagType === 'item' && tag.taggedItemId) {
                // Get item info
                const itemQuery = `
          SELECT vi.id, vi.metadata, vi.brand_hierarchy,
                 (SELECT image_url FROM item_images ii WHERE ii.item_id = vi.id AND ii.is_primary = true LIMIT 1) as primary_image
          FROM vufs_items vi
          WHERE vi.id = $1
        `;
                const result = await db.query(itemQuery, [tag.taggedItemId]);
                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    const metadata = row.metadata || {};
                    const brandHierarchy = row.brand_hierarchy || {};
                    tag.taggedItem = {
                        id: row.id,
                        name: metadata.name || 'Unnamed Item',
                        imageUrl: row.primary_image,
                        brandName: brandHierarchy.brand,
                    };
                }
            } else if (tag.taggedEntityId) {
                // Get entity info based on type
                let entityInfo: TaggedEntityInfo | undefined;

                if (tag.tagType === 'user') {
                    const query = 'SELECT id, username, profile FROM users WHERE id = $1';
                    const result = await db.query(query, [tag.taggedEntityId]);
                    if (result.rows.length > 0) {
                        const row = result.rows[0];
                        const profile = row.profile || {};
                        entityInfo = {
                            id: row.id,
                            type: 'user',
                            name: profile.name || row.username,
                            slug: row.username,
                            imageUrl: profile.profilePicture,
                        };
                    }
                } else if (tag.tagType === 'brand') {
                    const query = 'SELECT id, brand_info FROM brand_accounts WHERE id = $1';
                    const result = await db.query(query, [tag.taggedEntityId]);
                    if (result.rows.length > 0) {
                        const row = result.rows[0];
                        const brandInfo = row.brand_info || {};
                        entityInfo = {
                            id: row.id,
                            type: 'brand',
                            name: brandInfo.name || 'Unknown Brand',
                            slug: brandInfo.slug,
                            imageUrl: brandInfo.logo,
                        };
                    }
                } else if (tag.tagType === 'store') {
                    const query = 'SELECT id, name, slug FROM stores WHERE id = $1';
                    const result = await db.query(query, [tag.taggedEntityId]);
                    if (result.rows.length > 0) {
                        const row = result.rows[0];
                        entityInfo = {
                            id: row.id,
                            type: 'store',
                            name: row.name,
                            slug: row.slug,
                        };
                    }
                } else if (tag.tagType === 'page') {
                    const query = 'SELECT id, name, slug, logo_url FROM pages WHERE id = $1';
                    const result = await db.query(query, [tag.taggedEntityId]);
                    if (result.rows.length > 0) {
                        const row = result.rows[0];
                        entityInfo = {
                            id: row.id,
                            type: 'page',
                            name: row.name,
                            slug: row.slug,
                            imageUrl: row.logo_url,
                        };
                    }
                } else if (tag.tagType === 'supplier') {
                    const query = 'SELECT id, name, slug FROM suppliers WHERE id = $1';
                    const result = await db.query(query, [tag.taggedEntityId]);
                    if (result.rows.length > 0) {
                        const row = result.rows[0];
                        entityInfo = {
                            id: row.id,
                            type: 'supplier',
                            name: row.name,
                            slug: row.slug,
                        };
                    }
                }

                if (entityInfo) {
                    tag.taggedEntity = entityInfo;
                }
            }
        }

        return tags;
    }

    /**
     * Map database row to MediaTag object
     */
    private static mapRowToMediaTag(row: any): MediaTag {
        return {
            id: row.id,
            sourceType: row.source_type,
            sourceId: row.source_id,
            imageUrl: row.image_url,
            positionX: parseFloat(row.position_x),
            positionY: parseFloat(row.position_y),
            tagType: row.tag_type,
            taggedEntityId: row.tagged_entity_id || undefined,
            taggedItemId: row.tagged_item_id || undefined,
            locationName: row.location_name || undefined,
            locationAddress: row.location_address || undefined,
            locationLat: row.location_lat ? parseFloat(row.location_lat) : undefined,
            locationLng: row.location_lng ? parseFloat(row.location_lng) : undefined,
            createdBy: row.created_by,
            isApproved: row.is_approved,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
