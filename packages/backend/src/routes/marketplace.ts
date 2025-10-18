import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplaceController';
import { MarketplaceSearchController } from '../controllers/marketplaceSearchController';
import { TransactionController } from '../controllers/transactionController';
import { ReviewController } from '../controllers/reviewController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Marketplace listing routes
router.post('/listings', AuthUtils.authenticateToken, MarketplaceController.createListing);
router.get('/listings', MarketplaceController.searchListings);
router.get('/listings/my', AuthUtils.authenticateToken, MarketplaceController.getUserListings);
router.get('/listings/:id', MarketplaceController.getListing);
router.put('/listings/:id', AuthUtils.authenticateToken, MarketplaceController.updateListing);
router.delete('/listings/:id', AuthUtils.authenticateToken, MarketplaceController.deleteListing);

// Listing interactions
router.post('/listings/:id/like', AuthUtils.authenticateToken, MarketplaceController.toggleLike);

// Enhanced search and discovery
router.get('/search', MarketplaceSearchController.enhancedSearch);
router.get('/search/advanced', MarketplaceSearchController.advancedSearch);
router.get('/discovery/search', MarketplaceSearchController.enhancedSearch);
router.get('/search/autocomplete', MarketplaceSearchController.getAutocompleteSuggestions);
router.get('/search/vufs', MarketplaceSearchController.vufsSearch);
router.post('/search/save', AuthUtils.authenticateToken, MarketplaceSearchController.saveSearch);
router.get('/search/saved', AuthUtils.authenticateToken, MarketplaceSearchController.getSavedSearches);

// Discovery and recommendations
router.get('/trending', MarketplaceSearchController.getTrendingItems);
router.get('/feed', AuthUtils.authenticateToken, MarketplaceSearchController.getPersonalizedFeed);
router.get('/similar/:itemId', MarketplaceSearchController.getSimilarItems);
router.get('/analysis/:itemId', MarketplaceSearchController.getMarketAnalysis);
router.get('/pricing/:itemId', MarketplaceSearchController.getRealTimePricing);
router.get('/matching/:itemId', MarketplaceSearchController.getAutomaticModelMatching);
router.get('/recommendations', MarketplaceSearchController.getRecommendations);

// Transaction routes
router.post('/transactions', AuthUtils.authenticateToken, TransactionController.createTransaction);
router.get('/transactions', AuthUtils.authenticateToken, TransactionController.getUserTransactions);
router.get('/transactions/:transactionId', AuthUtils.authenticateToken, TransactionController.getTransaction);
router.put('/transactions/:transactionId', AuthUtils.authenticateToken, TransactionController.updateTransaction);
router.post('/transactions/:transactionId/payment', AuthUtils.authenticateToken, TransactionController.processPayment);
router.post('/transactions/:transactionId/cancel', AuthUtils.authenticateToken, TransactionController.cancelTransaction);
router.post('/transactions/:transactionId/confirm-delivery', AuthUtils.authenticateToken, TransactionController.confirmDelivery);
router.get('/transactions/stats', AuthUtils.authenticateToken, TransactionController.getTransactionStats);

// Seller profiles
router.get('/sellers/:sellerId', MarketplaceController.getSellerProfile);

// Review routes
router.post('/reviews', AuthUtils.authenticateToken, ReviewController.createReview);
router.get('/reviews/user/:userId', ReviewController.getUserReviews);
router.get('/reviews/:reviewId', ReviewController.getReview);
router.post('/reviews/:reviewId/helpful', AuthUtils.authenticateToken, ReviewController.markReviewHelpful);
router.post('/reviews/:reviewId/report', AuthUtils.authenticateToken, ReviewController.reportReview);
router.get('/reviews/stats/:userId', ReviewController.getReviewStats);
router.get('/sellers/:sellerId/performance', ReviewController.getSellerPerformance);

// Admin routes
router.get('/reviews/moderation', AuthUtils.authenticateToken, ReviewController.getReviewsForModeration);
router.get('/reviews/trends', AuthUtils.authenticateToken, ReviewController.getReviewTrends);

// Marketplace metadata
router.get('/categories', MarketplaceController.getCategories);
router.get('/stats', MarketplaceSearchController.getMarketplaceStats);

export default router;