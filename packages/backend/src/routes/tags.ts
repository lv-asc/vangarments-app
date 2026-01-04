import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as tagController from '../controllers/tagController';

const router = Router();

// Tag management endpoints
router.post('/', authenticateToken, tagController.addTag);
router.get('/', tagController.getTagsBySource);
router.get('/:tagId', tagController.getTag);
router.patch('/:tagId', authenticateToken, tagController.updateTag);
router.delete('/:tagId', authenticateToken, tagController.deleteTag);

// Search endpoints
router.get('/search/entities', tagController.searchEntities);
router.get('/search/items', tagController.searchItems);

export default router;

