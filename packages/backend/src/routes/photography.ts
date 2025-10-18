import { Router } from 'express';
import { PhotographyController } from '../controllers/photographyController';

const router = Router();

// Photography guidance routes
router.get('/guidance', PhotographyController.getGuidance);
router.get('/guidance/360', PhotographyController.get360Guidance);
router.get('/tips', PhotographyController.getTips);
router.get('/categories', PhotographyController.getCategories);
router.get('/checklist', PhotographyController.getQuickChecklist);

// Photo validation
router.post('/validate', PhotographyController.validatePhoto);

export default router;