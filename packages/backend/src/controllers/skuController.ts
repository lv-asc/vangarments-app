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
            const { name, code, collection, line, category, description, materials, images, metadata, retailPriceBrl, retailPriceUsd, retailPriceEur, parentSkuId } = req.body;

            let targetBrandId = brandId;
            let brand = await BrandAccountModel.findById(brandId);
            const isAdmin = req.user.roles && req.user.roles.includes('admin');

            // Logic to handle Global/VUFS Brands (Admin Only)
            // If Brand Account not found by ID, but user is admin, check if it's a VUFS Brand
            console.log('[SKUController] createSKU - brandId:', brandId, 'isAdmin:', isAdmin, 'brand found:', !!brand);
            if (!brand && isAdmin) {
                // Check if ID exists in vufs_brands
                console.log('[SKUController] Checking vufs_brands for ID:', brandId);
                const vufsRes = await db.query('SELECT name FROM vufs_brands WHERE id = $1', [brandId]);
                console.log('[SKUController] vufs_brands result:', vufsRes.rows);

                if (vufsRes.rows.length > 0) {
                    const vufsBrandName = vufsRes.rows[0].name;

                    // Try to find existing Brand Account by Name
                    brand = await BrandAccountModel.findBySlugOrId(vufsBrandName);

                    if (brand) {
                        targetBrandId = brand.id;
                    } else {
                        // Create new Brand Account for this VUFS Brand
                        brand = await BrandAccountModel.create({
                            userId: req.user.userId,
                            brandInfo: {
                                name: vufsBrandName,
                                businessType: 'brand',
                                description: `Official ${vufsBrandName} brand account`
                            },
                            partnershipTier: 'basic'
                        });
                        targetBrandId = brand.id;
                    }
                }
            }

            if (!brand) {
                res.status(404).json({ error: 'Brand not found' });
                return;
            }

            // Check permissions
            if (!isAdmin && brand.userId !== req.user.userId) {
                res.status(403).json({ error: 'You do not have permission to manage this brand' });
                return;
            }

            const sku = await SKUItemModel.create({
                brandId: targetBrandId,
                name,
                code,
                collection,
                line,
                category,
                description,
                materials,
                images,
                metadata,
                retailPriceBrl,
                retailPriceUsd,
                retailPriceEur,
                parentSkuId
            });

            res.status(201).json({ message: 'SKU created successfully', sku });
        } catch (error) {
            console.error('Create SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all SKUs for a brand with optional filtering and variant grouping
     */
    static async getBrandSKUs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { collection, line, search, parentsOnly = 'true' } = req.query;
            const filterParents = parentsOnly === 'true';

            // Fetch all SKUs for this brand
            const allSkus = await SKUItemModel.findByBrandId(brandId, {
                collection: collection as string,
                line: line as string,
                search: search as string
            });

            if (filterParents) {
                // Group ONLY by explicit parent_sku_id relationships
                const childrenByParentId: Record<string, any[]> = {};
                const childSkuIds = new Set<string>();

                // First pass: identify children and group them by parent
                allSkus.forEach((sku: any) => {
                    if (sku.parentSkuId) {
                        childSkuIds.add(sku.id);
                        if (!childrenByParentId[sku.parentSkuId]) {
                            childrenByParentId[sku.parentSkuId] = [];
                        }
                        childrenByParentId[sku.parentSkuId].push(sku);
                    }
                });

                const groupedResults: any[] = [];

                // Second pass: add parent SKUs with their variants, and standalone SKUs
                allSkus.forEach((sku: any) => {
                    // Skip child SKUs (they're included in their parent's variants)
                    if (childSkuIds.has(sku.id)) return;

                    const children = childrenByParentId[sku.id] || [];
                    const variants = children.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        code: v.code,
                        size: v.metadata?.sizeName || v.metadata?.size || '',
                        sizeId: v.metadata?.sizeId,
                        color: v.metadata?.colorName || v.metadata?.color,
                        retailPriceBrl: v.retailPriceBrl,
                        retailPriceUsd: v.retailPriceUsd,
                        retailPriceEur: v.retailPriceEur,
                        images: v.images || []
                    }));

                    // If this parent has variants, strip the size suffix from the parent name
                    // This handles cases where the parent was incorrectly saved with a size suffix like "[S]"
                    let parentName = sku.name;
                    if (variants.length > 0) {
                        // Strip size suffixes like [S], [M], [L], [XL], [XXL], [XS], etc.
                        parentName = sku.name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
                    }

                    groupedResults.push({
                        ...sku,
                        name: parentName,
                        variants
                    });
                });

                // Fetch size sort orders and sort all variants
                const allSizeIds = new Set<string>();
                groupedResults.forEach(result => {
                    result.variants?.forEach((v: any) => {
                        if (v.sizeId) allSizeIds.add(v.sizeId);
                    });
                });

                let sizeOrderMap: Record<string, number> = {};
                if (allSizeIds.size > 0) {
                    const sizeOrderQuery = `
                        SELECT id, sort_order 
                        FROM vufs_sizes 
                        WHERE id = ANY($1)
                    `;
                    const sizeOrderResult = await db.query(sizeOrderQuery, [Array.from(allSizeIds)]);
                    sizeOrderResult.rows.forEach((row: any) => {
                        sizeOrderMap[row.id] = row.sort_order || 999;
                    });
                }

                // Sort variants by size order
                groupedResults.forEach(result => {
                    if (result.variants && result.variants.length > 0) {
                        result.variants.sort((a: any, b: any) => {
                            const orderA = a.sizeId ? (sizeOrderMap[a.sizeId] || 999) : 999;
                            const orderB = b.sizeId ? (sizeOrderMap[b.sizeId] || 999) : 999;
                            return orderA - orderB;
                        });
                    }
                });

                // Sort by createdAt DESC
                groupedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                res.json({ skus: groupedResults });
            } else {
                // Return all without grouping
                res.json({ skus: allSkus.map((s: any) => ({ ...s, variants: [] })) });
            }

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
            const { page = 1, limit = 50, search, brandId, parentsOnly = 'true' } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const filterParents = parentsOnly === 'true';

            // Fetch ALL SKUs first (to enable explicit parent-child grouping)
            let query = `
                SELECT 
                    si.*, 
                    ba.brand_info->>'name' as brand_name,
                    ba.brand_info->>'logo' as brand_logo,
                    ba.brand_info->>'slug' as brand_slug,
                    bl.name as line_name, 
                    bl.logo as line_logo,
                    bc.name as collection_name,
                    bc.cover_image_url as collection_cover_image,
                    si.retail_price_brl,
                    si.retail_price_usd,
                    si.retail_price_eur
                FROM sku_items si
                JOIN brand_accounts ba ON si.brand_id = ba.id
                LEFT JOIN brand_lines bl ON si.line_id = bl.id
                LEFT JOIN brand_collections bc ON si.brand_id = bc.brand_id AND si.collection = bc.name
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

            query += ` ORDER BY si.created_at DESC`;

            const result = await db.query(query, values);
            const allSkus = result.rows;

            // If parentsOnly is true, group ONLY by explicit parent_sku_id
            if (filterParents) {
                const childrenByParentId: Record<string, any[]> = {};
                const childSkuIds = new Set<string>();

                // First pass: identify children and group them by parent
                allSkus.forEach(row => {
                    if (row.parent_sku_id) {
                        childSkuIds.add(row.id);
                        if (!childrenByParentId[row.parent_sku_id]) {
                            childrenByParentId[row.parent_sku_id] = [];
                        }
                        childrenByParentId[row.parent_sku_id].push(row);
                    }
                });

                const groupedResults: any[] = [];

                // Second pass: add parent SKUs with their variants, and standalone SKUs
                allSkus.forEach(row => {
                    // Skip child SKUs (they're included in their parent's variants)
                    if (childSkuIds.has(row.id)) return;

                    const children = childrenByParentId[row.id] || [];
                    groupedResults.push({
                        ...row,
                        _variants: children
                    });
                });


                // Sort by created_at DESC and apply pagination
                groupedResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const paginatedResults = groupedResults.slice(offset, offset + Number(limit));
                const total = groupedResults.length;

                // Fetch size sort orders for all variants
                const allSizeIds = new Set<string>();
                paginatedResults.forEach(row => {
                    (row._variants || []).forEach((v: any) => {
                        const vMeta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata || {};
                        if (vMeta.sizeId) allSizeIds.add(vMeta.sizeId);
                    });
                });

                let sizeOrderMap: Record<string, number> = {};
                if (allSizeIds.size > 0) {
                    const sizeOrderQuery = `
                        SELECT id, sort_order 
                        FROM vufs_sizes 
                        WHERE id = ANY($1)
                    `;
                    const sizeOrderResult = await db.query(sizeOrderQuery, [Array.from(allSizeIds)]);
                    sizeOrderResult.rows.forEach((row: any) => {
                        sizeOrderMap[row.id] = row.sort_order || 999;
                    });
                }

                // Map to output format
                const skus = paginatedResults.map(row => {
                    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
                    const variants = (row._variants || []).map((v: any) => {
                        const vMeta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata || {};
                        return {
                            id: v.id,
                            name: v.name,
                            code: v.code,
                            size: vMeta.sizeName || vMeta.size || v.name,
                            sizeId: vMeta.sizeId,
                            color: vMeta.colorName || vMeta.color,
                            retailPriceBrl: v.retail_price_brl,
                            retailPriceUsd: v.retail_price_usd,
                            retailPriceEur: v.retail_price_eur,
                            images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images || [],
                            _sizeOrder: vMeta.sizeId ? (sizeOrderMap[vMeta.sizeId] || 999) : 999
                        };
                    });

                    // Sort variants by size order
                    variants.sort((a: any, b: any) => a._sizeOrder - b._sizeOrder);
                    // Remove the temporary _sizeOrder field
                    variants.forEach((v: any) => delete v._sizeOrder);

                    // If this parent has variants, strip the size suffix from the parent name
                    // This handles cases where the parent was incorrectly saved with a size suffix like "[S]"
                    let parentName = row.name;
                    if (variants.length > 0) {
                        parentName = row.name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
                    }

                    const item: any = {
                        id: row._isVirtualParent ? `virtual-${row.id}` : row.id,
                        brandId: row.brand_id,
                        parentSkuId: row.parent_sku_id,
                        name: parentName,
                        code: row.code,
                        collection: row.collection,
                        line: row.line,
                        lineId: row.line_id,
                        category: typeof row.category === 'string' ? JSON.parse(row.category) : row.category,
                        description: row.description,
                        materials: row.materials,
                        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
                        videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : row.videos || [],
                        metadata: meta,
                        brand: {
                            name: row.brand_name,
                            logo: row.brand_logo,
                            slug: row.brand_slug
                        },
                        retailPriceBrl: row.retail_price_brl,
                        retailPriceUsd: row.retail_price_usd,
                        retailPriceEur: row.retail_price_eur,
                        createdAt: row.created_at,
                        isVirtualParent: row._isVirtualParent || false,
                        variants
                    };

                    if (row.line_name || row.line_logo || row.line_id) {
                        item.lineInfo = {
                            id: row.line_id,
                            name: row.line_name,
                            logo: row.line_logo
                        };
                    }

                    if (row.collection_name || row.collection_cover_image) {
                        item.collectionInfo = {
                            name: row.collection_name,
                            coverImage: row.collection_cover_image
                        };
                    }


                    return item;
                });

                res.json({ skus, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
            } else {
                // parentsOnly=false: return all SKUs without grouping
                const total = allSkus.length;
                const paginatedResults = allSkus.slice(offset, offset + Number(limit));

                const skus = paginatedResults.map(row => {
                    const item: any = {
                        id: row.id,
                        brandId: row.brand_id,
                        parentSkuId: row.parent_sku_id,
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
                            logo: row.brand_logo,
                            slug: row.brand_slug
                        },
                        retailPriceBrl: row.retail_price_brl,
                        retailPriceUsd: row.retail_price_usd,
                        retailPriceEur: row.retail_price_eur,
                        createdAt: row.created_at,
                        variants: []
                    };

                    if (row.line_name || row.line_logo || row.line_id) {
                        item.lineInfo = {
                            id: row.line_id,
                            name: row.line_name,
                            logo: row.line_logo
                        };
                    }

                    if (row.collection_name || row.collection_cover_image) {
                        item.collectionInfo = {
                            name: row.collection_name,
                            coverImage: row.collection_cover_image
                        };
                    }

                    return item;
                });

                res.json({ skus, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
            }
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

            // Verify brand ownership or admin
            const isAdmin = req.user.roles && req.user.roles.includes('admin');
            const brand = await BrandAccountModel.findById(currentSku.brandId);
            if (!isAdmin && brand?.userId !== req.user.userId) {
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

            // Verify brand ownership or admin
            const isAdmin = req.user.roles && req.user.roles.includes('admin');
            const brand = await BrandAccountModel.findById(currentSku.brandId);
            if (!isAdmin && brand?.userId !== req.user.userId) {
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
            const { term, brandId, parentsOnly = 'true' } = req.query;

            if (!term) {
                res.status(400).json({ error: 'Search term required' });
                return;
            }

            const searchTerm = term as string;
            const filterParents = parentsOnly === 'true';

            // Fetch all matching SKUs
            let query = `
                SELECT 
                    si.*, 
                    ba.brand_info->>'name' as brand_name,
                    ba.brand_info->>'logo' as brand_logo,
                    ba.brand_info->>'slug' as brand_slug,
                    bl.name as line_name, 
                    bl.logo as line_logo,
                    si.retail_price_brl,
                    si.retail_price_usd,
                    si.retail_price_eur
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

            query += ` ORDER BY si.created_at DESC LIMIT 100`;

            const result = await db.query(query, values);
            const allSkus = result.rows;

            if (filterParents) {
                // Group ONLY by explicit parent_sku_id
                const childrenByParentId: Record<string, any[]> = {};
                const childSkuIds = new Set<string>();

                // First pass: identify children and group them by parent
                allSkus.forEach(row => {
                    if (row.parent_sku_id) {
                        childSkuIds.add(row.id);
                        if (!childrenByParentId[row.parent_sku_id]) {
                            childrenByParentId[row.parent_sku_id] = [];
                        }
                        childrenByParentId[row.parent_sku_id].push(row);
                    }
                });

                const groupedResults: any[] = [];

                // Second pass: add parent SKUs with their variants, and standalone SKUs
                allSkus.forEach(row => {
                    // Skip child SKUs
                    if (childSkuIds.has(row.id)) return;

                    const children = childrenByParentId[row.id] || [];
                    groupedResults.push({
                        ...row,
                        _variants: children
                    });
                });

                groupedResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const topResults = groupedResults.slice(0, 20);


                // Fetch size sort orders for all variants
                const allSizeIds = new Set<string>();
                topResults.forEach(row => {
                    (row._variants || []).forEach((v: any) => {
                        const vMeta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata || {};
                        if (vMeta.sizeId) allSizeIds.add(vMeta.sizeId);
                    });
                });

                let sizeOrderMap: Record<string, number> = {};
                if (allSizeIds.size > 0) {
                    const sizeOrderQuery = `
                        SELECT id, sort_order 
                        FROM vufs_sizes 
                        WHERE id = ANY($1)
                    `;
                    const sizeOrderResult = await db.query(sizeOrderQuery, [Array.from(allSizeIds)]);
                    sizeOrderResult.rows.forEach((row: any) => {
                        sizeOrderMap[row.id] = row.sort_order || 999;
                    });
                }

                const skus = topResults.map(row => {
                    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
                    const variants = (row._variants || []).map((v: any) => {
                        const vMeta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata || {};
                        return {
                            id: v.id,
                            name: v.name,
                            code: v.code,
                            size: vMeta.sizeName || vMeta.size || v.name,
                            sizeId: vMeta.sizeId,
                            color: vMeta.colorName || vMeta.color,
                            retailPriceBrl: v.retail_price_brl,
                            retailPriceUsd: v.retail_price_usd,
                            retailPriceEur: v.retail_price_eur,
                            images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images || [],
                            _sizeOrder: vMeta.sizeId ? (sizeOrderMap[vMeta.sizeId] || 999) : 999
                        };
                    });

                    // Sort variants by size order
                    variants.sort((a: any, b: any) => a._sizeOrder - b._sizeOrder);
                    // Remove the temporary _sizeOrder field
                    variants.forEach((v: any) => delete v._sizeOrder);

                    // If this parent has variants, strip the size suffix from the parent name
                    // This handles cases where the parent was incorrectly saved with a size suffix like "[S]"
                    let parentName = row.name;
                    if (variants.length > 0) {
                        parentName = row.name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
                    }

                    const item: any = {
                        id: row._isVirtualParent ? `virtual-${row.id}` : row.id,
                        brandId: row.brand_id,
                        parentSkuId: row.parent_sku_id,
                        name: parentName,
                        code: row.code,
                        collection: row.collection,
                        line: row.line,
                        lineId: row.line_id,
                        category: typeof row.category === 'string' ? JSON.parse(row.category) : row.category,
                        description: row.description,
                        materials: row.materials,
                        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
                        metadata: meta,
                        brand: {
                            name: row.brand_name,
                            logo: row.brand_logo,
                            slug: row.brand_slug
                        },
                        retailPriceBrl: row.retail_price_brl,
                        retailPriceUsd: row.retail_price_usd,
                        retailPriceEur: row.retail_price_eur,
                        isVirtualParent: row._isVirtualParent || false,
                        variants
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
            } else {
                // parentsOnly=false: return all without grouping
                const skus = allSkus.slice(0, 20).map(row => {
                    const item: any = {
                        id: row.id,
                        brandId: row.brand_id,
                        parentSkuId: row.parent_sku_id,
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
                            logo: row.brand_logo,
                            slug: row.brand_slug
                        },
                        retailPriceBrl: row.retail_price_brl,
                        retailPriceUsd: row.retail_price_usd,
                        retailPriceEur: row.retail_price_eur,
                        variants: []
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
            }

        } catch (error) {
            console.error('Search SKUs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }


    /**
     * Get deleted SKUs (trash) - Admin only
     */
    static async getDeletedSKUs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.roles?.includes('admin')) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }

            const { search, brandId, page = 1, limit = 50 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            const result = await SKUItemModel.findDeleted(
                { brandId: brandId as string, search: search as string },
                Number(limit),
                offset
            );

            res.json({
                skus: result.skus,
                total: result.total,
                page: Number(page),
                totalPages: Math.ceil(result.total / Number(limit))
            });
        } catch (error) {
            console.error('Get deleted SKUs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Restore a deleted SKU - Admin only
     */
    static async restoreSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.roles?.includes('admin')) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }

            const { id } = req.params;
            const sku = await SKUItemModel.findByIdIncludeDeleted(id);

            if (!sku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            if (!sku.deletedAt) {
                res.status(400).json({ error: 'SKU is not deleted' });
                return;
            }

            await SKUItemModel.restore(id);
            res.json({ message: 'SKU restored successfully' });
        } catch (error) {
            console.error('Restore SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Permanently delete a SKU - Admin only
     */
    static async permanentDeleteSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.roles?.includes('admin')) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }

            const { id } = req.params;
            const sku = await SKUItemModel.findByIdIncludeDeleted(id);

            if (!sku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            if (!sku.deletedAt) {
                res.status(400).json({ error: 'SKU must be in trash before permanent deletion' });
                return;
            }

            await SKUItemModel.permanentDelete(id);
            res.json({ message: 'SKU permanently deleted' });
        } catch (error) {
            console.error('Permanent delete SKU error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
