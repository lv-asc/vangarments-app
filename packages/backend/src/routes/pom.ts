import { Router } from 'express';
import { POMController } from '../controllers/pomController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/categories', POMController.getCategories);
router.get('/definitions', POMController.getDefinitions);
router.get('/apparel/:apparelId', POMController.getApparelPOMs);
router.get('/package-types', POMController.getPackageMeasurementTypes);
router.get('/user-types', POMController.getUserMeasurementTypes);

// SKU measurements
router.get('/sku/:skuId', POMController.getSKUMeasurements);
router.post('/sku/:skuId', authenticateToken, POMController.saveSKUMeasurements);

// Admin routes (require authentication)
router.post('/apparel/:apparelId', authenticateToken, POMController.setApparelPOMs);
router.post('/definition', authenticateToken, POMController.upsertPOMDefinition);
router.delete('/definition/:id', authenticateToken, POMController.deletePOMDefinition);
router.post('/package-type', authenticateToken, POMController.upsertPackageMeasurementType);
router.post('/user-type', authenticateToken, POMController.upsertUserMeasurementType);

export default router;
