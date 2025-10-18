import { Router } from 'express';
import { WardrobeController } from '../controllers/wardrobeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All wardrobe routes require authentication
router.use(authenticateToken);

// Create wardrobe item with AI processing
router.post(
  '/items',
  WardrobeController.uploadMiddleware,
  WardrobeController.createItemWithAI
);

// Get user's wardrobe items
router.get('/items', WardrobeController.getUserWardrobe);

// Update wardrobe item
router.put('/items/:id', WardrobeController.updateItem);

// Delete wardrobe item
router.delete('/items/:id', WardrobeController.deleteItem);

// Provide AI feedback for training
router.post('/feedback', WardrobeController.provideFeedback);

// Reprocess item with AI
router.post('/items/:id/reprocess', WardrobeController.reprocessWithAI);

// Get VUFS options for item creation
router.get('/vufs-options', WardrobeController.getVUFSOptions);

// Get wardrobe statistics
router.get('/stats', WardrobeController.getWardrobeStats);

export default router;