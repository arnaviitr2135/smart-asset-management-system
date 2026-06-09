import { Router } from 'express';
import { issueAsset, returnAsset, getAllocations, reportAssetHealth, getHealthReports } from '../controllers/bookings.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAllocations);
router.post('/issue', authenticateJWT, requireAdmin, issueAsset);
router.post('/return', authenticateJWT, requireAdmin, returnAsset);
router.post('/health', authenticateJWT, requireAdmin, reportAssetHealth);
router.get('/health', authenticateJWT, getHealthReports);

export default router;
