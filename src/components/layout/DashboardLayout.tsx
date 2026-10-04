import {Link, NavLink, Outlet} from 'react-router-dom';

import {ProfileMenu} from '../ProfileMenu';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';

interface NavItem {
  to: string;
  label: string;
  badge?: number;
  end?: boolean;
}

export function DashboardLayout() {
  const {messages, notifications} = useUnreadCounts();

  const mainLinks: NavItem[] = [
    {to: '/dashboard', label: 'Dashboard', end: true},
    {to: '/dashboard/messages', label: 'Messages', badge: messages},
    {to: '/dashboard/requests', label: 'Requests'},
    {to: '/dashboard/experiences', label: 'Experiences'},
    {to: '/dashboard/membership', label: 'Membership'},
    {to: '/dashboard/notifications', label: 'Notifications', badge: notifications},
  ];

  const personalLinks: NavItem[] = [
    {to: '/dashboard/profile', label: 'Profile'},
    {to: '/dashboard/documents', label: 'Documents'},
    {to: '/dashboard/settings', label: 'Settings'},
  ];

  const renderLink = (link: NavItem) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({isActive}) =>
        `nav-link flex items-center justify-between whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`
      }
    >
      <span>{link.label}</span>
      {link.badge ? (
        <span className="ml-2 inline-flex min-w-4.5 justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-4 text-charcoal">
          {link.badge}
        </span>
      ) : null}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen flex-col bg-alabaster">
      <header className="border-b border-stone bg-alabaster/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/home" className="flex items-baseline gap-3" aria-label="Gillian Anderson Management home">
            <span className="text-lg font-semibold tracking-[0.18em] text-charcoal">GA</span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.24em] text-muted sm:inline">
              Gillian Anderson Management
            </span>
          </Link>
          <ProfileMenu />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:flex-row">
        <aside className="w-full shrink-0 border-b border-stone py-6 lg:w-60 lg:border-b-0 lg:border-r lg:pr-6">
          <nav className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-7 lg:overflow-visible" aria-label="Dashboard">
            <div className="min-w-44 lg:min-w-0">
              <p className="eyebrow mb-2 hidden lg:block">Overview</p>
              <div className="flex gap-1 lg:flex-col">{mainLinks.map(renderLink)}</div>
            </div>
            <div className="min-w-44 lg:min-w-0">
              <p className="eyebrow mb-2 hidden lg:block">Personal</p>
              <div className="flex gap-1 lg:flex-col">{personalLinks.map(renderLink)}</div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 py-8 lg:pl-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
