import {Bell, LogOut, Menu, ShieldCheck, X} from 'lucide-react';
import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {useEffect, useState} from 'react';

import {ProfileMenu} from '../ProfileMenu';
import {useAuth} from '../../auth/AuthContext';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';
import {readIsDesktop} from '../../lib/isDesktop';

interface NavSection {
  title: string;
  links: Array<{to: string; label: string}>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    links: [{to: '/management', label: 'Dashboard'}],
  },
  {
    title: 'Relationships',
    links: [
      {to: '/management/fans', label: 'Fans'},
      {to: '/management/applicants', label: 'Applicants'},
      {to: '/management/messages', label: 'Messages'},
      {to: '/management/requests', label: 'Requests'},
      {to: '/management/memberships', label: 'Memberships'},
    ],
  },
  {
    title: 'Experiences',
    links: [
      {to: '/management/experiences', label: 'Experiences'},
      {to: '/management/bookings', label: 'Bookings'},
      {to: '/management/calendar', label: 'Calendar'},
    ],
  },
  {
    title: 'Business',
    links: [
      {to: '/management/proposals', label: 'Proposals'},
      {to: '/management/payments', label: 'Payments'},
      {to: '/management/agreements', label: 'Agreements'},
    ],
  },
  {
    title: 'Content',
    links: [
      {to: '/management/cms', label: 'CMS'},
      {to: '/management/media', label: 'Media library'},
      {to: '/management/documents', label: 'Documents'},
    ],
  },
  {
    title: 'Operations',
    links: [
      {to: '/management/tasks', label: 'Tasks'},
      {to: '/management/staff', label: 'Staff'},
      {to: '/management/notifications', label: 'Notifications'},
    ],
  },
  {
    title: 'System',
    links: [
      {to: '/management/settings', label: 'Settings'},
      {to: '/management/security', label: 'Security'},
      {to: '/management/audit', label: 'Audit log'},
    ],
  },
];

const ALL_LINKS = NAV_SECTIONS.flatMap((section) => section.links);

function pageTitleFor(pathname: string): string {
  const match = ALL_LINKS.filter((link) =>
    link.to === '/management'
      ? pathname === '/management'
      : pathname === link.to || pathname.startsWith(`${link.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? 'Dashboard';
}

export function ManagementLayout() {
  const {profile, role, signOut} = useAuth();
  const {notifications} = useUnreadCounts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => readIsDesktop());
  const {pathname} = useLocation();
  const pageTitle = pageTitleFor(pathname);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const userName = profile?.full_name || profile?.email || 'Management';
  const userInitials =
    (profile?.full_name || profile?.email || '')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GA';

  return (
    <div className="flex min-h-screen flex-col bg-alabaster">
      <header className="sticky top-0 z-40 border-b border-stone bg-charcoal text-alabaster">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6">
          {/* Mobile: hamburger + monogram + page title */}
          <button
            type="button"
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone hover:text-alabaster focus-visible:outline focus-visible:outline-gold lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="management-sidebar"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link
            to="/management"
            aria-label="Management dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
          >
            <img
              src="/assets/images/ga-monogram-brushed-gold.png"
              alt=""
              className="h-7 w-auto object-contain"
              loading="eager"
            />
          </Link>

          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold uppercase tracking-[0.18em] lg:hidden">
            {pageTitle}
          </span>

          {/* Desktop: console lockup */}
          <Link
            to="/management"
            className="hidden truncate text-sm font-semibold uppercase tracking-[0.22em] lg:block"
          >
            GA Management · Console
          </Link>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              to="/management/notifications"
              aria-label="Notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone transition-colors hover:bg-white/5 hover:text-alabaster lg:hidden"
            >
              <Bell className="size-5" aria-hidden />
              {notifications > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-charcoal">
                  {notifications}
                </span>
              ) : null}
            </Link>

            <span className="hidden items-center gap-2 text-xs uppercase tracking-widest text-stone lg:flex">
              <ShieldCheck className="size-4" aria-hidden />
              {role === 'admin' ? 'Administrator' : 'Management'} · {profile?.full_name || profile?.email}
            </span>
            <button
              type="button"
              className="btn btn-ghost hidden text-stone hover:text-alabaster lg:inline-flex"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>

            <span className="lg:hidden">
              <ProfileMenu />
            </span>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:flex-row">
        <aside
          id="management-sidebar"
          aria-hidden={!isDesktop && !menuOpen ? true : undefined}
          inert={!isDesktop && !menuOpen ? true : undefined}
          className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border border-white/10 bg-charcoal p-4 text-alabaster shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:bottom-auto lg:z-auto lg:h-fit lg:max-h-[calc(100dvh_-_5rem)] lg:w-64 lg:max-w-none lg:shrink-0 lg:self-start lg:translate-x-0 lg:rounded-sm ${
            menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Drawer identity block (mobile drawer only) */}
          <div className="mb-5 border-b border-white/10 pb-4 lg:hidden">
            <div className="flex items-start justify-between gap-2">
              <Link
                to="/management"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-start gap-1 text-left"
              >
                <img
                  src="/assets/images/ga-monogram-brushed-gold.png"
                  alt="GA Monogram"
                  className="mb-1 h-9 w-auto object-contain"
                  loading="eager"
                />
                <span className="text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] text-alabaster">
                  Gillian Anderson
                </span>
                <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-gold">
                  Management
                </span>
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone hover:text-alabaster focus-visible:outline focus-visible:outline-gold"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A2318] font-serif text-[11px] tracking-wider text-[#E6C27A] ring-1 ring-gold/50">
                {userInitials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-alabaster">
                  {userName}
                </span>
                <span className="block truncate text-[10px] text-stone/70">
                  {role === 'admin' ? 'Administrator' : 'Management'}
                </span>
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-5" aria-label="Management">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="min-w-0">
                {/* pl-3.5 = the link's 2px active bar + 12px text padding, so
                    section labels and link labels share one left edge. */}
                <p className="eyebrow mb-2 pl-3.5 text-gold">{section.title}</p>
                <div className="flex flex-col gap-0.5">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/management'}
                      onClick={() => setMenuOpen(false)}
                      className={({isActive}) =>
                        `nav-link min-h-11 whitespace-nowrap border-l-2 py-2.5 transition-colors ${
                          isActive
                            ? 'nav-link-active border-gold bg-white/[0.07] font-medium text-gold'
                            : 'border-transparent text-stone/70 hover:bg-white/[0.05] hover:text-alabaster'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Drawer sign out (mobile) */}
          <button
            type="button"
            className="mt-5 flex min-h-11 items-center gap-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone hover:text-gold lg:hidden"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1 py-6 sm:py-10 lg:pl-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
