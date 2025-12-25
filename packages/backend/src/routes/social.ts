import { Router } from 'express';
import { SocialController } from '../controllers/socialController';
import { AuthUtils } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const socialController = new SocialController();

// Validation schemas
const createPostValidation = [
  body('postType')
    .isIn(['outfit', 'item', 'inspiration'])
    .withMessage('Post type must be outfit, item, or inspiration'),
  body('content.imageUrls')
    .isArray({ min: 1 })
    .withMessage('At least one image URL is required'),
  body('content.imageUrls.*')
    .isURL()
    .withMessage('Each image URL must be valid'),
  body('content.title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must be 100 characters or less'),
  body('content.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  body('content.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('wardrobeItemIds')
    .optional()
    .isArray()
    .withMessage('Wardrobe item IDs must be an array'),
  body('wardrobeItemIds.*')
    .optional()
    .isUUID()
    .withMessage('Each wardrobe item ID must be a valid UUID'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Visibility must be public, followers, or private'),
];

const addCommentValidation = [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters'),
  body('parentCommentId')
    .optional()
    .isUUID()
    .withMessage('Parent comment ID must be a valid UUID'),
];

const userIdValidation = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
];

const postIdValidation = [
  param('postId').isString().isLength({ min: 1 }).withMessage('Post ID/Slug must be valid'),
];

const commentIdValidation = [
  param('commentId').isUUID().withMessage('Comment ID must be a valid UUID'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
];

const feedValidation = [
  query('feedType')
    .optional()
    .isIn(['following', 'discover', 'personal'])
    .withMessage('Feed type must be following, discover, or personal'),
  ...paginationValidation,
];

const searchValidation = [
  query('q')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query must be 100 characters or less'),
  query('postType')
    .optional()
    .isIn(['outfit', 'item', 'inspiration'])
    .withMessage('Post type must be outfit, item, or inspiration'),
  query('tags')
    .optional()
    .custom((value: any) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return true;
      return false;
    })
    .withMessage('Tags must be a string or array of strings'),
  query('userId')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  ...paginationValidation,
];

// Post management routes
router.post(
  '/posts',
  AuthUtils.authenticateToken,
  createPostValidation,
  validateRequest,
  socialController.createPost.bind(socialController)
);

router.get(
  '/posts/:postId',
  postIdValidation,
  validateRequest,
  socialController.getPost.bind(socialController)
);

// Feed and discovery routes
router.get(
  '/feed',
  AuthUtils.authenticateToken,
  feedValidation,
  validateRequest,
  socialController.getFeed.bind(socialController)
);

router.get(
  '/posts/search',
  searchValidation,
  validateRequest,
  socialController.searchPosts.bind(socialController)
);

// User relationship routes
router.post(
  '/users/:userId/follow',
  AuthUtils.authenticateToken,
  userIdValidation,
  validateRequest,
  socialController.followUser.bind(socialController)
);

router.delete(
  '/users/:userId/follow',
  AuthUtils.authenticateToken,
  userIdValidation,
  validateRequest,
  socialController.unfollowUser.bind(socialController)
);

router.get(
  '/users/:userId/followers',
  userIdValidation,
  [
    ...paginationValidation,
    query('q').optional().isString(),
  ],
  validateRequest,
  socialController.getFollowers.bind(socialController)
);

router.get(
  '/users/:userId/following',
  userIdValidation,
  [
    ...paginationValidation,
    query('q').optional().isString(),
  ],
  validateRequest,
  socialController.getFollowing.bind(socialController)
);

router.get(
  '/users/:userId/follow-status',
  AuthUtils.authenticateToken,
  userIdValidation,
  validateRequest,
  socialController.checkFollowStatus.bind(socialController)
);

router.get(
  '/users/:userId/stats',
  userIdValidation,
  validateRequest,
  socialController.getUserSocialStats.bind(socialController)
);

// Post engagement routes
router.post(
  '/posts/:postId/like',
  AuthUtils.authenticateToken,
  postIdValidation,
  validateRequest,
  socialController.likePost.bind(socialController)
);

router.delete(
  '/posts/:postId/like',
  AuthUtils.authenticateToken,
  postIdValidation,
  validateRequest,
  socialController.unlikePost.bind(socialController)
);

router.post(
  '/posts/:postId/comments',
  AuthUtils.authenticateToken,
  addCommentValidation,
  validateRequest,
  socialController.addComment.bind(socialController)
);

router.delete(
  '/comments/:commentId',
  AuthUtils.authenticateToken,
  commentIdValidation,
  validateRequest,
  socialController.deleteComment.bind(socialController)
);

// Wardrobe integration routes
router.get(
  '/wardrobe',
  AuthUtils.authenticateToken,
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  validateRequest,
  socialController.getUserWardrobe.bind(socialController)
);

// Entity follow routes (for following brands, stores, suppliers, pages)
const entityTypeValidation = [
  param('entityType')
    .isIn(['brand', 'store', 'supplier', 'page'])
    .withMessage('Entity type must be brand, store, supplier, or page'),
  param('entityId').isUUID().withMessage('Entity ID must be a valid UUID'),
];

router.post(
  '/entities/:entityType/:entityId/follow',
  AuthUtils.authenticateToken,
  entityTypeValidation,
  validateRequest,
  socialController.followEntity.bind(socialController)
);

router.delete(
  '/entities/:entityType/:entityId/follow',
  AuthUtils.authenticateToken,
  entityTypeValidation,
  validateRequest,
  socialController.unfollowEntity.bind(socialController)
);

router.get(
  '/entities/:entityType/:entityId/followers',
  entityTypeValidation,
  paginationValidation,
  validateRequest,
  socialController.getEntityFollowers.bind(socialController)
);

router.get(
  '/entities/:entityType/:entityId/follow-status',
  AuthUtils.authenticateToken,
  entityTypeValidation,
  validateRequest,
  socialController.checkEntityFollowStatus.bind(socialController)
);

router.get(
  '/users/:userId/following-entities',
  userIdValidation,
  query('entityType')
    .optional()
    .isIn(['brand', 'store', 'supplier', 'page'])
    .withMessage('Entity type must be brand, store, supplier, or page'),
  paginationValidation,
  validateRequest,
  socialController.getUserFollowingEntities.bind(socialController)
);

export default router;