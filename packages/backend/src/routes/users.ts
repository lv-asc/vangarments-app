import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected user routes
router.put('/measurements', AuthUtils.authenticateToken, UserController.updateMeasurements);
router.put('/address', AuthUtils.authenticateToken, UserController.updateAddress);
router.put('/preferences', AuthUtils.authenticateToken, UserController.updatePreferences);

// Public user routes
router.get('/:id/profile', UserController.getProfile);
router.put('/profile', AuthUtils.authenticateToken, UserController.updateBasicProfile);
router.get('/check-username/:username', UserController.checkUsernameAvailability);
router.post('/avatar', AuthUtils.authenticateToken, UserController.uploadAvatarMiddleware, UserController.uploadAvatar);

// Public utility routes
router.get('/size-conversion', UserController.convertSize);
router.get('/size-chart', UserController.getSizeChart);

export default router;