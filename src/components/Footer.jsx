import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-white">
                <Hexagon size={20} strokeWidth={2} />
              </span>
              <span className="text-lg font-bold tracking-tight text-zinc-950">
                Serverless Projects Hub
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Discover. Build. Share.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              A community directory of projects running on serverless architectures.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:gap-16" aria-label="Footer">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Directory
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-zinc-600 hover:text-zinc-950">
                    Explore
                  </Link>
                </li>
                <li>
                  <Link to="/?sort=rating" className="text-zinc-600 hover:text-zinc-950">
                    Top Rated
                  </Link>
                </li>
                <li>
                  <Link to="/submit" className="text-zinc-600 hover:text-zinc-950">
                    Submit Project
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Project
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-zinc-600 hover:text-zinc-950">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-zinc-600 hover:text-zinc-950">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
          Built with React and serverless technologies. Created by{' '}
          <Link to="/about" className="font-medium text-zinc-500 hover:text-zinc-950">
            Jon Peciña
          </Link>
          .
        </div>
      </div>
    </footer>
  );
}
