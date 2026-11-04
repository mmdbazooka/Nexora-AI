import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { registerSchema, loginSchema, passwordSchema } from '@nexora/shared';
import { ActionToken, Session, User, Workspace } from '../core/models.js';
import { HttpError, validate } from '../core/errors.js';
import { authenticate, issueCsrf } from './middleware.js';
import { clearCookies, hash, newSession, randomToken, sendAction, setTokens } from './service.js';
import { sendMail } from '../core/mail.js';
import { config } from '../core/config.js';
export const authRouter = Router();
authRouter.get('/csrf', issueCsrf);
const limiter = rateLimit({
  windowMs: 15 * 60000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' },
  },
  skip: () => config.NODE_ENV === 'test',
});
authRouter.post('/register', limiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email }))
    throw new HttpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await Workspace.create({
    name: `${name.split(' ')[0]}'s workspace`,
    members: [{ userId: user._id, role: 'owner' }],
  });
  await sendAction(user, 'verify');
  await newSession(String(user._id), req, res);
  res.status(201).json({ data: user });
});
authRouter.post('/login', limiter, validate(loginSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    throw new HttpError(401, 'Email or password is incorrect');
  await newSession(String(user._id), req, res);
  res.json({ data: user.toJSON() });
});
authRouter.post('/refresh', async (req, res) => {
  const raw = req.cookies.nx_refresh;
  if (typeof raw !== 'string') {
    clearCookies(res);
    throw new HttpError(401, 'Please sign in again');
  }
  const oldHash = hash(raw),
    nextToken = randomToken();
  const session = await Session.findOneAndUpdate(
    { tokenHash: oldHash, revoked: false, expiresAt: { $gt: new Date() } },
    {
      $set: { tokenHash: hash(nextToken) },
      $push: { previousHashes: { $each: [oldHash], $slice: -64 } },
    },
    { new: true },
  );
  if (!session) {
    await Session.updateMany({ previousHashes: oldHash }, { $set: { revoked: true } });
    clearCookies(res);
    throw new HttpError(401, 'Session is no longer valid');
  }
  setTokens(res, String(session.userId), String(session._id), nextToken);
  res.json({ data: { refreshed: true } });
});
authRouter.post('/logout', async (req, res) => {
  if (typeof req.cookies.nx_refresh === 'string')
    await Session.updateMany(
      { tokenHash: hash(req.cookies.nx_refresh) },
      { $set: { revoked: true } },
    );
  clearCookies(res);
  res.json({ data: { loggedOut: true } });
});
authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ data: await User.findById(req.userId) });
});
authRouter.post(
  '/forgot-password',
  limiter,
  validate(z.object({ email: z.email().toLowerCase() })),
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) await sendAction(user, 'reset');
    res.json({ data: { message: 'If that email is registered, a reset link is on its way.' } });
  },
);
authRouter.post(
  '/reset-password',
  limiter,
  validate(z.object({ token: z.string().length(64), password: passwordSchema })),
  async (req, res) => {
    const action = await ActionToken.findOneAndDelete({
      hash: hash(req.body.token),
      kind: 'reset',
      expiresAt: { $gt: new Date() },
    });
    if (!action) throw new HttpError(400, 'This link has expired or was already used');
    await User.updateOne(
      { _id: action.userId },
      { $set: { passwordHash: await bcrypt.hash(req.body.password, 12) } },
    );
    await Session.updateMany({ userId: action.userId }, { $set: { revoked: true } });
    clearCookies(res);
    res.json({ data: { message: 'Password updated. Sign in with your new password.' } });
  },
);
authRouter.post(
  '/verify-email',
  validate(z.object({ token: z.string().length(64) })),
  async (req, res) => {
    const action = await ActionToken.findOneAndDelete({
      hash: hash(req.body.token),
      kind: 'verify',
      expiresAt: { $gt: new Date() },
    });
    if (!action) throw new HttpError(400, 'This link has expired or was already used');
    await User.updateOne({ _id: action.userId }, { $set: { verified: true } });
    res.json({ data: { message: 'Your email is verified.' } });
  },
);
authRouter.post('/resend-verification', limiter, authenticate, async (req, res) => {
  const user = await User.findById(req.userId);
  if (user && !user.verified) await sendAction(user, 'verify');
  res.json({ data: { message: 'Verification email sent.' } });
});
authRouter.post(
  '/contact',
  limiter,
  validate(
    z.object({
      name: z.string().min(2).max(80),
      email: z.email(),
      message: z.string().min(10).max(4000),
    }),
  ),
  async (req, res) => {
    await sendMail(
      config.CONTACT_EMAIL,
      `Nexora contact: ${req.body.name}`,
      `From: ${req.body.email}\n\n${req.body.message}`,
    );
    res.status(201).json({ data: { message: 'Thanks! Your message has been delivered.' } });
  },
);
