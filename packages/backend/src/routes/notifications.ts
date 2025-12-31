import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.post('/:id/read', markAsRead);

// Mark all as read
router.post('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
