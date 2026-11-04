'use client';
import Link from 'next/link';
import {
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Clock,
  ChartNoAxesCombined,
  Sparkles,
  Plus,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, ErrorState, Loading } from '@/components/ui/common';
import { CompletionChart } from '@/components/charts';
import { Avatar } from '@/components/avatar';
import { useUser, useWorkspaceData } from '@/lib/hooks';
import type { Analytics, Activity } from '@/lib/types';
import { shortDate, relativeTime } from '@/lib/utils';
export function Stats({ data }: { data: Analytics }) {
  const cards = [
    {
      label: 'Tasks completed',
      value: data.completed,
      caption: `of ${data.totalTasks} total tasks`,
      icon: CheckCircle2,
    },
    {
      label: 'Active projects',
      value: data.activeProjects,
      caption: `${data.totalProjects} projects in your space`,
      icon: FolderKanban,
    },
    {
      label: 'Completion rate',
      value: `${data.completionRate}%`,
      caption: 'Every small step counts',
      icon: ChartNoAxesCombined,
    },
    {
      label: 'Overdue tasks',
      value: data.overdue,
      caption: data.overdue ? 'A little attention needed' : 'All clear. Keep it going.',
      icon: Clock,
    },
  ];
  return (
    <div className="overview-stats">
      {cards.map(({ label, value, caption, icon: Icon }) => (
        <div className="stat-card" key={label}>
          <div className="stat-top">
            {label}
            <span className="stat-icon">
              <Icon size={14} />
            </span>
          </div>
          <div className="stat-value">{value}</div>
          <p className="stat-caption">{caption}</p>
        </div>
      ))}
    </div>
  );
}
export function Overview() {
  const user = useUser(),
    analytics = useWorkspaceData<Analytics>('analytics'),
    activity = useWorkspaceData<Activity[]>('activity');
  if (analytics.isLoading) return <Loading />;
  if (analytics.error)
    return <ErrorState error={analytics.error} retry={() => void analytics.refetch()} />;
  if (!analytics.data) return null;
  const data = analytics.data;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Good to see you, {user.data?.name.split(' ')[0]}.{' '}
            <span style={{ fontSize: 22 }}>✦</span>
          </h1>
          <p>Here’s a little clarity for the day ahead.</p>
        </div>
        <div className="heading-date">
          <CalendarDays size={14} />
          {new Date().toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
      <Stats data={data} />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>A little progress, every day</h2>
              <p>Your task activity over the last 7 days</p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="dot accent" />
                Completed
              </span>
              <span>
                <i className="dot" />
                Created
              </span>
            </div>
          </div>
          <div className="panel-body">
            <CompletionChart data={data.trends} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Projects in motion</h2>
              <p>The bigger picture, at a glance</p>
            </div>
            <Link href="/dashboard/projects">
              View all
              <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="panel-body">
            {data.projects.length ? (
              data.projects.slice(0, 4).map((p) => (
                <Link key={p._id} href={`/dashboard/projects/${p._id}`} className="project-row">
                  <span className={`project-symbol ${p.color}`}>
                    <FolderKanban size={15} />
                  </span>
                  <div className="project-row-main">
                    <div className="flex justify-between">
                      <h3>{p.name}</h3>
                      <small>{p.progress}%</small>
                    </div>
                    <div className="progress-track">
                      <i style={{ width: `${p.progress}%` }} />
                    </div>
                    <small>
                      {p.completed} of {p.total} tasks completed
                    </small>
                  </div>
                </Link>
              ))
            ) : (
              <Empty
                title="Room for your next big thing"
                description="Create a project to give your ideas a home."
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/projects">
                      <Plus size={13} />
                      New project
                    </Link>
                  </Button>
                }
              />
            )}
          </div>
        </section>
      </div>
      <section className="ai-insight">
        <div className="feature-icon">
          <Sparkles size={20} />
        </div>
        <div className="grow">
          <h2>
            A moment of clarity
            <span className="badge violet" style={{ fontSize: 8 }}>
              Workspace insight
            </span>
          </h2>
          <p>
            {data.suggestions[0] ||
              'Your workspace is finding its rhythm. What would you like to work on next?'}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/ai">
            Think it through
            <ArrowRight size={12} />
          </Link>
        </Button>
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>On the horizon</h2>
              <p>A heads-up for your upcoming deadlines</p>
            </div>
            <Link href="/dashboard/tasks">
              All tasks
              <ArrowUpRight size={11} />
            </Link>
          </div>
          {data.upcoming.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link
                        href={`/dashboard/tasks?task=${t._id}`}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 size={13} className="muted" />
                        <strong>{t.title}</strong>
                      </Link>
                    </td>
                    <td>
                      <span className={`priority ${t.priority}`}>
                        <Flag size={11} />
                        {t.priority}
                      </span>
                    </td>
                    <td
                      className={new Date(t.dueDate!) < new Date() ? 'red' : 'muted'}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {shortDate(t.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty
              title="A little breathing room"
              description="Tasks with a due date will appear here."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Around your workspace</h2>
              <p>The little steps that move things forward</p>
            </div>
          </div>
          <div className="panel-body">
            {activity.error ? (
              <ErrorState error={activity.error} />
            ) : activity.data?.length ? (
              activity.data.slice(0, 5).map((a) => (
                <Link className="activity-item" href={a.href} key={a._id}>
                  <Avatar name={a.createdBy?.name || 'Former member'} src={a.createdBy?.avatar} />
                  <div>
                    <p>
                      <strong>{a.createdBy?.name || 'Former member'}</strong> · {a.message}
                    </p>
                    <small>{relativeTime(a.createdAt)}</small>
                  </div>
                </Link>
              ))
            ) : (
              <Empty
                title="Your story starts here"
                description="Activity appears as you create and update work."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
