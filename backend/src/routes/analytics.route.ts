import { Router } from 'express';
import { getDashboardStats, getDemandForecast } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getDashboardStats);
router.get('/forecast', authenticateJWT, getDemandForecast);

export default router;
