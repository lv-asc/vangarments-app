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
            const { name, code, collection, line, lineId, category, description, materials, images, metadata, retailPriceBrl, retailPriceUsd, retailPriceEur, parentSkuId, releaseDate, careInstructions, officialItemLink } = req.body;

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
                lineId,
                category,
                description,
                materials,
                images,
                metadata,
                retailPriceBrl,
                retailPriceUsd,
                retailPriceEur,
                parentSkuId,
                releaseDate,
                careInstructions,
                officialItemLink,
                // Sport Context (Extract from metadata if present)
                sportSquadId: metadata?.sportContext?.squadId || null,
                jerseyNumber: metadata?.sportContext?.jerseyNumber || null,
                playerName: metadata?.sportContext?.playerName || null,
                apparelLine: metadata?.sportContext?.apparelLine || null,
                itemStatus: metadata?.sportContext?.status || null,
                sponsorRestrictionFlag: metadata?.sportContext?.sponsorRestriction || false
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
                        officialItemLink: v.officialItemLink,
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
                LEFT JOIN brand_collections bc ON si.collection = bc.name 
                    AND (
                        bc.brand_id = si.brand_id
                        OR
                        bc.brand_id IN (
                            SELECT id FROM brand_accounts sub_ba 
                            WHERE sub_ba.brand_info->>'name' = ba.brand_info->>'name'
                        )
                        OR
                        bc.brand_id IN (
                            SELECT id FROM vufs_brands vb
                            WHERE vb.name = ba.brand_info->>'name'
                        )
                    )
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
     * Get a single SKU by ID or Slug
     */
    static async getSKU(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            let sku: any = null;

            // Check if ID is UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (isUUID) {
                sku = await SKUItemModel.findById(id);
            } else {
                // Try to find by Slug (derived from name or code)
                // Since we don't have a dedicated slug column yet, we search by name or code
                // This is a temporary solution until we add a strict slug column
                sku = await SKUItemModel.findBySlug(id);
            }

            if (!sku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            // If this is a variant, fetch the parent and its siblings
            if (sku.parentSkuId) {
                const parent = await SKUItemModel.findById(sku.parentSkuId);
                if (parent) {
                    const variants = await SKUItemModel.findVariants(sku.parentSkuId);
                    // Map variants to include size/color info for the frontend selector
                    const mappedVariants = variants.map(v => {
                        const vMeta = v.metadata || {};
                        return {
                            ...v,
                            size: vMeta.sizeName || vMeta.size || v.name,
                            sizeId: vMeta.sizeId,
                            color: vMeta.colorName || vMeta.color,
                            colorId: vMeta.colorId
                        };
                    });
                    res.json({ sku: { ...parent, variants: mappedVariants } });
                    return;
                }
            }

            // Fetch variants for parent/standalone SKU
            const variants = await SKUItemModel.findVariants(sku.id);
            const mappedVariants = variants.map(v => {
                const vMeta = v.metadata || {};
                return {
                    ...v,
                    size: vMeta.sizeName || vMeta.size || v.name,
                    sizeId: vMeta.sizeId,
                    color: vMeta.colorName || vMeta.color,
                    colorId: vMeta.colorId
                };
            });
            res.json({ sku: { ...sku, variants: mappedVariants } });
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

            // Extract sport context for update if metadata is being updated
            if (updateData.metadata?.sportContext) {
                const sc = updateData.metadata.sportContext;
                (updateData as any).sportSquadId = sc.squadId || null;
                (updateData as any).jerseyNumber = sc.jerseyNumber || null;
                (updateData as any).playerName = sc.playerName || null;
                (updateData as any).apparelLine = sc.apparelLine || null;
                (updateData as any).itemStatus = sc.status || null;
                (updateData as any).sponsorRestrictionFlag = sc.sponsorRestriction || false;
            }

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
     * Get related SKUs (by collection or brand)
     */
    static async getRelatedSKUs(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type, limit = 8 } = req.query; // type: 'collection' | 'brand'

            const sku = await SKUItemModel.findById(id);
            if (!sku) {
                res.status(404).json({ error: 'SKU not found' });
                return;
            }

            let related: any[] = [];

            if (type === 'collection') {
                if (sku.collection) {
                    related = await SKUItemModel.findRelated(sku.brandId, sku.id, { collection: sku.collection, limit: Number(limit) });
                } else if (sku.lineId) {
                    // Fallback to line
                    related = await SKUItemModel.findRelated(sku.brandId, sku.id, { lineId: sku.lineId, limit: Number(limit) });
                }
            } else if (type === 'brand') {
                // Exclude current collection to avoid duplication
                related = await SKUItemModel.findRelated(sku.brandId, sku.id, {
                    excludeCollection: sku.collection,
                    limit: Number(limit)
                });
            }

            res.json(related);
        } catch (error) {
            console.error('Error fetching related items', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Public search for Linking
     */
    static async searchSKUs(req: Request, res: Response): Promise<void> {
        try {
            const {
                term = '',
                brandId,
                styleId,
                patternId,
                fitId,
                genderId,
                apparelId,
                materialId,
                lineId,
                collection,
                sizeId,
                nationality,
                years,
                months,
                days,
                colorId,
                subcategory1Id,
                subcategory2Id,
                subcategory3Id,
                parentsOnly = 'true',
                limit = 100,
                page = 1
            } = req.query;

            const searchTerm = term as string;
            const filterParents = parentsOnly === 'true';
            const offset = (Number(page) - 1) * Number(limit);

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
                    si.retail_price_eur,
                    s.name as style_name,
                    p.name as pattern_name,
                    f.name as fit_name,
                    g.name as gender_name,
                    a.name as apparel_name,
                    m.name as material_name,
                    bc.name as collection_name,
                    bc.cover_image_url as collection_cover_image
                FROM sku_items si
                JOIN brand_accounts ba ON si.brand_id = ba.id
                LEFT JOIN brand_lines bl ON si.line_id = bl.id
                LEFT JOIN brand_collections bc ON si.collection = bc.name 
                    AND (
                        bc.brand_id = si.brand_id
                        OR
                        bc.brand_id IN (
                            SELECT id FROM brand_accounts sub_ba 
                            WHERE sub_ba.brand_info->>'name' = ba.brand_info->>'name'
                        )
                        OR
                        bc.brand_id IN (
                            SELECT id FROM vufs_brands vb
                            WHERE vb.name = ba.brand_info->>'name'
                        )
                    )
                LEFT JOIN vufs_attribute_values s ON s.id = NULLIF(si.category->>'styleId', '')::uuid
                LEFT JOIN vufs_patterns p ON p.id = NULLIF(si.category->>'patternId', '')::uuid
                LEFT JOIN vufs_fits f ON f.id = NULLIF(si.category->>'fitId', '')::uuid
                LEFT JOIN vufs_genders g ON g.id = NULLIF(si.category->>'genderId', '')::uuid
                LEFT JOIN vufs_attribute_values a ON a.id = NULLIF(si.category->>'apparelId', '')::uuid
                LEFT JOIN vufs_materials m ON m.id = NULLIF(si.category->>'materialId', '')::uuid
                WHERE si.deleted_at IS NULL
            `;

            const values: any[] = [];
            let paramIndex = 1;

            // Multi-value filter support using PostgreSQL ANY()
            if (brandId) {
                const brandIds = (brandId as string).split(',');
                query += ` AND si.brand_id = ANY($${paramIndex++})`;
                values.push(brandIds);
            }

            if (styleId) {
                const styleIds = (styleId as string).split(',');
                query += ` AND si.category->>'styleId' = ANY($${paramIndex++})`;
                values.push(styleIds);
            }
            if (patternId) {
                const patternIds = (patternId as string).split(',');
                query += ` AND si.category->>'patternId' = ANY($${paramIndex++})`;
                values.push(patternIds);
            }
            if (fitId) {
                const fitIds = (fitId as string).split(',');
                query += ` AND si.category->>'fitId' = ANY($${paramIndex++})`;
                values.push(fitIds);
            }
            if (genderId) {
                const genderIds = (genderId as string).split(',');
                query += ` AND si.category->>'genderId' = ANY($${paramIndex++})`;
                values.push(genderIds);
            }
            if (apparelId) {
                const apparelIds = (apparelId as string).split(',');
                query += ` AND si.category->>'apparelId' = ANY($${paramIndex++})`;
                values.push(apparelIds);
            }
            if (materialId) {
                const materialIds = (materialId as string).split(',');
                query += ` AND si.category->>'materialId' = ANY($${paramIndex++})`;
                values.push(materialIds);
            }
            if (sizeId) {
                const sizeIds = (sizeId as string).split(',');
                query += ` AND si.metadata->>'sizeId' = ANY($${paramIndex++})`;
                values.push(sizeIds);
            }
            if (lineId) {
                const lineIds = (lineId as string).split(',');
                query += ` AND si.line_id = ANY($${paramIndex++})`;
                values.push(lineIds);
            }
            if (collection) {
                const collections = (collection as string).split(',');
                query += ` AND si.collection = ANY($${paramIndex++})`;
                values.push(collections);
            }
            if (nationality) {
                const nationalities = (nationality as string).split(',');
                query += ` AND ba.brand_info->>'country' = ANY($${paramIndex++})`;
                values.push(nationalities);
            }

            if (years) {
                const yearArray = (years as string).split(',');
                query += ` AND EXTRACT(YEAR FROM si.release_date) = ANY($${paramIndex++})`;
                values.push(yearArray.map(y => parseInt(y)));
            }
            if (months) {
                const monthArray = (months as string).split(',');
                query += ` AND EXTRACT(MONTH FROM si.release_date) = ANY($${paramIndex++})`;
                values.push(monthArray.map(m => parseInt(m)));
            }
            if (days) {
                const dayArray = (days as string).split(',');
                query += ` AND EXTRACT(DAY FROM si.release_date) = ANY($${paramIndex++})`;
                values.push(dayArray.map(d => parseInt(d)));
            }
            if (colorId) {
                const colorIds = (colorId as string).split(',');
                // Filter by color in either the SKU's own metadata OR in any of its child variants' metadata
                query += ` AND (
                    si.metadata->>'colorId' = ANY($${paramIndex})
                    OR si.id IN (
                        SELECT DISTINCT parent_sku_id 
                        FROM sku_items 
                        WHERE parent_sku_id IS NOT NULL 
                        AND metadata->>'colorId' = ANY($${paramIndex + 1})
                        AND deleted_at IS NULL
                    )
                )`;
                values.push(colorIds);
                values.push(colorIds);
                paramIndex += 2;
            }
            if (subcategory1Id) {
                const subcategory1Ids = (subcategory1Id as string).split(',');
                query += ` AND si.category->>'subcategory1Id' = ANY($${paramIndex++})`;
                values.push(subcategory1Ids);
            }
            if (subcategory2Id) {
                const subcategory2Ids = (subcategory2Id as string).split(',');
                query += ` AND si.category->>'subcategory2Id' = ANY($${paramIndex++})`;
                values.push(subcategory2Ids);
            }
            if (subcategory3Id) {
                const subcategory3Ids = (subcategory3Id as string).split(',');
                query += ` AND si.category->>'subcategory3Id' = ANY($${paramIndex++})`;
                values.push(subcategory3Ids);
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
            let allSkus = result.rows;

            // If filtering parents, we MUST ensure that if a child matches but the parent doesn't,
            // we still fetch the parent so the child can be grouped under it.
            if (filterParents) {
                const matchedParentIds = new Set(allSkus.filter(s => !s.parent_sku_id).map(s => s.id));
                const missingParentIds = new Set<string>();

                allSkus.forEach(s => {
                    if (s.parent_sku_id && !matchedParentIds.has(s.parent_sku_id)) {
                        missingParentIds.add(s.parent_sku_id);
                    }
                });

                if (missingParentIds.size > 0) {
                    const parentQuery = `
                        SELECT 
                            si.*, 
                            ba.brand_info->>'name' as brand_name,
                            ba.brand_info->>'logo' as brand_logo,
                            ba.brand_info->>'slug' as brand_slug,
                            bl.name as line_name, 
                            bl.logo as line_logo,
                            si.retail_price_brl,
                            si.retail_price_usd,
                            si.retail_price_eur,
                            s.name as style_name,
                            p.name as pattern_name,
                            f.name as fit_name,
                            g.name as gender_name,
                            a.name as apparel_name,
                            m.name as material_name
                        FROM sku_items si
                        JOIN brand_accounts ba ON si.brand_id = ba.id
                        LEFT JOIN brand_lines bl ON si.line_id = bl.id
                        LEFT JOIN vufs_attribute_values s ON s.id = NULLIF(si.category->>'styleId', '')::uuid
                        LEFT JOIN vufs_patterns p ON p.id = NULLIF(si.category->>'patternId', '')::uuid
                        LEFT JOIN vufs_fits f ON f.id = NULLIF(si.category->>'fitId', '')::uuid
                        LEFT JOIN vufs_genders g ON g.id = NULLIF(si.category->>'genderId', '')::uuid
                        LEFT JOIN vufs_attribute_values a ON a.id = NULLIF(si.category->>'apparelId', '')::uuid
                        LEFT JOIN vufs_materials m ON m.id = NULLIF(si.category->>'materialId', '')::uuid
                        WHERE si.id = ANY($1) AND si.deleted_at IS NULL
                    `;
                    const parentResult = await db.query(parentQuery, [Array.from(missingParentIds)]);
                    allSkus = [...allSkus, ...parentResult.rows];
                }
            }

            // Fetch size sort orders for ALL matching SKUs (used in both grouped and non-grouped views)
            const allSizeIds = new Set<string>();
            allSkus.forEach(row => {
                const rowMeta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
                if (rowMeta.sizeId) allSizeIds.add(rowMeta.sizeId);
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


                // Fetch size sort orders for all variants (redundant now, removed)

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
                            sizeSortOrder: vMeta.sizeId ? (sizeOrderMap[vMeta.sizeId] || 999) : 999,
                            color: vMeta.colorName || vMeta.color,
                            retailPriceBrl: v.retail_price_brl,
                            retailPriceUsd: v.retail_price_usd,
                            retailPriceEur: v.retail_price_eur,
                            images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images || [],
                            metadata: vMeta
                        };
                    });

                    // Sort variants by size order
                    variants.sort((a: any, b: any) => a.sizeSortOrder - b.sizeSortOrder);

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
                        style: row.style_name || (typeof row.category === 'string' ? JSON.parse(row.category).style : row.category?.style),
                        pattern: row.pattern_name || (typeof row.category === 'string' ? JSON.parse(row.category).pattern : row.category?.pattern),
                        fit: row.fit_name || (typeof row.category === 'string' ? JSON.parse(row.category).fit : row.category?.fit),
                        gender: row.gender_name || (typeof row.category === 'string' ? JSON.parse(row.category).gender : row.category?.gender),
                        materialName: row.material_name,
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
                        releaseDate: row.release_date,
                        careInstructions: row.care_instructions,
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

                res.json({ skus });
            } else {
                // parentsOnly=false: return all without grouping
                const skus = allSkus.slice(0, 20).map(row => {
                    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
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
                        style: row.style_name,
                        pattern: row.pattern_name,
                        fit: row.fit_name,
                        gender: row.gender_name,
                        apparel: row.apparel_name,
                        materialName: row.material_name,
                        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
                        metadata: meta,
                        sizeSortOrder: meta.sizeId ? (sizeOrderMap[meta.sizeId] || 999) : 999,
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

    /**
     * Get available release date options (years, months, days)
     */
    static async getReleaseDateOptions(req: Request, res: Response): Promise<void> {
        try {
            const query = `
                SELECT 
                    ARRAY_AGG(DISTINCT EXTRACT(YEAR FROM release_date) ORDER BY EXTRACT(YEAR FROM release_date) DESC) as years,
                    ARRAY_AGG(DISTINCT EXTRACT(MONTH FROM release_date) ORDER BY EXTRACT(MONTH FROM release_date) ASC) as months,
                    ARRAY_AGG(DISTINCT EXTRACT(DAY FROM release_date) ORDER BY EXTRACT(DAY FROM release_date) ASC) as days
                FROM sku_items
                WHERE release_date IS NOT NULL AND deleted_at IS NULL
            `;
            const result = await db.query(query);
            const options = result.rows[0] || { years: [], months: [], days: [] };

            // Handle potential nulls from ARRAY_AGG if table is empty
            res.json({
                years: options.years ? options.years.filter((y: any) => y !== null) : [],
                months: options.months ? options.months.filter((m: any) => m !== null) : [],
                days: options.days ? options.days.filter((d: any) => d !== null) : []
            });
        } catch (error) {
            console.error('Get release date options error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
