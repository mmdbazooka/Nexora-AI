import { randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import type { Request, Response } from 'express';
import { Session, ActionToken } from '../core/models.js';
import { config } from '../core/config.js';
import { sendMail } from '../core/mail.js';
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
export function clearCookies(res: Response) {
  res.clearCookie('nx_access', cookieOptions);
  res.clearCookie('nx_refresh', cookieOptions);
}
export async function newSession(userId: string, req: Request, res: Response) {
  const token = randomToken();
  const session = await Session.create({
    userId,
    tokenHash: hash(token),
    previousHashes: [],
    expiresAt: new Date(Date.now() + 30 * 86400000),
    userAgent: req.get('user-agent')?.slice(0, 250),
  });
  setTokens(res, userId, String(session._id), token);
}
export function setTokens(res: Response, userId: string, sessionId: string, refresh: string) {
  const access = jwt.sign({ sub: userId, sid: sessionId }, config.JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'nexora-api',
    audience: 'nexora-web',
  });
  res.cookie('nx_access', access, { ...cookieOptions, maxAge: 15 * 60000 });
  res.cookie('nx_refresh', refresh, { ...cookieOptions, maxAge: 30 * 86400000 });
}
export async function sendAction(
  user: { _id: Types.ObjectId; email: string },
  kind: 'verify' | 'reset',
) {
  const token = randomToken();
  await ActionToken.deleteMany({ userId: user._id, kind });
  await ActionToken.create({
    userId: user._id,
    hash: hash(token),
    kind,
    expiresAt: new Date(Date.now() + (kind === 'reset' ? 3600000 : 86400000)),
  });
  const path = kind === 'reset' ? 'reset-password' : 'verify-email';
  await sendMail(
    user.email,
    kind === 'reset' ? 'Reset your Nexora password' : 'Verify your Nexora email',
    `${kind === 'reset' ? 'Reset your password' : 'Verify your email'}: ${config.WEB_URL}/${path}?token=${token}\nThis link expires and can only be used once. If you did not request this, ignore this email.`,
  );
}
