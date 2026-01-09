import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DesignFileModel, CreateDesignFileData, UpdateDesignFileData } from '../models/DesignFile';
import { db } from '../database/connection';
import { GoogleCloudService } from '../services/googleCloudService';

const router = Router();

// Development-only routes (no auth required)
if (process.env.NODE_ENV === 'development') {
    // Dev route for listing design files without auth (excludes mockups)
    router.get('/list-dev', async (req: Request, res: Response) => {
        try {
            const { limit = '50', offset = '0' } = req.query;

            // Query directly to exclude mockups from design files
            const countQuery = `
                SELECT COUNT(*) FROM design_files 
                WHERE owner_id = $1 AND deleted_at IS NULL AND file_type != 'mockup'
            `;
            const query = `
                SELECT * FROM design_files 
                WHERE owner_id = $1 AND deleted_at IS NULL AND file_type != 'mockup'
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const devUserId = '00000000-0000-0000-0000-000000000000';

            const [countResult, filesResult] = await Promise.all([
                db.query(countQuery, [devUserId]),
                db.query(query, [devUserId, parseInt(limit as string, 10), parseInt(offset as string, 10)])
            ]);

            res.json({
                files: filesResult.rows.map((row: any) => ({
                    id: row.id,
                    ownerId: row.owner_id,
                    brandId: row.brand_id,
                    filename: row.filename,
                    originalFilename: row.original_filename,
                    fileType: row.file_type,
                    mimeType: row.mime_type,
                    fileSizeBytes: parseInt(row.file_size_bytes, 10),
                    gcsPath: row.gcs_path,
                    thumbnailPath: row.thumbnail_path,
                    metadata: row.metadata || {},
                    tags: row.tags || [],
                    visibility: row.visibility,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                })),
                total: parseInt(countResult.rows[0].count, 10)
            });
        } catch (error) {
            console.error('Error fetching design files (dev):', error);
            res.status(500).json({ error: 'Failed to fetch design files' });
        }
    });

    // Dev route for uploading design files without auth
    router.post('/upload-dev', async (req: Request, res: Response) => {
        // Use multer for file upload
        const multer = require('multer');
        const path = require('path');
        const fs = require('fs/promises');
        const { v4: uuidv4 } = require('uuid');

        const STORAGE_DIR = path.join(process.cwd(), 'storage', 'design-files');

        // Ensure storage directory exists
        await fs.mkdir(STORAGE_DIR, { recursive: true });

        const storage = multer.memoryStorage();
        const upload = multer({
            storage,
            limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        }).single('file');

        upload(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ error: 'File upload failed', details: err.message });
            }

            try {
                const file = (req as any).file;
                if (!file) {
                    return res.status(400).json({ error: 'No file provided' });
                }

                const fileId = uuidv4();
                const ext = path.extname(file.originalname).toLowerCase();
                const filename = `${fileId}${ext}`;
                const filePath = path.join(STORAGE_DIR, filename);

                // Save file to disk
                await fs.writeFile(filePath, file.buffer);

                // Determine file type based on extension
                let fileType = 'raster';
                if (['.ai', '.eps', '.svg'].includes(ext)) fileType = 'vector';
                else if (['.obj', '.fbx', '.gltf', '.glb'].includes(ext)) fileType = '3d_model';
                else if (['.sketch'].includes(ext)) fileType = 'sketch';

                const name = req.body.name || file.originalname.replace(ext, '');

                // Create database entry
                const designFile = await DesignFileModel.create({
                    ownerId: '00000000-0000-0000-0000-000000000000', // Dev user
                    filename,
                    originalFilename: file.originalname,
                    fileType: fileType as any,
                    mimeType: file.mimetype,
                    fileSizeBytes: file.size,
                    gcsPath: `/storage/design-files/${filename}`,
                    metadata: { name, description: req.body.description || '' }
                });

                // Sync to GCS
                try {
                    console.log(`Uploading design file to GCS: design-files/${filename}`);
                    await GoogleCloudService.uploadImage(file.buffer, `design-files/${filename}`, file.mimetype);
                } catch (gcsError) {
                    console.error('GCS Upload failed (design-file dev):', gcsError);
                }

                res.status(201).json(designFile);
            } catch (error) {
                console.error('Error processing upload (dev):', error);
                res.status(500).json({ error: 'Failed to process upload' });
            }
        });
    });

    // Dev route for deleting design files without auth
    router.delete('/delete-dev/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await DesignFileModel.delete(id);

            if (deleted) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'File not found' });
            }
        } catch (error) {
            console.error('Error deleting file (dev):', error);
            res.status(500).json({ error: 'Failed to delete file' });
        }
    });
}

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
