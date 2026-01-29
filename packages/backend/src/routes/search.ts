import express from 'express';
import { EntitySearchController } from '../controllers/entitySearchController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Search for entities (Users, Brands, Stores)
router.get('/entities', authenticateToken, EntitySearchController.searchEntities);

export default router;
