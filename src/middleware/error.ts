import type { ErrorRequestHandler, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound: RequestHandler = (req) => {
  throw ApiError.notFound(`Route ${req.method} ${req.originalUrl}`);
};

type ErrorBody = { error: { message: string; code: string; details?: unknown } };

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    return new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', fields);
  }

  if (err instanceof jwt.TokenExpiredError)
    return new ApiError(401, 'Session expired', 'TOKEN_EXPIRED');
  if (err instanceof jwt.JsonWebTokenError)
    return new ApiError(401, 'Invalid session', 'INVALID_TOKEN');

  if (err instanceof mongoose.Error.CastError)
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', fields);
  }

  if (typeof err === 'object' && err && 'code' in err && err.code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`, {
      [field]: `This ${field} is already in use`,
    });
  }

  if (typeof err === 'object' && err && 'type' in err && err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }

  return new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = toApiError(err);

  if (apiError.status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body: ErrorBody = {
    error: { message: apiError.message, code: apiError.code },
  };
  if (apiError.details) body.error.details = apiError.details;
  if (!env.isProd && apiError.status >= 500 && err instanceof Error) {
    body.error.details = { stack: err.stack };
  }

  res.status(apiError.status).json(body);
};
