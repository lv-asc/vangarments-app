import { Router } from 'express';
import { WishlistController } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/my-lists', authenticateToken, WishlistController.getMyWishlists);
router.post('/toggle', authenticateToken, WishlistController.toggleWishlistItem);
router.get('/status/:skuItemId', authenticateToken, WishlistController.checkStatus);
router.get('/:id/items', authenticateToken, WishlistController.getWishlistItems);
router.post('/', authenticateToken, WishlistController.createWishlist);
router.put('/:id', authenticateToken, WishlistController.updateWishlist);
router.delete('/:id', authenticateToken, WishlistController.deleteWishlist);

export default router;
