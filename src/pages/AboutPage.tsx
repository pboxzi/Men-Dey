import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchFilmography, fetchLiteraryWorks } from '../services/content';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import Button from '../components/ui/Button';

const HERO_IMAGE = '/assets/images/gillian_hero_one_1783349664739.jpg';

export default function AboutPage() {
  useSeo({
    title: 'About',
    description:
      'About Gillian Anderson — career, selected work and professional representation by Gillian Anderson Management.',
    canonicalPath: '/about',
  });

  const filmography = useAsync(fetchFilmography, []);
  const works = useAsync(fetchLiteraryWorks, []);

  return (
    <>
      {/* Large visual */}
      <section className="relative overflow-hidden" style={{ background: '#14181B' }}>
        <img
          src={HERO_IMAGE}
          alt="Gillian Anderson"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'center 22%', opacity: 0.72 }}
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(20,24,27,.55) 0%, rgba(20,24,27,.35) 40%, rgba(20,24,27,.9) 100%)' }}
        />
        <div className="ed-shell relative" style={{ paddingTop: 'clamp(5rem,14vw,9rem)', paddingBottom: 'clamp(3rem,8vw,5rem)' }}>
          <span className="t-meta" style={{ color: 'rgba(255,255,255,.6)' }}>
            About
          </span>
          <h1 className="t-display mt-3" style={{ color: '#fff' }}>
            Gillian Anderson
          </h1>
        </div>
      </section>

      {/* Introduction */}
      <section className="ed-section">
        <div className="ed-shell grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <span className="t-meta">Introduction</span>
            <hr className="ed-rule-accent mt-4" />
          </div>
          <div className="space-y-6">
            <p className="t-h2" style={{ maxWidth: '40rem' }}>
              Actor, author and advocate working across television, film, theatre and the written
              word.
            </p>
            <p className="t-body" style={{ maxWidth: '42rem' }}>
              This is the official presence surrounding Gillian Anderson and her professional
              representation. It is maintained by Gillian's management office, which handles
              professional enquiries, appearances, media requests and communication with fans.
            </p>
            <p className="t-body" style={{ maxWidth: '42rem' }}>
              All representation, scheduling and approvals are handled directly by management.
              Nothing on this site implies personal contact with Gillian.
            </p>
          </div>
        </div>
      </section>

      <hr className="ed-rule ed-shell" />

      {/* Selected work — from database */}
      <section className="ed-section">
        <div className="ed-shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="t-meta">Selected Work</span>
              <h2 className="t-h2 mt-2">Credits</h2>
            </div>
          </div>

          {filmography.loading && (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {filmography.error && (
            <ErrorState
              title="Credits could not be loaded"
              description="Please try again in a moment."
              onRetry={filmography.reload}
            />
          )}

          {!filmography.loading && !filmography.error && (filmography.data?.length ?? 0) === 0 && (
            <EmptyState
              title="No credits published yet"
              description="Selected work will appear here once it is published."
            />
          )}

          {!filmography.loading && !filmography.error && (filmography.data?.length ?? 0) > 0 && (
            <ul className="divide-y" style={{ borderColor: 'var(--ed-line)' }}>
              {filmography.data!.map((credit) => (
                <li
                  key={credit.id}
                  className="grid grid-cols-1 gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6"
                  style={{ borderColor: 'var(--ed-line)', borderTop: '1px solid var(--ed-line)' }}
                >
                  <div>
                    <h3 className="t-h3">{credit.title}</h3>
                    {credit.role && (
                      <p className="t-caption mt-1">as {credit.role}</p>
                    )}
                    {credit.tagline && (
                      <p className="t-body-sm mt-2" style={{ maxWidth: '40rem' }}>
                        {credit.tagline}
                      </p>
                    )}
                  </div>
                  {credit.year != null && (
                    <span className="t-meta sm:text-right">{credit.year}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Written works */}
      <section className="ed-section" style={{ background: 'var(--ed-bg-alt)' }}>
        <div className="ed-shell">
          <span className="t-meta">Written Works</span>
          <h2 className="t-h2 mt-2 mb-8">Books &amp; writing</h2>

          {works.loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {works.error && (
            <ErrorState title="Works could not be loaded" onRetry={works.reload} />
          )}

          {!works.loading && !works.error && (works.data?.length ?? 0) === 0 && (
            <EmptyState
              title="No published works yet"
              description="Written works will appear here once published."
            />
          )}

          {!works.loading && !works.error && (works.data?.length ?? 0) > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {works.data!.map((work) => (
                <li key={work.id} className="ed-card p-5">
                  <h3 className="t-h3" style={{ fontSize: '1.1rem' }}>
                    {work.title}
                  </h3>
                  {work.vibe && <p className="t-caption mt-2">{work.vibe}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Management CTA */}
      <section className="ed-section">
        <div className="ed-shell-narrow text-center">
          <span className="t-meta">Representation</span>
          <h2 className="t-h2 mt-3">Contact Gillian's Management</h2>
          <p className="t-body mx-auto mt-4" style={{ maxWidth: '34rem' }}>
            For professional enquiries, appearances, media requests and partnerships, please
            contact the management office directly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/contact" variant="primary" size="lg">
              Contact Management
            </Button>
            <Button to="/fan-access" variant="secondary" size="lg">
              Fan Access
            </Button>
          </div>
          <p className="t-caption mt-6">
            Looking for your own area?{' '}
            <Link to="/fan" className="underline" style={{ color: 'var(--ed-accent)' }}>
              Visit the fan area
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
