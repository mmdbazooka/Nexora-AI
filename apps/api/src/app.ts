import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { config } from './core/config.js';
import { errors, HttpError, logger } from './core/errors.js';
import { authRouter } from './auth/routes.js';
import { authenticate, csrf } from './auth/middleware.js';
import { workspaceAccess, workspaceRouter } from './workspace/routes.js';
import { projectsRouter, tasksRouter, notesRouter, activityRouter } from './resources/routes.js';
import { analyticsRouter } from './resources/analytics.js';
import { usersRouter, notificationsRouter } from './resources/users.js';
import { aiRouter } from './ai/routes.js';
export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY);
app.use(helmet());
app.use(
  cors({
    origin: config.WEB_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  }),
);
app.use((req, res, next) => {
  const id = randomUUID();
  res.set('X-Request-ID', id);
  const started = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - started,
      },
      'request',
    );
  });
  next();
});
app.get('/health', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res
    .status(ready ? 200 : 503)
    .json({ status: ready ? 'ok' : 'unavailable', database: ready ? 'connected' : 'disconnected' });
});
app.use(
  '/api',
  rateLimit({
    windowMs: 60000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please try again in a minute.' } },
  }),
);
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());
app.use(csrf);
app.use('/api/v1', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (mongoose.connection.readyState !== 1)
    throw new HttpError(
      503,
      'The database is unavailable. Please try again shortly.',
      'DATABASE_UNAVAILABLE',
    );
  next();
});
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticate, usersRouter);
app.use('/api/v1/notifications', authenticate, notificationsRouter);
app.use('/api/v1/workspaces', authenticate, workspaceRouter);
const base = '/api/v1/workspaces/:workspaceId';
app.use(`${base}/projects`, authenticate, workspaceAccess, projectsRouter);
app.use(`${base}/tasks`, authenticate, workspaceAccess, tasksRouter);
app.use(`${base}/notes`, authenticate, workspaceAccess, notesRouter);
app.use(`${base}/activity`, authenticate, workspaceAccess, activityRouter);
app.use(`${base}/analytics`, authenticate, workspaceAccess, analyticsRouter);
app.use(`${base}/ai`, authenticate, workspaceAccess, aiRouter);
app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint not found')));
app.use(errors);
