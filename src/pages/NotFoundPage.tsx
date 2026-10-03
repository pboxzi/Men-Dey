import { useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  const location = useLocation();
  useSeo({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    canonicalPath: location.pathname,
    noindex: true,
  });

  return (
    <section className="ed-shell ed-section flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span className="t-meta">404</span>
      <h1 className="t-h1 mt-4" style={{ fontSize: 'clamp(1.8rem,4vw,2.75rem)' }}>
        This page does not exist
      </h1>
      <p className="t-body-sm mx-auto mt-4" style={{ maxWidth: '30rem' }}>
        The address may be out of date, or the page may have moved. Everything on the site is
        reachable from the homepage.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/" variant="primary" size="lg">
          Back to Homepage
        </Button>
        <Button to="/news" variant="secondary" size="lg">
          Latest News
        </Button>
      </div>
    </section>
  );
}
