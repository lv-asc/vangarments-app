import { Router } from 'express';
import { VUFSController } from '../controllers/vufsController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Protected VUFS item routes
router.post('/items', AuthUtils.authenticateToken, VUFSController.createItem);
router.get('/items/my', AuthUtils.authenticateToken, VUFSController.getUserItems);
router.get('/items/stats', AuthUtils.authenticateToken, VUFSController.getUserStats);
router.put('/items/:id', AuthUtils.authenticateToken, VUFSController.updateItem);
router.delete('/items/:id', AuthUtils.authenticateToken, VUFSController.deleteItem);

// Public VUFS item routes
router.get('/items/search', VUFSController.searchItems);
router.get('/items/:id', VUFSController.getItem);
router.get('/code/:vufsCode', VUFSController.getItemByVUFSCode);

// VUFS utility routes
router.get('/validate/:code', VUFSController.validateVUFSCode);

export default router;