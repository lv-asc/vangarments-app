import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    MoodboardModel,
    CreateMoodboardData,
    UpdateMoodboardData,
    CreateMoodboardElementData,
    UpdateMoodboardElementData
} from '../models/DesignFile';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// =====================================================
// Moodboard Routes
// =====================================================

/**
 * GET /api/moodboards
 * List user's moodboards
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { limit = '20', offset = '0' } = req.query;

        const result = await MoodboardModel.findByOwner(
            userId,
            parseInt(limit as string, 10),
            parseInt(offset as string, 10)
        );

        res.json(result);
    } catch (error) {
        console.error('Error fetching moodboards:', error);
        res.status(500).json({ error: 'Failed to fetch moodboards' });
    }
});

/**
 * GET /api/moodboards/:id
 * Get a specific moodboard with elements
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { includeElements = 'true' } = req.query;

        const moodboard = await MoodboardModel.findById(
            id,
            includeElements === 'true'
        );

        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }

        res.json(moodboard);
    } catch (error) {
        console.error('Error fetching moodboard:', error);
        res.status(500).json({ error: 'Failed to fetch moodboard' });
    }
});

/**
 * GET /api/moodboards/slug/:slug
 * Get a moodboard by slug
 */
router.get('/slug/:slug', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { slug } = req.params;

        const moodboard = await MoodboardModel.findBySlug(userId, slug);

        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }

        res.json(moodboard);
    } catch (error) {
        console.error('Error fetching moodboard by slug:', error);
        res.status(500).json({ error: 'Failed to fetch moodboard' });
    }
});

/**
 * POST /api/moodboards
 * Create a new moodboard
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const {
            brandId,
            title,
            slug,
            description,
            coverImage,
            visibility,
            canvasWidth,
            canvasHeight,
            backgroundColor
        } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const data: CreateMoodboardData = {
            ownerId: userId,
            brandId,
            title,
            slug,
            description,
            coverImage,
            visibility,
            canvasWidth,
            canvasHeight,
            backgroundColor
        };

        const moodboard = await MoodboardModel.create(data);
        res.status(201).json(moodboard);
    } catch (error) {
        console.error('Error creating moodboard:', error);
        res.status(500).json({ error: 'Failed to create moodboard' });
    }
});

/**
 * PUT /api/moodboards/:id
 * Update a moodboard
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        // Verify ownership
        const existingMoodboard = await MoodboardModel.findById(id, false);
        if (!existingMoodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (existingMoodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this moodboard' });
        }

        const updateData: UpdateMoodboardData = req.body;
        const moodboard = await MoodboardModel.update(id, updateData);

        res.json(moodboard);
    } catch (error) {
        console.error('Error updating moodboard:', error);
        res.status(500).json({ error: 'Failed to update moodboard' });
    }
});

/**
 * DELETE /api/moodboards/:id
 * Soft delete a moodboard
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        // Verify ownership
        const existingMoodboard = await MoodboardModel.findById(id, false);
        if (!existingMoodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (existingMoodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this moodboard' });
        }

        const deleted = await MoodboardModel.delete(id);

        if (deleted) {
            res.json({ success: true, message: 'Moodboard deleted' });
        } else {
            res.status(500).json({ error: 'Failed to delete moodboard' });
        }
    } catch (error) {
        console.error('Error deleting moodboard:', error);
        res.status(500).json({ error: 'Failed to delete moodboard' });
    }
});

/**
 * POST /api/moodboards/:id/duplicate
 * Duplicate a moodboard
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        const duplicated = await MoodboardModel.duplicate(id, userId);

        if (!duplicated) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }

        res.status(201).json(duplicated);
    } catch (error) {
        console.error('Error duplicating moodboard:', error);
        res.status(500).json({ error: 'Failed to duplicate moodboard' });
    }
});

// =====================================================
// Moodboard Element Routes
// =====================================================

/**
 * GET /api/moodboards/:id/elements
 * Get all elements for a moodboard
 */
router.get('/:id/elements', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const elements = await MoodboardModel.getElements(id);
        res.json(elements);
    } catch (error) {
        console.error('Error fetching elements:', error);
        res.status(500).json({ error: 'Failed to fetch elements' });
    }
});

/**
 * POST /api/moodboards/:id/elements
 * Add an element to a moodboard
 */
router.post('/:id/elements', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        // Verify ownership
        const moodboard = await MoodboardModel.findById(id, false);
        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (moodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const {
            elementType,
            positionX,
            positionY,
            width,
            height,
            rotation,
            zIndex,
            content,
            opacity,
            borderRadius,
            shadow,
            locked
        } = req.body;

        if (!elementType || !content) {
            return res.status(400).json({ error: 'elementType and content are required' });
        }

        const data: CreateMoodboardElementData = {
            moodboardId: id,
            elementType,
            positionX,
            positionY,
            width,
            height,
            rotation,
            zIndex,
            content,
            opacity,
            borderRadius,
            shadow,
            locked
        };

        const element = await MoodboardModel.addElement(data);
        res.status(201).json(element);
    } catch (error) {
        console.error('Error adding element:', error);
        res.status(500).json({ error: 'Failed to add element' });
    }
});

/**
 * PUT /api/moodboards/:id/elements/:elementId
 * Update an element
 */
router.put('/:id/elements/:elementId', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id, elementId } = req.params;

        // Verify ownership
        const moodboard = await MoodboardModel.findById(id, false);
        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (moodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updateData: UpdateMoodboardElementData = req.body;
        const element = await MoodboardModel.updateElement(elementId, updateData);

        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }

        res.json(element);
    } catch (error) {
        console.error('Error updating element:', error);
        res.status(500).json({ error: 'Failed to update element' });
    }
});

/**
 * DELETE /api/moodboards/:id/elements/:elementId
 * Remove an element
 */
router.delete('/:id/elements/:elementId', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id, elementId } = req.params;

        // Verify ownership
        const moodboard = await MoodboardModel.findById(id, false);
        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (moodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const removed = await MoodboardModel.removeElement(elementId);

        if (removed) {
            res.json({ success: true, message: 'Element removed' });
        } else {
            res.status(404).json({ error: 'Element not found' });
        }
    } catch (error) {
        console.error('Error removing element:', error);
        res.status(500).json({ error: 'Failed to remove element' });
    }
});

/**
 * PUT /api/moodboards/:id/elements/reorder
 * Reorder elements (update z-index)
 */
router.put('/:id/elements/reorder', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { elementOrder } = req.body;

        // Verify ownership
        const moodboard = await MoodboardModel.findById(id, false);
        if (!moodboard) {
            return res.status(404).json({ error: 'Moodboard not found' });
        }
        if (moodboard.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!elementOrder || !Array.isArray(elementOrder)) {
            return res.status(400).json({ error: 'elementOrder must be an array of element IDs' });
        }

        const elements = await MoodboardModel.reorderElements(id, elementOrder);
        res.json(elements);
    } catch (error) {
        console.error('Error reordering elements:', error);
        res.status(500).json({ error: 'Failed to reorder elements' });
    }
});

export default router;
