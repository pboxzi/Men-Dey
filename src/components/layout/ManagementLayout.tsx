import {useEffect, useState} from 'react';
import {LogOut, Menu, ShieldCheck, X} from 'lucide-react';
import {Link, NavLink, Outlet} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';

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

export function ManagementLayout() {
  const {profile, role, signOut} = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone bg-charcoal text-alabaster">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-stone hover:text-alabaster focus-visible:outline focus-visible:outline-gold lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="management-sidebar"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Link
              to="/management"
              className="truncate text-sm font-semibold uppercase tracking-[0.22em]"
            >
              GA Management · Console
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs uppercase tracking-widest text-stone sm:flex">
              <ShieldCheck className="size-4" aria-hidden />
              {role === 'admin' ? 'Administrator' : 'Management'} · {profile?.full_name || profile?.email}
            </span>
            <button
              type="button"
              className="btn btn-ghost text-stone hover:text-alabaster"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:flex-row">
        <aside
          id="management-sidebar"
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r border-stone bg-charcoal p-4 transform transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-60 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:border-r lg:p-0 lg:py-6 lg:pr-6 lg:bg-transparent ${
            menuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'
          }`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone">
              Navigation
            </span>
            <button
              type="button"
              className="rounded-md p-1.5 text-stone hover:text-alabaster focus-visible:outline focus-visible:outline-gold"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <nav className="flex gap-4 overflow-x-auto lg:flex-col lg:gap-6 lg:overflow-visible" aria-label="Management">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="min-w-40 lg:min-w-0">
                <p className="eyebrow mb-2">{section.title}</p>
                <div className="flex gap-1 lg:flex-col">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/management'}
                      onClick={() => setMenuOpen(false)}
                      className={({isActive}) =>
                        `nav-link whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 py-10 lg:pl-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
