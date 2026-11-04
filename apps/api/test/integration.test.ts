import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { User, Session, Workspace, Project, Task, Note } from '../src/core/models.js';
import { testMailbox } from '../src/core/mail.js';
import { hash } from '../src/auth/service.js';
let database: MongoMemoryServer | undefined;
const origin = 'http://localhost:3000';
const agent = request.agent(app),
  outsider = request.agent(app);
let token = '',
  outsiderToken = '',
  wid = '',
  otherWid = '',
  projectId = '',
  taskId = '';
const send = (
  method: 'post' | 'patch' | 'delete',
  path: string,
  body: Record<string, unknown> = {},
) => agent[method](path).set('Origin', origin).set('X-CSRF-Token', token).send(body);
function cookieHeaders(response: { headers: Record<string, unknown> }): string[] {
  const value = response.headers['set-cookie'];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : typeof value === 'string'
      ? [value]
      : [];
}
beforeAll(async () => {
  const uri = process.env.TEST_MONGODB_URI;
  if (uri) {
    if (!new URL(uri).pathname.includes('test'))
      throw new Error('TEST_MONGODB_URI must point to a dedicated database with test in its name');
    await mongoose.connect(uri);
  } else {
    database = await MongoMemoryServer.create({ binary: { version: '8.0.17', checkMD5: true } });
    await mongoose.connect(database.getUri('nexora_test'));
  }
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  token = (await agent.get('/api/v1/auth/csrf')).body.data.token;
  outsiderToken = (await outsider.get('/api/v1/auth/csrf')).body.data.token;
});
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  await database?.stop();
});
describe('real MongoDB authentication and authorization', () => {
  it('registers with an HTTP-only cookie and does not expose the password hash', async () => {
    const res = await send('post', '/api/v1/auth/register', {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'a-strong-test-password',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(
      cookieHeaders(res).some(
        (c: string) =>
          c.startsWith('nx_access=') && c.includes('HttpOnly') && c.includes('SameSite=Lax'),
      ),
    ).toBe(true);
    const user = await User.findOne({ email: 'alex@example.com' }).select('+passwordHash');
    expect(user?.passwordHash).not.toBe('a-strong-test-password');
    wid = (await agent.get('/api/v1/workspaces')).body.data[0]._id;
  });
  it('requires CSRF protection for mutations', async () => {
    const res = await agent
      .post('/api/v1/workspaces')
      .set('Origin', origin)
      .send({ name: 'Untrusted' });
    expect(res.status).toBe(403);
  });
  it('verifies an email using an expiring single-use token', async () => {
    const mail = testMailbox.find(
      (m) => m.to === 'alex@example.com' && m.subject.includes('Verify'),
    );
    const raw = /token=([a-f0-9]+)/.exec(mail!.text)![1];
    expect((await send('post', '/api/v1/auth/verify-email', { token: raw })).status).toBe(200);
    expect((await send('post', '/api/v1/auth/verify-email', { token: raw })).status).toBe(400);
  });
  it('creates a project and task and persists status changes', async () => {
    const p = await send('post', `/api/v1/workspaces/${wid}/projects`, {
      name: 'Product launch',
      description: 'A real integration test',
    });
    expect(p.status).toBe(201);
    projectId = p.body.data._id;
    const task = await send('post', `/api/v1/workspaces/${wid}/tasks`, {
      title: 'Ship the first milestone',
      projectId,
    });
    expect(task.status).toBe(201);
    taskId = task.body.data._id;
    expect(
      (await send('patch', `/api/v1/workspaces/${wid}/tasks/${taskId}`, { status: 'done' })).status,
    ).toBe(200);
    expect((await Task.findById(taskId))?.completedAt).toBeInstanceOf(Date);
    const analytics = await agent.get(`/api/v1/workspaces/${wid}/analytics`);
    expect(analytics.body.data.completed).toBe(1);
    expect(analytics.body.data.projects[0].progress).toBe(100);
  });
  it('isolates all resources from a user in a different workspace', async () => {
    expect(
      (
        await outsider
          .post('/api/v1/auth/register')
          .set('Origin', origin)
          .set('X-CSRF-Token', outsiderToken)
          .send({
            name: 'Another Person',
            email: 'other@example.com',
            password: 'another-strong-password',
          })
      ).status,
    ).toBe(201);
    otherWid = (await outsider.get('/api/v1/workspaces')).body.data[0]._id;
    for (const resource of [
      'projects',
      'tasks',
      'notes',
      'analytics',
      'activity',
      'ai/conversations',
    ]) {
      expect((await outsider.get(`/api/v1/workspaces/${wid}/${resource}`)).status).toBe(403);
    }
    expect(
      (
        await outsider
          .patch(`/api/v1/workspaces/${wid}/tasks/${taskId}`)
          .set('Origin', origin)
          .set('X-CSRF-Token', outsiderToken)
          .send({ title: 'Unauthorized edit' })
      ).status,
    ).toBe(403);
  });
  it('rejects foreign project and assignee references and malformed IDs', async () => {
    const p = await outsider
      .post(`/api/v1/workspaces/${otherWid}/projects`)
      .set('Origin', origin)
      .set('X-CSRF-Token', outsiderToken)
      .send({ name: 'Private project' });
    expect(
      (
        await send('post', `/api/v1/workspaces/${wid}/tasks`, {
          title: 'Cross-workspace task',
          projectId: p.body.data._id,
        })
      ).status,
    ).toBe(422);
    expect((await agent.get(`/api/v1/workspaces/${wid}/tasks/not-an-id`)).status).toBe(400);
  });
  it('sanitizes stored notes and supports trash and restore', async () => {
    const n = await send('post', `/api/v1/workspaces/${wid}/notes`, {
      title: 'A safe note',
      content: '<p>Hello</p><script>alert(1)</script>',
    });
    expect(n.status).toBe(201);
    expect((await Note.findById(n.body.data._id))?.content).toBe('<p>Hello</p>');
    await send('patch', `/api/v1/workspaces/${wid}/notes/${n.body.data._id}`, { deleted: true });
    expect((await agent.get(`/api/v1/workspaces/${wid}/notes`)).body.data).toHaveLength(0);
    expect(
      (await agent.get(`/api/v1/workspaces/${wid}/notes?deleted=true`)).body.data,
    ).toHaveLength(1);
    await send('patch', `/api/v1/workspaces/${wid}/notes/${n.body.data._id}`, { deleted: false });
    expect((await agent.get(`/api/v1/workspaces/${wid}/notes`)).body.data).toHaveLength(1);
  });
  it('fails gracefully without an AI key instead of simulating a response', async () => {
    const c = await send('post', `/api/v1/workspaces/${wid}/ai/conversations`, {
      title: 'A real assistant',
    });
    expect(c.status).toBe(201);
    const res = await send(
      'post',
      `/api/v1/workspaces/${wid}/ai/conversations/${c.body.data._id}/messages`,
      { message: 'Hello' },
    );
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
  });
  it('enforces member permissions on project deletion and invitations', async () => {
    const other = await User.findOne({ email: 'other@example.com' });
    await Workspace.updateOne(
      { _id: wid },
      { $push: { members: { userId: other!._id, role: 'member' } } },
    );
    const base = `/api/v1/workspaces/${wid}`;
    expect(
      (
        await outsider
          .delete(`${base}/projects/${projectId}`)
          .set('Origin', origin)
          .set('X-CSRF-Token', outsiderToken)
      ).status,
    ).toBe(403);
    expect(
      (
        await outsider
          .post(`${base}/invites`)
          .set('Origin', origin)
          .set('X-CSRF-Token', outsiderToken)
          .send({ email: 'new@example.com' })
      ).status,
    ).toBe(403);
    expect((await Project.findById(projectId))?.name).toBe('Product launch');
  });
  it('rotates refresh tokens and revokes a session on replay', async () => {
    const login = await send('post', '/api/v1/auth/login', {
      email: 'alex@example.com',
      password: 'a-strong-test-password',
    });
    const oldCookie = cookieHeaders(login)
      .find((c) => c.startsWith('nx_refresh='))!
      .split(';')[0];
    expect((await send('post', '/api/v1/auth/refresh')).status).toBe(200);
    const session = await Session.findOne({
      previousHashes: hash(oldCookie.slice('nx_refresh='.length)),
    });
    expect(session?.revoked).toBe(false);
    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', origin)
      .set('Cookie', [oldCookie, `nx_csrf=${token}`])
      .set('X-CSRF-Token', token)
      .send({});
    expect(replay.status).toBe(401);
    expect((await Session.findById(session!._id))?.revoked).toBe(true);
  });
  it('resets a password once and invalidates existing sessions', async () => {
    await send('post', '/api/v1/auth/login', {
      email: 'alex@example.com',
      password: 'a-strong-test-password',
    });
    await send('post', '/api/v1/auth/forgot-password', { email: 'alex@example.com' });
    const mail = testMailbox.filter((m) => m.subject.includes('Reset')).at(-1)!;
    const raw = /token=([a-f0-9]+)/.exec(mail.text)![1];
    expect(
      (
        await send('post', '/api/v1/auth/reset-password', {
          token: raw,
          password: 'a-fresh-strong-password',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await send('post', '/api/v1/auth/reset-password', {
          token: raw,
          password: 'another-strong-password',
        })
      ).status,
    ).toBe(400);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    expect(
      (
        await send('post', '/api/v1/auth/login', {
          email: 'alex@example.com',
          password: 'a-fresh-strong-password',
        })
      ).status,
    ).toBe(200);
  });
  it('invalidates authentication on logout', async () => {
    expect((await send('post', '/api/v1/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });
});
