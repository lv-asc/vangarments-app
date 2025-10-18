import { Router, Request, Response } from 'express';
import { UpgradeSystemService } from '../services/upgradeSystemService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const upgradeSystemService = new UpgradeSystemService();

// Upgrade Flow Routes

/**
 * Generate upgrade flow for user
 */
router.get(
  '/flow/:targetTier',
  authenticateToken,
  [
    param('targetTier').isIn(['premium', 'enterprise']),
    query('featureName').optional().isString(),
    query('currentStep').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { targetTier } = req.params;
      const { featureName, currentStep } = req.query;
      const userId = req.user!.id;

      const flow = await upgradeSystemService.generateUpgradeFlow(
        userId,
        targetTier as 'premium' | 'enterprise',
        {
          featureName: featureName as string,
          currentStep: currentStep as string,
        }
      );

      res.json({
        success: true,
        data: flow,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate upgrade flow',
      });
    }
  }
);

/**
 * Process upgrade completion
 */
router.post(
  '/complete',
  authenticateToken,
  [
    body('subscriptionType').isIn(['premium', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'quarterly', 'yearly']),
    body('paymentMethodId').optional().isString(),
    body('promptId').optional().isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { subscriptionType, billingCycle, paymentMethodId, promptId } = req.body;

      const result = await upgradeSystemService.processUpgradeCompletion(
        userId,
        { subscriptionType, billingCycle, paymentMethodId },
        promptId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully upgraded to ${subscriptionType}!`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to complete upgrade',
      });
    }
  }
);

// Upgrade Prompt Routes

/**
 * Trigger upgrade prompt for feature limitation
 */
router.post(
  '/prompts/usage-limit',
  authenticateToken,
  [
    body('featureName').isString().isLength({ min: 1 }),
    body('currentUsage').isInt({ min: 0 }),
    body('limit').isInt({ min: 1 }),
    body('action').isString().isLength({ min: 1 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const context = req.body;

      const prompt = await upgradeSystemService.triggerUpgradePrompt(userId, context);

      res.status(201).json({
        success: true,
        data: prompt,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to trigger upgrade prompt',
      });
    }
  }
);

/**
 * Show feature discovery prompt
 */
router.post(
  '/prompts/feature-discovery',
  authenticateToken,
  [body('featureName').isString().isLength({ min: 1 })],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { featureName } = req.body;

      const prompt = await upgradeSystemService.showFeatureDiscoveryPrompt(userId, featureName);

      res.status(201).json({
        success: true,
        data: prompt,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to show feature discovery prompt',
      });
    }
  }
);

/**
 * Update prompt action (user response)
 */
router.patch(
  '/prompts/:promptId/action',
  authenticateToken,
  [
    param('promptId').isUUID(),
    body('action').isIn(['dismissed', 'upgraded', 'learn_more', 'ignored']),
    body('conversionValue').optional().isFloat({ min: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { promptId } = req.params;
      const { action, conversionValue } = req.body;

      // This would normally update the prompt in the database
      // For now, just acknowledge the action
      res.json({
        success: true,
        message: `Prompt action '${action}' recorded successfully`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to update prompt action',
      });
    }
  }
);

// Personalized Recommendations

/**
 * Get personalized upgrade recommendations
 */
router.get(
  '/recommendations',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const recommendations = await upgradeSystemService.getPersonalizedUpgradeRecommendations(userId);

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get upgrade recommendations',
      });
    }
  }
);

// A/B Testing

/**
 * Run A/B test for upgrade prompts
 */
router.post(
  '/ab-test',
  authenticateToken,
  [
    body('testVariants').isArray({ min: 2 }),
    body('testVariants.*.name').isString(),
    body('testVariants.*.weight').isFloat({ min: 0 }),
    body('testVariants.*.promptContent').isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { testVariants } = req.body;

      const prompt = await upgradeSystemService.runUpgradePromptTest(userId, testVariants);

      res.json({
        success: true,
        data: prompt,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to run A/B test',
      });
    }
  }
);

// Admin Analytics Routes

/**
 * Get upgrade analytics (admin only)
 */
router.get(
  '/analytics',
  authenticateToken,
  requireRole(['admin']),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? {
        start: startDate as string,
        end: endDate as string,
      } : undefined;

      const analytics = await upgradeSystemService.getUpgradeAnalytics(dateRange);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get upgrade analytics',
      });
    }
  }
);

// Marketplace Integration Routes

/**
 * Check marketplace access and show upgrade if needed
 */
router.get(
  '/marketplace-access',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // This would check if user has marketplace access
      // For now, assume they need premium
      const hasAccess = false; // Would check actual subscription
      
      if (hasAccess) {
        res.json({
          success: true,
          data: { hasAccess: true },
        });
      } else {
        // Generate upgrade flow for marketplace
        const flow = await upgradeSystemService.generateUpgradeFlow(
          userId,
          'premium',
          { featureName: 'marketplace_trading' }
        );

        res.json({
          success: true,
          data: {
            hasAccess: false,
            upgradeRequired: true,
            upgradeFlow: flow,
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to check marketplace access',
      });
    }
  }
);

/**
 * Enhanced social features access check
 */
router.get(
  '/social-features-access',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Check current social usage and limits
      const hasAccess = false; // Would check actual subscription and usage
      
      if (hasAccess) {
        res.json({
          success: true,
          data: { hasAccess: true },
        });
      } else {
        const recommendations = await upgradeSystemService.getPersonalizedUpgradeRecommendations(userId);
        
        res.json({
          success: true,
          data: {
            hasAccess: false,
            upgradeRequired: true,
            recommendations,
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to check social features access',
      });
    }
  }
);

/**
 * Professional tools access (enterprise tier)
 */
router.get(
  '/professional-tools-access',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Check if user has enterprise subscription
      const hasAccess = false; // Would check actual subscription
      
      if (hasAccess) {
        res.json({
          success: true,
          data: { hasAccess: true },
        });
      } else {
        const flow = await upgradeSystemService.generateUpgradeFlow(
          userId,
          'enterprise',
          { featureName: 'professional_tools' }
        );

        res.json({
          success: true,
          data: {
            hasAccess: false,
            upgradeRequired: true,
            targetTier: 'enterprise',
            upgradeFlow: flow,
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to check professional tools access',
      });
    }
  }
);

export default router;