import { Router } from 'express';
import { AdvertisingService } from '../services/advertisingService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requireAdvertisingAccess, requireDataIntelligenceAccess } from '../middleware/premium';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const advertisingService = new AdvertisingService();

// Campaign management routes
router.post(
  '/campaigns',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  requireAdvertisingAccess,
  [
    body('name').isLength({ min: 1, max: 255 }).withMessage('Campaign name is required'),
    body('objective').isIn(['brand_awareness', 'traffic', 'conversions', 'engagement', 'app_installs']),
    body('budget.totalBudget').isFloat({ min: 100 }).withMessage('Total budget must be at least R$100'),
    body('budget.dailyBudget').isFloat({ min: 10 }).withMessage('Daily budget must be at least R$10'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const campaign = await advertisingService.createCampaign(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/campaigns',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  requireAdvertisingAccess,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await advertisingService.getAdvertiserCampaigns(req.user.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/campaigns/:campaignId',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  [param('campaignId').isUUID()],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const { campaignId } = req.params;
      const campaign = await advertisingService.findCampaignById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Advertisement management routes
router.post(
  '/campaigns/:campaignId/ads',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  [
    param('campaignId').isUUID(),
    body('adType').isIn(['banner', 'sponsored_post', 'product_placement', 'story', 'video']),
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
    body('description').optional().isLength({ max: 500 }),
    body('creative').isObject(),
    body('targeting').isObject(),
    body('budget').isObject(),
    body('schedule').isObject(),
  ],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const { campaignId } = req.params;
      const adData = { ...req.body, campaignId };

      // Validate ad content
      const validation = await advertisingService.validateAdContent({
        title: req.body.title,
        description: req.body.description,
        creative: req.body.creative,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Ad content validation failed',
          errors: validation.issues,
        });
      }

      const advertisement = await advertisingService.createAdvertisement(req.user.id, adData);
      res.status(201).json({
        success: true,
        data: advertisement,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/campaigns/:campaignId/ads',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  [
    param('campaignId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const { campaignId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await advertisingService.getCampaignAdvertisements(campaignId, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Ad serving routes (for displaying ads to users)
router.get(
  '/targeted-ads',
  authenticateToken,
  [
    query('adType').optional().isIn(['banner', 'sponsored_post', 'product_placement', 'story', 'video']),
    query('placement').optional().isIn(['feed', 'sidebar', 'story', 'search']),
    query('limit').optional().isInt({ min: 1, max: 10 }),
  ],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const { adType, placement, limit } = req.query;

      // Get user profile for targeting (this would come from user service)
      const userProfile = {
        age: 25, // This would be calculated from user data
        location: 'Sao Paulo',
        interests: ['fashion', 'sustainable_fashion'],
      };

      const ads = await advertisingService.getTargetedAds(
        req.user.id,
        userProfile,
        {
          adType: adType as string,
          placement: placement as any,
          limit: parseInt(limit as string) || 5,
        }
      );

      res.json({
        success: true,
        data: ads,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.post(
  '/ads/:adId/click',
  authenticateToken,
  [param('adId').isUUID()],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const { adId } = req.params;
      const result = await advertisingService.handleAdClick(adId, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Analytics routes
router.get(
  '/analytics',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  [query('period').optional().isIn(['day', 'week', 'month'])],
  validateRequest,
  // @ts-ignore
  async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';
      const analytics = await advertisingService.getAdvertisingAnalytics(req.user.id, period);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/recommendations',
  authenticateToken,
  requireRole(['brand_owner', 'admin']),
  // @ts-ignore
  async (req, res) => {
    try {
      const recommendations = await advertisingService.getAdvertisingRecommendations(req.user!.id);

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Data intelligence routes
router.get(
  '/trends',
  authenticateToken,
  requireDataIntelligenceAccess,
  [
    query('reportType').optional().isIn(['fashion_trends', 'color_trends', 'brand_performance', 'market_analysis', 'user_behavior']),
    query('targetAudience').optional().isIn(['public', 'premium', 'brands', 'internal']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  // @ts-ignore
  // @ts-ignore
  async (req, res) => {
    try {
      const { reportType, targetAudience, page, limit } = req.query;

      const filters = {
        reportType: reportType as string,
        targetAudience: targetAudience as string,
      };

      const result = await advertisingService.getTrendReports(
        filters,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.post(
  '/trends/generate',
  authenticateToken,
  requireRole(['admin', 'analyst']),
  [
    body('reportType').isIn(['fashion_trends', 'color_trends', 'brand_performance', 'market_analysis', 'user_behavior']),
    body('targetAudience').optional().isIn(['public', 'premium', 'brands', 'internal']),
  ],
  validateRequest,
  // @ts-ignore
  // @ts-ignore
  async (req, res) => {
    try {
      const { reportType, targetAudience } = req.body;

      const report = await advertisingService.generateTrendReport(reportType, targetAudience);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/insights',
  authenticateToken,
  [
    query('category').optional().isIn(['trend_prediction', 'price_analysis', 'demand_forecast', 'competition_analysis']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ],
  validateRequest,
  // @ts-ignore
  // @ts-ignore
  async (req, res) => {
    try {
      const { category, page, limit } = req.query;

      const result = await advertisingService.getMarketInsights(
        category as string,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 10
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.post(
  '/insights',
  authenticateToken,
  requireRole(['admin', 'analyst']),
  [
    body('category').isIn(['trend_prediction', 'price_analysis', 'demand_forecast', 'competition_analysis']),
    body('title').isLength({ min: 1, max: 255 }),
    body('summary').isLength({ min: 1, max: 1000 }),
    body('confidence').isInt({ min: 0, max: 100 }),
    body('impact').isIn(['low', 'medium', 'high']),
    body('timeHorizon').isIn(['short_term', 'medium_term', 'long_term']),
    body('data').isObject(),
    body('tags').isArray(),
  ],
  validateRequest,
  // @ts-ignore
  // @ts-ignore
  async (req, res) => {
    try {
      const insight = await advertisingService.createMarketInsight(req.body);

      res.status(201).json({
        success: true,
        data: insight,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Platform analytics (admin only)
router.get(
  '/platform-analytics',
  authenticateToken,
  requireRole(['admin']),
  // @ts-ignore
  async (req, res) => {
    try {
      const analytics = await advertisingService.getPlatformAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;