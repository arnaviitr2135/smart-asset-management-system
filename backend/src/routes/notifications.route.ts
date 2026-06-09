import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getNotifications);
router.put('/:id/read', authenticateJWT, markNotificationAsRead);

export default router;
