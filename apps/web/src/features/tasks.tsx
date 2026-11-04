'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Columns3,
  List,
  GripVertical,
  Flag,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { taskStatuses, type TaskStatus } from '@nexora/shared';
import { useList, useWorkspaceId, useMembers } from '@/lib/hooks';
import { api, json } from '@/lib/api';
import type { Task, Project, Member } from '@/lib/types';
import { shortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loading, ErrorState, Empty } from '@/components/ui/common';
import { Avatar } from '@/components/avatar';
import { TaskForm } from './task-form';
const statusNames: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};
const statusColors: Record<TaskStatus, string> = {
  backlog: '#777687',
  todo: '#8da3f7',
  'in-progress': '#b096fc',
  done: '#65d5b3',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="badge"
      style={{ color: statusColors[status as TaskStatus] || 'var(--muted)', fontSize: 9 }}
    >
      <i className="dot" />
      {statusNames[status as TaskStatus] || status}
    </span>
  );
}
function TaskCard({
  task,
  onEdit,
  members,
}: {
  task: Task;
  onEdit: () => void;
  members: Member[];
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });
  const member = members.find((m) => m.userId._id === task.assigneeId);
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-card-header">
        <span className="task-id">NX-{task._id.slice(-4).toUpperCase()}</span>
        <button
          className="task-grip"
          aria-label={`Move ${task.title}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical size={13} />
        </button>
      </div>
      <button
        style={{
          background: 'none',
          border: 0,
          color: 'inherit',
          padding: 0,
          textAlign: 'left',
          width: '100%',
        }}
        onClick={onEdit}
      >
        <h3>{task.title}</h3>
      </button>
      {task.description && <p>{task.description}</p>}
      <div className="task-card-footer">
        <span className={`priority ${task.priority}`}>
          <Flag size={11} />
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="flex items-center gap-2">
            <CalendarDays size={10} />
            {shortDate(task.dueDate)}
          </span>
        )}
        {member ? <Avatar name={member.userId.name} src={member.userId.avatar} /> : null}
      </div>
      {task.subtasks.length > 0 && (
        <div style={{ fontSize: 9, color: 'var(--subtle)', marginTop: 10 }}>
          <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 5 }} />
          {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} smaller steps
        </div>
      )}
    </article>
  );
}
function Column({
  status,
  tasks,
  onAdd,
  onEdit,
  members,
}: {
  status: TaskStatus;
  tasks: Task[];
  onAdd: () => void;
  onEdit: (t: Task) => void;
  members: Member[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`kanban-column ${isOver ? 'over' : ''}`}>
      <div className="kanban-column-header">
        <i className="dot" style={{ color: statusColors[status] }} />
        {statusNames[status]}
        <small>{tasks.length}</small>
        <button
          className="btn btn-ghost btn-icon"
          style={{ width: 23, height: 23, minHeight: 23 }}
          onClick={onAdd}
          aria-label={`Add task to ${statusNames[status]}`}
        >
          <Plus size={13} />
        </button>
      </div>
      {tasks.map((t) => (
        <TaskCard key={t._id} task={t} onEdit={() => onEdit(t)} members={members} />
      ))}
      <button className="kanban-add" onClick={onAdd}>
        <Plus size={12} />
        Add task
      </button>
    </section>
  );
}
export function Tasks({ projectId, embedded = false }: { projectId?: string; embedded?: boolean }) {
  const params = useSearchParams(),
    wid = useWorkspaceId(),
    client = useQueryClient(),
    members = useMembers(),
    projects = useList<Project>('projects');
  const [search, setSearch] = useState(''),
    [priority, setPriority] = useState(''),
    [filterProject, setFilterProject] = useState(''),
    [sort, setSort] = useState(''),
    [view, setView] = useState('board');
  const [editing, setEditing] = useState<Task | undefined>(),
    [creating, setCreating] = useState<TaskStatus | null>(null),
    [closedParam, setClosedParam] = useState(false);
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (priority) query.set('priority', priority);
  if (projectId || filterProject) query.set('projectId', projectId || filterProject);
  if (sort) query.set('sort', sort);
  const tasks = useList<Task>('tasks', query.toString());
  const paramTask = !closedParam
    ? tasks.data?.find((t) => t._id === params.get('task'))
    : undefined;
  const selected = editing || paramTask;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api<Task>(`/workspaces/${wid}/tasks/${id}`, json('PATCH', { status })),
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: ['tasks', wid] });
      const previous = client.getQueriesData<Task[]>({ queryKey: ['tasks', wid] });
      client.setQueriesData<Task[]>({ queryKey: ['tasks', wid] }, (old) =>
        old?.map((t) => (t._id === id ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (error, _v, context) => {
      context?.previous.forEach(([key, value]) => client.setQueryData(key, value));
      toast.error(error.message);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ['tasks', wid] });
      void client.invalidateQueries({ queryKey: ['analytics', wid] });
      void client.invalidateQueries({ queryKey: ['activity', wid] });
    },
  });
  const onDragEnd = (e: DragEndEvent) => {
    if (
      e.over &&
      taskStatuses.includes(e.over.id as TaskStatus) &&
      tasks.data?.find((t) => t._id === e.active.id)?.status !== e.over.id
    )
      move.mutate({ id: String(e.active.id), status: e.over.id as TaskStatus });
  };
  return (
    <>
      {!embedded && (
        <div className="page-heading">
          <div>
            <h1>A little structure. A lot of momentum.</h1>
            <p>Your next steps, all in one place.</p>
          </div>
          <Button onClick={() => setCreating('todo')}>
            <Plus size={15} />
            New task
          </Button>
        </div>
      )}
      <div className="page-toolbar">
        <div className="search-input">
          <Search size={14} />
          <input
            className="input"
            placeholder="Find a task…"
            aria-label="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filter priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {!projectId && (
          <select
            className="filter-select"
            aria-label="Filter project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.data?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <select
          className="filter-select"
          aria-label="Sort tasks"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Recently updated</option>
          <option value="name">Alphabetical</option>
          <option value="oldest">Oldest first</option>
        </select>
        <div className="view-toggle">
          <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
            <Columns3 size={13} />
            Board
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <List size={13} />
            List
          </button>
        </div>
        {embedded && (
          <Button size="sm" onClick={() => setCreating('todo')}>
            <Plus size={13} />
            Task
          </Button>
        )}
      </div>
      {tasks.isLoading ? (
        <Loading />
      ) : tasks.error ? (
        <ErrorState error={tasks.error} retry={() => void tasks.refetch()} />
      ) : view === 'board' ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {taskStatuses.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={tasks.data?.filter((t) => t.status === status) || []}
                members={members.data || []}
                onAdd={() => setCreating(status)}
                onEdit={setEditing}
              />
            ))}
          </div>
        </DndContext>
      ) : tasks.data?.length ? (
        <section className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th className="hide-mobile">Due date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.data.map((t) => (
                <tr key={t._id}>
                  <td>
                    <button
                      style={{
                        background: 'none',
                        color: 'inherit',
                        border: 0,
                        textAlign: 'left',
                        padding: 0,
                      }}
                      onClick={() => setEditing(t)}
                    >
                      {t.title}
                    </button>
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${t.title}`}
                      className="filter-select"
                      value={t.status}
                      onChange={(e) =>
                        move.mutate({ id: t._id, status: e.target.value as TaskStatus })
                      }
                    >
                      {taskStatuses.map((s) => (
                        <option key={s} value={s}>
                          {statusNames[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`priority ${t.priority}`}>
                      <Flag size={10} />
                      {t.priority}
                    </span>
                  </td>
                  <td className="hide-mobile muted">{shortDate(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <Empty
          title="A clear board. A fresh start."
          description="Add your first task and take one small step forward."
          action={
            <Button onClick={() => setCreating('todo')}>
              <Plus size={13} />
              Create a task
            </Button>
          }
        />
      )}{' '}
      {(creating || selected) && (
        <TaskForm
          key={selected?._id || `new-${creating}`}
          open
          onClose={() => {
            setCreating(null);
            setEditing(undefined);
            setClosedParam(true);
          }}
          task={selected}
          status={creating || 'todo'}
          projectId={projectId}
        />
      )}
    </>
  );
}
