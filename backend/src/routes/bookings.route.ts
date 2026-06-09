import { Router } from 'express';
import { createBooking, getBookings, approveBooking, rejectBooking } from '../controllers/bookings.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, createBooking);
router.get('/', authenticateJWT, getBookings);
router.put('/:id/approve', authenticateJWT, requireAdmin, approveBooking);
router.put('/:id/reject', authenticateJWT, requireAdmin, rejectBooking);

export default router;
