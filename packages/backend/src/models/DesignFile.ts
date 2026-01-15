import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

// =====================================================
// Design File Types and Interfaces
// =====================================================

export interface DesignFile {
    id: string;
    ownerId: string;
    brandId?: string;
    filename: string;
    originalFilename: string;
    fileType: 'vector' | '3d_model' | 'raster' | 'sketch' | 'mockup';
    mimeType: string;
    fileSizeBytes: number;
    gcsPath: string;
    thumbnailPath?: string;
    metadata: Record<string, any>;
    tags: string[];
    visibility: 'private' | 'team' | 'public';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface CreateDesignFileData {
    ownerId: string;
    brandId?: string;
    filename: string;
    originalFilename: string;
    fileType: 'vector' | '3d_model' | 'raster' | 'sketch' | 'mockup';
    mimeType: string;
    fileSizeBytes: number;
    gcsPath: string;
    thumbnailPath?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    visibility?: 'private' | 'team' | 'public';
}

export interface UpdateDesignFileData {
    filename?: string;
    thumbnailPath?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    visibility?: 'private' | 'team' | 'public';
}

export interface DesignFileFilters {
    ownerId?: string;
    brandId?: string;
    fileType?: string;
    visibility?: string;
    tags?: string[];
    search?: string;
}

// =====================================================
// Moodboard Types and Interfaces
// =====================================================

export interface Moodboard {
    id: string;
    ownerId: string;
    ownerUsername?: string;
    brandId?: string;
    title: string;
    slug?: string;
    description?: string;
    coverImage?: string;
    visibility: 'private' | 'team' | 'public';
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
    gridEnabled: boolean;
    snapToGrid: boolean;
    canvasData?: object;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    elements?: MoodboardElement[];
}

export interface CreateMoodboardData {
    ownerId: string;
    brandId?: string;
    title: string;
    slug?: string;
    description?: string;
    coverImage?: string;
    visibility?: 'private' | 'team' | 'public';
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
}

export interface UpdateMoodboardData {
    title?: string;
    description?: string;
    coverImage?: string;
    visibility?: 'private' | 'team' | 'public';
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
    gridEnabled?: boolean;
    snapToGrid?: boolean;
    canvasData?: object;
}

export interface MoodboardElement {
    id: string;
    moodboardId: string;
    elementType: 'image' | 'color' | 'text' | 'fabric' | 'link' | 'design_file' | 'shape';
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    content: Record<string, any>;
    opacity: number;
    borderRadius: number;
    shadow?: Record<string, any>;
    locked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMoodboardElementData {
    moodboardId: string;
    elementType: 'image' | 'color' | 'text' | 'fabric' | 'link' | 'design_file' | 'shape';
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
    rotation?: number;
    zIndex?: number;
    content: Record<string, any>;
    opacity?: number;
    borderRadius?: number;
    shadow?: Record<string, any>;
    locked?: boolean;
}

export interface UpdateMoodboardElementData {
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
    rotation?: number;
    zIndex?: number;
    content?: Record<string, any>;
    opacity?: number;
    borderRadius?: number;
    shadow?: Record<string, any>;
    locked?: boolean;
}

// =====================================================
// Design File Model
// =====================================================

export class DesignFileModel {
    // Create a new design file record
    static async create(data: CreateDesignFileData): Promise<DesignFile> {
        const query = `
            INSERT INTO design_files (
                owner_id, brand_id, filename, original_filename,
                file_type, mime_type, file_size_bytes, gcs_path,
                thumbnail_path, metadata, tags, visibility
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const values = [
            data.ownerId,
            data.brandId || null,
            data.filename,
            data.originalFilename,
            data.fileType,
            data.mimeType,
            data.fileSizeBytes,
            data.gcsPath,
            data.thumbnailPath || null,
            JSON.stringify(data.metadata || {}),
            data.tags || [],
            data.visibility || 'private'
        ];

        const result = await db.query(query, values);
        return this.mapRowToDesignFile(result.rows[0]);
    }

    // Find design file by ID
    static async findById(id: string): Promise<DesignFile | null> {
        const query = `
            SELECT * FROM design_files
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToDesignFile(result.rows[0]) : null;
    }

    // Find design files by owner
    static async findByOwner(
        ownerId: string,
        filters: Omit<DesignFileFilters, 'ownerId'> = {},
        limit = 50,
        offset = 0
    ): Promise<{ files: DesignFile[]; total: number }> {
        const conditions = ['owner_id = $1', 'deleted_at IS NULL'];
        const values: any[] = [ownerId];
        let paramIndex = 2;

        if (filters.brandId) {
            conditions.push(`brand_id = $${paramIndex++}`);
            values.push(filters.brandId);
        }

        if (filters.fileType) {
            conditions.push(`file_type = $${paramIndex++}`);
            values.push(filters.fileType);
        }

        if (filters.visibility) {
            conditions.push(`visibility = $${paramIndex++}`);
            values.push(filters.visibility);
        }

        if (filters.tags && filters.tags.length > 0) {
            conditions.push(`tags && $${paramIndex++}`);
            values.push(filters.tags);
        }

        if (filters.search) {
            conditions.push(`(filename ILIKE $${paramIndex} OR original_filename ILIKE $${paramIndex})`);
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        const whereClause = conditions.join(' AND ');

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM design_files WHERE ${whereClause}`;
        const countResult = await db.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        // Get paginated results
        const query = `
            SELECT * FROM design_files
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        values.push(limit, offset);

        const result = await db.query(query, values);
        const files = result.rows.map(this.mapRowToDesignFile);

        return { files, total };
    }

    // Find design files by brand
    static async findByBrand(
        brandId: string,
        limit = 50,
        offset = 0
    ): Promise<{ files: DesignFile[]; total: number }> {
        const query = `
            SELECT * FROM design_files
            WHERE brand_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const countQuery = `
            SELECT COUNT(*) FROM design_files
            WHERE brand_id = $1 AND deleted_at IS NULL
        `;

        const [result, countResult] = await Promise.all([
            db.query(query, [brandId, limit, offset]),
            db.query(countQuery, [brandId])
        ]);

        return {
            files: result.rows.map(this.mapRowToDesignFile),
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    // Update design file
    static async update(id: string, data: UpdateDesignFileData): Promise<DesignFile | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.filename !== undefined) {
            setClause.push(`filename = $${paramIndex++}`);
            values.push(data.filename);
        }
        if (data.thumbnailPath !== undefined) {
            setClause.push(`thumbnail_path = $${paramIndex++}`);
            values.push(data.thumbnailPath);
        }
        if (data.metadata !== undefined) {
            setClause.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(data.metadata));
        }
        if (data.tags !== undefined) {
            setClause.push(`tags = $${paramIndex++}`);
            values.push(data.tags);
        }
        if (data.visibility !== undefined) {
            setClause.push(`visibility = $${paramIndex++}`);
            values.push(data.visibility);
        }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE design_files
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToDesignFile(result.rows[0]) : null;
    }

    // Soft delete design file
    static async delete(id: string): Promise<boolean> {
        const query = `
            UPDATE design_files
            SET deleted_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Add tags to design file
    static async addTags(id: string, tags: string[]): Promise<DesignFile | null> {
        const query = `
            UPDATE design_files
            SET tags = array_cat(tags, $2), updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await db.query(query, [id, tags]);
        return result.rows.length > 0 ? this.mapRowToDesignFile(result.rows[0]) : null;
    }

    // Remove tag from design file
    static async removeTag(id: string, tag: string): Promise<DesignFile | null> {
        const query = `
            UPDATE design_files
            SET tags = array_remove(tags, $2), updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await db.query(query, [id, tag]);
        return result.rows.length > 0 ? this.mapRowToDesignFile(result.rows[0]) : null;
    }

    // Map database row to DesignFile interface
    private static mapRowToDesignFile(row: any): DesignFile {
        return {
            id: row.id,
            ownerId: row.owner_id,
            brandId: row.brand_id || undefined,
            filename: row.filename,
            originalFilename: row.original_filename,
            fileType: row.file_type,
            mimeType: row.mime_type,
            fileSizeBytes: parseInt(row.file_size_bytes, 10),
            gcsPath: row.gcs_path,
            thumbnailPath: row.thumbnail_path || undefined,
            metadata: row.metadata || {},
            tags: row.tags || [],
            visibility: row.visibility,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at || undefined
        };
    }
}

// =====================================================
// Moodboard Model
// =====================================================

export class MoodboardModel {
    // Create a new moodboard
    static async create(data: CreateMoodboardData): Promise<Moodboard> {
        const slug = data.slug || slugify(data.title);

        const query = `
            INSERT INTO moodboards (
                owner_id, brand_id, title, slug, description,
                cover_image, visibility, canvas_width, canvas_height,
                background_color
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            data.ownerId,
            data.brandId || null,
            data.title,
            slug,
            data.description || null,
            data.coverImage || null,
            data.visibility || 'private',
            data.canvasWidth || 1920,
            data.canvasHeight || 1080,
            data.backgroundColor || '#FFFFFF'
        ];

        const result = await db.query(query, values);
        return this.mapRowToMoodboard(result.rows[0]);
    }

    // Find moodboard by ID (with elements)
    static async findById(id: string, includeElements = true): Promise<Moodboard | null> {
        const query = `
            SELECT * FROM moodboards
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) return null;

        const moodboard = this.mapRowToMoodboard(result.rows[0]);

        if (includeElements) {
            moodboard.elements = await this.getElements(id);
        }

        return moodboard;
    }

    // Find moodboard by slug
    static async findBySlug(ownerId: string, slug: string): Promise<Moodboard | null> {
        const query = `
            SELECT * FROM moodboards
            WHERE owner_id = $1 AND slug = $2 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [ownerId, slug]);

        if (result.rows.length === 0) return null;

        const moodboard = this.mapRowToMoodboard(result.rows[0]);
        moodboard.elements = await this.getElements(moodboard.id);

        return moodboard;
    }

    // Find moodboards by owner
    static async findByOwner(
        ownerId: string,
        limit = 20,
        offset = 0
    ): Promise<{ moodboards: Moodboard[]; total: number }> {
        const query = `
            SELECT m.*, u.username as owner_username
            FROM moodboards m
            LEFT JOIN users u ON m.owner_id = u.id
            WHERE m.owner_id = $1 AND m.deleted_at IS NULL
            ORDER BY m.updated_at DESC
            LIMIT $2 OFFSET $3
        `;
        const countQuery = `
            SELECT COUNT(*) FROM moodboards
            WHERE owner_id = $1 AND deleted_at IS NULL
        `;

        const [result, countResult] = await Promise.all([
            db.query(query, [ownerId, limit, offset]),
            db.query(countQuery, [ownerId])
        ]);

        return {
            moodboards: result.rows.map(this.mapRowToMoodboard),
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    // Update moodboard
    static async update(id: string, data: UpdateMoodboardData): Promise<Moodboard | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            setClause.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            setClause.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.coverImage !== undefined) {
            setClause.push(`cover_image = $${paramIndex++}`);
            values.push(data.coverImage);
        }
        if (data.visibility !== undefined) {
            setClause.push(`visibility = $${paramIndex++}`);
            values.push(data.visibility);
        }
        if (data.canvasWidth !== undefined) {
            setClause.push(`canvas_width = $${paramIndex++}`);
            values.push(data.canvasWidth);
        }
        if (data.canvasHeight !== undefined) {
            setClause.push(`canvas_height = $${paramIndex++}`);
            values.push(data.canvasHeight);
        }
        if (data.backgroundColor !== undefined) {
            setClause.push(`background_color = $${paramIndex++}`);
            values.push(data.backgroundColor);
        }
        if (data.gridEnabled !== undefined) {
            setClause.push(`grid_enabled = $${paramIndex++}`);
            values.push(data.gridEnabled);
        }
        if (data.snapToGrid !== undefined) {
            setClause.push(`snap_to_grid = $${paramIndex++}`);
            values.push(data.snapToGrid);
        }
        if (data.canvasData !== undefined) {
            setClause.push(`canvas_data = $${paramIndex++}`);
            values.push(JSON.stringify(data.canvasData));
        }

        if (setClause.length === 0) return this.findById(id);

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE moodboards
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToMoodboard(result.rows[0]) : null;
    }

    // Soft delete moodboard
    static async delete(id: string): Promise<boolean> {
        const query = `
            UPDATE moodboards
            SET deleted_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    // Duplicate moodboard
    static async duplicate(id: string, newOwnerId?: string): Promise<Moodboard | null> {
        const original = await this.findById(id);
        if (!original) return null;

        // Create new moodboard
        const newMoodboard = await this.create({
            ownerId: newOwnerId || original.ownerId,
            brandId: original.brandId,
            title: `${original.title} (Copy)`,
            description: original.description,
            visibility: 'private',
            canvasWidth: original.canvasWidth,
            canvasHeight: original.canvasHeight,
            backgroundColor: original.backgroundColor
        });

        // Duplicate elements
        if (original.elements) {
            for (const element of original.elements) {
                await this.addElement({
                    moodboardId: newMoodboard.id,
                    elementType: element.elementType,
                    positionX: element.positionX,
                    positionY: element.positionY,
                    width: element.width,
                    height: element.height,
                    rotation: element.rotation,
                    zIndex: element.zIndex,
                    content: element.content,
                    opacity: element.opacity,
                    borderRadius: element.borderRadius,
                    shadow: element.shadow,
                    locked: element.locked
                });
            }
        }

        return this.findById(newMoodboard.id);
    }

    // =====================================================
    // Element Methods
    // =====================================================

    // Get all elements for a moodboard
    static async getElements(moodboardId: string): Promise<MoodboardElement[]> {
        const query = `
            SELECT * FROM moodboard_elements
            WHERE moodboard_id = $1
            ORDER BY z_index ASC
        `;
        const result = await db.query(query, [moodboardId]);
        return result.rows.map(this.mapRowToMoodboardElement);
    }

    // Add element to moodboard
    static async addElement(data: CreateMoodboardElementData): Promise<MoodboardElement> {
        const query = `
            INSERT INTO moodboard_elements (
                moodboard_id, element_type, position_x, position_y,
                width, height, rotation, z_index, content,
                opacity, border_radius, shadow, locked
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        const values = [
            data.moodboardId,
            data.elementType,
            data.positionX || 0,
            data.positionY || 0,
            data.width || 100,
            data.height || 100,
            data.rotation || 0,
            data.zIndex || 0,
            JSON.stringify(data.content),
            data.opacity || 1,
            data.borderRadius || 0,
            data.shadow ? JSON.stringify(data.shadow) : null,
            data.locked || false
        ];

        const result = await db.query(query, values);

        // Update moodboard's updated_at
        await db.query(
            'UPDATE moodboards SET updated_at = NOW() WHERE id = $1',
            [data.moodboardId]
        );

        return this.mapRowToMoodboardElement(result.rows[0]);
    }

    // Update element
    static async updateElement(
        elementId: string,
        data: UpdateMoodboardElementData
    ): Promise<MoodboardElement | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.positionX !== undefined) {
            setClause.push(`position_x = $${paramIndex++}`);
            values.push(data.positionX);
        }
        if (data.positionY !== undefined) {
            setClause.push(`position_y = $${paramIndex++}`);
            values.push(data.positionY);
        }
        if (data.width !== undefined) {
            setClause.push(`width = $${paramIndex++}`);
            values.push(data.width);
        }
        if (data.height !== undefined) {
            setClause.push(`height = $${paramIndex++}`);
            values.push(data.height);
        }
        if (data.rotation !== undefined) {
            setClause.push(`rotation = $${paramIndex++}`);
            values.push(data.rotation);
        }
        if (data.zIndex !== undefined) {
            setClause.push(`z_index = $${paramIndex++}`);
            values.push(data.zIndex);
        }
        if (data.content !== undefined) {
            setClause.push(`content = $${paramIndex++}`);
            values.push(JSON.stringify(data.content));
        }
        if (data.opacity !== undefined) {
            setClause.push(`opacity = $${paramIndex++}`);
            values.push(data.opacity);
        }
        if (data.borderRadius !== undefined) {
            setClause.push(`border_radius = $${paramIndex++}`);
            values.push(data.borderRadius);
        }
        if (data.shadow !== undefined) {
            setClause.push(`shadow = $${paramIndex++}`);
            values.push(JSON.stringify(data.shadow));
        }
        if (data.locked !== undefined) {
            setClause.push(`locked = $${paramIndex++}`);
            values.push(data.locked);
        }

        if (setClause.length === 0) {
            const result = await db.query(
                'SELECT * FROM moodboard_elements WHERE id = $1',
                [elementId]
            );
            return result.rows.length > 0 ? this.mapRowToMoodboardElement(result.rows[0]) : null;
        }

        setClause.push(`updated_at = NOW()`);
        values.push(elementId);

        const query = `
            UPDATE moodboard_elements
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);

        if (result.rows.length > 0) {
            // Update moodboard's updated_at
            await db.query(
                'UPDATE moodboards SET updated_at = NOW() WHERE id = $1',
                [result.rows[0].moodboard_id]
            );
        }

        return result.rows.length > 0 ? this.mapRowToMoodboardElement(result.rows[0]) : null;
    }

    // Remove element
    static async removeElement(elementId: string): Promise<boolean> {
        // Get moodboard ID first
        const element = await db.query(
            'SELECT moodboard_id FROM moodboard_elements WHERE id = $1',
            [elementId]
        );

        if (element.rows.length === 0) return false;

        const query = 'DELETE FROM moodboard_elements WHERE id = $1';
        const result = await db.query(query, [elementId]);

        if ((result.rowCount || 0) > 0) {
            // Update moodboard's updated_at
            await db.query(
                'UPDATE moodboards SET updated_at = NOW() WHERE id = $1',
                [element.rows[0].moodboard_id]
            );
        }

        return (result.rowCount || 0) > 0;
    }

    // Reorder elements (update z-index for all elements)
    static async reorderElements(
        moodboardId: string,
        elementOrder: string[]
    ): Promise<MoodboardElement[]> {
        // Update z-index for each element based on position in array
        for (let i = 0; i < elementOrder.length; i++) {
            await db.query(
                'UPDATE moodboard_elements SET z_index = $1, updated_at = NOW() WHERE id = $2 AND moodboard_id = $3',
                [i, elementOrder[i], moodboardId]
            );
        }

        return this.getElements(moodboardId);
    }

    // Map database row to Moodboard interface
    private static mapRowToMoodboard(row: any): Moodboard {
        return {
            id: row.id,
            ownerId: row.owner_id,
            ownerUsername: row.owner_username || undefined,
            brandId: row.brand_id || undefined,
            title: row.title,
            slug: row.slug || undefined,
            description: row.description || undefined,
            coverImage: row.cover_image || undefined,
            visibility: row.visibility,
            canvasWidth: row.canvas_width,
            canvasHeight: row.canvas_height,
            backgroundColor: row.background_color,
            gridEnabled: row.grid_enabled,
            snapToGrid: row.snap_to_grid,
            canvasData: row.canvas_data || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at || undefined
        };
    }

    // Map database row to MoodboardElement interface
    private static mapRowToMoodboardElement(row: any): MoodboardElement {
        return {
            id: row.id,
            moodboardId: row.moodboard_id,
            elementType: row.element_type,
            positionX: parseFloat(row.position_x),
            positionY: parseFloat(row.position_y),
            width: parseFloat(row.width),
            height: parseFloat(row.height),
            rotation: parseFloat(row.rotation),
            zIndex: row.z_index,
            content: row.content || {},
            opacity: parseFloat(row.opacity),
            borderRadius: row.border_radius,
            shadow: row.shadow || undefined,
            locked: row.locked,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
