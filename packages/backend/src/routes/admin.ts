import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { dbSyncController } from '../controllers/dbSyncController';
import { AuthUtils } from '../utils/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();
const adminController = new AdminController();

// All routes here require admin access
router.use(AuthUtils.authenticateToken, requireAdmin);

router.get('/users', adminController.getUsers.bind(adminController));
router.post('/users', adminController.createUser.bind(adminController));

// Entity verification management
router.get('/all-entities', adminController.getAllEntities.bind(adminController));
router.put('/entities/:entityId/verify', adminController.updateEntityVerification.bind(adminController));

// Database sync routes
router.get('/db/status', dbSyncController.getStatus);
router.post('/db/switch', dbSyncController.switchMode);
router.post('/db/sync/push', dbSyncController.pushToCloud);
router.post('/db/sync/pull', dbSyncController.pullFromCloud);

export default router;
