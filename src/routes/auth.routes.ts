import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.validators.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many login attempts. Try again in a few minutes.',
      code: 'RATE_LIMITED',
    },
  },
});

export const authRoutes = Router()
  .post('/login', loginLimiter, validate({ body: loginSchema }), auth.login)
  .post('/logout', auth.logout)
  .get('/me', authenticate, auth.me);
