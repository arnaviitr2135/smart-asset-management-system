import { Router } from 'express';
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } from '../controllers/assets.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAssets);
router.get('/:id', authenticateJWT, getAssetById);
router.post('/', authenticateJWT, requireAdmin, createAsset);
router.put('/:id', authenticateJWT, requireAdmin, updateAsset);
router.delete('/:id', authenticateJWT, requireAdmin, deleteAsset);

export default router;
