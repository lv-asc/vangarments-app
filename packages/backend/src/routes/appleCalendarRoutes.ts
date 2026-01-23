import { Router } from 'express';
import { appleCalendarController } from '../controllers/appleCalendarController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

router.get('/status', appleCalendarController.getConnectionStatus);
router.post('/connect', appleCalendarController.connectCalendar);
router.post('/add-event', appleCalendarController.addEventToAppleCalendar);

export default router;
