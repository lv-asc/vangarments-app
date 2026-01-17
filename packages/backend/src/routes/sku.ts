import { Router } from 'express';
import { SKUController } from '../controllers/skuController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public search for SEO/metadata generation
router.get('/search', SKUController.searchSKUs);
router.get('/release-date-options', SKUController.getReleaseDateOptions);

// Brand specific SKU management
router.post('/brands/:brandId/skus', authenticateToken, SKUController.createSKU);
router.get('/brands/:brandId/skus', authenticateToken, SKUController.getBrandSKUs);

// SKU CRUD
router.get('/', authenticateToken, SKUController.getAllSKUs);
router.get('/:id/related', SKUController.getRelatedSKUs); // Public
router.get('/:id', SKUController.getSKU);
router.patch('/:id', authenticateToken, SKUController.updateSKU);
router.delete('/:id', authenticateToken, SKUController.deleteSKU);

// Trash management (Admin only)
router.get('/trash', authenticateToken, SKUController.getDeletedSKUs);
router.post('/:id/restore', authenticateToken, SKUController.restoreSKU);
router.delete('/:id/permanent', authenticateToken, SKUController.permanentDeleteSKU);

export default router;
// Refreshed: 2025-12-23
