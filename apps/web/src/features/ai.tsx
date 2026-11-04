'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { toast } from 'sonner';
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Send,
  Copy,
  CheckCheck,
  Lightbulb,
  FileText,
  FolderKanban,
  Info,
  LoaderCircle,
  MessageSquare,
} from 'lucide-react';
import { useWorkspaceId, useWorkspaceData, useList } from '@/lib/hooks';
import { api, json, securityToken, ApiError } from '@/lib/api';
import type { Conversation, Project, User } from '@/lib/types';
import type { TaskInput } from '@nexora/shared';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Empty, ErrorState, Loading } from '@/components/ui/common';
export function AI() {
  const wid = useWorkspaceId(),
    client = useQueryClient();
  const status = useWorkspaceData<{ available: boolean; model: string; dailyLimit: number }>(
      'ai/status',
    ),
    conversations = useWorkspaceData<Conversation[]>('ai/conversations'),
    projects = useList<Project>('projects');
  const [selected, setSelected] = useState(''),
    [message, setMessage] = useState(''),
    [projectId, setProjectId] = useState(''),
    [streaming, setStreaming] = useState(false),
    [partial, setPartial] = useState(''),
    [pendingMessage, setPendingMessage] = useState(''),
    [error, setError] = useState(''),
    [suggestions, setSuggestions] = useState<Partial<TaskInput>[] | null>(null),
    [generating, setGenerating] = useState(false),
    [creating, setCreating] = useState(false);
  const bottom = useRef<HTMLDivElement>(null),
    controller = useRef<AbortController | null>(null);
  const conversation = useQuery({
    queryKey: ['conversation', wid, selected],
    queryFn: () => api<Conversation>(`/workspaces/${wid}/ai/conversations/${selected}`),
    enabled: !!selected,
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [partial, conversation.data?.messages?.length]);
  useEffect(() => () => controller.current?.abort(), []);
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['ai/conversations', wid] });
    void client.invalidateQueries({ queryKey: ['conversation', wid] });
  };
  const send = async () => {
    if (!message.trim() || streaming || !status.data?.available) return;
    const text = message.trim();
    setStreaming(true);
    setError('');
    setPartial('');
    setPendingMessage(text);
    setMessage('');
    try {
      await api<User>('/auth/me');
      let id = selected;
      if (!id) {
        const c = await api<Conversation>(
          `/workspaces/${wid}/ai/conversations`,
          json('POST', { title: text.slice(0, 60) }),
        );
        id = c._id;
        setSelected(id);
      }
      controller.current = new AbortController();
      const response = await fetch(`/api/v1/workspaces/${wid}/ai/conversations/${id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await securityToken() },
        body: JSON.stringify({ message: text, ...(projectId ? { projectId } : {}) }),
        signal: controller.current.signal,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(data.error?.message || 'The assistant is unavailable', response.status);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('This browser does not support response streaming');
      const decoder = new TextDecoder();
      let buffer = '';
      let doneEvent = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const event = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (!event.startsWith('data: ')) continue;
          const data = JSON.parse(event.slice(6)) as {
            delta?: string;
            done?: boolean;
            error?: string;
          };
          if (data.error) throw new Error(data.error);
          if (data.delta) setPartial((p) => p + data.delta);
          if (data.done) doneEvent = true;
        }
      }
      if (!doneEvent) throw new Error('The response was interrupted. Please try again.');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setMessage(text);
      }
    } finally {
      setStreaming(false);
      setPendingMessage('');
      setPartial('');
      invalidate();
    }
  };
  const prompts = [
    {
      icon: Lightbulb,
      title: 'Explore an idea',
      text: 'Find a fresh perspective.',
      prompt:
        'Help me brainstorm a thoughtful plan for my next project. Ask me a few focused questions to start.',
    },
    {
      icon: FolderKanban,
      title: 'Find the next step',
      text: 'Make the big idea smaller.',
      prompt: 'Help me break my project into clear, achievable milestones and tasks.',
    },
    {
      icon: FileText,
      title: 'Make it clearer',
      text: 'Get past the blank page.',
      prompt: 'Help me write a clear project brief. Ask what you need to know first.',
    },
  ];
  const msgs = conversation.data?.messages || [];
  return (
    <div className="ai-layout">
      <aside className="conversation-sidebar">
        <Button
          variant="secondary"
          size="sm"
          disabled={streaming}
          onClick={() => {
            setSelected('');
            setMessage('');
            setError('');
          }}
        >
          <Plus size={14} />
          New conversation
        </Button>
        <span className="conversation-label">A little history</span>
        {conversations.error ? (
          <span className="muted text-sm">Couldn’t load conversations</span>
        ) : (
          conversations.data?.map((c) => (
            <div className={`conversation-item ${selected === c._id ? 'active' : ''}`} key={c._id}>
              <MessageSquare size={12} />
              <button
                disabled={streaming}
                onClick={() => {
                  setSelected(c._id);
                  setError('');
                }}
              >
                {c.title}
              </button>
              <button
                className="btn btn-ghost btn-icon"
                disabled={streaming}
                aria-label={`Rename ${c.title}`}
                onClick={async () => {
                  const title = window.prompt('A new name for this conversation', c.title);
                  if (!title?.trim()) return;
                  try {
                    await api(
                      `/workspaces/${wid}/ai/conversations/${c._id}`,
                      json('PATCH', { title: title.slice(0, 100) }),
                    );
                    invalidate();
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Pencil size={11} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                disabled={streaming}
                aria-label={`Delete ${c.title}`}
                onClick={async () => {
                  if (!window.confirm('Delete this conversation permanently?')) return;
                  try {
                    await api(`/workspaces/${wid}/ai/conversations/${c._id}`, json('DELETE'));
                    if (selected === c._id) setSelected('');
                    invalidate();
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
        <div className="ai-status">
          <i
            className="dot"
            style={{ color: status.data?.available ? 'var(--green)' : 'var(--subtle)' }}
          />
          {status.data?.available ? 'Connected to your provider' : 'Provider not connected'}
        </div>
      </aside>
      <section className="chat-main">
        <header className="chat-topbar">
          <span>
            <Sparkles size={14} className="accent" />
            Nexora Assistant
            <span className="badge violet" style={{ fontSize: 8 }}>
              AI
            </span>
          </span>
          <select
            aria-label="AI project context"
            value={projectId}
            disabled={streaming}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project context</option>
            {projects.data?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </header>
        {conversation.isLoading && selected ? (
          <Loading />
        ) : conversation.error ? (
          <ErrorState error={conversation.error} />
        ) : msgs.length || streaming ? (
          <div className="chat-messages">
            {msgs.map((m) => (
              <div className="message" key={m._id}>
                <span className="message-avatar">
                  {m.role === 'assistant' ? <Sparkles size={14} /> : 'You'}
                </span>
                <div className="message-content">
                  <div className="message-meta">
                    {m.role === 'assistant' ? 'Nexora' : 'You'}
                    <small>
                      {new Date(m.createdAt).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                    {m.role === 'assistant' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Copy response"
                        style={{ height: 23, minHeight: 23, width: 23, marginLeft: 'auto' }}
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(m.content)
                            .then(() => toast.success('Copied'))
                            .catch(() => toast.error('Clipboard permission is unavailable'))
                        }
                      >
                        <Copy size={11} />
                      </Button>
                    )}
                  </div>
                  <div className="markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {streaming && (
              <>
                <div className="message">
                  <span className="message-avatar">You</span>
                  <div className="message-content">
                    <div className="message-meta">You</div>
                    <p className="markdown">{pendingMessage}</p>
                  </div>
                </div>
                <div className="message">
                  <span className="message-avatar">
                    <Sparkles size={14} />
                  </span>
                  <div className="message-content">
                    <div className="message-meta">
                      Nexora <LoaderCircle size={11} className="spin" />
                    </div>
                    <div className="markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {partial || 'A little thought…'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </>
            )}
            {!streaming && msgs.some((m) => m.role === 'assistant') && (
              <Button
                variant="secondary"
                size="sm"
                style={{ alignSelf: 'flex-start', marginLeft: 40 }}
                disabled={generating || !status.data?.available}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const data = await api<Partial<TaskInput>[]>(
                      `/workspaces/${wid}/ai/conversations/${selected}/suggest-tasks`,
                      json('POST'),
                    );
                    setSuggestions(data);
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                <CheckCheck size={12} />
                {generating ? 'Finding next steps…' : 'Turn this into tasks'}
              </Button>
            )}
            <div ref={bottom} />
          </div>
        ) : (
          <div className="chat-welcome">
            <div className="ai-orb">
              <Sparkles size={30} strokeWidth={1.4} />
            </div>
            <span className="eyebrow" style={{ marginBottom: 12 }}>
              A little intelligence. A lot of possibility.
            </span>
            <h1>What’s on your mind?</h1>
            <p>
              A messy idea, a blank page, a big next step.
              <br />
              Let’s think it through, together.
            </p>
            <div className="prompt-grid">
              {prompts.map(({ icon: Icon, title, text, prompt }) => (
                <button className="prompt-card" key={title} onClick={() => setMessage(prompt)}>
                  <Icon size={17} />
                  <strong>{title}</strong>
                  <p>{text}</p>
                </button>
              ))}
            </div>
            {status.isLoading ? (
              <p className="muted" style={{ marginTop: 20, fontSize: 11 }}>
                Checking AI connection…
              </p>
            ) : status.error ? (
              <div className="ai-unavailable" role="alert">
                <Info size={15} />
                {status.error.message}
              </div>
            ) : (
              !status.data?.available && (
                <div className="ai-unavailable">
                  <Info size={16} />
                  <span>
                    Your thinking partner isn’t connected yet. The deployment owner can add an AI
                    provider key to enable conversations. Meanwhile, your projects, tasks, and notes
                    are ready for you.
                  </span>
                </div>
              )
            )}
          </div>
        )}
        <div className="chat-composer-wrap">
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Message Nexora"
              placeholder="A thought, a question, a little inspiration…"
              value={message}
              maxLength={12000}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={streaming}
            />
            <div className="composer-actions">
              <Sparkles size={12} />
              <span>
                {projectId
                  ? 'Selected project context will be shared'
                  : 'Only this conversation is shared'}
              </span>
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={!message.trim() || streaming || !status.data?.available}
              >
                {streaming ? <LoaderCircle size={15} className="spin" /> : <Send size={15} />}
              </Button>
            </div>
          </form>
          <p className="composer-note">
            A thinking partner, not the final word. Always review AI suggestions. · 50 requests /
            day
          </p>
        </div>
      </section>
      <Dialog
        open={suggestions !== null}
        onOpenChange={(v) => !v && setSuggestions(null)}
        title="Good ideas deserve a next step"
        description="Review these AI suggestions. Tasks are created only when you confirm."
      >
        {suggestions?.length ? (
          suggestions.map((t, i) => (
            <div className="notice" key={i}>
              <strong style={{ color: 'var(--text)' }}>{t.title}</strong>
              <p>{t.description}</p>
              <small>{t.priority} priority</small>
            </div>
          ))
        ) : (
          <Empty
            title="No actionable tasks found"
            description="Add a little more context to your conversation and try again."
          />
        )}
        <div className="form-actions">
          <Button variant="secondary" disabled={creating} onClick={() => setSuggestions(null)}>
            Cancel
          </Button>
          <Button
            disabled={creating || !suggestions?.length}
            onClick={async () => {
              setCreating(true);
              const failed: Partial<TaskInput>[] = [];
              for (const task of suggestions || []) {
                try {
                  await api(
                    `/workspaces/${wid}/tasks`,
                    json('POST', { ...task, status: 'todo', projectId: projectId || null }),
                  );
                } catch {
                  failed.push(task);
                }
              }
              void client.invalidateQueries({ queryKey: ['tasks', wid] });
              void client.invalidateQueries({ queryKey: ['analytics', wid] });
              if (failed.length) {
                setSuggestions(failed);
                toast.error(
                  `${failed.length} tasks could not be created. You can retry the remaining suggestions.`,
                );
              } else {
                setSuggestions(null);
                toast.success('Your next steps are ready.');
              }
              setCreating(false);
            }}
          >
            {creating ? 'Creating…' : 'Create these tasks'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
