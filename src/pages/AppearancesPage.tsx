import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchAppearances, type Appearance } from '../services/content';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import Button from '../components/ui/Button';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Evaluated once at module load so render stays pure. */
const NOW = Date.now();

export default function AppearancesPage() {
  useSeo({
    title: 'Appearances',
    description: 'Public appearances, events and engagements featuring Gillian Anderson.',
    canonicalPath: '/appearances',
  });

  const { data, loading, error, reload } = useAsync(fetchAppearances, []);
  const now = NOW;
  const upcoming = (data ?? []).filter((a) => new Date(a.start_date).getTime() >= now);
  const past = (data ?? []).filter((a) => new Date(a.start_date).getTime() < now);

  return (
    <>
      <section className="ed-shell" style={{ paddingTop: 'clamp(4rem,10vw,7rem)', paddingBottom: 'clamp(2.5rem,5vw,4rem)' }}>
        <span className="t-meta">Appearances</span>
        <h1 className="t-h1 mt-3">Public appearances &amp; engagements</h1>
        <p className="t-body mt-5" style={{ maxWidth: '40rem' }}>
          Approved public appearances and engagements. Private scheduling, availability and
          negotiation details are handled by management and are never published here.
        </p>
      </section>

      <section className="ed-shell pb-16">
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {error && (
          <ErrorState
            title="Appearances could not be loaded"
            description="Please try again in a moment."
            onRetry={reload}
          />
        )}

        {!loading && !error && (data?.length ?? 0) === 0 && (
          <EmptyState
            title="No appearances published"
            description="Upcoming public appearances will be listed here as they are confirmed by management."
            action={
              <Button to="/contact" variant="secondary" size="sm">
                Contact Management
              </Button>
            }
          />
        )}

        {!loading && !error && (data?.length ?? 0) > 0 && (
          <div className="space-y-14">
            {upcoming.length > 0 && (
              <div>
                <h2 className="t-h3 mb-6">Upcoming</h2>
                <ul className="grid gap-5 md:grid-cols-2">
                  {upcoming.map((item) => (
                    <AppearanceCard key={item.id} item={item} status="Upcoming" />
                  ))}
                </ul>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="t-h3 mb-6">Past</h2>
                <ul className="grid gap-5 md:grid-cols-2">
                  {past
                    .slice()
                    .reverse()
                    .map((item) => (
                      <AppearanceCard key={item.id} item={item} status="Past" />
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function AppearanceCard({ item, status }: { item: Appearance; status: 'Upcoming' | 'Past' }) {
  return (
    <li className="ed-card flex flex-col">
      {item.cover_image_url ? (
        <img
          src={item.cover_image_url}
          alt=""
          className="ed-media h-44"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-44 w-full" style={{ background: 'var(--ed-bg-alt)' }} aria-hidden="true" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="t-meta">{formatDate(item.start_date)}</span>
          <span
            className="t-meta"
            style={{ color: status === 'Upcoming' ? 'var(--ed-accent)' : 'var(--ed-muted)' }}
          >
            {status}
          </span>
        </div>

        <h3 className="t-h3 mt-3">{item.title}</h3>

        {item.location && (
          <p className="t-caption mt-2">{item.location}</p>
        )}

        {item.description && (
          <p className="t-body-sm mt-3" style={{ color: 'var(--ed-muted)' }}>
            {item.description}
          </p>
        )}
      </div>
    </li>
  );
}
