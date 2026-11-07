'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Mail, Users, Pencil, Trash2 } from 'lucide-react';
import { useWorkspaces, useMembers, useWorkspaceId, useUser } from '@/lib/hooks';
import { useWorkspace } from '@/lib/store';
import { api, json } from '@/lib/api';
import type { Workspace } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Loading, ErrorState } from '@/components/ui/common';
import { Avatar } from '@/components/avatar';
export function Workspaces() {
  const workspaces = useWorkspaces(),
    members = useMembers(),
    wid = useWorkspaceId(),
    user = useUser(),
    client = useQueryClient(),
    params = useSearchParams();
  const { setWorkspace } = useWorkspace();
  const [create, setCreate] = useState(false),
    [rename, setRename] = useState(false),
    [invite, setInvite] = useState(false),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [role, setRole] = useState('member'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [acceptedToken, setAcceptedToken] = useState('');
  const inviteToken = params.get('invite') || '';
  const token = inviteToken === acceptedToken ? '' : inviteToken;
  const workspace = workspaces.data?.find((w) => w._id === wid),
    ownRole = workspace?.members.find((m) => m.userId === user.data?._id)?.role,
    admin = ['owner', 'admin'].includes(ownRole || '');
  const run = async (fn: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      await client.invalidateQueries();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Better things, together.</h1>
          <p>Your people. A shared sense of possibility.</p>
        </div>
        <Button
          onClick={() => {
            setName('');
            setCreate(true);
            setError('');
          }}
        >
          <Plus size={14} />
          New workspace
        </Button>
      </div>
      {token && (
        <section className="notice">
          <p>
            You have a workspace invitation. Sign in with the invited email and verify your email
            before accepting.
          </p>
          <Button
            size="sm"
            style={{ marginTop: 10 }}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const w = await api<Workspace>(
                  '/workspaces/accept-invite',
                  json('POST', { token }),
                );
                setWorkspace(w._id);
                setAcceptedToken(token);
                toast.success('Welcome to the team');
              })
            }
          >
            Accept invitation
          </Button>
          {error && (
            <p className="red" role="alert">
              {error}
            </p>
          )}
        </section>
      )}
      <section className="panel" style={{ marginBottom: 25 }}>
        <div className="panel-header">
          <div>
            <h2>{workspace?.name}</h2>
            <p>
              {members.data?.length || 0} members · Your role: {ownRole || 'member'}
            </p>
          </div>
          <div className="flex gap-2">
            {admin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Rename workspace"
                  onClick={() => {
                    setName(workspace?.name || '');
                    setRename(true);
                    setError('');
                  }}
                >
                  <Pencil size={14} />
                </Button>
                {process.env.NEXT_PUBLIC_EMAIL_DISABLED === 'true' ? (
                  <p className="muted">Email invitations are unavailable in this demo.</p>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInvite(true);
                      setError('');
                    }}
                  >
                    <Mail size={13} />
                    Invite someone
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {members.isLoading ? (
          <Loading />
        ) : members.error ? (
          <ErrorState error={members.error} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.data?.map((m) => (
                <tr key={m.userId._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.userId.name} src={m.userId.avatar} />
                      <div>
                        <strong>
                          {m.userId.name}
                          {m.userId._id === user.data?._id ? ' (you)' : ''}
                        </strong>
                        <small
                          className="muted"
                          style={{ display: 'block', marginTop: 4, fontSize: 10 }}
                        >
                          {m.userId.email}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {ownRole === 'owner' && m.role !== 'owner' ? (
                      <select
                        aria-label={`Role for ${m.userId.name}`}
                        className="filter-select"
                        value={m.role}
                        onChange={(e) =>
                          void run(async () => {
                            await api(
                              `/workspaces/${wid}/members/${m.userId._id}`,
                              json('PATCH', { role: e.target.value }),
                            );
                            toast.success('Role updated');
                          })
                        }
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="badge">{m.role}</span>
                    )}
                  </td>
                  <td>
                    {admin && m.role !== 'owner' && (m.role !== 'admin' || ownRole === 'owner') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${m.userId.name}`}
                        onClick={() => {
                          if (window.confirm(`Remove ${m.userId.name} from this workspace?`))
                            void run(async () => {
                              await api(
                                `/workspaces/${wid}/members/${m.userId._id}`,
                                json('DELETE'),
                              );
                              toast.success('Member removed');
                            });
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {error && !create && !rename && !invite && !token && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="section-intro" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20 }}>Your spaces</h2>
        <p>Different projects. Different people. A little room for each.</p>
      </div>
      <div className="projects-grid">
        {workspaces.data?.map((w) => (
          <button
            key={w._id}
            className="panel project-card"
            style={{
              textAlign: 'left',
              color: 'inherit',
              borderColor: w._id === wid ? 'var(--primary)' : undefined,
            }}
            onClick={() => setWorkspace(w._id)}
          >
            <div className="project-card-top">
              <span className="project-symbol">
                <Users size={18} />
              </span>
              {w._id === wid && <span className="badge violet">Current</span>}
            </div>
            <h2>{w.name}</h2>
            <p>
              {w.members.length} people · {w.members.find((m) => m.userId === user.data?._id)?.role}
            </p>
          </button>
        ))}
      </div>
      <Dialog
        open={create || rename}
        onOpenChange={(v) => {
          if (!v) {
            setCreate(false);
            setRename(false);
          }
        }}
        title={rename ? 'A new name, the same possibility' : 'Make a little space'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (rename) await api(`/workspaces/${wid}`, json('PATCH', { name }));
              else {
                const w = await api<Workspace>('/workspaces', json('POST', { name }));
                setWorkspace(w._id);
              }
              setCreate(false);
              setRename(false);
              toast.success(rename ? 'Workspace renamed' : 'Workspace created');
            });
          }}
        >
          <Field label="Workspace name">
            <input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your next chapter"
            />
          </Field>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button disabled={busy}>
              {busy ? 'Saving…' : rename ? 'Save name' : 'Create workspace'}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={invite}
        onOpenChange={setInvite}
        title="Good things are better shared"
        description="We’ll email an invitation that expires in 7 days."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api(`/workspaces/${wid}/invites`, json('POST', { email, role }));
              setInvite(false);
              setEmail('');
              toast.success('An invitation is on its way');
            });
          }}
        >
          <Field label="Email address">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Workspace role">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member — create and manage work</option>
              <option value="admin">Admin — also manage members and projects</option>
            </select>
          </Field>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
