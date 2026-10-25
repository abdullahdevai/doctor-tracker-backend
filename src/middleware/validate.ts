import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    req.valid ??= {};
    for (const key of ['params', 'query', 'body'] as const) {
      const schema = schemas[key];
      if (schema) req.valid[key] = schema.parse(req[key] ?? {});
    }
    next();
  };

export const bodyOf = <S extends z.ZodType>(req: Request, _schema: S) =>
  req.valid.body as z.output<S>;
export const queryOf = <S extends z.ZodType>(req: Request, _schema: S) =>
  req.valid.query as z.output<S>;
export const paramsOf = <S extends z.ZodType>(req: Request, _schema: S) =>
  req.valid.params as z.output<S>;
