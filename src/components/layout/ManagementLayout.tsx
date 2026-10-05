import {LogOut, ShieldCheck} from 'lucide-react';
import {Link, NavLink, Outlet} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';

interface NavSection {
  title: string;
  links: Array<{to: string; label: string}>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    links: [
      {to: '/management', label: 'Home'},
      {to: '/management/inbox', label: 'Inbox'},
      {to: '/management/applicants', label: 'Applicants'},
      {to: '/management/requests', label: 'Requests'},
      {to: '/management/messages', label: 'Messages'},
      {to: '/management/notes', label: 'Notes'},
      {to: '/management/conversations', label: 'Conversations'},
    ],
  },
  {
    title: 'Membership',
    links: [
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
    title: 'Operations',
    links: [
      {to: '/management/tasks', label: 'Tasks'},
      {to: '/management/documents', label: 'Documents'},
      {to: '/management/media', label: 'Media'},
      {to: '/management/staff', label: 'Staff'},
      {to: '/management/audit', label: 'Audit log'},
      {to: '/management/settings', label: 'Settings'},
      {to: '/management/cms', label: 'CMS'},
    ],
  },
];

export function ManagementLayout() {
  const {profile, role, signOut} = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone bg-charcoal text-alabaster">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.22em]">
            GA Management · Console
          </Link>
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

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:flex-row">
        <aside className="w-full shrink-0 border-b border-stone py-6 lg:w-60 lg:border-b-0 lg:border-r lg:pr-6">
          <nav className="flex gap-4 overflow-x-auto lg:flex-col lg:gap-6 lg:overflow-visible" aria-label="Management">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="min-w-40 lg:min-w-0">
                <p className="eyebrow mb-2 hidden lg:block">{section.title}</p>
                <div className="flex gap-1 lg:flex-col">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/management'}
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
