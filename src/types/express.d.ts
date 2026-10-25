import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      valid: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
