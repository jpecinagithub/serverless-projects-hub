import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Hexagon, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';

const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || 'https://github.com/';

function GithubIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Serverless Hub home">
      <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-white shadow-sm">
        <Hexagon size={20} strokeWidth={2} />
      </span>
      <span className="text-lg font-bold tracking-tight text-zinc-950">
        Serverless&nbsp;Hub
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    [
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-950',
    ].join(' ');

  const goSubmit = () => {
    setOpen(false);
    navigate('/submit');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/" end className={linkCls}>
            Explore
          </NavLink>
          <NavLink to="/?sort=rating" className={linkCls}>
            Top Rated
          </NavLink>
          <NavLink to="/submit" className={linkCls}>
            Submit Project
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="hidden size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950 sm:grid"
          >
            <GithubIcon size={19} />
          </a>
          <button
            onClick={goSubmit}
            className="hidden items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-zinc-800 hover:shadow md:inline-flex"
          >
            <Plus size={16} />
            Submit Project
          </button>
          <button
            className="grid size-9 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-200/70 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-zinc-200/80 bg-white px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={linkCls} onClick={() => setOpen(false)}>
              Explore
            </NavLink>
            <NavLink to="/?sort=rating" className={linkCls} onClick={() => setOpen(false)}>
              Top Rated
            </NavLink>
            <button
              onClick={goSubmit}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Submit Project
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
