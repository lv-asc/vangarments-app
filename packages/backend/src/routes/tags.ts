import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import * as tagController from '../controllers/tagController';

const router = Router();

// Tag management endpoints
router.post('/', authenticate, tagController.addTag);
router.get('/', optionalAuthenticate, tagController.getTagsBySource);
router.get('/:tagId', optionalAuthenticate, tagController.getTag);
router.patch('/:tagId', authenticate, tagController.updateTag);
router.delete('/:tagId', authenticate, tagController.deleteTag);

// Search endpoints
router.get('/search/entities', optionalAuthenticate, tagController.searchEntities);
router.get('/search/items', optionalAuthenticate, tagController.searchItems);

export default router;
