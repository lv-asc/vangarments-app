import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const subscriptionService = new SubscriptionService();

// Get subscription pricing and features
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const pricing = SubscriptionService.getSubscriptionPricing();
    const features = SubscriptionService.getSubscriptionFeatures();
    
    res.json({
      success: true,
      data: {
        pricing,
        features,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
});

// Get current user subscription
router.get(
  '/current',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const subscription = await subscriptionService.getUserActiveSubscription(req.user!.id);
      
      res.json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

// Create new subscription
router.post(
  '/',
  authenticateToken,
  [
    body('subscriptionType').isIn(['basic', 'premium', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'quarterly', 'yearly']),
    body('paymentMethodId').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionType, billingCycle, paymentMethodId } = req.body;
      
      const subscription = await subscriptionService.createSubscription({
        userId: req.user!.id,
        subscriptionType,
        billingCycle,
        paymentMethodId,
      });
      
      res.status(201).json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Bad request',
      });
    }
  }
);

// Upgrade subscription
router.post(
  '/upgrade',
  authenticateToken,
  [
    body('subscriptionType').isIn(['premium', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'quarterly', 'yearly']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionType, billingCycle } = req.body;
      
      const subscription = await subscriptionService.upgradeSubscription(
        req.user!.id,
        subscriptionType,
        billingCycle
      );
      
      res.json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Bad request',
      });
    }
  }
);

// Cancel subscription
router.post(
  '/cancel',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await subscriptionService.cancelSubscription(req.user!.id);
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Bad request',
      });
    }
  }
);

// Get subscription history
router.get(
  '/history',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const result = await subscriptionService.getUserSubscriptionHistory(
        req.user!.id,
        limit,
        offset
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

// Check feature access
router.get(
  '/features/:feature/access',
  authenticateToken,
  [param('feature').isString()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { feature } = req.params;
      
      const hasAccess = await subscriptionService.hasFeatureAccess(
        req.user!.id,
        feature as any
      );
      
      res.json({
        success: true,
        data: {
          feature,
          hasAccess,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

// Admin routes
router.get(
  '/analytics',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const analytics = await subscriptionService.getSubscriptionAnalytics();
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

router.post(
  '/process-renewals',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await subscriptionService.processRenewals();
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

router.get(
  '/:subscriptionId',
  authenticateToken,
  requireRole(['admin']),
  [param('subscriptionId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }
      
      res.json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }
);

export default router;