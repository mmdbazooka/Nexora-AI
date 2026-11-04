import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { Session, User } from '../core/models.js';
import { config } from '../core/config.js';
import { HttpError } from '../core/errors.js';
import { randomToken, cookieOptions } from './service.js';
declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
    sessionId: string;
    workspaceId: string;
    workspaceRole: 'owner' | 'admin' | 'member';
  }
}
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const payload = jwt.verify(req.cookies.nx_access || '', config.JWT_SECRET, {
      issuer: 'nexora-api',
      audience: 'nexora-web',
      algorithms: ['HS256'],
    }) as JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
      throw new Error('Invalid claims');
    const session = await Session.exists({
      _id: payload.sid,
      userId: payload.sub,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session || !(await User.exists({ _id: payload.sub }))) throw new Error('Invalid session');
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Please sign in.', 'UNAUTHORIZED'));
  }
};
export const csrf: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  if (origin !== new URL(config.WEB_URL).origin) {
    next(new HttpError(403, 'Request origin is not allowed', 'CSRF_ERROR'));
    return;
  }
  const cookie = req.cookies.nx_csrf;
  const token = req.get('x-csrf-token');
  if (
    typeof cookie !== 'string' ||
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/.test(cookie) ||
    !/^[a-f0-9]{64}$/.test(token) ||
    !timingSafeEqual(Buffer.from(cookie), Buffer.from(token))
  ) {
    next(new HttpError(403, 'Invalid security token. Refresh and try again.', 'CSRF_ERROR'));
    return;
  }
  next();
};
export const issueCsrf: RequestHandler = (_req, res) => {
  const token = randomToken();
  res.cookie('nx_csrf', token, { ...cookieOptions, httpOnly: true, maxAge: 86400000 });
  res.set('Cache-Control', 'no-store').json({ data: { token } });
};
