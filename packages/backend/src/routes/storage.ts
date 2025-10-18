import { Router } from 'express';
import { StorageController } from '../controllers/storageController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Serve images (public access for now, can be restricted later)
router.get('/images/:category/:userId/:filename', StorageController.serveImage);
router.get('/images/:category/:filename', StorageController.serveImage);

// Admin-only storage management routes
router.get('/stats', authenticateToken, requireAdmin, StorageController.getStorageStats);
router.post('/cleanup', authenticateToken, requireAdmin, StorageController.cleanupTempFiles);

export default router;