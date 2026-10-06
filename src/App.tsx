import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {AuthProvider} from './auth/AuthContext';
import {InstallPrompt} from './components/InstallPrompt';
import {AppRoutes} from './routes';

function RobotsMeta() {
  const {pathname} = useLocation();
  const indexable = pathname === '/';

  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]');
    if (tag) tag.setAttribute('content', indexable ? 'index, follow' : 'noindex, nofollow');
  }, [indexable]);

  return null;
}

export function App() {
  return (
    <AuthProvider>
      <RobotsMeta />
      <AppRoutes />
      <InstallPrompt />
    </AuthProvider>
  );
}
