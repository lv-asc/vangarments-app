import { Router } from 'express';
import { AnteroomController } from '../controllers/anteroomController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected anteroom routes - basic CRUD
router.post('/items', AuthUtils.authenticateToken, AnteroomController.addItem);
router.get('/items', AuthUtils.authenticateToken, AnteroomController.getUserItems);
router.put('/items/:id', AuthUtils.authenticateToken, AnteroomController.updateItem);
router.post('/items/:id/complete', AuthUtils.authenticateToken, AnteroomController.completeItem);
router.delete('/items/:id', AuthUtils.authenticateToken, AnteroomController.removeItem);

// New batch and bulk operations
router.get('/count', AuthUtils.authenticateToken, AnteroomController.getItemCount);
router.post(
    '/items/batch',
    AuthUtils.authenticateToken,
    AnteroomController.uploadMiddleware,
    AnteroomController.addBatchItems
);
router.post(
    '/items/with-images',
    AuthUtils.authenticateToken,
    AnteroomController.uploadMiddleware,
    AnteroomController.addItemWithImages
);
router.post('/items/bulk-update', AuthUtils.authenticateToken, AnteroomController.applyQualityBulk);

// Admin/system routes
router.post('/cleanup', AnteroomController.cleanupExpired);

export default router;