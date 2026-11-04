import { describe, it, expect } from 'vitest';
import { registerSchema, projectSchema, taskSchema, noteSchema, chatSchema } from '../src/index.js';
describe('workspace boundary validation', () => {
  it('normalizes registration details and rejects weak passwords', () => {
    expect(
      registerSchema.parse({
        name: '  Alex Morgan  ',
        email: 'ALEX@EXAMPLE.COM',
        password: 'a-strong-passphrase',
      }),
    ).toMatchObject({ name: 'Alex Morgan', email: 'alex@example.com' });
    expect(
      registerSchema.safeParse({ name: 'A', email: 'invalid', password: 'short' }).success,
    ).toBe(false);
  });
  it('strips role escalation and foreign ownership fields', () => {
    const data = registerSchema.parse({
      name: 'Alex',
      email: 'alex@example.com',
      password: 'a-strong-passphrase',
      role: 'admin',
      verified: true,
    });
    expect(data).not.toHaveProperty('role');
    expect(data).not.toHaveProperty('verified');
    const task = taskSchema.parse({
      title: 'Ship the launch',
      workspaceId: 'foreign',
      createdBy: 'someone-else',
    });
    expect(task).not.toHaveProperty('workspaceId');
    expect(task).not.toHaveProperty('createdBy');
  });
  it('restricts statuses and priorities', () => {
    expect(taskSchema.safeParse({ title: 'Plan launch', status: 'executed' }).success).toBe(false);
    expect(projectSchema.safeParse({ name: 'Website', priority: 'maximum' }).success).toBe(false);
  });
  it('rejects non-ISO dates and oversized input', () => {
    expect(taskSchema.safeParse({ title: 'Plan launch', dueDate: 'tomorrow' }).success).toBe(false);
    expect(chatSchema.safeParse({ message: 'x'.repeat(12001) }).success).toBe(false);
    expect(noteSchema.safeParse({ title: 'Note', content: 'x'.repeat(200001) }).success).toBe(
      false,
    );
  });
  it('supplies safe task defaults', () => {
    expect(taskSchema.parse({ title: 'Review the prototype' })).toMatchObject({
      status: 'todo',
      priority: 'medium',
      subtasks: [],
      description: '',
    });
  });
  it('accepts intentional null assignments and dates', () => {
    expect(
      taskSchema.parse({
        title: 'Review prototype',
        projectId: null,
        assigneeId: null,
        dueDate: null,
      }),
    ).toMatchObject({ projectId: null, assigneeId: null, dueDate: null });
  });
  it('prevents bcrypt UTF-8 truncation ambiguity', () => {
    expect(
      registerSchema.safeParse({
        name: 'Alex',
        email: 'alex@example.com',
        password: '🔐'.repeat(20),
      }).success,
    ).toBe(false);
  });
  it('limits subtask payloads', () => {
    expect(
      taskSchema.safeParse({
        title: 'Plan launch',
        subtasks: Array.from({ length: 51 }, () => ({ title: 'Subtask', done: false })),
      }).success,
    ).toBe(false);
  });
});
