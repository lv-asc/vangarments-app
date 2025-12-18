import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected user routes
router.put('/profile', AuthUtils.authenticateToken, UserController.updateBasicProfile);
router.put('/measurements', AuthUtils.authenticateToken, UserController.updateMeasurements);
router.put('/address', AuthUtils.authenticateToken, UserController.updateAddress);
router.put('/preferences', AuthUtils.authenticateToken, UserController.updatePreferences);
router.post('/activity', AuthUtils.authenticateToken, UserController.updateActivity);

// Public user routes
router.get('/', AuthUtils.authenticateToken, UserController.getAllUsers);
router.get('/:id/profile', UserController.getProfile);
router.get('/u/:username', UserController.getByUsername);
router.get('/check-username/:username', UserController.checkUsernameAvailability);
router.post('/avatar', AuthUtils.authenticateToken, UserController.uploadAvatarMiddleware, UserController.uploadAvatar);

// Public utility routes
router.get('/size-conversion', UserController.convertSize);
router.get('/size-chart', UserController.getSizeChart);

// Admin user management (must be last to avoid conflict with static paths)
router.get('/:id', AuthUtils.authenticateToken, UserController.getUserById);
router.put('/:id', AuthUtils.authenticateToken, UserController.adminUpdateUser);
router.post('/:id/ban', AuthUtils.authenticateToken, UserController.banUser);
router.post('/:id/deactivate', AuthUtils.authenticateToken, UserController.deactivateUser);
router.post('/:id/reactivate', AuthUtils.authenticateToken, UserController.reactivateUser);
router.delete('/:id', AuthUtils.authenticateToken, UserController.deleteUser);

export default router;