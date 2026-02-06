import { Router } from 'express';
import { ContentController } from '../controllers/contentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT POSTS
// ─────────────────────────────────────────────────────────────────────────────

// Create content post
router.post('/posts', authenticateToken, ContentController.createPost);

// Get content feed (public, with optional auth for personalization)
router.get('/feed', optionalAuth, ContentController.getFeed);

// Get active Daily stories from followed users
router.get('/stories', authenticateToken, ContentController.getStories);

// Get single content post
router.get('/posts/:id', optionalAuth, ContentController.getPost);

// Update content post
router.put('/posts/:id', authenticateToken, ContentController.updatePost);

// Delete content post
router.delete('/posts/:id', authenticateToken, ContentController.deletePost);

// Toggle like on content
router.post('/posts/:id/like', authenticateToken, ContentController.toggleLike);

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT VIEWS (Story "Seen" tracking)
// ─────────────────────────────────────────────────────────────────────────────

// Record view (for Daily stories)
router.post('/posts/:id/view', authenticateToken, ContentController.recordView);

// Get viewers list (for content owner)
router.get('/posts/:id/viewers', authenticateToken, ContentController.getViewers);

// ─────────────────────────────────────────────────────────────────────────────
// DRAFTS
// ─────────────────────────────────────────────────────────────────────────────

// Get user's drafts
router.get('/drafts', authenticateToken, ContentController.getDrafts);

// Create draft
router.post('/drafts', authenticateToken, ContentController.createDraft);

// Get single draft
router.get('/drafts/:id', authenticateToken, ContentController.getDraft);

// Update draft
router.put('/drafts/:id', authenticateToken, ContentController.updateDraft);

// Delete draft
router.delete('/drafts/:id', authenticateToken, ContentController.deleteDraft);

// Publish draft (convert to post)
router.post('/drafts/:id/publish', authenticateToken, ContentController.publishDraft);

export default router;
