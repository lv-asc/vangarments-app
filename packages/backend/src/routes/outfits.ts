import { Router } from 'express';
import { OutfitController } from '../controllers/outfitController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Outfit CRUD operations
router.post('/', AuthUtils.authenticateToken, OutfitController.createOutfit);
router.get('/my', AuthUtils.authenticateToken, OutfitController.getUserOutfits);
router.get('/public', OutfitController.searchPublicOutfits);
router.get('/stats', AuthUtils.authenticateToken, OutfitController.getUserStats);
router.get('/:id', OutfitController.getOutfit);
router.put('/:id', AuthUtils.authenticateToken, OutfitController.updateOutfit);
router.delete('/:id', AuthUtils.authenticateToken, OutfitController.deleteOutfit);

// Outfit interactions
router.post('/:id/favorite', AuthUtils.authenticateToken, OutfitController.toggleFavorite);
router.post('/:id/wear', AuthUtils.authenticateToken, OutfitController.recordWear);

// Styling and recommendations
router.get('/suggestions/:baseItemId', AuthUtils.authenticateToken, OutfitController.getOutfitSuggestions);
router.get('/:id/analyze', OutfitController.analyzeOutfit);
router.get('/:id/recommendations', AuthUtils.authenticateToken, OutfitController.getStyleRecommendations);

export default router;