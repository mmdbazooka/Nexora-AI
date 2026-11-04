'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Star,
  Trash2,
  RotateCcw,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Check,
  LoaderCircle,
} from 'lucide-react';
import type { Note } from '@/lib/types';
import { useList, useWorkspaceId } from '@/lib/hooks';
import { api, json } from '@/lib/api';
import { relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Empty, ErrorState, Loading } from '@/components/ui/common';
function NoteEditor({ note, onDeleted }: { note: Note; onDeleted: () => void }) {
  const wid = useWorkspaceId(),
    client = useQueryClient();
  const [title, setTitle] = useState(note.title),
    [category, setCategory] = useState(note.category),
    [favorite, setFavorite] = useState(note.favorite),
    [state, setState] = useState('Saved'),
    [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pending = useRef<Partial<Note>>({}),
    saving = useRef(false),
    mounted = useRef(true);
  const flush = useCallback(
    async function savePending() {
      if (saving.current || !Object.keys(pending.current).length) return;
      saving.current = true;
      const payload = { ...pending.current };
      pending.current = {};
      if (mounted.current) setState('Saving…');
      try {
        await api(`/workspaces/${wid}/notes/${note._id}`, json('PATCH', payload));
        if (mounted.current) {
          setState('Saved');
          setError('');
        }
        void client.invalidateQueries({ queryKey: ['notes', wid] });
      } catch (e) {
        pending.current = { ...payload, ...pending.current };
        if (mounted.current) {
          setState('Not saved');
          setError((e as Error).message);
        }
        saving.current = false;
        return;
      }
      saving.current = false;
      if (Object.keys(pending.current).length) await savePending();
    },
    [wid, note._id, client],
  );
  const queue = (patch: Partial<Note>) => {
    pending.current = { ...pending.current, ...patch };
    setState('Unsaved changes');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Give the thought a little space…' }),
    ],
    content: note.content,
    immediatelyRender: false,
    editable: !note.deleted,
    onUpdate: ({ editor }) => queue({ content: editor.getHTML() }),
  });
  useEffect(() => {
    mounted.current = true;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || saving.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      mounted.current = false;
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);
  const update = async (patch: Partial<Note>) => {
    try {
      await flush();
      await api(`/workspaces/${wid}/notes/${note._id}`, json('PATCH', patch));
      void client.invalidateQueries({ queryKey: ['notes', wid] });
      if ('deleted' in patch) onDeleted();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <section className="panel note-editor">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div className="save-status">
          {state === 'Saving…' ? <LoaderCircle size={11} className="spin" /> : <Check size={11} />}
          <span aria-live="polite">{state}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={favorite ? 'Remove favorite' : 'Favorite note'}
            onClick={() => {
              setFavorite(!favorite);
              void update({ favorite: !favorite });
            }}
          >
            <Star
              size={15}
              fill={favorite ? 'currentColor' : 'none'}
              className={favorite ? 'accent' : ''}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={note.deleted ? 'Restore note' : 'Move note to trash'}
            onClick={() => void update({ deleted: !note.deleted })}
          >
            {note.deleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
          </Button>
        </div>
      </div>
      <input
        aria-label="Note title"
        maxLength={160}
        value={title}
        disabled={note.deleted}
        onChange={(e) => {
          setTitle(e.target.value);
          if (e.target.value.trim()) queue({ title: e.target.value });
        }}
      />
      <div className="flex items-center gap-3">
        <select
          className="filter-select"
          aria-label="Note category"
          value={category}
          disabled={note.deleted}
          onChange={(e) => {
            setCategory(e.target.value);
            queue({ category: e.target.value });
          }}
        >
          {Array.from(
            new Set(['General', 'Ideas', 'Meeting notes', 'Research', 'Personal', note.category]),
          ).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 10 }}>
          Edited {relativeTime(note.updatedAt)}
        </span>
      </div>
      {!note.deleted && (
        <div className="editor-toolbar">
          {[
            {
              label: 'Bold',
              icon: Bold,
              active: editor?.isActive('bold'),
              action: () => editor?.chain().focus().toggleBold().run(),
            },
            {
              label: 'Italic',
              icon: Italic,
              active: editor?.isActive('italic'),
              action: () => editor?.chain().focus().toggleItalic().run(),
            },
            {
              label: 'Heading',
              icon: Heading2,
              active: editor?.isActive('heading'),
              action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            },
            {
              label: 'Bullet list',
              icon: List,
              active: editor?.isActive('bulletList'),
              action: () => editor?.chain().focus().toggleBulletList().run(),
            },
            {
              label: 'Numbered list',
              icon: ListOrdered,
              active: editor?.isActive('orderedList'),
              action: () => editor?.chain().focus().toggleOrderedList().run(),
            },
            {
              label: 'Code block',
              icon: Code,
              active: editor?.isActive('codeBlock'),
              action: () => editor?.chain().focus().toggleCodeBlock().run(),
            },
            {
              label: 'Quote',
              icon: Quote,
              active: editor?.isActive('blockquote'),
              action: () => editor?.chain().focus().toggleBlockquote().run(),
            },
          ].map(({ label, icon: Icon, active, action }) => (
            <button
              key={label}
              title={label}
              aria-label={label}
              aria-pressed={active || false}
              onClick={action}
              className={active ? 'active' : ''}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      )}
      <EditorContent editor={editor} />
      {error && (
        <div className="notice error" role="alert">
          {error}{' '}
          <Button size="sm" variant="secondary" onClick={() => void flush()}>
            Retry saving
          </Button>
        </div>
      )}
      {note.deleted && (
        <div className="notice">
          This note is in the trash. Restore it to continue editing.{' '}
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!window.confirm('Permanently delete this note?')) return;
              try {
                await api(`/workspaces/${wid}/notes/${note._id}`, json('DELETE'));
                void client.invalidateQueries({ queryKey: ['notes', wid] });
                onDeleted();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Delete permanently
          </Button>
        </div>
      )}
    </section>
  );
}
export function Notes() {
  const wid = useWorkspaceId(),
    client = useQueryClient(),
    params = useSearchParams();
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState('');
  const query = new URLSearchParams({
    search,
    ...(filter === 'trash' ? { deleted: 'true' } : {}),
    ...(filter === 'favorites' ? { favorite: 'true' } : {}),
  });
  const notes = useList<Note>('notes', query.toString());
  const active =
    notes.data?.find((n) => n._id === (selected || params.get('note'))) || notes.data?.[0];
  const create = useMutation({
    mutationFn: () =>
      api<Note>(
        `/workspaces/${wid}/notes`,
        json('POST', { title: 'Untitled idea', content: '', category: 'General' }),
      ),
    onSuccess: (n) => {
      setFilter('all');
      setSearch('');
      setSelected(n._id);
      void client.invalidateQueries({ queryKey: ['notes', wid] });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Catch the thought.</h1>
          <p>A little space for ideas worth coming back to.</p>
        </div>
        <Button disabled={create.isPending} onClick={() => create.mutate()}>
          <Plus size={14} />
          New note
        </Button>
      </div>
      <div className="page-toolbar">
        <div className="search-input">
          <Search size={14} />
          <input
            className="input"
            placeholder="Find a thought…"
            aria-label="Search notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filter notes"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setSelected('');
          }}
        >
          <option value="all">All notes</option>
          <option value="favorites">Favorites</option>
          <option value="trash">Trash</option>
        </select>
      </div>
      {notes.isLoading ? (
        <Loading />
      ) : notes.error ? (
        <ErrorState error={notes.error} retry={() => void notes.refetch()} />
      ) : notes.data?.length ? (
        <div className="notes-layout">
          <div className="note-list">
            {notes.data.map((n) => (
              <button
                key={n._id}
                className={`note-list-item ${active?._id === n._id ? 'active' : ''}`}
                onClick={() => setSelected(n._id)}
              >
                <h3>
                  {n.title}
                  {n.favorite && <Star size={11} className="accent" fill="currentColor" />}
                </h3>
                <p>{n.content.replace(/<[^>]*>/g, ' ').trim() || 'Room for a fresh thought…'}</p>
                <div className="flex justify-between">
                  <small>{n.category}</small>
                  <small>{relativeTime(n.updatedAt)}</small>
                </div>
              </button>
            ))}
          </div>
          {active && (
            <NoteEditor key={active._id} note={active} onDeleted={() => setSelected('')} />
          )}
        </div>
      ) : (
        <Empty
          title={filter === 'trash' ? 'Nothing left behind' : 'Every good idea starts somewhere'}
          description={
            filter === 'trash'
              ? 'Deleted notes stay here until you restore or permanently remove them.'
              : 'Create a note and give the thought a little room.'
          }
          action={
            filter !== 'trash' && (
              <Button onClick={() => create.mutate()}>
                <Plus size={14} />
                Write your first note
              </Button>
            )
          }
        />
      )}
    </>
  );
}
