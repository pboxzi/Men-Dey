import {Link, NavLink, Outlet} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';

function brandClass(isActive: boolean) {
  return `inline-block truncate text-xs font-medium uppercase tracking-[0.18em] transition-colors sm:text-sm ${
    isActive ? 'text-gold-deep' : 'text-charcoal hover:text-gold-deep'
  }`;
}

export function PublicLayout() {
  const {isAuthenticated, signOut} = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone bg-alabaster/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl min-w-0 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className={`${brandClass(false)} min-w-0 max-w-[50vw]`}>
            Gillian Anderson Management
          </Link>
          <nav className="flex shrink-0 items-center gap-1" aria-label="Primary">
            <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/home" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                  My account
                </NavLink>
                <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/sign-in" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                  Sign in
                </NavLink>
                <Link to="/acknowledgement" className="btn btn-primary ml-2">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>Gillian Anderson Management</p>
          <p>Private platform — all contact is routed through management.</p>
        </div>
      </footer>
    </div>
  );
}
