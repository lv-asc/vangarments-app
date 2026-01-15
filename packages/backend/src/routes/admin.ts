import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { dbSyncController } from '../controllers/dbSyncController';
import { AuthUtils } from '../utils/auth';
import { requireAdmin } from '../middleware/adminAuth';
import multer from 'multer';

// Configure multer for admin uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = Router();
const adminController = new AdminController();

// All routes here require admin access
router.use(AuthUtils.authenticateToken, requireAdmin);

router.get('/users', adminController.getUsers.bind(adminController));
router.post('/users', adminController.createUser.bind(adminController));

// Admin User Management Extensions
router.post('/users/:userId/avatar', upload.single('avatar'), adminController.uploadUserAvatar.bind(adminController));
router.post('/users/:userId/banner', upload.single('banner'), adminController.uploadUserBanner.bind(adminController));

router.get('/users/:userId/follows', adminController.getUserFollows.bind(adminController));
router.post('/users/:userId/follows', adminController.addUserFollow.bind(adminController));
router.delete('/users/:userId/follows/:targetId', adminController.removeUserFollow.bind(adminController));

// Entity verification management
router.get('/all-entities', adminController.getAllEntities.bind(adminController));
router.put('/entities/:entityId/verify', adminController.updateEntityVerification.bind(adminController));

// Database sync routes
router.get('/db/status', dbSyncController.getStatus);
router.post('/db/switch', dbSyncController.switchMode);
router.post('/db/sync/push', dbSyncController.pushToCloud);
router.post('/db/sync/pull', dbSyncController.pullFromCloud);

export default router;
