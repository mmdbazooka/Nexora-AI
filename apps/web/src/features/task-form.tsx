'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Trash2 } from 'lucide-react';
import { taskSchema, type TaskStatus } from '@nexora/shared';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/common';
import { useWorkspaceId, useMembers, useList } from '@/lib/hooks';
import { api, json } from '@/lib/api';
import type { Task, Project } from '@/lib/types';
interface Values {
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assigneeId: string;
  dueDate: string;
}
export function TaskForm({
  open,
  onClose,
  task,
  status = 'todo',
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task;
  status?: TaskStatus;
  projectId?: string;
}) {
  const wid = useWorkspaceId(),
    members = useMembers(),
    projects = useList<Project>('projects'),
    client = useQueryClient();
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || status,
      priority: task?.priority || 'medium',
      projectId: task?.projectId || projectId || '',
      assigneeId: task?.assigneeId || '',
      dueDate: task?.dueDate?.slice(0, 10) || '',
    },
  });
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api(
        `/workspaces/${wid}/tasks${task ? '/' + task._id : ''}`,
        json(task ? 'PATCH' : 'POST', body),
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tasks', wid] });
      void client.invalidateQueries({ queryKey: ['analytics', wid] });
      void client.invalidateQueries({ queryKey: ['activity', wid] });
      toast.success(task ? 'Task updated' : 'A little momentum. Task created.');
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api(`/workspaces/${wid}/tasks/${task?._id}`, json('DELETE')),
    onSuccess: () => {
      void client.invalidateQueries();
      onClose();
      toast.success('Task deleted');
    },
    onError: (e) => setError(e.message),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={task ? 'A little refinement' : 'What’s the next step?'}
      description={
        task
          ? 'Update this task and keep your work moving.'
          : 'Break the big idea into something achievable.'
      }
    >
      <form
        onSubmit={handleSubmit((v) => {
          setError('');
          const result = taskSchema.safeParse({
            ...v,
            projectId: v.projectId || null,
            assigneeId: v.assigneeId || null,
            dueDate: v.dueDate ? new Date(v.dueDate + 'T12:00:00').toISOString() : null,
            subtasks: subtasks.filter((s) => s.title.trim()),
          });
          if (!result.success) {
            setError(result.error.issues[0].message);
            return;
          }
          mutation.mutate(result.data);
        })}
      >
        <Field label="Task title" error={errors.title?.message}>
          <input
            placeholder="Give the next step a name"
            {...register('title', {
              required: 'A task needs a title',
              minLength: { value: 2, message: 'Use at least 2 characters' },
            })}
          />
        </Field>
        <Field label="A little more context">
          <textarea placeholder="What does done look like?" {...register('description')} />
        </Field>
        <div className="form-row">
          <Field label="Status">
            <select {...register('status')}>
              <option value="backlog">Backlog</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </Field>
          <Field label="Priority">
            <select {...register('priority')}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Project">
            <select {...register('projectId')}>
              <option value="">No project</option>
              {projects.data?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned to">
            <select {...register('assigneeId')}>
              <option value="">Unassigned</option>
              {members.data?.map((m) => (
                <option key={m.userId._id} value={m.userId._id}>
                  {m.userId.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Due date">
          <input type="date" {...register('dueDate')} />
        </Field>
        <div className="field">
          <span>
            Smaller steps <small className="muted">(optional)</small>
          </span>
          {subtasks.map((s, i) => (
            <div className="subtask-input" key={i}>
              <input
                type="checkbox"
                aria-label={`Complete subtask ${i + 1}`}
                checked={s.done}
                onChange={(e) =>
                  setSubtasks(
                    subtasks.map((s, j) => (i === j ? { ...s, done: e.target.checked } : s)),
                  )
                }
              />
              <input
                className="input"
                aria-label={`Subtask ${i + 1}`}
                value={s.title}
                onChange={(e) =>
                  setSubtasks(
                    subtasks.map((s, j) => (i === j ? { ...s, title: e.target.value } : s)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove subtask ${i + 1}`}
                onClick={() => setSubtasks(subtasks.filter((_, j) => i !== j))}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSubtasks([...subtasks, { title: '', done: false }])}
          >
            <Plus size={12} />
            Add a smaller step
          </Button>
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {task && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm('Delete this task permanently?')) remove.mutate();
              }}
            >
              <Trash2 size={13} />
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending || remove.isPending}>
            {mutation.isPending ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
