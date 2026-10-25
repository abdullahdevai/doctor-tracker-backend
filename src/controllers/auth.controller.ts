import type { CookieOptions, RequestHandler } from 'express';
import { env } from '../config/env.js';
import { bodyOf } from '../middleware/validate.js';
import * as authService from '../services/auth.service.js';
import { loginSchema } from '../validators/auth.validators.js';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/',
};

export const login: RequestHandler = async (req, res) => {
  const { user, token } = await authService.login(bodyOf(req, loginSchema));
  res.cookie(env.COOKIE_NAME, token, { ...cookieOptions, maxAge: env.JWT_TTL_SECONDS * 1000 });
  res.json({ data: { user } });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, cookieOptions);
  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getUserById(req.user!.id);
  res.json({ data: { user } });
};
