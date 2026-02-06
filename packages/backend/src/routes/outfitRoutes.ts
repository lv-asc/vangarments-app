import { Router } from 'express';
import { OutfitController } from '../controllers/outfitController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Trigger reload

// Public routes (no auth required)
router.get('/public/:username', OutfitController.getPublicByUsername);
router.get('/public/:username/:slug', OutfitController.getPublicByUsernameAndSlug);

// Authenticated routes
router.use(authenticateToken);

router.get('/trash', OutfitController.getDeleted);
router.post('/', OutfitController.create);
router.get('/', OutfitController.getAll);
router.get('/slug/:slug', OutfitController.getBySlug);
router.get('/:id', OutfitController.getOne);
router.put('/:id', OutfitController.update);
router.delete('/:id', OutfitController.delete);
router.post('/:id/restore', OutfitController.restore);
router.delete('/:id/permanent', OutfitController.permanentDelete);

export default router;
