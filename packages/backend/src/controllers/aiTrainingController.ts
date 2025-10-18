import { Request, Response } from 'express';
import { AITrainingModel } from '../models/AITraining';
import { AuthenticatedRequest } from '../utils/auth';

export class AITrainingController {
  /**
   * Submit user feedback for AI predictions
   */
  static async submitFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { imageUrl, corrections, confidence } = req.body;

      if (!imageUrl || !corrections) {
        return res.status(400).json({
          error: {
            code: 'MISSING_DATA',
            message: 'Image URL and corrections are required',
          },
        });
      }

      const trainingData = await AITrainingModel.recordUserFeedback(
        imageUrl,
        req.user.userId,
        corrections,
        confidence || 100
      );

      if (!trainingData) {
        return res.status(404).json({
          error: {
            code: 'TRAINING_DATA_NOT_FOUND',
            message: 'No training data found for this image',
          },
        });
      }

      res.json({
        message: 'Feedback recorded successfully',
        trainingData,
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while recording feedback',
        },
      });
    }
  }

  /**
   * Get items that need human review
   */
  static async getItemsForReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { confidenceThreshold = 70 } = req.query;

      const items = await AITrainingModel.getItemsNeedingReview(
        parseInt(confidenceThreshold as string)
      );

      res.json({
        items,
        count: items.length,
        confidenceThreshold: parseInt(confidenceThreshold as string),
      });
    } catch (error) {
      console.error('Get items for review error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching items for review',
        },
      });
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(req: Request, res: Response) {
    try {
      const { modelVersion } = req.params;

      if (!modelVersion) {
        return res.status(400).json({
          error: {
            code: 'MISSING_MODEL_VERSION',
            message: 'Model version is required',
          },
        });
      }

      const performance = await AITrainingModel.calculateModelPerformance(modelVersion);

      res.json({
        performance,
      });
    } catch (error) {
      console.error('Get model performance error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while calculating model performance',
        },
      });
    }
  }

  /**
   * Get model performance history
   */
  static async getPerformanceHistory(req: Request, res: Response) {
    try {
      const history = await AITrainingModel.getModelPerformanceHistory();

      res.json({
        history,
        count: history.length,
      });
    } catch (error) {
      console.error('Get performance history error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching performance history',
        },
      });
    }
  }

  /**
   * Get training statistics
   */
  static async getTrainingStats(req: Request, res: Response) {
    try {
      const stats = await AITrainingModel.getTrainingStats();

      res.json({
        stats,
      });
    } catch (error) {
      console.error('Get training stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching training statistics',
        },
      });
    }
  }

  /**
   * Get training dataset for model improvement
   */
  static async getTrainingDataset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { modelVersion, limit = 1000, offset = 0 } = req.query;

      const dataset = await AITrainingModel.getTrainingDataset(
        modelVersion as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        dataset,
        count: dataset.length,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      console.error('Get training dataset error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching training dataset',
        },
      });
    }
  }

  /**
   * Store training data with ground truth labels
   */
  static async storeTrainingData(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { imageUrl, groundTruthLabels, aiPredictions, modelVersion } = req.body;

      if (!imageUrl || !groundTruthLabels || !modelVersion) {
        return res.status(400).json({
          error: {
            code: 'MISSING_DATA',
            message: 'Image URL, ground truth labels, and model version are required',
          },
        });
      }

      const trainingData = await AITrainingModel.storeTrainingData({
        imageUrl,
        groundTruthLabels,
        aiPredictions,
        modelVersion,
      });

      res.status(201).json({
        message: 'Training data stored successfully',
        trainingData,
      });
    } catch (error) {
      console.error('Store training data error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while storing training data',
        },
      });
    }
  }

  /**
   * Evaluate and store model performance
   */
  static async evaluateModel(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { modelVersion } = req.body;

      if (!modelVersion) {
        return res.status(400).json({
          error: {
            code: 'MISSING_MODEL_VERSION',
            message: 'Model version is required',
          },
        });
      }

      // Calculate performance
      const performance = await AITrainingModel.calculateModelPerformance(modelVersion);

      // Store performance metrics
      await AITrainingModel.storeModelPerformance(performance);

      res.json({
        message: 'Model evaluation completed',
        performance,
      });
    } catch (error) {
      console.error('Evaluate model error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while evaluating the model',
        },
      });
    }
  }
}