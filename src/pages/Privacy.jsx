import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-950"
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-zinc-950 text-white">
          <ShieldCheck size={26} />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Privacy</h1>
      </div>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-600">
        <p>
          Serverless Projects Hub is designed to collect as little personal data
          as possible.
        </p>

        <h2 className="pt-2 text-lg font-bold text-zinc-950">What we store</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-zinc-800">Project submissions:</strong> the
            title, URL, description, author name/nickname, optional bio, and
            optional project image you provide. This information is public by
            design.
          </li>
          <li>
            <strong className="text-zinc-800">Contact email (optional):</strong>{' '}
            stored privately for administrative contact only. It is never
            displayed publicly and never shared.
          </li>
          <li>
            <strong className="text-zinc-800">Ratings:</strong> your star rating
            linked to a random anonymous visitor identifier generated in your
            browser (stored in localStorage). This lets you update your vote
            without an account. We do not store IP addresses for ratings.
          </li>
        </ul>

        <h2 className="pt-2 text-lg font-bold text-zinc-950">What we don't do</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>No accounts, no passwords, no tracking profiles.</li>
          <li>No advertising and no sale of data.</li>
          <li>No third-party analytics beacons in the core product.</li>
        </ul>

        <h2 className="pt-2 text-lg font-bold text-zinc-950">Your control</h2>
        <p>
          Clearing your browser's localStorage removes your anonymous visitor
          identifier. If you submitted a project and want it removed, contact
          the site administrator — every project page links back to the
          directory where removal can be requested.
        </p>

        <p className="text-sm text-zinc-400">
          Last updated: October 2026.
        </p>
      </div>
    </main>
  );
}
