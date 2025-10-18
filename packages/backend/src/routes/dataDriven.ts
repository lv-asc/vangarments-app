import { Router, Request, Response } from 'express';
import { DataDrivenService } from '../services/dataDrivenService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requireAdvancedAnalyticsAccess } from '../middleware/premium';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const dataDrivenService = new DataDrivenService();

// AI Model Management Routes (Admin only)
router.post(
  '/ai-models/metrics',
  authenticateToken,
  requireRole(['admin', 'data_scientist']),
  [
    body('modelName').isString().isLength({ min: 1, max: 100 }),
    body('modelVersion').isString().isLength({ min: 1, max: 50 }),
    body('trainingResults.accuracy').isFloat({ min: 0, max: 1 }),
    body('trainingResults.precision').isFloat({ min: 0, max: 1 }),
    body('trainingResults.recall').isFloat({ min: 0, max: 1 }),
    body('trainingResults.f1Score').isFloat({ min: 0, max: 1 }),
    body('trainingResults.trainingDataSize').isInt({ min: 1 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const metrics = await dataDrivenService.updateAIModelMetrics(req.body);
      
      res.status(201).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to update AI model metrics',
      });
    }
  }
);

router.get(
  '/ai-models/metrics',
  authenticateToken,
  requireRole(['admin', 'data_scientist']),
  [query('modelName').optional().isString()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { modelName } = req.query;
      const metrics = await dataDrivenService.getAIModelMetrics(modelName as string);
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get AI model metrics',
      });
    }
  }
);

// Item Valuation Routes
router.post(
  '/items/:itemId/valuation',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [
    param('itemId').isUUID(),
    body('originalPrice').optional().isFloat({ min: 0 }),
    body('condition').isIn(['new', 'excellent', 'good', 'fair', 'poor']),
    body('brand').isString().isLength({ min: 1 }),
    body('category').isString().isLength({ min: 1 }),
    body('purchaseDate').isISO8601(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const valuationRequest = {
        itemId,
        ...req.body,
      };
      
      const valuation = await dataDrivenService.calculateItemValuation(valuationRequest);
      
      res.json({
        success: true,
        data: valuation,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to calculate item valuation',
      });
    }
  }
);

// Style DNA Routes
router.get(
  '/users/:userId/style-dna',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const styleDNA = await dataDrivenService.analyzeUserStyleDNA(userId);
      
      res.json({
        success: true,
        data: styleDNA,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to analyze style DNA',
      });
    }
  }
);

router.post(
  '/users/:userId/style-dna/analyze',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const styleDNA = await dataDrivenService.analyzeUserStyleDNA(userId);
      
      res.json({
        success: true,
        data: styleDNA,
        message: 'Style DNA analysis completed',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to analyze style DNA',
      });
    }
  }
);

// Wardrobe Optimization Routes
router.get(
  '/users/:userId/wardrobe-optimization',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const optimization = await dataDrivenService.generateWardrobeOptimization(userId);
      
      res.json({
        success: true,
        data: optimization,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate wardrobe optimization',
      });
    }
  }
);

// Trend Predictions Routes
router.get(
  '/users/:userId/trend-predictions',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const predictions = await dataDrivenService.generatePersonalizedTrendPredictions(userId);
      
      res.json({
        success: true,
        data: predictions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate trend predictions',
      });
    }
  }
);

// Comprehensive Analytics Routes
router.get(
  '/users/:userId/analytics',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const analytics = await dataDrivenService.getUserAnalytics(userId);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get user analytics',
      });
    }
  }
);

// Style Recommendations Routes
router.get(
  '/users/:userId/style-recommendations',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [
    param('userId').isUUID(),
    query('occasion').optional().isString(),
    query('season').optional().isString(),
    query('budgetMin').optional().isFloat({ min: 0 }),
    query('budgetMax').optional().isFloat({ min: 0 }),
    query('categories').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { occasion, season, budgetMin, budgetMax, categories } = req.query;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const context: any = {};
      if (occasion) context.occasion = occasion;
      if (season) context.season = season;
      if (budgetMin && budgetMax) {
        context.budget = { 
          min: parseFloat(budgetMin as string), 
          max: parseFloat(budgetMax as string) 
        };
      }
      if (categories) {
        context.categories = (categories as string).split(',');
      }
      
      const recommendations = await dataDrivenService.generateStyleRecommendations(userId, context);
      
      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate style recommendations',
      });
    }
  }
);

// Sustainability Analysis Routes
router.get(
  '/users/:userId/sustainability-metrics',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const metrics = await dataDrivenService.analyzeSustainabilityMetrics(userId);
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to analyze sustainability metrics',
      });
    }
  }
);

// Cost-per-wear Analysis Routes
router.get(
  '/users/:userId/cost-per-wear',
  authenticateToken,
  requireAdvancedAnalyticsAccess,
  [param('userId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own data or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const analysis = await dataDrivenService.generateCostPerWearAnalysis(userId);
      
      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate cost-per-wear analysis',
      });
    }
  }
);

// User Interaction Tracking Routes
router.post(
  '/users/:userId/interactions',
  authenticateToken,
  [
    param('userId').isUUID(),
    body('itemId').isUUID(),
    body('interactionType').isIn(['viewed', 'liked', 'worn', 'shared', 'purchased', 'sold']),
    body('interactionData').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { itemId, interactionType, interactionData } = req.body;
      
      // Check if user is tracking their own interactions or is admin
      if (userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      await dataDrivenService.trackUserInteraction(
        userId,
        itemId,
        interactionType,
        interactionData || {}
      );
      
      res.json({
        success: true,
        message: 'Interaction tracked successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to track interaction',
      });
    }
  }
);

export default router;