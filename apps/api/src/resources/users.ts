import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { passwordSchema } from '@nexora/shared';
import {
  User,
  Session,
  Workspace,
  Invitation,
  Notification,
  Conversation,
  Usage,
  Project,
  Task,
  Note,
  Activity,
  ActionToken,
} from '../core/models.js';
import { HttpError, objectId, validate } from '../core/errors.js';
import { clearCookies } from '../auth/service.js';
export const usersRouter = Router();
usersRouter.patch(
  '/me',
  validate(
    z.object({
      name: z.string().trim().min(2).max(80).optional(),
      theme: z.enum(['dark', 'light', 'system']).optional(),
      notifications: z.object({ email: z.boolean(), activity: z.boolean() }).optional(),
      avatar: z.string().max(350000).optional(),
    }),
  ),
  async (req, res) => {
    if (req.body.avatar) {
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(req.body.avatar);
      if (!match) throw new HttpError(422, 'Use a PNG, JPEG, or WebP image under 250 KB');
      const buffer = Buffer.from(match[2], 'base64');
      const valid =
        match[1] === 'png'
          ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : match[1] === 'jpeg'
            ? buffer[0] === 255 && buffer[1] === 216
            : buffer.toString('ascii', 0, 4) === 'RIFF' &&
              buffer.toString('ascii', 8, 12) === 'WEBP';
      if (!valid || buffer.length > 256000)
        throw new HttpError(422, 'Image is invalid or too large');
    }
    res.json({ data: await User.findByIdAndUpdate(req.userId, { $set: req.body }, { new: true }) });
  },
);
usersRouter.post(
  '/me/password',
  validate(z.object({ currentPassword: z.string().min(1).max(128), password: passwordSchema })),
  async (req, res) => {
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash)))
      throw new HttpError(400, 'Current password is incorrect');
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    await user.save();
    await Session.updateMany({ userId: req.userId }, { $set: { revoked: true } });
    clearCookies(res);
    res.json({ data: { message: 'Password changed. Please sign in again.' } });
  },
);
usersRouter.get('/me/sessions', async (req, res) => {
  const sessions = await Session.find({
    userId: req.userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select('_id userAgent createdAt expiresAt')
    .lean();
  res.json({ data: sessions.map((s) => ({ ...s, current: String(s._id) === req.sessionId })) });
});
usersRouter.delete('/me/sessions/:id', async (req, res) => {
  await Session.updateOne(
    { _id: objectId(req.params.id), userId: req.userId },
    { $set: { revoked: true } },
  );
  if (req.params.id === req.sessionId) clearCookies(res);
  res.json({ data: { revoked: true } });
});
usersRouter.delete(
  '/me',
  validate(z.object({ password: z.string().min(1).max(128), confirmation: z.literal('DELETE') })),
  async (req, res) => {
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new HttpError(400, 'Password is incorrect');
    if (
      await Workspace.exists({
        members: { $elemMatch: { userId: req.userId, role: 'owner' } },
        'members.1': { $exists: true },
      })
    )
      throw new HttpError(409, 'Remove other workspace members before deleting your account.');
    const owned = await Workspace.find({
      members: { $elemMatch: { userId: req.userId, role: 'owner' } },
    }).select('_id');
    const ownedIds = owned.map((w) => w._id);
    await Promise.all([
      Project.deleteMany({ workspaceId: { $in: ownedIds } }),
      Task.deleteMany({ workspaceId: { $in: ownedIds } }),
      Note.deleteMany({ workspaceId: { $in: ownedIds } }),
      Activity.deleteMany({ workspaceId: { $in: ownedIds } }),
      Conversation.deleteMany({ workspaceId: { $in: ownedIds } }),
      Invitation.deleteMany({ workspaceId: { $in: ownedIds } }),
      Workspace.deleteMany({ _id: { $in: ownedIds } }),
      ActionToken.deleteMany({ userId: req.userId }),
    ]);
    await Workspace.updateMany(
      { 'members.userId': req.userId },
      { $pull: { members: { userId: req.userId } } },
    );
    await Promise.all([
      User.deleteOne({ _id: req.userId }),
      Session.deleteMany({ userId: req.userId }),
      Invitation.deleteMany({ email: user.email }),
      Notification.deleteMany({ userId: req.userId }),
      Conversation.deleteMany({ createdBy: req.userId }),
      Usage.deleteMany({ userId: req.userId }),
    ]);
    clearCookies(res);
    res.json({ data: { deleted: true } });
  },
);
export const notificationsRouter = Router();
notificationsRouter.get('/', async (req, res) => {
  res.json({
    data: await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(30),
  });
});
notificationsRouter.patch('/read', async (req, res) => {
  await Notification.updateMany({ userId: req.userId }, { $set: { read: true } });
  res.json({ data: { read: true } });
});
