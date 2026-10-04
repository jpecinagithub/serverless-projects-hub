import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  Star,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import { api, USE_MOCK } from '../lib/api.js';
import { Stars } from '../components/Stars.jsx';
import { formatDate, formatRating } from '../lib/format.js';

const STATUS_STYLES = {
  published: 'bg-emerald-100 text-emerald-800',
  hidden: 'bg-zinc-200 text-zinc-700',
  pending: 'bg-amber-100 text-amber-800',
  blocked: 'bg-red-100 text-red-800',
};

function LoginForm({ onDone }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.adminLogin(secret);
      onDone();
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <span className="grid size-12 place-items-center rounded-2xl bg-zinc-950 text-white">
          <Lock size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-950">
          Admin sign-in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          This area is restricted. Enter the admin secret to continue.
        </p>
        {USE_MOCK && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800">
            Demo mode — the admin secret is <code className="font-mono font-bold">demo-secret</code>.
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-secret" className="mb-1.5 block text-sm font-semibold text-zinc-900">
              Admin secret
            </label>
            <input
              id="admin-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-[15px] shadow-sm focus:border-zinc-950"
              placeholder="••••••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !secret}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Sign in
          </button>
        </form>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={16} />
          Back to site
        </Link>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, p] = await Promise.all([api.adminStats(), api.adminListProjects()]);
      setStats(s);
      setProjects(p.projects || []);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setError(err.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id, status) {
    setActing(id);
    try {
      await api.adminUpdateStatus(id, status);
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (err) {
      alert(err.message || 'Could not update the project.');
    } finally {
      setActing(null);
    }
  }

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
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="Loading dashboard">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton mt-8 h-96 rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Moderate projects and watch the community grow.</p>
        </div>
        <button
          onClick={async () => {
            await api.adminLogout().catch(() => {});
            onLogout();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {stats && (
        <section aria-label="Statistics" className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects} />
          <StatCard icon={Star} label="Total Ratings" value={stats.totalRatings} />
          <StatCard
            icon={BarChart3}
            label="Average Rating"
            value={formatRating(stats.averageRating)}
          />
          <StatCard icon={Sparkles} label="New This Week" value={stats.newThisWeek} />
        </section>
      )}

      <section aria-label="Projects" className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-zinc-950">Projects</h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Author</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                  <td className="px-5 py-3">
                    <Link
                      to={`/project/${p.id}`}
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-56 truncate text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      {p.url}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{p.authorName}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {p.ratingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Stars value={p.averageRating} size={13} />
                        <span className="font-semibold text-zinc-800">
                          {formatRating(p.averageRating)}
                        </span>
                        <span className="text-xs text-zinc-400">({p.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-xs italic text-zinc-400">Not rated yet</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.hidden}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === 'published' ? (
                        <button
                          onClick={() => changeStatus(p.id, 'hidden')}
                          disabled={acting === p.id}
                          title="Hide project"
                          aria-label={`Hide ${p.title}`}
                          className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                        >
                          <EyeOff size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus(p.id, 'published')}
                          disabled={acting === p.id}
                          title="Publish project"
                          aria-label={`Publish ${p.title}`}
                          className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {confirmDelete === p.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            onClick={() => remove(p.id)}
                            disabled={acting === p.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {acting === p.id ? 'Deleting…' : 'Confirm'}
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
                          className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    No projects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Deleting a project also removes its ratings and its stored image.
        </p>
      </section>
    </main>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState(null);

  const check = useCallback(async () => {
    if (USE_MOCK) {
      const { mockApi } = await import('../lib/mockApi.js');
      setAuthed(mockApi.adminAuthed());
      return;
    }
    // Real mode: a cheap authed probe.
    try {
      await api.adminStats();
      setAuthed(true);
    } catch (err) {
      setAuthed(err.status === 401 || err.status === 503 ? false : false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (authed === null) {
    return (
      <main className="mx-auto max-w-md px-4 py-20" aria-label="Checking session">
        <div className="skeleton h-96 rounded-3xl" />
      </main>
    );
  }

  if (!authed) return <LoginForm onDone={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
