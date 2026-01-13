import { Router } from 'express';
import { calendarController } from '../controllers/calendarController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Public routes
router.get('/events', calendarController.getEvents);
router.get('/events/:id', calendarController.getEventById);
router.get('/years', calendarController.getAvailableYears);
router.get('/event-types', calendarController.getEventTypes);

// Protected routes (require authentication)
router.post('/events', AuthUtils.authenticateToken, calendarController.createEvent);
router.put('/events/:id', AuthUtils.authenticateToken, calendarController.updateEvent);
router.delete('/events/:id', AuthUtils.authenticateToken, calendarController.deleteEvent);

// Subscriptions
router.post('/subscribe', AuthUtils.authenticateToken, calendarController.subscribe);
router.post('/unsubscribe', AuthUtils.authenticateToken, calendarController.unsubscribe);
router.get('/subscriptions', AuthUtils.authenticateToken, calendarController.getSubscriptions);

// Admin/Sync
router.post('/sync-skus', AuthUtils.authenticateToken, calendarController.syncSKUs);

// Event Types Management (Admin)
router.post('/event-types', AuthUtils.authenticateToken, calendarController.createEventType);
router.put('/event-types/:id', AuthUtils.authenticateToken, calendarController.updateEventType);
router.delete('/event-types/:id', AuthUtils.authenticateToken, calendarController.deleteEventType);

export default router;
