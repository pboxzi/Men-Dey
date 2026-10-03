import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { LoadingState } from '../components/ui/States';
import { useSeo } from '../hooks/useSeo';

const FAN_NAV = [
  { label: 'Home', to: '/fan', end: true },
  { label: 'Messages', to: '/fan/messages' },
  { label: 'Requests', to: '/fan/requests' },
  { label: 'Access', to: '/fan/membership' },
  { label: 'Notifications', to: '/fan/notifications' },
  { label: 'Profile', to: '/fan/profile' },
  { label: 'Settings', to: '/fan/settings' },
];

export default function FanLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  useSeo({ noindex: true, title: 'Fan Area' });

  if (loading) {
    return (
      <div className="ed-shell ed-section">
        <LoadingState label="Opening your fan area" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  const firstName = profile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen" style={{ background: 'var(--ed-bg)' }}>
      <a className="skip-link" href="#fan-content">
        Skip to content
      </a>

      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(251,250,247,.94)', borderColor: 'var(--ed-line)', backdropFilter: 'blur(8px)' }}
      >
        <div className="ed-shell flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Back to website">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border font-serif text-[11px] font-bold"
                style={{ borderColor: 'var(--ed-line-strong)' }}
              >
                GA
              </span>
              <span className="hidden flex-col leading-none sm:flex">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--ed-ink)' }}>
                  Gillian Anderson
                </span>
                <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.22em] t-accent">
                  Management
                </span>
              </span>
            </NavLink>
            <span className="hidden h-5 w-px md:block" style={{ background: 'var(--ed-line)' }} />
            <span className="hidden truncate text-[13px] md:block" style={{ color: 'var(--ed-muted)' }}>
              Fan Area
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] sm:block" style={{ color: 'var(--ed-ink-soft)' }}>
              {firstName}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
              aria-hidden="true"
            >
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Mobile / tablet nav */}
        <nav className="ed-shell lg:hidden" aria-label="Fan area">
          <ul className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto pb-2">
            {FAN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                      isActive ? '' : ''
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive ? 'var(--ed-ink)' : 'transparent',
                    color: isActive ? '#FBFAF7' : 'var(--ed-ink-soft)',
                    border: `1px solid ${isActive ? 'var(--ed-ink)' : 'var(--ed-line)'}`,
                  })}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="ed-shell grid gap-8 py-8 lg:grid-cols-[13rem_1fr] lg:py-10">
        {/* Desktop rail */}
        <nav className="hidden lg:block" aria-label="Fan area">
          <ul className="space-y-1">
            {FAN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className="block border-l-2 px-3 py-2 text-[13px] transition-colors"
                  style={({ isActive }) => ({
                    borderColor: isActive ? 'var(--ed-accent)' : 'transparent',
                    color: isActive ? 'var(--ed-ink)' : 'var(--ed-muted)',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--ed-accent-soft)' : 'transparent',
                  })}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--ed-line)' }}>
            <NavLink to="/" className="text-[13px] transition-colors hover:opacity-70" style={{ color: 'var(--ed-muted)' }}>
              ← Back to website
            </NavLink>
          </div>
        </nav>

        <main id="fan-content" className="min-w-0" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
