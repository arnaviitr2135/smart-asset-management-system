import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
 
dotenv.config();

import authRouter from './routes/auth.route';
import assetsRouter from './routes/assets.route';
import bookingsRouter from './routes/bookings.route';
import allocationsRouter from './routes/allocations.route';
import analyticsRouter from './routes/analytics.route';
import auditRouter from './routes/audit.route';
import notificationsRouter from './routes/notifications.route';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend web server
app.use(cors({
  origin: '*', // In development allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Heartbeat route
app.get('/healthz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'CONNECTED' });
  } catch (error) {
    console.error('Database connection failed in healthz check:', error);
    res.status(500).json({ status: 'ERROR', database: 'DISCONNECTED' });
  }
});

// Register api v1 routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/assets', assetsRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/allocations', allocationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'An unhandled server error occurred' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Server] CultTrack AI Backend listening on port ${PORT}`);
});
