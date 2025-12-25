import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DesignFileModel, CreateDesignFileData, UpdateDesignFileData } from '../models/DesignFile';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// =====================================================
// Design File Routes
// =====================================================

/**
 * GET /api/design-files
 * List user's design files with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const {
            brandId,
            fileType,
            visibility,
            tags,
            search,
            limit = '50',
            offset = '0'
        } = req.query;

        const filters = {
            brandId: brandId as string | undefined,
            fileType: fileType as string | undefined,
            visibility: visibility as string | undefined,
            tags: tags ? (tags as string).split(',') : undefined,
            search: search as string | undefined
        };

        const result = await DesignFileModel.findByOwner(
            userId,
            filters,
            parseInt(limit as string, 10),
            parseInt(offset as string, 10)
        );

        res.json(result);
    } catch (error) {
        console.error('Error fetching design files:', error);
        res.status(500).json({ error: 'Failed to fetch design files' });
    }
});

/**
 * GET /api/design-files/brand/:brandId
 * List design files for a specific brand
 */
router.get('/brand/:brandId', async (req: Request, res: Response) => {
    try {
        const { brandId } = req.params;
        const { limit = '50', offset = '0' } = req.query;

        const result = await DesignFileModel.findByBrand(
            brandId,
            parseInt(limit as string, 10),
            parseInt(offset as string, 10)
        );

        res.json(result);
    } catch (error) {
        console.error('Error fetching brand design files:', error);
        res.status(500).json({ error: 'Failed to fetch design files' });
    }
});

/**
 * GET /api/design-files/:id
 * Get a specific design file
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = await DesignFileModel.findById(id);

        if (!file) {
            return res.status(404).json({ error: 'Design file not found' });
        }

        res.json(file);
    } catch (error) {
        console.error('Error fetching design file:', error);
        res.status(500).json({ error: 'Failed to fetch design file' });
    }
});

/**
 * POST /api/design-files
 * Create a new design file record
 * Note: File upload to GCS should be handled separately
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const {
            brandId,
            filename,
            originalFilename,
            fileType,
            mimeType,
            fileSizeBytes,
            gcsPath,
            thumbnailPath,
            metadata,
            tags,
            visibility
        } = req.body;

        // Validate required fields
        if (!filename || !originalFilename || !fileType || !mimeType || !fileSizeBytes || !gcsPath) {
            return res.status(400).json({
                error: 'Missing required fields: filename, originalFilename, fileType, mimeType, fileSizeBytes, gcsPath'
            });
        }

        const data: CreateDesignFileData = {
            ownerId: userId,
            brandId,
            filename,
            originalFilename,
            fileType,
            mimeType,
            fileSizeBytes,
            gcsPath,
            thumbnailPath,
            metadata,
            tags,
            visibility
        };

        const file = await DesignFileModel.create(data);
        res.status(201).json(file);
    } catch (error) {
        console.error('Error creating design file:', error);
        res.status(500).json({ error: 'Failed to create design file' });
    }
});

/**
 * PUT /api/design-files/:id
 * Update a design file
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        // Verify ownership
        const existingFile = await DesignFileModel.findById(id);
        if (!existingFile) {
            return res.status(404).json({ error: 'Design file not found' });
        }
        if (existingFile.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this file' });
        }

        const updateData: UpdateDesignFileData = req.body;
        const file = await DesignFileModel.update(id, updateData);

        res.json(file);
    } catch (error) {
        console.error('Error updating design file:', error);
        res.status(500).json({ error: 'Failed to update design file' });
    }
});

/**
 * DELETE /api/design-files/:id
 * Soft delete a design file
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        // Verify ownership
        const existingFile = await DesignFileModel.findById(id);
        if (!existingFile) {
            return res.status(404).json({ error: 'Design file not found' });
        }
        if (existingFile.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this file' });
        }

        const deleted = await DesignFileModel.delete(id);

        if (deleted) {
            res.json({ success: true, message: 'Design file deleted' });
        } else {
            res.status(500).json({ error: 'Failed to delete design file' });
        }
    } catch (error) {
        console.error('Error deleting design file:', error);
        res.status(500).json({ error: 'Failed to delete design file' });
    }
});

/**
 * POST /api/design-files/:id/tags
 * Add tags to a design file
 */
router.post('/:id/tags', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { tags } = req.body;

        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({ error: 'Tags must be an array' });
        }

        // Verify ownership
        const existingFile = await DesignFileModel.findById(id);
        if (!existingFile) {
            return res.status(404).json({ error: 'Design file not found' });
        }
        if (existingFile.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const file = await DesignFileModel.addTags(id, tags);
        res.json(file);
    } catch (error) {
        console.error('Error adding tags:', error);
        res.status(500).json({ error: 'Failed to add tags' });
    }
});

/**
 * DELETE /api/design-files/:id/tags/:tag
 * Remove a tag from a design file
 */
router.delete('/:id/tags/:tag', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id, tag } = req.params;

        // Verify ownership
        const existingFile = await DesignFileModel.findById(id);
        if (!existingFile) {
            return res.status(404).json({ error: 'Design file not found' });
        }
        if (existingFile.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const file = await DesignFileModel.removeTag(id, tag);
        res.json(file);
    } catch (error) {
        console.error('Error removing tag:', error);
        res.status(500).json({ error: 'Failed to remove tag' });
    }
});

export default router;
