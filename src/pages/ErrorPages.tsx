import {Link} from 'react-router-dom';

import {GateHeader} from '../components/auth/GateHeader';

export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="mb-3 text-3xl">Page not found</h1>
      <p className="mb-8 text-sm text-muted">The page you requested does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />
      <div className="mx-auto mt-14 w-full max-w-md text-center">
        <p className="eyebrow mb-3">403</p>
        <h1 className="mb-3 text-3xl">Access denied</h1>
        <p className="mb-7 text-sm text-muted">
          Your account does not have permission to view this area.
        </p>
        <Link to="/home" className="btn btn-primary">
          Go to my account
        </Link>
      </div>
    </div>
  );
}
