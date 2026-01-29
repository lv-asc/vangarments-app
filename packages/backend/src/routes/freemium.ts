import { Router, Request, Response } from 'express';
import { FeatureAccessService } from '../services/featureAccessService';
import { AccountLinkingService } from '../services/accountLinkingService';
import { SubscriptionService } from '../services/subscriptionService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const featureAccessService = new FeatureAccessService();
const accountLinkingService = new AccountLinkingService();
const subscriptionService = new SubscriptionService();

// Feature Access Routes

/**
 * Check access to a specific feature
 */
router.get(
  '/features/:featureName/access',
  authenticateToken,
  [param('featureName').isString().isLength({ min: 1 })],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { featureName } = req.params;
      const userId = req.user!.id;

      // Check if user has account linking
      const hasAccountLinking = await accountLinkingService.hasAccountLinking(userId);

      const access = await featureAccessService.hasFeatureAccess(userId, featureName, {
        hasAccountLinking,
      });

      res.json({
        success: true,
        data: {
          featureName,
          hasAccess: access.hasAccess,
          reason: access.reason,
          upgradeRequired: access.upgradeRequired,
          limitation: access.limitation,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to check feature access',
      });
    }
  }
);

/**
 * Get all available features for user
 */
router.get(
  '/features',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const hasAccountLinking = await accountLinkingService.hasAccountLinking(userId);

      const features = await featureAccessService.getUserAvailableFeatures(userId, hasAccountLinking);

      res.json({
        success: true,
        data: features,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get user features',
      });
    }
  }
);

/**
 * Get feature usage statistics
 */
router.get(
  '/usage',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const [usage, limits] = await Promise.all([
        featureAccessService.getUserFeatureUsage(userId),
        featureAccessService.checkUsageLimits(userId),
      ]);

      res.json({
        success: true,
        data: {
          usage,
          limits,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get usage statistics',
      });
    }
  }
);

/**
 * Get upgrade recommendations
 */
router.get(
  '/upgrade-recommendations',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const recommendations = await featureAccessService.getUpgradeRecommendations(userId);

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

// Account Linking Routes

/**
 * Link social media account
 */
router.post(
  '/social-links',
  authenticateToken,
  [
    body('platform').isIn(['instagram', 'tiktok', 'pinterest', 'twitter', 'linkedin']),
    body('platformUsername').isString().isLength({ min: 1, max: 255 }),
    body('linkType').isIn(['bio_link', 'profile_verification', 'content_sync']),
    body('isPublic').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const linkingRequest = req.body;

      const socialLink = await accountLinkingService.linkSocialAccount(userId, linkingRequest);

      res.status(201).json({
        success: true,
        data: socialLink,
        message: 'Social account linked successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to link social account',
      });
    }
  }
);

/**
 * Get user's social account links
 */
router.get(
  '/social-links',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const socialLinks = await accountLinkingService.getUserSocialAccountLinks(userId);

      res.json({
        success: true,
        data: socialLinks,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get social links',
      });
    }
  }
);

/**
 * Unlink social media account
 */
router.delete(
  '/social-links/:platform',
  authenticateToken,
  [param('platform').isIn(['instagram', 'tiktok', 'pinterest', 'twitter', 'linkedin'])],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { platform } = req.params;

      await accountLinkingService.unlinkSocialAccount(userId, platform);

      res.json({
        success: true,
        message: 'Social account unlinked successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to unlink social account',
      });
    }
  }
);

/**
 * Update social link visibility
 */
router.patch(
  '/social-links/:platform/visibility',
  authenticateToken,
  [
    param('platform').isIn(['instagram', 'tiktok', 'pinterest', 'twitter', 'linkedin']),
    body('isPublic').isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { platform } = req.params;
      const { isPublic } = req.body;

      await accountLinkingService.updateLinkVisibility(userId, platform, isPublic);

      res.json({
        success: true,
        message: 'Link visibility updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to update link visibility',
      });
    }
  }
);

/**
 * Sync social profiles
 */
router.post(
  '/social-links/sync',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const syncResult = await accountLinkingService.syncSocialProfiles(userId);

      res.json({
        success: true,
        data: syncResult,
        message: `Synced ${syncResult.synced} profiles successfully`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to sync social profiles',
      });
    }
  }
);

/**
 * Generate bio link
 */
router.get(
  '/bio-link',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const bioLink = await accountLinkingService.generateBioLink(userId);

      res.json({
        success: true,
        data: bioLink,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate bio link',
      });
    }
  }
);

/**
 * Get social proof metrics
 */
router.get(
  '/social-proof',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const metrics = await accountLinkingService.getSocialProofMetrics(userId);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get social proof metrics',
      });
    }
  }
);

// Public Routes

/**
 * Get all feature definitions (public)
 */
router.get(
  '/features/definitions',
  async (req: Request, res: Response) => {
    try {
      const features = FeatureAccessService.getAllFeatures();

      res.json({
        success: true,
        data: features,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get feature definitions',
      });
    }
  }
);

/**
 * Get features by category (public)
 */
router.get(
  '/features/categories/:category',
  [param('category').isIn(['core', 'social', 'marketplace', 'analytics', 'professional'])],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const features = FeatureAccessService.getFeaturesByCategory(category as any);

      res.json({
        success: true,
        data: features,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get features by category',
      });
    }
  }
);

/**
 * Get features by tier (public)
 */
router.get(
  '/features/tiers/:tier',
  [param('tier').isIn(['free', 'premium', 'enterprise'])],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { tier } = req.params;
      const features = FeatureAccessService.getFeaturesByTier(tier as any);

      res.json({
        success: true,
        data: features,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get features by tier',
      });
    }
  }
);

/**
 * Get subscription pricing (public)
 */
router.get(
  '/pricing',
  async (req: Request, res: Response) => {
    try {
      const pricing = SubscriptionService.getSubscriptionPricing();
      const features = SubscriptionService.getSubscriptionFeatures();

      res.json({
        success: true,
        data: {
          pricing,
          features,
          tiers: {
            free: {
              name: 'Free',
              price: 0,
              features: FeatureAccessService.getFeaturesByTier('free'),
              limitations: {
                wardrobeItems: 100,
                socialFollows: 50,
              },
            },
            premium: {
              name: 'Premium',
              price: pricing.premium.monthly,
              features: [
                ...FeatureAccessService.getFeaturesByTier('free'),
                ...FeatureAccessService.getFeaturesByTier('premium'),
              ],
              limitations: {},
            },
            enterprise: {
              name: 'Enterprise',
              price: pricing.enterprise.monthly,
              features: [
                ...FeatureAccessService.getFeaturesByTier('free'),
                ...FeatureAccessService.getFeaturesByTier('premium'),
                ...FeatureAccessService.getFeaturesByTier('enterprise'),
              ],
              limitations: {},
            },
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get pricing information',
      });
    }
  }
);

// MVP Demo Routes

/**
 * Get MVP demo features
 */
router.get(
  '/mvp-demo',
  async (req: Request, res: Response) => {
    try {
      const mvpFeatures = {
        core: FeatureAccessService.getFeaturesByCategory('core'),
        social: FeatureAccessService.getFeaturesByCategory('social').filter(f => f.tier === 'free'),
        demoData: {
          wardrobeItems: [
            {
              id: 'demo_1',
              name: 'Classic White Shirt',
              category: 'Tops',
              brand: 'Demo Brand',
              color: 'White',
              image: 'https://example.com/demo-shirt.jpg',
            },
            {
              id: 'demo_2',
              name: 'Dark Wash Jeans',
              category: 'Bottoms',
              brand: 'Demo Denim',
              color: 'Indigo',
              image: 'https://example.com/demo-jeans.jpg',
            },
          ],
          brandPartners: [
            {
              name: 'Sustainable Fashion Co.',
              logo: 'https://example.com/brand1-logo.jpg',
              link: 'https://example.com/brand1',
            },
            {
              name: 'Local Brazilian Brand',
              logo: 'https://example.com/brand2-logo.jpg',
              link: 'https://example.com/brand2',
            },
          ],
        },
      };

      res.json({
        success: true,
        data: mvpFeatures,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get MVP demo data',
      });
    }
  }
);

export default router;