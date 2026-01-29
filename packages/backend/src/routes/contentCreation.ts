import { Router } from 'express';
import { ContentCreationController } from '../controllers/contentCreationController';
import { AuthUtils } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const contentCreationController = new ContentCreationController();

// Validation schemas
const createFitPicValidation = [
  body('imageUrl')
    .isURL()
    .withMessage('Image URL must be valid'),
  body('wardrobeItemIds')
    .optional()
    .isArray()
    .withMessage('Wardrobe item IDs must be an array'),
  body('wardrobeItemIds.*')
    .optional()
    .isUUID()
    .withMessage('Each wardrobe item ID must be a valid UUID'),
  body('caption')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Caption must be 500 characters or less'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be 100 characters or less'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Visibility must be public, followers, or private'),
];


const personalizedFeedValidation = [
  query('interests')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Interests must be 200 characters or less'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('includeFollowing')
    .optional()
    .isBoolean()
    .withMessage('Include following must be a boolean'),
];

// Fit pic routes
router.post(
  '/fit-pics',
  AuthUtils.authenticateToken,
  createFitPicValidation,
  validateRequest,
  contentCreationController.createFitPic.bind(contentCreationController)
);


// Personalized feed
router.get(
  '/personalized-feed',
  AuthUtils.authenticateToken,
  personalizedFeedValidation,
  validateRequest,
  contentCreationController.getPersonalizedFeed.bind(contentCreationController)
);

// Analytics and insights
router.get(
  '/analytics',
  AuthUtils.authenticateToken,
  contentCreationController.getContentAnalytics.bind(contentCreationController)
);

router.get(
  '/trending',
  contentCreationController.getTrendingContent.bind(contentCreationController)
);

router.get(
  '/tips',
  AuthUtils.authenticateToken,
  contentCreationController.getContentCreationTips.bind(contentCreationController)
);

export default router;