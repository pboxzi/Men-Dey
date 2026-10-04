import {Navigate, Outlet, useLocation} from 'react-router-dom';

import {FullPageLoader} from '../components/ui/FullPageLoader';
import {getStoredAck} from './ack';
import {useAuth} from './AuthContext';

function useUnauthenticatedTarget(): string {
  const location = useLocation();
  return `${location.pathname}${location.search}`;
}

export function RequireAuth() {
  const {loading, isAuthenticated} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  return <Outlet />;
}

export function RequireManagement() {
  const {loading, isAuthenticated, role} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  if (role !== 'management' && role !== 'admin') return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const {loading, isAuthenticated, role} = useAuth();
  const next = useUnauthenticatedTarget();

  if (loading) return <FullPageLoader />;
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

export function RequireAcknowledgement() {
  const ack = getStoredAck();
  if (!ack) return <Navigate to="/acknowledgement" replace />;
  return <Outlet />;
}
