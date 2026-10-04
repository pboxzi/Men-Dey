import {Link, NavLink, Outlet} from 'react-router-dom';

import {ProfileMenu} from '../ProfileMenu';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';

const NAV_LINKS = [
  {to: '/home', label: 'HOME'},
  {to: '/dashboard', label: 'DASHBOARD'},
  {to: '/dashboard/messages', label: 'MESSAGES'},
  {to: '/dashboard/requests', label: 'REQUESTS'},
  {to: '/dashboard/membership', label: 'MEMBERSHIP'},
];

export function HomeLayout() {
  const {messages} = useUnreadCounts();

  return (
    <div className="flex min-h-screen flex-col bg-alabaster">
      <header className="border-b border-stone bg-alabaster/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link to="/home" className="flex items-baseline gap-3" aria-label="Gillian Anderson Management home">
            <span className="text-xl font-semibold tracking-[0.18em] text-charcoal">GA</span>
            <span className="hidden text-xs font-medium uppercase tracking-[0.24em] text-muted sm:inline">
              Gillian Anderson Management
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/home' || link.to === '/dashboard'}
                className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
                {link.label === 'MESSAGES' && messages > 0 ? (
                  <span className="ml-1.5 inline-flex min-w-4 justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-4 text-charcoal">
                    {messages}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <ProfileMenu />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-stone px-6 py-2 md:hidden"
          aria-label="Primary mobile"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/home' || link.to === '/dashboard'}
              className={({isActive}) => `nav-link whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
