import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchNews } from '../services/content';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(iso),
    );
  } catch {
    return null;
  }
}

export default function NewsPage() {
  useSeo({
    title: 'News',
    description: 'News and official announcements from Gillian Anderson Management.',
    canonicalPath: '/news',
  });

  const { data, loading, error, reload } = useAsync(fetchNews, []);
  const items = data ?? [];
  const [featured, ...rest] = items;

  return (
    <>
      <section
        className="ed-shell"
        style={{ paddingTop: 'clamp(4rem,10vw,7rem)', paddingBottom: 'clamp(2.5rem,5vw,3.5rem)' }}
      >
        <span className="t-meta">News</span>
        <h1 className="t-h1 mt-3">Latest news</h1>
        <p className="t-body mt-5" style={{ maxWidth: '40rem' }}>
          Announcements and editorial updates published by the management office.
        </p>
      </section>

      <section className="ed-shell pb-16">
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-72 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        )}

        {error && <ErrorState title="News could not be loaded" onRetry={reload} />}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No news published yet"
            description="Official announcements will appear here as they are released by management."
          />
        )}

        {!loading && !error && items.length > 0 && featured && (
          <div className="space-y-12">
            <article className="ed-card">
              {featured.cover_image_url && (
                <img
                  src={featured.cover_image_url}
                  alt=""
                  className="ed-media h-64 sm:h-96"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-4">
                  {formatDate(featured.published_at) && (
                    <span className="t-meta">{formatDate(featured.published_at)}</span>
                  )}
                  {featured.is_featured && <span className="t-meta t-accent">Featured</span>}
                </div>
                <h2 className="t-h2 mt-3">
                  <Link to={`/news/${featured.slug}`} className="transition-opacity hover:opacity-70">
                    {featured.title}
                  </Link>
                </h2>
                {featured.excerpt && (
                  <p className="t-body mt-4" style={{ maxWidth: '46rem' }}>
                    {featured.excerpt}
                  </p>
                )}
                <Link to={`/news/${featured.slug}`} className="t-caption mt-5 inline-block underline t-accent">
                  Read the full article
                </Link>
              </div>
            </article>

            {rest.length > 0 && (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <li key={item.id} className="ed-card flex flex-col">
                    {item.cover_image_url && (
                      <img
                        src={item.cover_image_url}
                        alt=""
                        className="ed-media h-40"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {formatDate(item.published_at) && (
                        <span className="t-meta">{formatDate(item.published_at)}</span>
                      )}
                      <h3 className="t-h3 mt-2" style={{ fontSize: '1.2rem' }}>
                        <Link to={`/news/${item.slug}`} className="transition-opacity hover:opacity-70">
                          {item.title}
                        </Link>
                      </h3>
                      {item.excerpt && (
                        <p className="t-caption mt-2" style={{ color: 'var(--ed-muted)' }}>
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </>
  );
}
