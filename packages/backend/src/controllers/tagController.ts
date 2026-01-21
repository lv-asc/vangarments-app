import { Request, Response } from 'express';
import { MediaTagModel, CreateMediaTagData } from '../models/MediaTag';
import { TagType, TagSourceType } from '@vangarments/shared';
import { AuthenticatedRequest } from '../utils/auth';

/**
 * Tag Controller - Unified endpoints for media tagging functionality
 */

/**
 * Add a tag to an image
 * POST /api/tags
 */
export async function addTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const {
            sourceType,
            sourceId,
            imageUrl,
            positionX,
            positionY,
            tagType,
            taggedEntityId,
            taggedItemId,
            locationName,
            locationAddress,
            locationLat,
            locationLng,
        } = req.body;

        // Validate required fields
        if (!sourceType || !sourceId || !imageUrl || positionX === undefined || positionY === undefined || !tagType) {
            res.status(400).json({ error: 'Missing required fields: sourceType, sourceId, imageUrl, positionX, positionY, tagType' });
            return;
        }

        // Validate position values
        if (positionX < 0 || positionX > 100 || positionY < 0 || positionY > 100) {
            res.status(400).json({ error: 'Position values must be between 0 and 100' });
            return;
        }

        // Validate tag type specific requirements
        if (tagType === 'item' && !taggedItemId) {
            res.status(400).json({ error: 'taggedItemId is required for item tags' });
            return;
        }
        if (tagType === 'location' && !locationName) {
            res.status(400).json({ error: 'locationName is required for location tags' });
            return;
        }
        if (!['item', 'location'].includes(tagType) && !taggedEntityId) {
            res.status(400).json({ error: 'taggedEntityId is required for entity tags' });
            return;
        }

        const tagData: CreateMediaTagData = {
            sourceType,
            sourceId,
            imageUrl,
            positionX,
            positionY,
            tagType,
            taggedEntityId,
            taggedItemId,
            locationName,
            locationAddress,
            locationLat,
            locationLng,
            createdBy: userId,
        };

        const tag = await MediaTagModel.create(tagData);
        res.status(201).json({ data: tag });
    } catch (error) {
        console.error('Error adding tag:', error);
        res.status(500).json({ error: 'Failed to add tag' });
    }
}

/**
 * Get tags for a specific source (lookbook, post, etc.)
 * GET /api/tags?sourceType=lookbook_image&sourceId=uuid
 */
export async function getTagsBySource(req: Request, res: Response): Promise<void> {
    try {
        const { sourceType, sourceId, imageUrl } = req.query;

        if (!sourceType || !sourceId) {
            res.status(400).json({ error: 'sourceType and sourceId query parameters are required' });
            return;
        }

        let tags;
        if (imageUrl) {
            tags = await MediaTagModel.findByImage(
                sourceType as TagSourceType,
                sourceId as string,
                imageUrl as string
            );
        } else {
            tags = await MediaTagModel.findBySource(
                sourceType as TagSourceType,
                sourceId as string
            );
        }

        res.json({ data: tags });
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
}

/**
 * Get a single tag by ID
 * GET /api/tags/:tagId
 */
export async function getTag(req: Request, res: Response): Promise<void> {
    try {
        const { tagId } = req.params;
        const tag = await MediaTagModel.findById(tagId);

        if (!tag) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        res.json({ data: tag });
    } catch (error) {
        console.error('Error getting tag:', error);
        res.status(500).json({ error: 'Failed to get tag' });
    }
}

/**
 * Update a tag (position or approval status)
 * PATCH /api/tags/:tagId
 */
export async function updateTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { tagId } = req.params;
        const { positionX, positionY, isApproved } = req.body;

        // Check tag exists and user is authorized
        const existingTag = await MediaTagModel.findById(tagId);
        if (!existingTag) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        // Only tag creator can update position, tagged entity owner can update approval
        // For now, allow tag creator to update
        if (existingTag.createdBy !== userId) {
            // Check if user is the tagged entity (for approval)
            if (isApproved !== undefined) {
                // TODO: Check if userId matches taggedEntityId for user tags
                // For now, allow the update
            } else {
                res.status(403).json({ error: 'Not authorized to update this tag' });
                return;
            }
        }

        const updatedTag = await MediaTagModel.update(tagId, { positionX, positionY, isApproved });
        res.json({ data: updatedTag });
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ error: 'Failed to update tag' });
    }
}

/**
 * Delete a tag
 * DELETE /api/tags/:tagId
 */
export async function deleteTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { tagId } = req.params;

        // Check tag exists and user is authorized
        const existingTag = await MediaTagModel.findById(tagId);
        if (!existingTag) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        // Only tag creator can delete
        if (existingTag.createdBy !== userId) {
            // TODO: Also allow source owner (lookbook owner, post owner) to delete
            res.status(403).json({ error: 'Not authorized to delete this tag' });
            return;
        }

        await MediaTagModel.delete(tagId);
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
}

/**
 * Search for taggable entities
 * GET /api/tags/search?q=query&types=user,brand&limit=10
 */
export async function searchEntities(req: Request, res: Response): Promise<void> {
    try {
        const { q, types, limit } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }

        const typeArray = types
            ? (types as string).split(',').filter(t => ['user', 'brand', 'store', 'page', 'supplier'].includes(t)) as TagType[]
            : ['user', 'brand', 'store', 'page', 'supplier'] as TagType[];

        const limitNum = limit ? Math.min(parseInt(limit as string), 20) : 10;

        const results = await MediaTagModel.searchEntities(q, typeArray, limitNum);
        res.json({ data: { results, query: q } });
    } catch (error) {
        console.error('Error searching entities:', error);
        res.status(500).json({ error: 'Failed to search entities' });
    }
}

/**
 * Search for items to tag
 * GET /api/tags/items/search?q=query&limit=10
 */
export async function searchItems(req: Request, res: Response): Promise<void> {
    try {
        const { q, limit } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }

        const limitNum = limit ? Math.min(parseInt(limit as string), 20) : 10;

        const results = await MediaTagModel.searchItems(q, limitNum);
        res.json({ data: { results, query: q } });
    } catch (error) {
        console.error('Error searching items:', error);
        res.status(500).json({ error: 'Failed to search items' });
    }
}

/**
 * Get tagged content for a user
 * GET /api/users/:userId/tagged
 */
export async function getTaggedContentForUser(req: Request, res: Response): Promise<void> {
    try {
        const { userId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const content = await MediaTagModel.getTaggedContent('user', userId, pageNum, limitNum);
        res.json({ data: content });
    } catch (error) {
        console.error('Error getting tagged content for user:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}

/**
 * Get tagged content for a brand
 * GET /api/brands/:brandId/tagged
 */
export async function getTaggedContentForBrand(req: Request, res: Response): Promise<void> {
    try {
        const { brandId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const content = await MediaTagModel.getTaggedContent('brand', brandId, pageNum, limitNum);
        res.json({ data: content });
    } catch (error) {
        console.error('Error getting tagged content for brand:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}

/**
 * Get tagged content for a store
 * GET /api/stores/:storeId/tagged
 */
export async function getTaggedContentForStore(req: Request, res: Response): Promise<void> {
    try {
        const { storeId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const content = await MediaTagModel.getTaggedContent('store', storeId, pageNum, limitNum);
        res.json({ data: content });
    } catch (error) {
        console.error('Error getting tagged content for store:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}

/**
 * Get tagged content for a page
 * GET /api/pages/:pageId/tagged
 */
export async function getTaggedContentForPage(req: Request, res: Response): Promise<void> {
    try {
        const { pageId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const content = await MediaTagModel.getTaggedContent('page', pageId, pageNum, limitNum);
        res.json({ data: content });
    } catch (error) {
        console.error('Error getting tagged content for page:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}

/**
 * Get tagged content for a supplier
 * GET /api/suppliers/:supplierId/tagged
 */
export async function getTaggedContentForSupplier(req: Request, res: Response): Promise<void> {
    try {
        const { supplierId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const content = await MediaTagModel.getTaggedContent('supplier', supplierId, pageNum, limitNum);
        res.json({ data: content });
    } catch (error) {
        console.error('Error getting tagged content for supplier:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}

/**
 * Get tagged content for an item
 * GET /api/items/:itemId/tagged
 */
export async function getTaggedContentForItem(req: Request, res: Response): Promise<void> {
    try {
        const { itemId } = req.params;
        const { page, limit } = req.query;

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? Math.min(parseInt(limit as string), 50) : 20;

        const { tags, total } = await MediaTagModel.findByTaggedItem(itemId, limitNum, (pageNum - 1) * limitNum);

        res.json({
            data: {
                tags,
                total,
                page: pageNum,
                limit: limitNum,
                hasMore: (pageNum - 1) * limitNum + tags.length < total,
            }
        });
    } catch (error) {
        console.error('Error getting tagged content for item:', error);
        res.status(500).json({ error: 'Failed to get tagged content' });
    }
}
