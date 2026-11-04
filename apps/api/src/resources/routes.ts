import { Router, type Request } from 'express';
import type { Model } from 'mongoose';
import { projectSchema, taskSchema, noteSchema } from '@nexora/shared';
import type { ZodType } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { Activity, Project, Task, Note, Workspace } from '../core/models.js';
import { HttpError, objectId, validate } from '../core/errors.js';
import { recordActivity, requireAdmin } from '../workspace/routes.js';

export const sanitizeNote = (content: string) =>
  sanitizeHtml(content, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      's',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'h1',
      'h2',
      'h3',
      'hr',
    ],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
export function pagination(query: Request['query']) {
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.page) || 1)));
  const limit = Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 50)));
  return { page, limit };
}
async function validateRelations(req: Request) {
  const workspace = await Workspace.findById(req.workspaceId);
  const memberIds = workspace!.members.map((m) => String(m.userId));
  if (
    req.body.projectId &&
    !(await Project.exists({ _id: objectId(req.body.projectId), workspaceId: req.workspaceId }))
  )
    throw new HttpError(422, 'Project must belong to this workspace');
  if (req.body.assigneeId && !memberIds.includes(objectId(req.body.assigneeId)))
    throw new HttpError(422, 'Assignee must belong to this workspace');
  if (req.body.members?.some((id: unknown) => !memberIds.includes(objectId(id))))
    throw new HttpError(422, 'All project members must belong to this workspace');
}
// A shared CRUD transport keeps ownership scopes consistent; models and validation stay feature-specific.
function resourceRouter<T extends { workspaceId: unknown }>(
  model: Pick<
    Model<T>,
    'find' | 'findOne' | 'countDocuments' | 'create' | 'findOneAndUpdate' | 'findOneAndDelete'
  >,
  schema: ZodType,
  kind: 'projects' | 'tasks' | 'notes',
) {
  const router = Router({ mergeParams: true });
  router.get('/', async (req, res) => {
    const { page, limit } = pagination(req.query);
    const filter: Record<string, unknown> = { workspaceId: req.workspaceId };
    if (typeof req.query.search === 'string') {
      const escaped = req.query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter[kind === 'projects' ? 'name' : 'title'] = { $regex: escaped, $options: 'i' };
    }
    if (typeof req.query.status === 'string' && kind !== 'notes') filter.status = req.query.status;
    if (kind === 'tasks' && typeof req.query.projectId === 'string')
      filter.projectId = objectId(req.query.projectId);
    if (kind === 'tasks' && typeof req.query.priority === 'string')
      filter.priority = req.query.priority;
    if (kind === 'notes') {
      filter.deleted = req.query.deleted === 'true';
      if (req.query.favorite === 'true') filter.favorite = true;
    }
    const sort: Record<string, 1 | -1> =
      req.query.sort === 'oldest'
        ? { createdAt: 1 }
        : req.query.sort === 'name'
          ? { [kind === 'projects' ? 'name' : 'title']: 1 }
          : { updatedAt: -1 };
    const [data, total] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      model.countDocuments(filter),
    ]);
    res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } });
  });
  router.get('/:id', async (req, res) => {
    const data = await model.findOne({
      _id: objectId(req.params.id),
      workspaceId: req.workspaceId,
    });
    if (!data) throw new HttpError(404, 'Record not found');
    res.json({ data });
  });
  router.post('/', validate(schema), async (req, res) => {
    await validateRelations(req);
    if (kind === 'notes') req.body.content = sanitizeNote(req.body.content);
    if (kind === 'tasks' && req.body.status === 'done') req.body.completedAt = new Date();
    const data = await model.create({
      ...req.body,
      workspaceId: req.workspaceId,
      createdBy: req.userId,
    });
    await recordActivity(
      req.workspaceId,
      req.userId,
      `Created ${kind.slice(0, -1)}: ${req.body.name || req.body.title}`,
      `/dashboard/${kind}`,
    );
    res.status(201).json({ data });
  });
  router.patch('/:id', validate((schema as typeof projectSchema).partial()), async (req, res) => {
    await validateRelations(req);
    if (kind === 'notes' && req.body.content !== undefined)
      req.body.content = sanitizeNote(req.body.content);
    if (kind === 'tasks' && req.body.status !== undefined)
      req.body.completedAt = req.body.status === 'done' ? new Date() : null;
    const data = await model.findOneAndUpdate(
      { _id: objectId(req.params.id), workspaceId: req.workspaceId },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!data) throw new HttpError(404, 'Record not found');
    await recordActivity(
      req.workspaceId,
      req.userId,
      `Updated ${kind.slice(0, -1)}: ${req.body.name || req.body.title || 'details'}`,
      `/dashboard/${kind}`,
    );
    res.json({ data });
  });
  router.delete('/:id', ...(kind === 'projects' ? [requireAdmin] : []), async (req, res) => {
    const data = await model.findOneAndDelete({
      _id: objectId(req.params.id),
      workspaceId: req.workspaceId,
    });
    if (!data) throw new HttpError(404, 'Record not found');
    if (kind === 'projects')
      await Task.updateMany(
        { projectId: req.params.id, workspaceId: req.workspaceId },
        { $set: { projectId: null } },
      );
    await recordActivity(
      req.workspaceId,
      req.userId,
      `Deleted ${kind.slice(0, -1)}`,
      `/dashboard/${kind}`,
    );
    res.json({ data: { deleted: true } });
  });
  return router;
}
export const projectsRouter = resourceRouter(Project, projectSchema, 'projects');
export const tasksRouter = resourceRouter(Task, taskSchema, 'tasks');
export const notesRouter = resourceRouter(Note, noteSchema, 'notes');
export const activityRouter = Router({ mergeParams: true });
activityRouter.get('/', async (req, res) => {
  res.json({
    data: await Activity.find({ workspaceId: req.workspaceId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('createdBy', 'name avatar'),
  });
});
