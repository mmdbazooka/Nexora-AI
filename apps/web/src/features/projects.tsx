'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FolderKanban,
  CalendarDays,
  ArrowUpRight,
  ArrowLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import { projectSchema } from '@nexora/shared';
import type { Project, Analytics } from '@/lib/types';
import {
  useWorkspaceId,
  useList,
  useWorkspaceData,
  useMembers,
  useUser,
  useWorkspaces,
} from '@/lib/hooks';
import { api, json } from '@/lib/api';
import { shortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Empty, ErrorState, Loading } from '@/components/ui/common';
import { Avatar } from '@/components/avatar';
import { Tasks } from './tasks';
export function ProjectForm({ project, onClose }: { project?: Project; onClose: () => void }) {
  const wid = useWorkspaceId(),
    client = useQueryClient(),
    members = useMembers();
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'active',
      priority: project?.priority || 'medium',
      dueDate: project?.dueDate?.slice(0, 10) || '',
      color: project?.color || 'violet',
      members: project?.members || [],
    },
  });
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api(
        `/workspaces/${wid}/projects${project ? '/' + project._id : ''}`,
        json(project ? 'PATCH' : 'POST', body),
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['projects', wid] });
      void client.invalidateQueries({ queryKey: ['project', wid] });
      void client.invalidateQueries({ queryKey: ['analytics', wid] });
      toast.success(project ? 'Project updated' : 'Your next big thing has a home.');
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(v) => !v && onClose()}
      title={project ? 'Shape the next chapter' : 'Give your idea a home'}
      description="A clear direction makes the next step a little easier."
    >
      <form
        onSubmit={handleSubmit((v) => {
          const result = projectSchema.safeParse({
            ...v,
            dueDate: v.dueDate ? new Date(v.dueDate + 'T12:00:00').toISOString() : null,
          });
          if (!result.success) {
            setError(result.error.issues[0].message);
            return;
          }
          mutation.mutate(result.data);
        })}
      >
        <Field label="Project name">
          <input
            placeholder="Something worth making"
            {...register('name', { required: true, minLength: 2 })}
          />
        </Field>
        <Field label="Description">
          <textarea placeholder="What are you working toward?" {...register('description')} />
        </Field>
        <div className="form-row">
          <Field label="Status">
            <select {...register('status')}>
              {['planned', 'active', 'completed', 'archived'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select {...register('priority')}>
              {['low', 'medium', 'high', 'urgent'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Target date">
            <input type="date" {...register('dueDate')} />
          </Field>
          <Field label="Project color">
            <select {...register('color')}>
              {['violet', 'blue', 'emerald', 'amber', 'rose'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Project members">
          <select multiple aria-label="Project members" {...register('members')}>
            {members.data?.map((m) => (
              <option key={m.userId._id} value={m.userId._id}>
                {m.userId.name}
              </option>
            ))}
          </select>
          <small className="muted">Hold Ctrl / ⌘ to select multiple people.</small>
        </Field>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
export function Projects() {
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [sort, setSort] = useState(''),
    [create, setCreate] = useState(false);
  const projects = useList<Project>(
      'projects',
      new URLSearchParams({
        search,
        ...(status ? { status } : {}),
        ...(sort ? { sort } : {}),
      }).toString(),
    ),
    analytics = useWorkspaceData<Analytics>('analytics'),
    members = useMembers();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A home for every big idea.</h1>
          <p>Your projects, with a little more perspective.</p>
        </div>
        <Button onClick={() => setCreate(true)}>
          <Plus size={15} />
          New project
        </Button>
      </div>
      <div className="page-toolbar">
        <div className="search-input">
          <Search size={14} />
          <input
            className="input"
            placeholder="Find a project…"
            aria-label="Search projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filter project status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {['planned', 'active', 'completed', 'archived'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Sort projects"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Recently updated</option>
          <option value="name">Alphabetical</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      {projects.isLoading ? (
        <Loading />
      ) : projects.error ? (
        <ErrorState error={projects.error} retry={() => void projects.refetch()} />
      ) : projects.data?.length ? (
        <div className="projects-grid">
          {projects.data.map((p) => {
            const progress = analytics.data?.projects.find((a) => a._id === p._id);
            return (
              <Link
                href={`/dashboard/projects/${p._id}`}
                className="panel project-card"
                key={p._id}
              >
                <div className="project-card-top">
                  <span className={`project-symbol ${p.color}`}>
                    <FolderKanban size={19} />
                  </span>
                  <span
                    className={`badge ${p.status === 'completed' ? 'emerald' : p.status === 'active' ? 'violet' : ''}`}
                  >
                    <i className="dot" />
                    {p.status}
                  </span>
                </div>
                <h2>{p.name}</h2>
                <p>{p.description || 'A little space for something great.'}</p>
                <div className="progress-caption">
                  <span>Progress</span>
                  <span>{progress?.progress || 0}%</span>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${progress?.progress || 0}%` }} />
                </div>
                <div className="project-card-footer">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={12} />
                    {shortDate(p.dueDate)}
                  </span>
                  <div className="avatar-stack">
                    {members.data
                      ?.filter((m) => p.members.includes(m.userId._id))
                      .slice(0, 4)
                      .map((m) => (
                        <Avatar key={m.userId._id} name={m.userId.name} src={m.userId.avatar} />
                      ))}
                  </div>
                  <ArrowUpRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title={search || status ? 'No projects in this view' : 'Your next chapter starts here'}
          description={
            search || status
              ? 'Try another search or filter.'
              : 'Create your first project and make room for what you want to build.'
          }
          action={
            <Button onClick={() => setCreate(true)}>
              <Plus size={14} />
              Create a project
            </Button>
          }
        />
      )}{' '}
      {create && <ProjectForm onClose={() => setCreate(false)} />}
    </>
  );
}
export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter(),
    wid = useWorkspaceId(),
    user = useUser(),
    workspaces = useWorkspaces(),
    client = useQueryClient();
  const [edit, setEdit] = useState(false);
  const project = useQuery({
    queryKey: ['project', wid, id],
    queryFn: () => api<Project>(`/workspaces/${wid}/projects/${id}`),
    enabled: !!wid,
  });
  const canDelete = workspaces.data
    ?.find((w) => w._id === wid)
    ?.members.some((m) => m.userId === user.data?._id && ['owner', 'admin'].includes(m.role));
  if (project.isLoading) return <Loading />;
  if (project.error) return <ErrorState error={project.error} />;
  if (!project.data) return null;
  const p = project.data;
  return (
    <>
      <Link href="/dashboard/projects" className="auth-back">
        <ArrowLeft size={12} />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className={`project-symbol ${p.color}`}>
              <FolderKanban size={18} />
            </span>
            <h1>{p.name}</h1>
          </div>
          <p>{p.description || 'A little space for something great.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEdit(true)}>
            <Pencil size={13} />
            Edit
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete project"
              onClick={async () => {
                if (
                  !window.confirm('Delete this project? Its tasks will remain without a project.')
                )
                  return;
                try {
                  await api(`/workspaces/${wid}/projects/${id}`, json('DELETE'));
                  void client.invalidateQueries();
                  router.push('/dashboard/projects');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-3" style={{ marginBottom: 28 }}>
        <span className="badge violet">{p.status}</span>
        <span className="badge">{p.priority} priority</span>
        <span className="badge">
          <CalendarDays size={11} />
          {shortDate(p.dueDate)}
        </span>
      </div>
      <Suspense fallback={<Loading />}>
        <Tasks projectId={id} embedded />
      </Suspense>
      {edit && <ProjectForm project={p} onClose={() => setEdit(false)} />}
    </>
  );
}
