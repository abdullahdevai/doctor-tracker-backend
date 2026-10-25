import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { verifyToken } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token: string | undefined = req.cookies?.[env.COOKIE_NAME] ?? bearer;

  if (!token) throw ApiError.unauthorized();

  const payload = verifyToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
};

export const authorize =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
