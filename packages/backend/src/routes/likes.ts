import { Router } from 'express';
import { LikesController } from '../controllers/likesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toggle like
router.post('/toggle', authenticateToken, LikesController.toggleLike);

// Check status
router.get('/status/:skuItemId', authenticateToken, LikesController.checkStatus);

// Get user likes
router.get('/user', authenticateToken, LikesController.getUserLikes);

export default router;
