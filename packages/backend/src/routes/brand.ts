import { Router } from 'express';
import { BrandController } from '../controllers/brandController';
import { AuthUtils } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const brandController = new BrandController();

// Validation schemas
const registerBrandValidation = [
  body('brandName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Contact email must be valid'),
  body('contactPhone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Contact phone must be 20 characters or less'),
  body('businessType')
    .isIn(['brand', 'store', 'designer', 'manufacturer'])
    .withMessage('Business type must be brand, store, designer, or manufacturer'),
  body('partnershipTier')
    .optional()
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Partnership tier must be basic, premium, or enterprise'),
];

const updateBrandPageValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('logo')
    .optional()
    .isURL()
    .withMessage('Logo must be a valid URL'),
  body('banner')
    .optional()
    .isURL()
    .withMessage('Banner must be a valid URL'),
  body('brandColors')
    .optional()
    .isArray()
    .withMessage('Brand colors must be an array'),
  body('brandColors.*')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Each brand color must be a valid hex color'),
  body('socialLinks')
    .optional()
    .isArray()
    .withMessage('Social links must be an array'),
];

const addToCatalogValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('vufsItemId')
    .isUUID()
    .withMessage('VUFS item ID must be a valid UUID'),
  body('officialPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Official price must be a positive number'),
  body('availabilityStatus')
    .optional()
    .isIn(['available', 'out_of_stock', 'discontinued', 'pre_order'])
    .withMessage('Availability status must be available, out_of_stock, discontinued, or pre_order'),
  body('purchaseLink')
    .optional()
    .isURL()
    .withMessage('Purchase link must be a valid URL'),
];

const updateCatalogItemValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  param('itemId')
    .isUUID()
    .withMessage('Item ID must be a valid UUID'),
  body('officialPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Official price must be a positive number'),
  body('availabilityStatus')
    .optional()
    .isIn(['available', 'out_of_stock', 'discontinued', 'pre_order'])
    .withMessage('Availability status must be available, out_of_stock, discontinued, or pre_order'),
  body('purchaseLink')
    .optional()
    .isURL()
    .withMessage('Purchase link must be a valid URL'),
];

const brandIdValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const catalogFiltersValidation = [
  query('availabilityStatus')
    .optional()
    .isIn(['available', 'out_of_stock', 'discontinued', 'pre_order'])
    .withMessage('Availability status must be available, out_of_stock, discontinued, or pre_order'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  query('collection')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Collection must be 100 characters or less'),
  query('season')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Season must be 50 characters or less'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query must be 100 characters or less'),
];

const verifyBrandValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('status')
    .isIn(['verified', 'rejected'])
    .withMessage('Status must be verified or rejected'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be 500 characters or less'),
];

const upgradeTierValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('tier')
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Tier must be basic, premium, or enterprise'),
];

const bulkUpdateValidation = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array'),
  body('updates.*.vufsItemId')
    .isUUID()
    .withMessage('Each update must have a valid VUFS item ID'),
  body('updates.*.availabilityStatus')
    .isIn(['available', 'out_of_stock', 'discontinued', 'pre_order'])
    .withMessage('Each update must have a valid availability status'),
];

// Brand registration and management
router.post(
  '/register',
  AuthUtils.authenticateToken,
  registerBrandValidation,
  validateRequest,
  brandController.registerBrand.bind(brandController)
);

router.get(
  '/search',
  query('q')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query must be 100 characters or less'),
  query('verificationStatus')
    .optional()
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('Verification status must be pending, verified, or rejected'),
  query('partnershipTier')
    .optional()
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Partnership tier must be basic, premium, or enterprise'),
  paginationValidation,
  validateRequest,
  brandController.searchBrands.bind(brandController)
);

// Brand profile and customization
router.get(
  '/:brandId',
  brandIdValidation,
  validateRequest,
  brandController.getBrandProfile.bind(brandController)
);

router.put(
  '/:brandId/page',
  AuthUtils.authenticateToken,
  updateBrandPageValidation,
  validateRequest,
  brandController.updateBrandPage.bind(brandController)
);

// Brand catalog management
router.get(
  '/:brandId/catalog',
  brandIdValidation,
  catalogFiltersValidation,
  paginationValidation,
  validateRequest,
  brandController.getBrandCatalog.bind(brandController)
);

router.post(
  '/:brandId/catalog',
  AuthUtils.authenticateToken,
  addToCatalogValidation,
  validateRequest,
  brandController.addToCatalog.bind(brandController)
);

router.put(
  '/:brandId/catalog/:itemId',
  AuthUtils.authenticateToken,
  updateCatalogItemValidation,
  validateRequest,
  brandController.updateCatalogItem.bind(brandController)
);

router.put(
  '/:brandId/catalog/bulk-update',
  AuthUtils.authenticateToken,
  bulkUpdateValidation,
  validateRequest,
  brandController.bulkUpdateAvailability.bind(brandController)
);

// Brand analytics and performance
router.get(
  '/:brandId/analytics',
  AuthUtils.authenticateToken,
  brandIdValidation,
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  validateRequest,
  brandController.getBrandAnalytics.bind(brandController)
);

router.get(
  '/:brandId/commissions',
  AuthUtils.authenticateToken,
  brandIdValidation,
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'paid', 'disputed'])
    .withMessage('Status must be pending, approved, paid, or disputed'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  paginationValidation,
  validateRequest,
  brandController.getCommissionHistory.bind(brandController)
);

// Admin routes
router.put(
  '/:brandId/verify',
  AuthUtils.authenticateToken,
  verifyBrandValidation,
  validateRequest,
  brandController.verifyBrand.bind(brandController)
);

router.put(
  '/:brandId/upgrade',
  AuthUtils.authenticateToken,
  upgradeTierValidation,
  validateRequest,
  brandController.upgradeBrandTier.bind(brandController)
);

export default router;