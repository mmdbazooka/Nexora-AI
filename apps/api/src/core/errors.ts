import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import mongoose from 'mongoose';
import pino from 'pino';
export const logger = pino({
  redact: ['req.headers.cookie', 'req.headers.authorization', 'password', 'token'],
});
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'REQUEST_ERROR',
  ) {
    super(message);
  }
}
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
export function objectId(value: unknown): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value))
    throw new HttpError(400, 'Invalid resource ID');
  return value;
}
export const errors: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues[0]?.message,
        details: err.issues.map((i) => ({ path: i.path, message: i.message })),
      },
    });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid resource ID' } });
    return;
  }
  if (err?.code === 11000) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'That record already exists' } });
    return;
  }
  const status = err instanceof HttpError ? err.status : 400 === err.status ? 400 : 500;
  if (status === 500) logger.error({ name: err.name, message: err.message }, 'Request failed');
  res.status(status).json({
    error: {
      code: err instanceof HttpError ? err.code : 'INTERNAL_ERROR',
      message: status === 500 ? 'Something went wrong. Please try again.' : err.message,
    },
  });
};
