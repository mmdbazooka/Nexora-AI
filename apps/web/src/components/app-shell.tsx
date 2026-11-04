'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  FolderKanban,
  CheckCheck,
  FileText,
  ChartNoAxesCombined,
  Sparkles,
  Users,
  Settings,
  PanelLeft,
  Search,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  LogOut,
  ArrowUpRight,
  Menu,
  Check,
} from 'lucide-react';
import { Logo } from './logo';
import { Avatar } from './avatar';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Loading, ErrorState, Empty } from './ui/common';
import { useUser, useWorkspaces, useWorkspaceId, useList } from '@/lib/hooks';
import { useWorkspace } from '@/lib/store';
import { api, ApiError, json } from '@/lib/api';
import type { Notification, Project, Task, Note } from '@/lib/types';
import { relativeTime } from '@/lib/utils';
const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/tasks', label: 'My tasks', icon: CheckCheck },
  { href: '/dashboard/notes', label: 'Notes & docs', icon: FileText },
  { href: '/dashboard/ai', label: 'AI assistant', icon: Sparkles },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
];
function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const projects = useList<Project>('projects', `search=${encodeURIComponent(q)}`),
    tasks = useList<Task>('tasks', `search=${encodeURIComponent(q)}`),
    notes = useList<Note>('notes', `search=${encodeURIComponent(q)}`);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Find a little clarity"
      description="Search your current workspace’s projects, tasks, and notes."
    >
      <input
        className="input"
        aria-label="Search workspace"
        placeholder="What are you looking for?"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="search-results">
        {projects.isLoading || tasks.isLoading || notes.isLoading ? (
          <Loading />
        ) : projects.error || tasks.error || notes.error ? (
          <ErrorState error={(projects.error || tasks.error || notes.error)!} />
        ) : (
          <>
            {projects.data?.slice(0, 5).map((p) => (
              <Link
                key={p._id}
                onClick={() => onOpenChange(false)}
                className="search-result"
                href={`/dashboard/projects/${p._id}`}
              >
                <FolderKanban size={15} />
                {p.name}
                <small>Project</small>
              </Link>
            ))}
            {tasks.data?.slice(0, 5).map((t) => (
              <Link
                key={t._id}
                onClick={() => onOpenChange(false)}
                className="search-result"
                href={`/dashboard/tasks?task=${t._id}`}
              >
                <CheckCheck size={15} />
                {t.title}
                <small>Task</small>
              </Link>
            ))}
            {notes.data?.slice(0, 5).map((n) => (
              <Link
                key={n._id}
                onClick={() => onOpenChange(false)}
                className="search-result"
                href={`/dashboard/notes?note=${n._id}`}
              >
                <FileText size={15} />
                {n.title}
                <small>Note</small>
              </Link>
            ))}
            {!projects.data?.length && !tasks.data?.length && !notes.data?.length && (
              <Empty
                title="No matching ideas"
                description="Try a different word, or create something new."
              />
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    client = useQueryClient();
  const user = useUser(),
    workspaces = useWorkspaces();
  const wid = useWorkspaceId();
  const { setWorkspace } = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [notifications, setNotifications] = useState(false);
  const notices = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Notification[]>('/notifications'),
    enabled: !!user.data,
    refetchInterval: 60000,
  });
  useEffect(() => {
    if (user.error instanceof ApiError && user.error.status === 401) router.replace('/login');
  }, [user.error, router]);
  useEffect(() => {
    if (user.data?.theme) setTheme(user.data.theme);
  }, [user.data?.theme, setTheme]);
  useEffect(() => {
    const expired = () => {
      client.removeQueries({ queryKey: ['me'] });
      router.replace('/login');
    };
    window.addEventListener('nexora:unauthorized', expired);
    return () => window.removeEventListener('nexora:unauthorized', expired);
  }, [client, router]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === 'Escape') setMobile(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  if (user.isLoading) return <Loading />;
  if (user.error)
    return user.error instanceof ApiError && user.error.status === 401 ? (
      <Loading label="Returning to sign in…" />
    ) : (
      <ErrorState error={user.error} retry={() => void user.refetch()} />
    );
  if (!user.data) return null;
  const current = nav.find((n) =>
    n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href),
  );
  const changeTheme = () => {
    const theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    void api('/users/me', json('PATCH', { theme }))
      .then(() => client.invalidateQueries({ queryKey: ['me'] }))
      .catch(async (e) => {
        const { toast } = await import('sonner');
        toast.error((e as Error).message);
      });
  };
  const logout = async () => {
    try {
      await api('/auth/logout', json('POST'));
      client.clear();
      router.replace('/login');
    } catch (e) {
      const { toast } = await import('sonner');
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop mobile-only"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`} aria-label="Workspace navigation">
        <Logo />
        <div className="workspace-switcher">
          <span className="workspace-symbol">
            {workspaces.data?.find((w) => w._id === wid)?.name[0] || 'N'}
          </span>
          <select
            aria-label="Active workspace"
            value={wid}
            onChange={(e) => {
              setWorkspace(e.target.value);
              router.push('/dashboard');
            }}
          >
            {workspaces.data?.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <span className="sidebar-label">Workspace</span>
        <nav className="app-nav">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={
                (href === '/dashboard' ? pathname === href : pathname.startsWith(href))
                  ? 'active'
                  : ''
              }
            >
              <Icon size={17} />
              {label}
              {label === 'AI assistant' && <span className="nav-count">✦</span>}
            </Link>
          ))}
        </nav>
        <span className="sidebar-label">Your team</span>
        <nav className="app-nav">
          <Link
            href="/dashboard/workspaces"
            onClick={() => setMobile(false)}
            className={pathname.includes('/workspaces') ? 'active' : ''}
          >
            <Users size={17} />
            Members & workspaces
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <strong>
              <Sparkles size={13} className="accent" />A fresh perspective
            </strong>
            <p>Big ideas feel smaller when you have a thinking partner.</p>
            <Link href="/dashboard/ai" onClick={() => setMobile(false)}>
              Meet your assistant
              <ArrowUpRight size={11} />
            </Link>
          </div>
          <nav className="app-nav">
            <Link
              href="/dashboard/settings/profile"
              onClick={() => setMobile(false)}
              className={pathname.includes('/settings') ? 'active' : ''}
            >
              <Settings size={17} />
              Settings
            </Link>
          </nav>
          <div className="sidebar-profile">
            <Avatar name={user.data.name} src={user.data.avatar} />
            <div>
              <strong>{user.data.name}</strong>
              <small>Personal workspace</small>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              aria-label="Sign out"
              onClick={() => void logout()}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-icon mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={18} />
            </button>
            <div className="breadcrumbs">
              <span>
                <PanelLeft size={15} />
              </span>
              <span>Workspace</span>
              <ChevronRight size={11} />
              <strong>
                {current?.label ||
                  (pathname.includes('settings') ? 'Settings' : 'Members & workspaces')}
              </strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => setSearch(true)}
              aria-label="Search workspace"
            >
              <Search size={15} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="topbar-separator" />
            <button
              className="btn btn-ghost btn-icon"
              aria-label="Toggle theme"
              onClick={() => changeTheme()}
            >
              <Sun size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              aria-label="Notifications"
              onClick={() => setNotifications(true)}
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {notices.data?.some((n) => !n.read) && (
                <i className="dot accent" style={{ position: 'absolute', right: 7, top: 7 }} />
              )}
            </button>
            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <button
                  style={{ background: 'none', border: 0, padding: 0 }}
                  aria-label="Open account menu"
                >
                  <Avatar name={user.data.name} src={user.data.avatar} />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content className="dropdown-content" align="end" sideOffset={10}>
                  <Dropdown.Item asChild className="dropdown-item">
                    <Link href="/dashboard/settings/profile">
                      <Settings size={14} />
                      Profile & settings
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item className="dropdown-item" onSelect={() => changeTheme()}>
                    <Moon size={14} />
                    Change appearance
                  </Dropdown.Item>
                  <Dropdown.Item className="dropdown-item" onSelect={() => void logout()}>
                    <LogOut size={14} />
                    Sign out
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        <main id="main" className="app-content">
          {workspaces.error ? (
            <ErrorState error={workspaces.error} retry={() => void workspaces.refetch()} />
          ) : (
            children
          )}
        </main>
      </div>
      {search && <GlobalSearch open={search} onOpenChange={setSearch} />}
      <Dialog
        open={notifications}
        onOpenChange={setNotifications}
        title="A little heads-up"
        description="Activity and updates from your shared workspaces."
      >
        {notices.isLoading ? (
          <Loading />
        ) : notices.error ? (
          <ErrorState error={notices.error} />
        ) : notices.data?.length ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await api('/notifications/read', json('PATCH'));
                await client.invalidateQueries({ queryKey: ['notifications'] });
              }}
            >
              <Check size={13} />
              Mark all as read
            </Button>
            <div className="notification-list">
              {notices.data.map((n) => (
                <Link
                  onClick={() => setNotifications(false)}
                  href={n.href}
                  className={`notification-item ${n.read ? '' : 'unread'}`}
                  key={n._id}
                >
                  {n.message}
                  <small>{relativeTime(n.createdAt)}</small>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Empty
            title="You’re all caught up"
            description="Updates from your teammates will show up here."
          />
        )}
      </Dialog>
    </div>
  );
}
