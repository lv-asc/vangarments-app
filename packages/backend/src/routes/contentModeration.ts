import { Router } from 'express';
import { ContentModerationController } from '../controllers/contentModerationController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const contentModerationController = new ContentModerationController();

// Content moderation routes (admin/moderator only)
router.get(
  '/reports',
  authenticateToken,
  // TODO: Add role-based middleware for moderators/admins
  query('status').optional().isIn(['pending', 'reviewing', 'resolved', 'dismissed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('reportedContentType').optional().isIn(['post', 'comment', 'user']),
  query('reportedBy').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  contentModerationController.getReports.bind(contentModerationController)
);

router.get(
  '/reports/:reportId',
  authenticateToken,
  param('reportId').isUUID(),
  validateRequest,
  contentModerationController.getReport.bind(contentModerationController)
);

router.put(
  '/reports/:reportId/action',
  authenticateToken,
  param('reportId').isUUID(),
  body('action').isIn(['approve', 'remove', 'warn', 'dismiss']),
  body('reason').optional().isString().isLength({ max: 500 }),
  validateRequest,
  contentModerationController.takeAction.bind(contentModerationController)
);

router.get(
  '/statistics',
  authenticateToken,
  contentModerationController.getStatistics.bind(contentModerationController)
);

// Bulk actions
router.post(
  '/reports/bulk-action',
  authenticateToken,
  body('reportIds').isArray().custom((value) => {
    return value.every((id: any) => typeof id === 'string');
  }),
  body('action').isIn(['approve', 'remove', 'warn', 'dismiss']),
  body('reason').optional().isString().isLength({ max: 500 }),
  validateRequest,
  contentModerationController.bulkAction.bind(contentModerationController)
);

// Content flagging for automated systems
router.post(
  '/flag-content',
  authenticateToken,
  body('contentId').isUUID(),
  body('contentType').isIn(['post', 'comment', 'user']),
  body('flagType').isIn(['ai_detected', 'user_reported', 'system_flagged']),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('details').optional().isObject(),
  validateRequest,
  contentModerationController.flagContent.bind(contentModerationController)
);

export { router as contentModerationRoutes };