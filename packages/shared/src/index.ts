import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Use at most 72 UTF-8 bytes for your password',
  );
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: passwordSchema,
});
export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(128),
});
export const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(3000).default(''),
  status: z.enum(['planned', 'active', 'completed', 'archived']).default('active'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().nullable().optional(),
  members: z.array(z.string()).max(100).default([]),
  color: z.enum(['violet', 'blue', 'emerald', 'amber', 'rose']).default('violet'),
});
export const taskStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const;
export const taskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(10000).default(''),
  status: z.enum(taskStatuses).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  subtasks: z
    .array(z.object({ title: z.string().min(1).max(200), done: z.boolean() }))
    .max(50)
    .default([]),
});
export const noteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().max(200000).default(''),
  category: z.string().max(50).default('General'),
  favorite: z.boolean().default(false),
  deleted: z.boolean().default(false),
});
export const workspaceSchema = z.object({ name: z.string().trim().min(2).max(80) });
export const chatSchema = z.object({
  message: z.string().trim().min(1).max(12000),
  projectId: z.string().optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type TaskStatus = (typeof taskStatuses)[number];
export type Role = 'owner' | 'admin' | 'member';
export type ApiResult<T> = { data: T; meta?: { total: number; page: number; pages: number } };
