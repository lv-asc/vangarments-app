import { Request, Response } from 'express';
import { AdvertisingService } from '../services/advertisingService';
import { AuthenticatedRequest } from '../utils/auth';

const advertisingService = new AdvertisingService();

export class AdvertisingController {
  /**
   * Create a new advertising campaign
   */
  async createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        campaignName,
        campaignType,
        budget,
        targeting,
        creativeAssets,
        placements,
        schedule,
      } = req.body;

      if (!campaignName || !campaignType || !budget || !creativeAssets) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Campaign name, type, budget, and creative assets are required',
          },
        });
        return;
      }

      const campaign = await advertisingService.createCampaign({
        advertiserId: userId,
        campaignName,
        campaignType,
        budget,
        targeting: targeting || {},
        creativeAssets,
        placements: placements || ['feed'],
        schedule,
      });

      res.status(201).json({
        success: true,
        data: { campaign },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'CAMPAIGN_CREATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get targeted ads for user
   */
  async getTargetedAds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { placement = 'feed', limit = 3 } = req.query;
      const { currentPage, deviceType, location } = req.body;

      const context = {
        userId,
        currentPage: currentPage || 'unknown',
        deviceType: deviceType || 'web',
        location,
      };

      const ads = await advertisingService.getTargetedAds(
        userId,
        placement as string,
        context,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { ads },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ADS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Track ad click
   */
  async trackAdClick(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { impressionId, campaignId, destinationUrl } = req.body;

      if (!impressionId || !campaignId || !destinationUrl) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Impression ID, campaign ID, and destination URL are required',
          },
        });
        return;
      }

      await advertisingService.trackAdClick(impressionId, campaignId, userId, destinationUrl);

      res.json({
        success: true,
        message: 'Ad click tracked successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'TRACK_CLICK_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Track ad conversion
   */
  async trackAdConversion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { clickId, campaignId, conversionType, conversionValue, conversionData } = req.body;

      if (!clickId || !campaignId || !conversionType) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Click ID, campaign ID, and conversion type are required',
          },
        });
        return;
      }

      await advertisingService.trackAdConversion(
        clickId,
        campaignId,
        userId,
        conversionType,
        conversionValue || 0,
        conversionData || {}
      );

      res.json({
        success: true,
        message: 'Ad conversion tracked successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'TRACK_CONVERSION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: startDate as string,
          end: endDate as string,
        };
      }

      const analytics = await advertisingService.getCampaignAnalytics(campaignId, dateRange);

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ANALYTICS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get targeting recommendations
   */
  async getTargetingRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { campaignType } = req.query;

      if (!campaignType) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Campaign type is required',
          },
        });
        return;
      }

      const recommendations = await advertisingService.getAdvertisingRecommendations(
        userId
      );

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_RECOMMENDATIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Generate fashion trend report
   */
  async generateTrendReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportType, startDate, endDate, accessLevel = 'public' } = req.body;

      if (!reportType || !startDate || !endDate) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Report type, start date, and end date are required',
          },
        });
        return;
      }

      const report = await advertisingService.generateTrendReport(
        reportType,
        { start: startDate, end: endDate },
        accessLevel
      );

      res.status(201).json({
        success: true,
        data: { report },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GENERATE_REPORT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Generate market intelligence report
   */
  async generateMarketIntelligence(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category, accessLevel = 'premium' } = req.body;

      if (!category) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Report category is required',
          },
        });
        return;
      }

      const report = await advertisingService.generateMarketIntelligence(category, accessLevel);

      res.status(201).json({
        success: true,
        data: { report },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GENERATE_INTELLIGENCE_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const recommendations = await advertisingService.getPersonalizedRecommendations(userId);

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_RECOMMENDATIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get advertiser dashboard
   */
  async getAdvertiserDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const dashboard = await advertisingService.getAdvertiserDashboard(userId);

      res.json({
        success: true,
        data: { dashboard },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_DASHBOARD_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get data intelligence dashboard
   */
  async getDataIntelligenceDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Check if user has admin or analytics access
      const dashboard = await advertisingService.getDataIntelligenceDashboard(req.user!.userId);

      res.json({
        success: true,
        data: { dashboard },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_INTELLIGENCE_DASHBOARD_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Create VUFS-targeted campaign
   */
  async createVUFSTargetedCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        targetingCriteria,
        campaignName,
        campaignType,
        budget,
        creativeAssets,
        placements,
        schedule,
      } = req.body;

      if (!targetingCriteria || !campaignName || !campaignType || !budget || !creativeAssets) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Targeting criteria, campaign name, type, budget, and creative assets are required',
          },
        });
        return;
      }

      const campaign = await advertisingService.createVUFSTargetedCampaign(
        userId,
        {
          advertiserId: userId,
          campaignName,
          campaignType,
          budget,
          creativeAssets,
          placements: placements || ['feed'],
          schedule,
          targeting: targetingCriteria,
        }
      );

      res.status(201).json({
        success: true,
        data: { campaign },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'VUFS_CAMPAIGN_CREATION_FAILED',
          message: error.message,
        },
      });
    }
  }
}