import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthUtils } from '../utils/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Admin-specific routes
router.post('/admin/login', AuthController.adminLogin);
router.post('/admin/initialize', AuthController.initializeAdmin);

// Protected routes
router.get('/profile', AuthUtils.authenticateToken, AuthController.getProfile);
router.put('/profile', AuthUtils.authenticateToken, AuthController.updateProfile);
router.post('/refresh', AuthUtils.authenticateToken, AuthController.refreshToken);

// Admin-only routes
router.post('/admin/grant-role', AuthUtils.authenticateToken, requireAdmin, AuthController.grantAdminRole);
router.get('/admin/users', AuthUtils.authenticateToken, requireAdmin, AuthController.getAdminUsers);

export default router;