import { Router } from 'express';
import { AIController, uploadMiddleware } from '../controllers/aiController';
import { AITrainingController } from '../controllers/aiTrainingController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// AI processing routes
router.post('/process-image', AuthUtils.authenticateToken, uploadMiddleware, AIController.processImage);
router.post('/analyze-url', AIController.analyzeImageUrl);
router.post('/batch-process', AuthUtils.authenticateToken, AIController.batchProcess);

// AI capabilities and info
router.get('/capabilities', AIController.getCapabilities);

// AI training and learning routes
router.post('/feedback', AuthUtils.authenticateToken, AITrainingController.submitFeedback);
router.get('/review-items', AuthUtils.authenticateToken, AITrainingController.getItemsForReview);
router.get('/performance/:modelVersion', AITrainingController.getModelPerformance);
router.get('/performance-history', AITrainingController.getPerformanceHistory);
router.get('/training-stats', AITrainingController.getTrainingStats);
router.get('/training-dataset', AuthUtils.authenticateToken, AITrainingController.getTrainingDataset);
router.post('/training-data', AuthUtils.authenticateToken, AITrainingController.storeTrainingData);
router.post('/evaluate-model', AuthUtils.authenticateToken, AITrainingController.evaluateModel);

export default router;