import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Cloud, Zap, Braces } from 'lucide-react';

function FloatingChip({ icon: Icon, label, sub, className = '', delay = '0s' }) {
  return (
    <div
      className={`animate-float-slow pointer-events-none absolute hidden items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-lg shadow-zinc-900/5 backdrop-blur lg:flex ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-white">
        <Icon size={17} />
      </span>
      <span>
        <span className="block font-mono text-xs font-semibold text-zinc-900">{label}</span>
        <span className="block text-[11px] text-zinc-500">{sub}</span>
      </span>
      <span className="animate-pulse-node ml-1 size-2 rounded-full bg-emerald-500" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle technological backdrop */}
      <div className="tech-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-zinc-950/[0.04] blur-3xl"
        aria-hidden="true"
      />

      <FloatingChip
        icon={Cloud}
        label="GET /api/projects"
        sub="200 OK · 12 ms"
        className="left-[6%] top-24"
      />
      <FloatingChip
        icon={Zap}
        label="EDGE · COLD START"
        sub="0 ms · serverless"
        className="right-[7%] top-40"
        delay="1.4s"
      />
      <FloatingChip
        icon={Braces}
        label="POST /api/projects"
        sub="201 Created"
        className="bottom-24 left-[10%]"
        delay="2.6s"
      />

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          A community directory for the serverless era
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl">
          Discover Amazing
          <br />
          Serverless Projects
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
          Explore projects built by developers around the world, discover new
          ideas, rate your favorites, and share your own serverless creation.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/submit"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-zinc-950/15 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl sm:w-auto"
          >
            Submit Your Project
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="#directory"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-7 py-3.5 text-base font-semibold text-zinc-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow sm:w-auto"
          >
            <Compass size={18} />
            Explore Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
