import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Hero } from '../components/Hero.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { SortControls } from '../components/SortControls.jsx';
import { ProjectGrid } from '../components/ProjectGrid.jsx';
import { FeaturedRow } from '../components/FeaturedRow.jsx';
import { api, USE_MOCK } from '../lib/api.js';

const PAGE_SIZE = 12;

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = ['newest', 'rating', 'popular'].includes(searchParams.get('sort'))
    ? searchParams.get('sort')
    : 'newest';

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listProjects({
        page,
        limit: PAGE_SIZE,
        sort,
        search,
      });
      setProjects(data.projects || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSearchParams(next, { replace: true });
  };

  const onSortChange = (s) => updateParams({ sort: s === 'newest' ? null : s, page: null });
  const onSearchChange = (s) => {
    setSearch(s);
    updateParams({ search: s || null, page: null });
  };
  const onPage = (p) => {
    updateParams({ page: p > 1 ? String(p) : null });
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Hero />

      <main id="directory" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        {USE_MOCK && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            <strong>Demo mode:</strong> showing local sample data. Connect Neon Postgres
            and Vercel Blob to go live — see the README.
          </div>
        )}

        <FeaturedRow />

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Explore Projects
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {pagination.total > 0 && !loading
              ? `${pagination.total} project${pagination.total === 1 ? '' : 's'} shared by the community`
              : 'Fresh serverless ideas from the community'}
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={search} onChange={onSearchChange} />
          </div>
          <SortControls value={sort} onChange={onSortChange} />
        </div>

        <ProjectGrid projects={projects} loading={loading} error={error} onRetry={load} />

        {!loading && !error && pagination.totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-2"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-sm font-medium text-zinc-600" aria-live="polite">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= pagination.totalPages}
              aria-label="Next page"
              className="grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
