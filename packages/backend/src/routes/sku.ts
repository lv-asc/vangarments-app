import { Router } from 'express';
import { SKUController } from '../controllers/skuController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public search for SEO/metadata generation
router.get('/search', SKUController.searchSKUs);

// Brand specific SKU management
router.post('/brands/:brandId/skus', authenticateToken, SKUController.createSKU);
router.get('/brands/:brandId/skus', authenticateToken, SKUController.getBrandSKUs);

// SKU CRUD
router.get('/', authenticateToken, SKUController.getAllSKUs);
router.get('/skus/:id/related', SKUController.getRelatedSKUs); // Public
router.get('/skus/:id', authenticateToken, SKUController.getSKU);
router.patch('/skus/:id', authenticateToken, SKUController.updateSKU);
router.delete('/skus/:id', authenticateToken, SKUController.deleteSKU);

// Trash management (Admin only)
router.get('/trash', authenticateToken, SKUController.getDeletedSKUs);
router.post('/skus/:id/restore', authenticateToken, SKUController.restoreSKU);
router.delete('/skus/:id/permanent', authenticateToken, SKUController.permanentDeleteSKU);

export default router;
// Refreshed: 2025-12-23
