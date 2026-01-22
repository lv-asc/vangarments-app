import { Router } from 'express';
import { googleCalendarController } from '../controllers/googleCalendarController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Check if user has Google Calendar connected
router.get('/status', AuthUtils.authenticateToken, googleCalendarController.getConnectionStatus);

// Add event to Google Calendar (requires authentication)
router.post('/add-event', AuthUtils.authenticateToken, googleCalendarController.addEventToGoogleCalendar);

// Generate Google Calendar URL (fallback - works without full OAuth)
router.get('/generate-url', googleCalendarController.generateGoogleCalendarUrl);

export default router;
