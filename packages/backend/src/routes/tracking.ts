import { Router } from 'express';
import { ItemTrackingController } from '../controllers/itemTrackingController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Loan management routes
router.post('/loans', AuthUtils.authenticateToken, ItemTrackingController.createLoan);
router.put('/loans/:loanId/return', AuthUtils.authenticateToken, ItemTrackingController.returnItem);
router.get('/loans', AuthUtils.authenticateToken, ItemTrackingController.getUserLoans);

// Wishlist management routes
router.post('/wishlist', AuthUtils.authenticateToken, ItemTrackingController.addToWishlist);
router.get('/wishlist', AuthUtils.authenticateToken, ItemTrackingController.getUserWishlist);
router.put('/wishlist/:id', AuthUtils.authenticateToken, ItemTrackingController.updateWishlistItem);
router.delete('/wishlist/:id', AuthUtils.authenticateToken, ItemTrackingController.removeFromWishlist);

// Usage tracking routes
router.post('/items/:itemId/wear', AuthUtils.authenticateToken, ItemTrackingController.recordWear);
router.get('/items/:itemId/usage', ItemTrackingController.getItemUsage);
router.get('/usage/stats', AuthUtils.authenticateToken, ItemTrackingController.getUserUsageStats);

// Care instructions utility
router.post('/care-instructions', ItemTrackingController.generateCareInstructions);

export default router;