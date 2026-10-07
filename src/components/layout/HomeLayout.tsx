import {Bell} from 'lucide-react';
import {Link, NavLink, Outlet} from 'react-router-dom';

import {MobileBottomNav} from './MobileBottomNav';
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
      <header className="sticky top-0 z-40 border-b border-[#EAE4DA]/80 bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 md:h-20 lg:px-10">
          {/* Mobile: GA monogram · Desktop: full lockup */}
          <Link
            to="/home"
            aria-label="Gillian Anderson Management home"
            className="flex h-11 w-11 shrink-0 items-center justify-center md:hidden"
          >
            <img
              src="/assets/images/ga-monogram-brushed-gold.png"
              alt=""
              className="h-8 w-auto object-contain"
              loading="eager"
            />
          </Link>
          <div className="hidden md:block">
            <GaBrand variant="light" size="md" to="/home" />
          </div>

          {/* Mobile: compact centered brand */}
          <span
            className="min-w-0 flex-1 text-center leading-tight md:hidden"
            aria-hidden="true"
          >
            <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1E1E1E]">
              Gillian Anderson
            </span>
            <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.3em] text-[#A67F2C]">
              Management
            </span>
          </span>

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

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              to="/dashboard/notifications"
              aria-label="View notifications"
              className="relative flex h-11 w-11 items-center justify-center text-stone-700 hover:text-[#1E1E1E] transition-colors rounded-full hover:bg-stone-200/50"
            >
              <Bell className="w-5 h-5 stroke-[1.8]" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-[10px] font-semibold text-white shadow-xs">
                  {notifications}
                </span>
              )}
            </Link>

            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <MobileBottomNav messagesBadge={messages} />
    </div>
  );
}
