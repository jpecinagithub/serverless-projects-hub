import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Hexagon, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';

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
