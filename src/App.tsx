import {useEffect} from 'react';
import {useLocation, useNavigationType} from 'react-router-dom';

import {AuthProvider} from './auth/AuthContext';
import {DocumentMeta} from './components/DocumentMeta';
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

function ScrollToTop() {
  const {pathname} = useLocation();
  const navigationType = useNavigationType();

  // The document keeps its scroll offset across a client-side navigation, so a
  // clicked page would open halfway down the screen. Every forward navigation
  // opens at the top; browser back/forward keeps the browser's own restored
  // position for the page the visitor is returning to.
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);

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
      <DocumentMeta />
      <ScrollToTop />
      <AppRoutes />
      <InstallGate />
    </AuthProvider>
  );
}
