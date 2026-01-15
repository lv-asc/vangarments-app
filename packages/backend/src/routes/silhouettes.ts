import { Router } from 'express';
import { SilhouetteController } from '../controllers/silhouetteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Silhouette management
router.get('/', authenticateToken, SilhouetteController.listSilhouettes);
router.post('/', authenticateToken, SilhouetteController.createSilhouette);
router.patch('/:id', authenticateToken, SilhouetteController.updateSilhouette);
router.delete('/:id', authenticateToken, SilhouetteController.deleteSilhouette);

export default router;
