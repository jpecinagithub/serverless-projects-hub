import { Link } from 'react-router-dom';
import { PackageOpen, Plus } from 'lucide-react';

export function EmptyState({ title, message, action = true }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
        <PackageOpen size={30} />
      </span>
      <h3 className="mt-5 text-xl font-bold text-zinc-950">
        {title || 'No projects yet.'}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        {message ||
          'Be the first developer to share a serverless project with the community.'}
      </p>
      {action && (
        <Link
          to="/submit"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-zinc-800"
        >
          <Plus size={16} />
          Submit the First Project
        </Link>
      )}
    </div>
  );
}
