import { Link } from 'react-router-dom';
import { ExternalLink, User } from 'lucide-react';
import { Stars } from './Stars.jsx';
import { formatRating, ratingsLabel } from '../lib/format.js';

const PLACEHOLDER = '/default-project.svg';

export function ProjectCard({ project }) {
  const rated = project.ratingCount > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/[0.07]">
      <Link
        to={`/project/${project.id}`}
        className="relative block aspect-[8/5] overflow-hidden bg-zinc-100"
        aria-label={`View details of ${project.title}`}
        tabIndex={-1}
      >
        <img
          src={project.imageUrl || PLACEHOLDER}
          alt={`${project.title} thumbnail`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link to={`/project/${project.id}`} className="hover:underline">
          <h3 className="text-lg font-bold tracking-tight text-zinc-950">
            {project.title}
          </h3>
        </Link>
        <p className="clamp-2 mt-1.5 flex-none text-sm leading-relaxed text-zinc-600">
          {project.description}
        </p>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
          <User size={13} className="text-zinc-400" />
          by <span className="font-medium text-zinc-700">{project.authorName}</span>
        </p>

        <div className="mt-3 flex items-center gap-2">
          {rated ? (
            <>
              <Stars value={project.averageRating} size={15} />
              <span className="text-sm font-semibold text-zinc-900">
                {formatRating(project.averageRating)}
              </span>
              <span className="text-xs text-zinc-500">
                ({ratingsLabel(project.ratingCount)})
              </span>
            </>
          ) : (
            <span className="text-xs font-medium italic text-zinc-400">
              Not rated yet
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-1 items-end gap-2">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            View Project
            <ExternalLink size={14} />
          </a>
          <Link
            to={`/project/${project.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
      aria-hidden="true"
    >
      <div className="skeleton aspect-[8/5]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-2/3 rounded-md" />
        <div className="skeleton h-4 w-full rounded-md" />
        <div className="skeleton h-4 w-5/6 rounded-md" />
        <div className="skeleton h-4 w-1/3 rounded-md" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
