import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  User,
  CalendarDays,
  Loader2,
  CheckCircle2,
  PartyPopper,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { getVisitorId } from '../lib/visitor.js';
import { Stars } from '../components/Stars.jsx';
import { RatingStars } from '../components/RatingStars.jsx';
import { formatDate, formatRating, ratingsLabel } from '../lib/format.js';

const PLACEHOLDER = '/default-project.svg';

export function ProjectDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const fresh = searchParams.get('fresh') === '1';

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rated, setRated] = useState(false);
  const [rateError, setRateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.getProject(id);
      setProject(data.project);
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (fresh) {
      const t = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [fresh, setSearchParams]);

  async function submitRating(n) {
    if (saving || !project) return;
    setSaving(true);
    setRateError('');
    try {
      const res = await api.rateProject(project.id, {
        visitorId: getVisitorId(),
        rating: n,
      });
      setMyRating(res.yourRating);
      setRated(true);
      setProject((p) => ({
        ...p,
        averageRating: res.averageRating,
        ratingCount: res.ratingCount,
      }));
    } catch (err) {
      setRateError(err.message || "We couldn't save your rating.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-label="Loading project">
        <div className="skeleton h-6 w-40 rounded-md" />
        <div className="skeleton mt-6 aspect-[16/7] rounded-3xl" />
        <div className="mt-8 space-y-4">
          <div className="skeleton h-9 w-2/3 rounded-lg" />
          <div className="skeleton h-5 w-full rounded-md" />
          <div className="skeleton h-5 w-5/6 rounded-md" />
        </div>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-950">Project not found</h1>
        <p className="mt-2 text-zinc-500">
          This project doesn't exist or is no longer public.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>
      </main>
    );
  }

  const ratedYet = project.ratingCount > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-950"
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {fresh && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
        >
          <PartyPopper size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">Your project has been published!</p>
            <p className="text-sm text-emerald-700">
              It's now live in the directory for everyone to discover and rate.
            </p>
          </div>
        </div>
      )}

      <article className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative aspect-[16/7] bg-zinc-100">
          <img
            src={project.imageUrl || PLACEHOLDER}
            alt={`${project.title} thumbnail`}
            className="size-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main column */}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
                {project.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} className="text-zinc-400" />
                  Created by <strong className="font-semibold text-zinc-800">{project.authorName}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-zinc-400" />
                  {formatDate(project.createdAt)}
                </span>
              </div>

              <p className="mt-6 text-[17px] leading-relaxed text-zinc-700">
                {project.description}
              </p>

              {project.authorBio && (
                <section
                  aria-labelledby="about-creator"
                  className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
                >
                  <h2 id="about-creator" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                    About the creator
                  </h2>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{project.authorName}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                    {project.authorBio}
                  </p>
                </section>
              )}

              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-zinc-950/15 transition-all hover:-translate-y-0.5 hover:bg-zinc-800"
              >
                Visit Project
                <ExternalLink size={18} />
              </a>
              <p className="mt-2 break-all text-xs text-zinc-400">{project.url}</p>
            </div>

            {/* Rating sidebar */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 lg:sticky lg:top-24">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Community rating
                </h2>

                {ratedYet ? (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-5xl font-extrabold tracking-tight text-zinc-950">
                      {formatRating(project.averageRating)}
                    </span>
                    <div>
                      <Stars value={project.averageRating} size={18} />
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatRating(project.averageRating)} / 5 · {ratingsLabel(project.ratingCount)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm italic text-zinc-500">
                    Not rated yet — be the first!
                  </p>
                )}

                <div className="mt-6 border-t border-zinc-200 pt-6">
                  <h3 className="text-sm font-semibold text-zinc-900">Rate this project</h3>
                  {rated ? (
                    <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 size={18} className="shrink-0" />
                      Thank you for your rating!
                    </p>
                  ) : (
                    <div className="mt-3">
                      <RatingStars
                        value={myRating}
                        onRate={submitRating}
                        disabled={saving}
                        size={32}
                      />
                      {saving && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                          <Loader2 size={14} className="animate-spin" />
                          Saving your rating…
                        </p>
                      )}
                      {rateError && (
                        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                          {rateError}
                        </p>
                      )}
                      {myRating > 0 && !saving && (
                        <p className="mt-2 text-xs text-zinc-400">
                          You rated this {myRating}/5 — tap another star to change it.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
