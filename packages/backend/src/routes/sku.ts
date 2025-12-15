import { Router } from 'express';
import { SKUController } from '../controllers/skuController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public search (or authenticated but generic)
router.get('/search', authenticateToken, SKUController.searchSKUs);

// Brand specific SKU management
router.post('/brands/:brandId/skus', authenticateToken, SKUController.createSKU);
router.get('/brands/:brandId/skus', authenticateToken, SKUController.getBrandSKUs);

// SKU CRUD
router.get('/', authenticateToken, SKUController.getAllSKUs);
router.get('/skus/:id', authenticateToken, SKUController.getSKU);
router.patch('/skus/:id', authenticateToken, SKUController.updateSKU);
router.delete('/skus/:id', authenticateToken, SKUController.deleteSKU);

export default router;
