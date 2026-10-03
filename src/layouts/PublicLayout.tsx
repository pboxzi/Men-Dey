import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/public/PublicHeader';
import PublicFooter from '../components/public/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ed-bg)', color: 'var(--ed-ink)' }}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
