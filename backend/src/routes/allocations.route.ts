import { Router } from 'express';
import {
  issueAsset,
  returnAsset,
  requestReturnAsset,
  getReturnRequests,
  respondToReturnRequest,
  getAllocations,
  reportAssetHealth,
  getHealthReports,
} from '../controllers/bookings.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAllocations);
router.post('/issue', authenticateJWT, requireAdmin, issueAsset);
router.post('/request-return', authenticateJWT, requestReturnAsset);
router.get('/return-requests', authenticateJWT, getReturnRequests);
router.post('/return-requests/:id/respond', authenticateJWT, respondToReturnRequest);
router.post('/return', authenticateJWT, requireAdmin, returnAsset);
router.post('/health', authenticateJWT, requireAdmin, reportAssetHealth);
router.get('/health', authenticateJWT, getHealthReports);

export default router;
