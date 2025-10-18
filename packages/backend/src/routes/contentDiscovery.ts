import { Router } from 'express';
import { ContentDiscoveryController } from '../controllers/contentDiscoveryController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';
import { AuthUtils } from '../utils/auth';

const router = Router();
const contentDiscoveryController = new ContentDiscoveryController();

// Content discovery routes
router.get(
  '/feed',
  AuthUtils.optionalAuth, // Allow both authenticated and anonymous users
  query('category').optional().isString(),
  query('tags').optional(),
  query('contentType').optional().isIn(['outfit', 'item', 'inspiration']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  contentDiscoveryController.getDiscoveryFeed.bind(contentDiscoveryController)
);

router.get(
  '/trending',
  query('timeframe').optional().isIn(['1d', '7d', '30d']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  contentDiscoveryController.getTrendingContent.bind(contentDiscoveryController)
);

router.get(
  '/categories',
  contentDiscoveryController.getContentCategories.bind(contentDiscoveryController)
);

router.get(
  '/recommendations',
  authenticateToken,
  query('type').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  validateRequest,
  contentDiscoveryController.getPersonalizedRecommendations.bind(contentDiscoveryController)
);

router.get(
  '/search',
  query('q').optional().isString(),
  query('contentType').optional().isIn(['outfit', 'item', 'inspiration']),
  query('tags').optional(),
  query('userId').optional().isUUID(),
  query('category').optional().isString(),
  query('sortBy').optional().isIn(['relevance', 'recent', 'popular']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  contentDiscoveryController.searchContent.bind(contentDiscoveryController)
);

router.get(
  '/tags/:tag',
  param('tag').isString().isLength({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['recent', 'popular']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  contentDiscoveryController.getContentByTag.bind(contentDiscoveryController)
);

router.get(
  '/featured',
  query('limit').optional().isInt({ min: 1, max: 20 }),
  validateRequest,
  contentDiscoveryController.getFeaturedContent.bind(contentDiscoveryController)
);

router.get(
  '/similar/:postId',
  param('postId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  validateRequest,
  contentDiscoveryController.getSimilarContent.bind(contentDiscoveryController)
);

// Content reporting
router.post(
  '/report',
  authenticateToken,
  body('contentId').isUUID(),
  body('contentType').isIn(['post', 'comment', 'user']),
  body('reason').isIn([
    'inappropriate_content',
    'harassment',
    'spam',
    'fake_account',
    'copyright',
    'violence',
    'hate_speech',
    'nudity',
    'misinformation',
    'other'
  ]),
  body('description').optional().isString().isLength({ max: 500 }),
  validateRequest,
  contentDiscoveryController.reportContent.bind(contentDiscoveryController)
);

// User feed preferences
router.get(
  '/preferences',
  authenticateToken,
  contentDiscoveryController.getFeedPreferences.bind(contentDiscoveryController)
);

router.put(
  '/preferences',
  authenticateToken,
  body('showFollowing').optional().isBoolean(),
  body('showRecommended').optional().isBoolean(),
  body('showTrending').optional().isBoolean(),
  body('preferredStyles').optional().isArray(),
  body('preferredOccasions').optional().isArray(),
  body('contentTypes').optional().isArray(),
  body('blockedUsers').optional().isArray(),
  body('blockedTags').optional().isArray(),
  validateRequest,
  contentDiscoveryController.updateFeedPreferences.bind(contentDiscoveryController)
);

export { router as contentDiscoveryRoutes };