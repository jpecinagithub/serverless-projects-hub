import { ProjectForm } from '../components/ProjectForm.jsx';
import { Rocket } from 'lucide-react';

export function Submit() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 text-center">
        <span className="inline-grid size-14 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/15">
          <Rocket size={26} />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
          Share Your Project
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
          Tell the community about your serverless creation. It goes live the
          moment you hit publish — no account, no waiting.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <ProjectForm />
      </div>
    </main>
  );
}
