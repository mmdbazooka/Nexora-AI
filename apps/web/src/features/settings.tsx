'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserRound,
  ShieldCheck,
  Palette,
  Bell,
  Monitor,
  Upload,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useUser } from '@/lib/hooks';
import { api, json } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Loading, ErrorState } from '@/components/ui/common';
import { Avatar } from '@/components/avatar';
const emailDisabled = process.env.NEXT_PUBLIC_EMAIL_DISABLED === 'true';
const links = [
  { name: 'Profile', slug: 'profile', icon: UserRound },
  { name: 'Security', slug: 'security', icon: ShieldCheck },
  { name: 'Appearance', slug: 'appearance', icon: Palette },
  { name: 'Notifications', slug: 'notifications', icon: Bell },
];
interface Session {
  _id: string;
  userAgent: string;
  createdAt: string;
  current: boolean;
}
export function Settings({ section }: { section: string }) {
  const user = useUser(),
    client = useQueryClient(),
    router = useRouter();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState(false),
    [confirmation, setConfirmation] = useState(''),
    [password, setPassword] = useState('');
  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api<Session[]>('/users/me/sessions'),
    enabled: section === 'security',
  });
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (user.isLoading) return <Loading />;
  if (user.error) return <ErrorState error={user.error} />;
  if (!user.data) return null;
  const u = user.data;
  const save = async (body: unknown) => {
    await api('/users/me', json('PATCH', body));
    await client.invalidateQueries({ queryKey: ['me'] });
    toast.success('A little more you. Preferences saved.');
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Make yourself at home.</h1>
          <p>Your space, your preferences, your way of working.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings">
          {links.map(({ name, slug, icon: Icon }) => (
            <Link
              key={slug}
              href={`/dashboard/settings/${slug}`}
              className={section === slug ? 'active' : ''}
            >
              <Icon size={15} />
              {name}
            </Link>
          ))}
        </nav>
        <div>
          {section === 'profile' && (
            <section className="panel settings-panel">
              <h2>A little about you</h2>
              <p className="muted">The person behind the good ideas.</p>
              <div className="flex items-center gap-4" style={{ marginBottom: 30 }}>
                <span style={{ transform: 'scale(1.6)', margin: '10px' }}>
                  <Avatar name={u.name} src={u.avatar} />
                </span>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={13} />
                  Change avatar
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 256000) {
                        setError('Choose an image under 250 KB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => void run(() => save({ avatar: reader.result }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <span className="muted" style={{ fontSize: 10 }}>
                  PNG, JPEG, WebP · 250 KB max
                </span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  void run(() => save({ name: form.get('name') }));
                }}
              >
                <Field label="Full name">
                  <input
                    name="name"
                    defaultValue={u.name}
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email address">
                  <input value={u.email} disabled readOnly />
                  <small className="muted">Email changes are not supported in this version.</small>
                </Field>
                {!u.verified &&
                  (emailDisabled ? (
                    <p className="notice">Email verification is unavailable in this demo.</p>
                  ) : (
                    <div className="notice">
                      Your email is not verified yet. Check your inbox, or{' '}
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 0,
                          padding: 0,
                          color: 'var(--accent)',
                        }}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api('/auth/resend-verification', json('POST'));
                            toast.success('Check your inbox for a new verification link.');
                          })
                        }
                      >
                        send a new verification email
                      </button>
                      .
                    </div>
                  ))}
                <Button disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
              </form>
            </section>
          )}
          {section === 'appearance' && (
            <section className="panel settings-panel">
              <h2>A different kind of atmosphere</h2>
              <p className="muted">Find the view that helps you find your flow.</p>
              <div className="theme-options">
                {['dark', 'light', 'system'].map((t) => (
                  <button
                    key={t}
                    className={`theme-option ${theme === t ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(t);
                      void run(() => save({ theme: t }));
                    }}
                    disabled={busy}
                  >
                    <span className={`theme-swatch ${t}`} style={{ display: 'flex' }} />
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 11 }}>
                System follows your device. Your preference is saved to your account and this
                browser.
              </p>
            </section>
          )}
          {section === 'notifications' && (
            <section className="panel settings-panel">
              <h2>A heads-up, on your terms</h2>
              <p className="muted">Choose which workspace updates reach you.</p>
              <div className="setting-row">
                <div>
                  <h3>Workspace activity</h3>
                  <p>In-app notifications when teammates create or update work.</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Workspace activity notifications"
                  checked={u.notifications.activity}
                  disabled={busy}
                  onChange={(e) =>
                    void run(() =>
                      save({ notifications: { ...u.notifications, activity: e.target.checked } }),
                    )
                  }
                />
              </div>
              <div className="setting-row">
                <div>
                  <h3>New work by email</h3>
                  <p>
                    {emailDisabled
                      ? 'Email updates are unavailable in this demo.'
                      : 'Email updates when a teammate creates a project or task.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Workspace email notifications"
                  checked={u.notifications.email}
                  disabled={busy || emailDisabled}
                  onChange={(e) =>
                    void run(() =>
                      save({ notifications: { ...u.notifications, email: e.target.checked } }),
                    )
                  }
                />
              </div>
              {!emailDisabled && (
                <p className="muted" style={{ fontSize: 10, marginTop: 20 }}>
                  Account verification, password recovery, and invitation emails remain enabled.
                </p>
              )}
            </section>
          )}
          {section === 'security' && (
            <>
              <section className="panel settings-panel" style={{ marginBottom: 20 }}>
                <h2>Keep your space yours</h2>
                <p className="muted">A strong password is a good place to start.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void run(async () => {
                      await api(
                        '/users/me/password',
                        json('POST', {
                          currentPassword: f.get('currentPassword'),
                          password: f.get('password'),
                        }),
                      );
                      client.clear();
                      toast.success('Password changed. Sign in again.');
                      router.push('/login');
                    });
                  }}
                >
                  <Field label="Current password">
                    <input
                      type="password"
                      autoComplete="current-password"
                      name="currentPassword"
                      required
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      autoComplete="new-password"
                      name="password"
                      required
                      minLength={10}
                      maxLength={128}
                    />
                  </Field>
                  <Button disabled={busy}>Update password & sign out</Button>
                </form>
              </section>
              <section className="panel settings-panel" style={{ marginBottom: 20 }}>
                <h2>Your active sessions</h2>
                <p className="muted">A little visibility into where you’re signed in.</p>
                {sessions.isLoading ? (
                  <Loading />
                ) : sessions.error ? (
                  <ErrorState error={sessions.error} />
                ) : (
                  sessions.data?.map((s) => (
                    <div className="session-row" key={s._id}>
                      <Monitor size={18} className="muted" />
                      <div className="grow">
                        <span>
                          {s.userAgent?.includes('Mobile') ? 'Mobile browser' : 'Web browser'}{' '}
                          {s.current && (
                            <span className="badge emerald" style={{ marginLeft: 6, fontSize: 8 }}>
                              This session
                            </span>
                          )}
                        </span>
                        <small>Started {new Date(s.createdAt).toLocaleDateString()}</small>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={s.current ? 'Sign out this session' : 'Revoke session'}
                        onClick={() =>
                          void run(async () => {
                            await api(`/users/me/sessions/${s._id}`, json('DELETE'));
                            if (s.current) {
                              client.clear();
                              router.push('/login');
                            } else await sessions.refetch();
                          })
                        }
                      >
                        <LogOut size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </section>
              <section className="panel settings-panel" style={{ borderColor: '#e1597935' }}>
                <h2>A final goodbye</h2>
                <p className="muted">
                  Account deletion is permanent. Remove teammates from owned workspaces before
                  continuing.
                </p>
                <Button
                  variant="danger"
                  onClick={() => {
                    setDeleting(true);
                    setError('');
                  }}
                >
                  <Trash2 size={14} />
                  Delete my account
                </Button>
              </section>
            </>
          )}
          {error && !deleting && (
            <p className="notice error" style={{ marginTop: 20 }} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <Dialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Ready to leave this space?"
        description="This permanently removes your account and invalidates your sessions. Shared content may remain for collaborators."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api('/users/me', json('DELETE', { password, confirmation }));
              client.clear();
              router.push('/');
              toast.success('Your account has been deleted.');
            });
          }}
        >
          <Field label="Your password">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Type DELETE to confirm">
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
              pattern="DELETE"
            />
          </Field>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={() => setDeleting(false)}>
              Stay here
            </Button>
            <Button variant="danger" disabled={busy || confirmation !== 'DELETE'}>
              Permanently delete account
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
