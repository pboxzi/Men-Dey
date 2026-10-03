import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

const NAV_ITEMS = [
  { label: 'About', to: '/about' },
  { label: 'Appearances', to: '/appearances' },
  { label: 'Media', to: '/media' },
  { label: 'News', to: '/news' },
  { label: 'Fan Access', to: '/fan-access' },
  { label: 'Contact Management', to: '/contact' },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the overlay menu when history navigation happens underneath it.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: '#14181B',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,.10)' : '1px solid transparent',
          boxShadow: scrolled ? '0 8px 30px -18px rgba(0,0,0,.9)' : 'none',
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Brand */}
          <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Gillian Anderson Management — home">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 font-serif text-[12px] font-bold text-white transition-colors group-hover:border-white">
              GA
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Gillian Anderson
              </span>
              <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C89B3C]">
                Management
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `relative py-1 text-[13px] transition-colors ${
                    isActive ? 'font-medium text-white' : 'text-white/70 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#C89B3C]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/fan'}
                  className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[12px] text-white/85 transition-colors hover:border-white/40 hover:text-white"
                >
                  <User className="h-3.5 w-3.5" />
                  {profile?.name ? profile.name.split(' ')[0] : 'My Area'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-[12px] text-white/55 transition-colors hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="hidden rounded-full border border-white/25 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/5 lg:inline-flex"
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#14181B] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              Gillian Anderson
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 pb-10 sm:px-8" aria-label="Mobile primary">
            <ul className="mt-6 space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between border-b border-white/10 py-4 font-elegant text-2xl transition-colors ${
                        isActive ? 'text-[#C89B3C]' : 'text-white/85'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3">
              {user ? (
                <>
                  <Link
                    to={profile?.role === 'admin' ? '/admin' : '/fan'}
                    onClick={() => setOpen(false)}
                    className="btn btn-lg btn-light btn-full"
                  >
                    Enter My Area
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                    className="btn btn-lg btn-ghost btn-full"
                    style={{ color: 'rgba(255,255,255,.7)' }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/sign-in" onClick={() => setOpen(false)} className="btn btn-lg btn-light btn-full">
                    Sign In
                  </Link>
                  <Link
                    to="/create-account"
                    onClick={() => setOpen(false)}
                    className="btn btn-lg btn-secondary btn-full"
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
                  >
                    Create Fan Account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
