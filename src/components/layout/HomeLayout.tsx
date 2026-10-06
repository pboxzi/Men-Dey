import {Bell} from 'lucide-react';
import {Link, NavLink, Outlet} from 'react-router-dom';

import {ProfileMenu} from '../ProfileMenu';
import {GaBrand} from '../ui/GaBrand';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';

const NAV_LINKS = [
  {to: '/home', label: 'HOME'},
  {to: '/dashboard', label: 'DASHBOARD'},
  {to: '/dashboard/messages', label: 'MESSAGES'},
  {to: '/dashboard/requests', label: 'REQUESTS'},
  {to: '/dashboard/membership', label: 'MEMBERSHIP'},
];

export function HomeLayout() {
  const {messages, notifications} = useUnreadCounts();

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#1E1E1E] antialiased">
      <header className="sticky top-0 z-30 border-b border-[#EAE4DA]/80 bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 md:h-20 lg:px-10">
          <GaBrand variant="light" size="md" to="/home" />

          <nav className="hidden items-center gap-5 md:flex lg:gap-9" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/home' || link.to === '/dashboard'}
                className={({isActive}) =>
                  `nav-link text-[11px] font-medium uppercase tracking-[0.14em] transition-all relative py-2 lg:text-xs lg:tracking-[0.18em] ${
                    isActive
                      ? 'nav-link-active text-[#1E1E1E] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#C89B3C]'
                      : 'text-[#7D766D] hover:text-[#1E1E1E]'
                  }`
                }
              >
                {link.label}
                {link.label === 'MESSAGES' && messages > 0 ? (
                  <span className="ml-1.5 inline-flex min-w-4 justify-center rounded-full bg-[#C89B3C] px-1 text-[10px] font-semibold leading-4 text-white">
                    {messages}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/notifications"
              aria-label="View notifications"
              className="relative p-2 text-stone-700 hover:text-[#1E1E1E] transition-colors rounded-full hover:bg-stone-200/50"
            >
              <Bell className="w-5 h-5 stroke-[1.8]" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-[10px] font-semibold text-white shadow-xs">
                  {notifications}
                </span>
              )}
            </Link>

            <ProfileMenu />
          </div>
        </div>

        <nav
          className="flex gap-3.5 overflow-x-auto border-t border-[#EAE4DA] px-4 py-2 md:hidden bg-[#FAF8F5]"
          aria-label="Primary mobile"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/home' || link.to === '/dashboard'}
              className={({isActive}) =>
                `nav-link text-[10px] font-medium uppercase tracking-[0.12em] whitespace-nowrap py-1 ${
                  isActive ? 'nav-link-active text-[#1E1E1E] border-b-2 border-[#C89B3C]' : 'text-[#7D766D]'
                }`
              }
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
