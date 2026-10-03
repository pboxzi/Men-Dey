import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useSeo } from '../hooks/useSeo';

const SECTIONS = [{ label: 'Overview', to: '/admin', end: true }];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  useSeo({ noindex: true, title: 'Management Office' });

  return (
    <div className="min-h-screen" style={{ background: 'var(--ed-bg-alt)' }}>
      <a className="skip-link" href="#admin-content">
        Skip to content
      </a>

      <header className="sticky top-0 z-40" style={{ background: '#14181B' }}>
        <div className="mx-auto flex h-16 w-full max-w-[85rem] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Back to website">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 font-serif text-[12px] font-bold text-white">
                GA
              </span>
              <span className="hidden flex-col leading-none sm:flex">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  Gillian Anderson
                </span>
                <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C89B3C]">
                  Management
                </span>
              </span>
            </Link>
            <span className="hidden h-5 w-px sm:block" style={{ background: 'rgba(255,255,255,.15)' }} />
            <span className="hidden text-[13px] sm:block" style={{ color: 'rgba(255,255,255,.6)' }}>
              Management Office
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden text-[13px] transition-colors hover:text-white sm:inline-flex"
              style={{ color: 'rgba(255,255,255,.6)' }}
            >
              <ExternalLink className="mr-1.5 inline h-3.5 w-3.5" />
              View site
            </Link>
            <span className="hidden text-[13px] md:block" style={{ color: 'rgba(255,255,255,.75)' }}>
              {profile?.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,.25)', color: 'rgba(255,255,255,.8)' }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>

        <nav className="mx-auto w-full max-w-[85rem] px-5 sm:px-8" aria-label="Management office">
          <ul className="flex gap-1 overflow-x-auto pb-2">
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  end={section.end}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors"
                  style={({ isActive }) => ({
                    background: isActive ? 'rgba(255,255,255,.10)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                    border: `1px solid ${isActive ? 'rgba(255,255,255,.18)' : 'transparent'}`,
                  })}
                >
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="admin-content" className="mx-auto w-full max-w-[85rem] px-5 py-8 sm:px-8" tabIndex={-1} key={location.pathname}>
        <Outlet />
      </main>
    </div>
  );
}
