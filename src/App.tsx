import {AuthProvider} from './auth/AuthContext';
import {AppRoutes} from './routes';

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
