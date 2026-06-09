import { Router } from 'express';
import { getAuditLogs } from '../controllers/analytics.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requireAdmin, getAuditLogs);

export default router;
