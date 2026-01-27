import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { AuthUtils } from '../utils/auth';

const router = Router();
const requireAdmin = AuthUtils.requireRole(['admin']);
const authenticate = AuthUtils.authenticateToken;

// List all events
router.get('/', EventController.listEvents);

// Get single event by ID or slug
router.get('/:id', EventController.getEvent);

// Create event (admin only)
router.post('/', authenticate, requireAdmin, EventController.createEvent);

// Update event (admin only)
router.put('/:id', authenticate, requireAdmin, EventController.updateEvent);

// Delete event (admin only)
router.delete('/:id', authenticate, requireAdmin, EventController.deleteEvent);

export default router;
