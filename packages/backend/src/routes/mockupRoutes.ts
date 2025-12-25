import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { DesignFileModel, CreateDesignFileData } from '../models/DesignFile';

// @ts-ignore - psd library doesn't have types
import PSD from 'psd';

const router = Router();

// Configure multer for mockup file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'image/vnd.adobe.photoshop',  // PSD mime type
        'application/x-photoshop',     // Alternative PSD mime type
        'application/photoshop',       // Alternative PSD mime type
        'application/psd',             // Alternative PSD mime type
        'image/psd'                    // Alternative PSD mime type
    ];

    // Also check by extension for PSD files
    const ext = path.extname(file.originalname).toLowerCase();
    const isPSD = ext === '.psd';

    if (allowedMimes.includes(file.mimetype) || isPSD) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PNG, JPG, WEBP, SVG, PDF, PSD`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max (PSDs can be large)
    }
});

// Storage directory for mockups
const MOCKUP_STORAGE_DIR = path.join(process.cwd(), 'storage', 'mockups');

// Ensure storage directory exists
async function ensureStorageDir() {
    try {
        await fs.mkdir(MOCKUP_STORAGE_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating mockup storage directory:', error);
    }
}
ensureStorageDir();

/**
 * Convert PSD to PNG
 * Returns the PNG buffer and dimensions
 */
async function convertPsdToPng(buffer: Buffer): Promise<{ pngBuffer: Buffer; width: number; height: number }> {
    // Write buffer to temp file (psd library requires file path)
    const tempPath = path.join(MOCKUP_STORAGE_DIR, `temp_${uuidv4()}.psd`);
    await fs.writeFile(tempPath, buffer);

    try {
        const psd = await PSD.open(tempPath);
        const png = psd.image.toPng();

        // Get dimensions
        const width = psd.header.width;
        const height = psd.header.height;

        // Convert to buffer
        const pngBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = png.pack();
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });

        return { pngBuffer, width, height };
    } finally {
        // Clean up temp file
        try {
            await fs.unlink(tempPath);
        } catch (e) {
            console.warn('Failed to clean up temp PSD file:', e);
        }
    }
}

// All routes require authentication
router.use(authenticateToken);

// =====================================================
// Mockup Routes
// =====================================================

/**
 * GET /api/mockups
 * List user's mockup files
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { limit = '50', offset = '0' } = req.query;

        // Get mockups from design_files where file_type = 'mockup'
        const result = await DesignFileModel.findByOwner(
            userId,
            { fileType: 'mockup' },
            parseInt(limit as string, 10),
            parseInt(offset as string, 10)
        );

        res.json({
            mockups: result.files,
            total: result.total
        });
    } catch (error) {
        console.error('Error fetching mockups:', error);
        res.status(500).json({ error: 'Failed to fetch mockups' });
    }
});

/**
 * POST /api/mockups/upload
 * Upload a new mockup file
 * PSD files are automatically converted to PNG for preview
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { name, description } = req.body;
        const ext = path.extname(file.originalname).toLowerCase();
        const isPSD = ext === '.psd';

        let uniqueFilename: string;
        let storagePath: string;
        let previewFilename: string | undefined;
        let previewPath: string | undefined;
        let fileBuffer = file.buffer;
        let mimeType = file.mimetype;
        let psdDimensions: { width: number; height: number } | undefined;

        // Generate unique filename
        const baseId = uuidv4();

        if (isPSD) {
            // Save original PSD
            uniqueFilename = `${baseId}.psd`;
            storagePath = path.join(MOCKUP_STORAGE_DIR, uniqueFilename);
            await fs.writeFile(storagePath, file.buffer);

            // Convert to PNG for preview
            try {
                console.log('Converting PSD to PNG...');
                const { pngBuffer, width, height } = await convertPsdToPng(file.buffer);

                previewFilename = `${baseId}_preview.png`;
                previewPath = path.join(MOCKUP_STORAGE_DIR, previewFilename);
                await fs.writeFile(previewPath, pngBuffer);

                psdDimensions = { width, height };
                console.log(`PSD converted: ${width}x${height}`);
            } catch (conversionError) {
                console.error('PSD conversion failed:', conversionError);
                // Continue without preview - original PSD is still saved
            }
        } else {
            // Regular file - save as-is
            uniqueFilename = `${baseId}${ext}`;
            storagePath = path.join(MOCKUP_STORAGE_DIR, uniqueFilename);
            await fs.writeFile(storagePath, file.buffer);
        }

        // Create database record
        const data: CreateDesignFileData = {
            ownerId: userId,
            filename: uniqueFilename,
            originalFilename: file.originalname,
            fileType: 'mockup',
            mimeType: isPSD ? 'image/vnd.adobe.photoshop' : mimeType,
            fileSizeBytes: file.size,
            gcsPath: `/storage/mockups/${uniqueFilename}`,
            thumbnailPath: previewFilename ? `/storage/mockups/${previewFilename}` : undefined,
            metadata: {
                description: description || '',
                name: name || file.originalname,
                isPSD,
                previewFilename,
                originalFormat: ext.replace('.', ''),
                ...(psdDimensions && { width: psdDimensions.width, height: psdDimensions.height })
            },
            visibility: 'private'
        };

        const mockup = await DesignFileModel.create(data);

        res.status(201).json({
            ...mockup,
            url: `/api/mockups/${mockup.id}/file`,
            previewUrl: previewFilename ? `/api/mockups/${mockup.id}/preview` : undefined
        });
    } catch (error) {
        console.error('Error uploading mockup:', error);
        res.status(500).json({ error: 'Failed to upload mockup' });
    }
});

/**
 * GET /api/mockups/:id
 * Get a specific mockup
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        // Check ownership
        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(mockup);
    } catch (error) {
        console.error('Error fetching mockup:', error);
        res.status(500).json({ error: 'Failed to fetch mockup' });
    }
});

/**
 * GET /api/mockups/:id/file
 * Serve the actual mockup file (original)
 */
router.get('/:id/file', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        // Check ownership
        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // For PSD files, serve the preview PNG instead for browser display
        const isPSD = mockup.metadata?.isPSD;
        let filePath: string;
        let contentType: string;
        let filename: string;

        if (isPSD && mockup.metadata?.previewFilename) {
            // Serve preview for browser display
            filePath = path.join(MOCKUP_STORAGE_DIR, mockup.metadata.previewFilename);
            contentType = 'image/png';
            filename = mockup.originalFilename.replace('.psd', '_preview.png');
        } else {
            filePath = path.join(MOCKUP_STORAGE_DIR, mockup.filename);
            contentType = mockup.mimeType;
            filename = mockup.originalFilename;
        }

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error serving mockup file:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

/**
 * GET /api/mockups/:id/preview
 * Serve the PNG preview (for PSD files)
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const previewFilename = mockup.metadata?.previewFilename;
        if (!previewFilename) {
            return res.status(404).json({ error: 'No preview available' });
        }

        const filePath = path.join(MOCKUP_STORAGE_DIR, previewFilename);

        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Preview file not found' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${mockup.originalFilename.replace('.psd', '_preview.png')}"`);

        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error serving preview:', error);
        res.status(500).json({ error: 'Failed to serve preview' });
    }
});

/**
 * GET /api/mockups/:id/download
 * Download the original file (useful for PSD)
 */
router.get('/:id/download', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const filePath = path.join(MOCKUP_STORAGE_DIR, mockup.filename);

        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.setHeader('Content-Type', mockup.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${mockup.originalFilename}"`);

        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error downloading mockup:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

/**
 * PUT /api/mockups/:id
 * Update mockup metadata
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { name, description } = req.body;
        const updates = {
            metadata: {
                ...mockup.metadata,
                name: name || mockup.metadata?.name,
                description: description || mockup.metadata?.description
            }
        };

        const updated = await DesignFileModel.update(id, updates);
        res.json(updated);
    } catch (error) {
        console.error('Error updating mockup:', error);
        res.status(500).json({ error: 'Failed to update mockup' });
    }
});

/**
 * DELETE /api/mockups/:id
 * Delete a mockup
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const mockup = await DesignFileModel.findById(id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        if (mockup.ownerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete main file from disk
        const filePath = path.join(MOCKUP_STORAGE_DIR, mockup.filename);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn('Could not delete main file from disk:', error);
        }

        // Delete preview file if exists (for PSDs)
        const previewFilename = mockup.metadata?.previewFilename;
        if (previewFilename) {
            const previewPath = path.join(MOCKUP_STORAGE_DIR, previewFilename);
            try {
                await fs.unlink(previewPath);
            } catch (error) {
                console.warn('Could not delete preview file from disk:', error);
            }
        }

        // Soft delete from database
        const deleted = await DesignFileModel.delete(id);

        if (deleted) {
            res.json({ success: true, message: 'Mockup deleted' });
        } else {
            res.status(500).json({ error: 'Failed to delete mockup' });
        }
    } catch (error) {
        console.error('Error deleting mockup:', error);
        res.status(500).json({ error: 'Failed to delete mockup' });
    }
});

export default router;
