import { Router } from 'express';
import { AnteroomController } from '../controllers/anteroomController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected anteroom routes
router.post('/items', AuthUtils.authenticateToken, AnteroomController.addItem);
router.get('/items', AuthUtils.authenticateToken, AnteroomController.getUserItems);
router.put('/items/:id', AuthUtils.authenticateToken, AnteroomController.updateItem);
router.post('/items/:id/complete', AuthUtils.authenticateToken, AnteroomController.completeItem);
router.delete('/items/:id', AuthUtils.authenticateToken, AnteroomController.removeItem);

// Admin/system routes
router.post('/cleanup', AnteroomController.cleanupExpired);

export default router;