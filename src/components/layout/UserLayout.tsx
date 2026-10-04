import {LogOut, User} from 'lucide-react';
import {Link, NavLink, Outlet} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';

const USER_LINKS = [
  {to: '/home', label: 'Home'},
  {to: '/dashboard', label: 'Dashboard'},
  {to: '/dashboard/messages', label: 'Messages'},
  {to: '/dashboard/requests', label: 'Requests'},
  {to: '/dashboard/membership', label: 'Membership'},
  {to: '/dashboard/experiences', label: 'Experiences'},
  {to: '/dashboard/notifications', label: 'Notifications'},
  {to: '/dashboard/documents', label: 'Documents'},
  {to: '/dashboard/profile', label: 'Profile'},
  {to: '/dashboard/settings', label: 'Settings'},
];

export function UserLayout() {
  const {profile, signOut} = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone bg-alabaster/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.22em] text-charcoal">
            Gillian Anderson Management
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-sm text-muted sm:flex">
              <User className="size-4" aria-hidden />
              {profile?.full_name || profile?.email || 'Account'}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
        <nav
          className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto border-t border-stone px-6 py-2"
          aria-label="Account"
        >
          {USER_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({isActive}) => `nav-link whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
