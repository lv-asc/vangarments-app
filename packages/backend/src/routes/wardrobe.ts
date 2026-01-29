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

// Analyze item image (for pre-filling form)
router.post(
  '/analyze',
  WardrobeController.uploadMiddleware,
  WardrobeController.analyzeItem
);

// Get user's wardrobe items
router.get('/items', WardrobeController.getUserWardrobe);

// Get wardrobe facets for filtering
router.get('/items/facets', WardrobeController.getFacets);

// Get single wardrobe item
router.get('/items/:id', WardrobeController.getItem);

// Update wardrobe item
router.put('/items/:id', WardrobeController.updateItem);

// Delete wardrobe item
router.delete('/items/:id', WardrobeController.deleteItem);

// Provide AI feedback for training
router.post('/feedback', WardrobeController.provideFeedback);

// Reprocess item with AI
router.post('/items/:id/reprocess', WardrobeController.reprocessWithAI);

// Batch remove background
router.post('/items/:id/images/batch-remove-background', WardrobeController.batchRemoveBackground);

// Remove background from item image
router.post('/items/:id/images/:imageId/remove-background', WardrobeController.removeImageBackground);

// Save manually processed image (help tool)
router.post(
  '/items/:id/images/:imageId/save-processed',
  WardrobeController.uploadMiddleware,
  WardrobeController.saveProcessedImage
);

// Delete specific image from item
router.delete('/items/:id/images/:imageId', WardrobeController.deleteItemImage);

// Reorder images for an item
router.put('/items/:id/images/reorder', WardrobeController.reorderImages);


// Get VUFS options for item creation
router.get('/vufs-options', WardrobeController.getVUFSOptions);

// Get wardrobe statistics
router.get('/stats', WardrobeController.getWardrobeStats);

// Trash management routes
router.get('/trash', WardrobeController.getTrashItems);
router.post('/trash/:id/restore', WardrobeController.restoreItem);
router.delete('/trash/:id', WardrobeController.permanentDeleteItem);

export default router;