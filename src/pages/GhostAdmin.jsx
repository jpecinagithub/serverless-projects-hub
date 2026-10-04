import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { api, USE_MOCK } from '../lib/api.js';
import { formatDate } from '../lib/format.js';

/** Rendered when the token is wrong — deliberately looks like a plain 404. */
function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <p className="text-6xl font-extrabold tracking-tight text-zinc-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-zinc-950">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Back to home
      </Link>
    </main>
  );
}

function ModerationList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = await api.adminListProjects();
      setProjects(p.projects || []);
    } catch (err) {
      setError(err.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    setActing(id);
    try {
      await api.adminDeleteProject(id);
      setProjects((ps) => ps.filter((p) => p.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.message || 'Could not delete the project.');
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6" aria-label="Loading">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton mt-6 h-24 rounded-2xl" />
        <div className="skeleton mt-3 h-24 rounded-2xl" />
        <div className="skeleton mt-3 h-24 rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-zinc-950 text-white">
          <ShieldAlert size={20} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-950">
            Quick moderation
          </h1>
          <p className="text-sm text-zinc-500">
            {projects.length} project{projects.length === 1 ? '' : 's'} — deletion is permanent.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {projects.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
          >
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt=""
                className="size-14 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-400">
                No img
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-900">{p.title}</p>
              <p className="truncate text-xs text-zinc-500">
                {p.authorName} · {formatDate(p.createdAt)} ·{' '}
                <span className="capitalize">{p.status}</span>
              </p>
            </div>
            {confirmDelete === p.id ? (
              <span className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => remove(p.id)}
                  disabled={acting === p.id}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {acting === p.id ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(p.id)}
                title="Delete project"
                aria-label={`Delete ${p.title}`}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={17} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {projects.length === 0 && !error && (
        <p className="mt-6 text-center text-sm text-zinc-500">No projects to moderate.</p>
      )}
      <p className="mt-6 text-xs text-zinc-400">
        Deleting a project also removes its ratings and its stored image. This page is not
        linked anywhere — keep its address private.
      </p>
    </main>
  );
}

export function GhostAdmin() {
  const { token } = useParams();
  const [state, setState] = useState(USE_MOCK ? 'mock' : 'checking');

  useEffect(() => {
    if (USE_MOCK) return;
    let cancelled = false;
    api
      .ghostRedeem(token)
      .then(() => {
        if (!cancelled) setState('ok');
      })
      .catch(() => {
        if (!cancelled) setState('denied');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === 'checking') {
    return (
      <main className="mx-auto max-w-md px-4 py-24 sm:px-6" aria-label="Checking link">
        <div className="flex justify-center">
          <Loader2 size={28} className="animate-spin text-zinc-400" />
        </div>
      </main>
    );
  }

  if (state === 'mock') {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-bold text-zinc-950">Ghost links are a production feature</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Run against the real API to use this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Back to home
        </Link>
      </main>
    );
  }

  if (state === 'denied') return <NotFound />;
  return <ModerationList />;
}
