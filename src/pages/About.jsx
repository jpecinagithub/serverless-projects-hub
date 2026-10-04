import { Link } from 'react-router-dom';
import { Hexagon, ArrowLeft } from 'lucide-react';

export function About() {
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
          <Hexagon size={26} />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
          About Serverless Hub
        </h1>
      </div>

      <div className="prose-sm mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-600">
        <p>
          <strong className="text-zinc-900">Serverless Projects Hub</strong> is a
          community directory where developers and creators share projects built
          on serverless architectures — no servers to provision, scale, or
          babysit.
        </p>
        <p>
          Anyone can submit a project in under a minute: a title, a link, a
          short description, and optionally an image. Every submission goes live
          immediately — no accounts, no approval queues.
        </p>
        <p>
          Visitors can discover projects, visit them, and rate their favorites
          from 1 to 5 stars. Ratings are anonymous: we generate a random
          visitor identifier in your browser so you can update your vote, but we
          never ask for your name or email to rate.
        </p>
        <p>
          The platform itself practices what it preaches: a static React
          frontend, serverless API functions, PostgreSQL for structured data,
          and object storage for images. Nothing runs on a permanently-on
          server.
        </p>
        <h2 className="pt-2 text-xl font-bold text-zinc-950">Moderation</h2>
        <p>
          Projects are published automatically but can be hidden or removed by
          moderators if they violate basic community standards (spam, malware,
          or abusive content). Contact emails submitted with projects are kept
          private and never displayed publicly.
        </p>
        <h2 className="pt-2 text-xl font-bold text-zinc-950">Author</h2>
        <p>
          <strong className="text-zinc-900">Jon Peciña</strong> — Industrial
          Engineer (UNAV) and Full-Stack Developer (React + Node.js +
          PostgreSQL) working as an AI Engineer: building complete applications
          accelerated by AI tools.
        </p>
        <p>
          Contact:{' '}
          <a
            href="mailto:jpecina@gmail.com"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-600"
          >
            jpecina@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
