import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { ProjectCard } from './ProjectCard.jsx';

/**
 * "Top Rated Projects" — only projects with a strong rating AND a minimum
 * number of votes (default 5), so a 5.0 from a single vote can't dominate.
 */
export function FeaturedRow({ minRatings = 5, limit = 4 }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.listProjects({
          sort: 'rating',
          limit,
          minRatings,
        });
        if (!cancelled) setProjects(data.projects || []);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [minRatings, limit]);

  if (!loading && projects.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mb-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-amber-100 text-amber-600">
            <Trophy size={20} />
          </span>
          <div>
            <h2 id="featured-heading" className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Top Rated Projects
            </h2>
            <p className="text-sm text-zinc-500">
              Community favorites with at least {minRatings} ratings
            </p>
          </div>
        </div>
        <Link
          to="/?sort=rating"
          className="hidden text-sm font-semibold text-zinc-700 underline-offset-4 hover:underline sm:block"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading top rated">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="skeleton aspect-[8/5]" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-2/3 rounded-md" />
                <div className="skeleton h-4 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}
