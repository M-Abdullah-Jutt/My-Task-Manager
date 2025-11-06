import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getMyNotifications, markAsRead, getUnreadCount } from '../controllers/notification.controller';

const router = Router();

router.use(protect); // All notification routes are protected

// /notifications/unread-count
router.get('/unread-count', getUnreadCount);

// /notifications
router.get('/', getMyNotifications);

// /notifications/:id/read
router.patch('/:id/read', markAsRead);

export default router;