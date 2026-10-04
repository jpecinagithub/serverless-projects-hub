import { ProjectCard, ProjectCardSkeleton } from './ProjectCard.jsx';
import { EmptyState } from './EmptyState.jsx';

export function ProjectGrid({ projects, loading, error, onRetry }) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-label="Loading projects"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="font-semibold text-red-800">We couldn't load the projects.</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      data-testid="project-grid"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
