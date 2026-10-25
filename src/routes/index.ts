import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import { authRoutes } from './auth.routes.js';
import { doctorRoutes } from './doctor.routes.js';
import { patientRoutes } from './patient.routes.js';
import { statsRoutes } from './stats.routes.js';

const protectedRoutes = Router()
  .use(authenticate, authorize('admin'))
  .use('/doctors', doctorRoutes)
  .use('/patients', patientRoutes)
  .use('/stats', statsRoutes);

export const apiRoutes = Router()
  .get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db });
  })
  .use('/auth', authRoutes)
  .use(protectedRoutes);
