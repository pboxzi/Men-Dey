import {Navigate, Outlet, useLocation} from 'react-router-dom';

import {FullPageLoader} from '../components/ui/FullPageLoader';
import {useAuth} from './AuthContext';

function useUnauthenticatedTarget(): string {
  const location = useLocation();
  return `${location.pathname}${location.search}`;
}

export function RequireAuth() {
  const {loading, profileLoading, isAuthenticated, profile} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading || profileLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  // Unverified accounts never reach restricted features.
  if (profile && !profile.email_verified_at) {
    const email = profile.email ? `?email=${encodeURIComponent(profile.email)}` : '';
    return <Navigate to={`/verify-email${email}`} replace />;
  }
  return <Outlet />;
}

export function RequireManagement() {
  const {loading, profileLoading, isAuthenticated, role} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading || profileLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  if (role !== 'management' && role !== 'admin') return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const {loading, profileLoading, isAuthenticated, role} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading || profileLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  if (role !== 'admin') return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed({to = '/home'}: {to?: string}) {
  const {loading, isAuthenticated} = useAuth();

  if (loading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to={to} replace />;
  return <Outlet />;
}
