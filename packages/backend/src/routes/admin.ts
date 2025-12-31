import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
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

export default router;
