
import { Router } from 'express';
import { SocialController } from '../controllers/socialController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// --- User Follows ---
// Follow a user
router.post('/users/:userId/follow', authenticateToken, SocialController.followUser);

// Unfollow a user
router.delete('/users/:userId/follow', authenticateToken, SocialController.unfollowUser);

// Get follow status
router.get('/users/:userId/follow-status', authenticateToken, SocialController.getFollowStatus);

// Get followers of a user
router.get('/users/:userId/followers', SocialController.getUserFollowers);

// Get who a user is following
router.get('/users/:userId/following', SocialController.getUserFollowing);

// Get entities a user is following
router.get('/users/:userId/following-entities', SocialController.getUserFollowingEntities);

// Get mutual connections
router.get('/users/:userId/mutual-connections', authenticateToken, SocialController.getMutualConnections);


// --- Entity Follows (Brands, Stores, etc) ---
// Follow an entity
router.post('/entities/:entityType/:entityId/follow', authenticateToken, SocialController.followEntity);

// Unfollow an entity
router.delete('/entities/:entityType/:entityId/follow', authenticateToken, SocialController.unfollowEntity);

// Get entity follow status
router.get('/entities/:entityType/:entityId/follow-status', authenticateToken, SocialController.getEntityFollowStatus);

// Get followers of an entity
router.get('/entities/:entityType/:entityId/followers', SocialController.getEntityFollowers);

export default router;
