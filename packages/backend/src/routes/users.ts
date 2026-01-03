import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected user routes
router.put('/profile', AuthUtils.authenticateToken, UserController.updateBasicProfile);
router.put('/measurements', AuthUtils.authenticateToken, UserController.updateMeasurements);
router.put('/address', AuthUtils.authenticateToken, UserController.updateAddress);
router.put('/preferences', AuthUtils.authenticateToken, UserController.updatePreferences);
router.put('/preferences/notifications', AuthUtils.authenticateToken, UserController.updateNotificationPreferences);
router.post('/activity', AuthUtils.authenticateToken, UserController.updateActivity);

// Public user routes
router.get('/', AuthUtils.authenticateToken, UserController.getAllUsers);
router.get('/team-memberships', AuthUtils.authenticateToken, UserController.getAllTeamMemberships);
router.get('/my-memberships', AuthUtils.authenticateToken, UserController.getMyMemberships);
router.get('/:id/profile', UserController.getProfile);
router.get('/u/:username', UserController.getByUsername);
router.get('/check-username/:username', UserController.checkUsernameAvailability);
router.get('/lookup-cep/:cep', UserController.lookupCEP);
router.post('/avatar', AuthUtils.authenticateToken, UserController.uploadAvatarMiddleware, UserController.uploadAvatar);
router.post('/banner', AuthUtils.authenticateToken, UserController.uploadBannerMiddleware, UserController.uploadBanner);
router.put('/profile-images', AuthUtils.authenticateToken, UserController.updateProfileImages);
router.put('/banner-images', AuthUtils.authenticateToken, UserController.updateBannerImages);

// Public utility routes
router.get('/size-conversion', UserController.convertSize);
router.get('/size-chart', UserController.getSizeChart);

// Privacy settings routes
router.put('/privacy', AuthUtils.authenticateToken, UserController.updatePrivacySettings);

// Follow request routes
router.get('/follow-requests', AuthUtils.authenticateToken, UserController.getFollowRequests);
router.get('/follow-requests/count', AuthUtils.authenticateToken, UserController.getFollowRequestCount);
router.post('/follow-requests/:requesterId/accept', AuthUtils.authenticateToken, UserController.acceptFollowRequest);
router.delete('/follow-requests/:requesterId', AuthUtils.authenticateToken, UserController.declineFollowRequest);
router.get('/follow-status/:userId', AuthUtils.authenticateToken, UserController.getFollowStatus);

// Admin user management (must be last to avoid conflict with static paths)
router.get('/:id', AuthUtils.authenticateToken, UserController.getUserById);
router.put('/:id', AuthUtils.authenticateToken, UserController.adminUpdateUser);
router.post('/:id/ban', AuthUtils.authenticateToken, UserController.banUser);
router.post('/:id/deactivate', AuthUtils.authenticateToken, UserController.deactivateUser);
router.post('/:id/reactivate', AuthUtils.authenticateToken, UserController.reactivateUser);
router.post('/:id/restore', AuthUtils.authenticateToken, UserController.restoreUser);
router.delete('/:id', AuthUtils.authenticateToken, UserController.deleteUser);

// Verification endpoints (admin only)
router.put('/:id/verify', AuthUtils.authenticateToken, UserController.verifyUser);
router.put('/:id/unverify', AuthUtils.authenticateToken, UserController.unverifyUser);

// Tagged content endpoint
import { getTaggedContentForUser } from '../controllers/tagController';
router.get('/:userId/tagged', getTaggedContentForUser);

export default router;