import { Request, Response } from 'express';
import { db } from '../database/connection';
import { SKUItemModel } from '../models/SKUItem';
import { AuthenticatedRequest } from '../utils/auth';
import { BrandAccountModel } from '../models/BrandAccount';

export class SKUController {
    /**
     * Create a new SKU item for a brand
     */
    static async createSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const { brandId } = req.params;
            const { name, code, collection, line, category, description, materials, images, metadata } = req.body;

            // Verify brand ownership
            const brand = await BrandAccountModel.findById(brandId);
            if (!brand) {
                res.status(404).json({ error: 'Brand not found' });
                return;
            }

            if (brand.userId !== req.user.userId) {
                res.status(403).json({ error: 'You do not have permission to manage this brand' });
                return;
            }

            const sku = await SKUItemModel.create({
                brandId,
                name,
                code,
                collection,
                line,
                category,
                description,
                materials,
                images,
                metadata
            });

            res.status(201).json({ message: 'SKU created successfully', sku });
        } catch (error) {
            console.error('Create SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all SKUs for a brand with optional filtering
     */
    static async getBrandSKUs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { collection, line, search } = req.query;

            const skus = await SKUItemModel.findByBrandId(brandId, {
                collection: collection as string,
                line: line as string,
                search: search as string
            });

            res.json({ skus });
        } catch (error) {
            console.error('Get Brand SKUs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all SKUs (Admin/Global view)
     */
    static async getAllSKUs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 50, search, brandId } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let query = `
                SELECT 
                    si.*, 
                    ba.brand_info->>'name' as brand_name,
                    ba.brand_info->>'logo' as brand_logo,
                    bl.name as line_name, 
                    bl.logo as line_logo
                FROM sku_items si
                JOIN brand_accounts ba ON si.brand_id = ba.id
                LEFT JOIN brand_lines bl ON si.line_id = bl.id
                WHERE si.deleted_at IS NULL
            `;

            const values: any[] = [];
            let paramIndex = 1;

            if (brandId) {
                query += ` AND si.brand_id = $${paramIndex++}`;
                values.push(brandId);
            }

            if (search) {
                query += ` AND (
                    si.name ILIKE $${paramIndex} OR 
                    si.code ILIKE $${paramIndex} OR 
                    (ba.brand_info->>'name') ILIKE $${paramIndex} OR 
                    bl.name ILIKE $${paramIndex}
                )`;
                values.push(`%${search}%`);
                paramIndex++;
            }

            query += ` ORDER BY si.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            values.push(Number(limit), offset);

            const result = await db.query(query, values);

            // Get total count for pagination
            // Note: This is an estimated count if search is active (simplified)
            // Ideally we'd run a separate count query
            const countQuery = `SELECT COUNT(*) as total FROM sku_items WHERE deleted_at IS NULL`;
            const countResult = await db.query(countQuery);
            const total = parseInt(countResult.rows[0].total);

            const skus = result.rows.map(row => {
                const item: any = {
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
                    brand: {
                        name: row.brand_name,
                        logo: row.brand_logo
                    },
                    createdAt: row.created_at
                };

                if (row.line_name || row.line_logo || row.line_id) {
                    item.lineInfo = {
                        id: row.line_id,
                        name: row.line_name,
                        logo: row.line_logo
                    };
                }

                return item;
            });

            res.json({ skus, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
        } catch (error) {
            console.error('Get All SKUs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get a single SKU by ID
     */
    static async getSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const sku = await SKUItemModel.findById(id);

            if (!sku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            res.json({ sku });
        } catch (error) {
            console.error('Get SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update a SKU
     */
    static async updateSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const { id } = req.params;
            const updateData = req.body;

            const currentSku = await SKUItemModel.findById(id);
            if (!currentSku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            // Verify brand ownership
            const brand = await BrandAccountModel.findById(currentSku.brandId);
            if (brand?.userId !== req.user.userId) {
                res.status(403).json({ error: 'You do not have permission to update this SKU' });
                return;
            }

            const updatedSku = await SKUItemModel.update(id, updateData);
            res.json({ message: 'SKU updated successfully', sku: updatedSku });
        } catch (error) {
            console.error('Update SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Delete a SKU (soft delete)
     */
    static async deleteSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const { id } = req.params;
            const currentSku = await SKUItemModel.findById(id);

            if (!currentSku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            // Verify brand ownership
            const brand = await BrandAccountModel.findById(currentSku.brandId);
            if (brand?.userId !== req.user.userId) {
                res.status(403).json({ error: 'You do not have permission to delete this SKU' });
                return;
            }

            await SKUItemModel.delete(id);
            res.json({ message: 'SKU deleted successfully' });
        } catch (error) {
            console.error('Delete SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Public search for Linking
     */
    static async searchSKUs(req: Request, res: Response): Promise<void> {
        try {
            const { term, brandId } = req.query;

            if (!term) {
                res.status(400).json({ error: 'Search term required' });
                return;
            }

            const searchTerm = term as string;
            // Base query with joins for Brand and Line info
            let query = `
                SELECT 
                    si.*, 
                    ba.brand_info->>'name' as brand_name,
                    ba.brand_info->>'logo' as brand_logo,
                    bl.name as line_name, 
                    bl.logo as line_logo
                FROM sku_items si
                JOIN brand_accounts ba ON si.brand_id = ba.id
                LEFT JOIN brand_lines bl ON si.line_id = bl.id
                WHERE si.deleted_at IS NULL
            `;

            const values: any[] = [];
            let paramIndex = 1;

            if (brandId) {
                query += ` AND si.brand_id = $${paramIndex++}`;
                values.push(brandId);
            }

            // Search logic: Match SKU name, Code, Brand Name, or Line Name
            query += ` AND (
                si.name ILIKE $${paramIndex} OR 
                si.code ILIKE $${paramIndex} OR 
                (ba.brand_info->>'name') ILIKE $${paramIndex} OR 
                bl.name ILIKE $${paramIndex}
            )`;
            values.push(`%${searchTerm}%`);

            query += ` ORDER BY si.created_at DESC LIMIT 20`;

            const result = await db.query(query, values);

            const skus = result.rows.map(row => {
                const item: any = {
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
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
                    brand: {
                        name: row.brand_name,
                        logo: row.brand_logo
                    }
                };

                if (row.line_name || row.line_logo || row.line_id) {
                    item.lineInfo = {
                        id: row.line_id,
                        name: row.line_name,
                        logo: row.line_logo
                    };
                }

                return item;
            });

            res.json({ skus });

        } catch (error) {
            console.error('Search SKUs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
