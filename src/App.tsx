import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {AuthProvider} from './auth/AuthContext';
import {InstallPrompt} from './components/InstallPrompt';
import {AppRoutes} from './routes';

// The private gate and its auth flow stay free of floating install/chat chrome.
// The legal desk reads like a document, so it gets the same treatment.
const PUBLIC_PREFIXES = [
  '/sign-in',
  '/acknowledgement',
  '/create-account',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/forbidden',
  '/legal',
  '/privacy',
  '/terms',
  '/policies',
];

function isPublicSurface(pathname: string): boolean {
  return (
    pathname === '/' ||
    PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function RobotsMeta() {
  const {pathname} = useLocation();
  const indexable = pathname === '/';

  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]');
    if (tag) tag.setAttribute('content', indexable ? 'index, follow' : 'noindex, nofollow');
  }, [indexable]);

  return null;
}

function InstallGate() {
  const {pathname} = useLocation();
  if (isPublicSurface(pathname)) return null;
  return <InstallPrompt />;
}

export function App() {
  return (
    <AuthProvider>
      <RobotsMeta />
      <AppRoutes />
      <InstallGate />
    </AuthProvider>
  );
}
