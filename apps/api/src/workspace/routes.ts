import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { workspaceSchema } from '@nexora/shared';
import { Activity, Invitation, Notification, User, Workspace } from '../core/models.js';
import { HttpError, objectId, validate } from '../core/errors.js';
import { hash, randomToken } from '../auth/service.js';
import { emailEnabled, requireEmail, sendMail } from '../core/mail.js';
import { logger } from '../core/errors.js';
import { config } from '../core/config.js';

export const workspaceAccess: RequestHandler = async (req, _res, next) => {
  req.workspaceId = objectId(req.params.workspaceId);
  const workspace = await Workspace.findOne({ _id: req.workspaceId, 'members.userId': req.userId });
  if (!workspace) throw new HttpError(403, 'You do not have access to this workspace', 'FORBIDDEN');
  req.workspaceRole = workspace.members.find((m) => String(m.userId) === req.userId)!.role as
    'owner' | 'admin' | 'member';
  next();
};
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!['owner', 'admin'].includes(req.workspaceRole))
    throw new HttpError(403, 'An owner or admin must do this', 'FORBIDDEN');
  next();
};
export async function recordActivity(
  workspaceId: string,
  createdBy: string,
  message: string,
  href = '/dashboard',
) {
  await Activity.create({ workspaceId, createdBy, message, href });
  const workspace = await Workspace.findById(workspaceId);
  if (workspace) {
    const users = await User.find({
      _id: {
        $in: workspace.members.filter((m) => String(m.userId) !== createdBy).map((m) => m.userId),
      },
    });
    const notifications = users
      .filter((u) => u.notifications?.activity)
      .map((u) => ({ userId: u._id, message, href }));
    if (notifications.length) await Notification.insertMany(notifications);
    if (emailEnabled && /^Created (project|task):/.test(message))
      await Promise.all(
        users
          .filter((u) => u.notifications?.email)
          .map((u) =>
            sendMail(
              u.email,
              'A little momentum in your workspace',
              `${message}\n${config.WEB_URL}${href}`,
            ).catch(() => logger.warn('Workspace email delivery failed')),
          ),
      );
  }
}
export const workspaceRouter = Router();
workspaceRouter.get('/', async (req, res) => {
  res.json({ data: await Workspace.find({ 'members.userId': req.userId }).sort({ createdAt: 1 }) });
});
workspaceRouter.post('/', validate(workspaceSchema), async (req, res) => {
  res.status(201).json({
    data: await Workspace.create({
      name: req.body.name,
      members: [{ userId: req.userId, role: 'owner' }],
    }),
  });
});
workspaceRouter.post(
  '/accept-invite',
  validate(z.object({ token: z.string().length(64) })),
  async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user?.verified)
      throw new HttpError(403, 'Verify your email before accepting an invitation');
    const invite = await Invitation.findOne({
      hash: hash(req.body.token),
      expiresAt: { $gt: new Date() },
      email: user.email,
    });
    if (!invite)
      throw new HttpError(400, 'Invitation is invalid, expired, or addressed to another email');
    const workspace = await Workspace.findOneAndUpdate(
      { _id: invite.workspaceId, 'members.userId': { $ne: req.userId } },
      { $push: { members: { userId: req.userId, role: invite.role } } },
      { new: true },
    );
    await Invitation.deleteOne({ _id: invite._id });
    if (!workspace) throw new HttpError(409, 'You already belong to this workspace');
    res.json({ data: workspace });
  },
);
workspaceRouter.get('/:workspaceId/members', workspaceAccess, async (req, res) => {
  const workspace = await Workspace.findById(req.params.workspaceId).populate(
    'members.userId',
    'name email avatar',
  );
  res.json({ data: workspace?.members });
});
workspaceRouter.patch(
  '/:workspaceId',
  workspaceAccess,
  requireAdmin,
  validate(workspaceSchema),
  async (req, res) => {
    res.json({
      data: await Workspace.findByIdAndUpdate(
        req.params.workspaceId,
        { name: req.body.name },
        { new: true },
      ),
    });
  },
);
workspaceRouter.post(
  '/:workspaceId/invites',
  workspaceAccess,
  requireAdmin,
  validate(
    z.object({
      email: z.email().toLowerCase(),
      role: z.enum(['admin', 'member']).default('member'),
    }),
  ),
  async (req, res) => {
    requireEmail();
    const inviter = await User.findById(req.userId);
    if (!inviter?.verified) throw new HttpError(403, 'Verify your email before inviting teammates');
    const token = randomToken();
    await Invitation.deleteMany({ workspaceId: req.params.workspaceId, email: req.body.email });
    await Invitation.create({
      workspaceId: req.params.workspaceId,
      ...req.body,
      hash: hash(token),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
    await sendMail(
      req.body.email,
      'You are invited to Nexora',
      `${inviter.name} invited you to collaborate. Sign in with this email, verify it, and accept: ${config.WEB_URL}/dashboard/workspaces?invite=${token}`,
    );
    res.status(201).json({ data: { message: 'Invitation sent. It expires in 7 days.' } });
  },
);
workspaceRouter.patch(
  '/:workspaceId/members/:memberId',
  workspaceAccess,
  requireAdmin,
  validate(z.object({ role: z.enum(['admin', 'member']) })),
  async (req, res) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    const member = workspace?.members.find(
      (m) => String(m.userId) === objectId(req.params.memberId),
    );
    if (!member) throw new HttpError(404, 'Member not found');
    if (member.role === 'owner' || req.workspaceRole !== 'owner')
      throw new HttpError(403, 'Only the owner can change non-owner roles');
    member.role = req.body.role;
    await workspace!.save();
    res.json({ data: workspace });
  },
);
workspaceRouter.delete(
  '/:workspaceId/members/:memberId',
  workspaceAccess,
  requireAdmin,
  async (req, res) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    const member = workspace?.members.find(
      (m) => String(m.userId) === objectId(req.params.memberId),
    );
    if (!member) throw new HttpError(404, 'Member not found');
    if (member.role === 'owner' || (member.role === 'admin' && req.workspaceRole !== 'owner'))
      throw new HttpError(403, 'This member cannot be removed by your role');
    workspace!.members.pull(member._id);
    await workspace!.save();
    res.json({ data: { removed: true } });
  },
);
