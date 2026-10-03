import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchNewsBySlug } from '../services/content';
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

export default function NewsArticlePage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => fetchNewsBySlug(slug), [slug]);

  useSeo({
    title: data?.title ?? 'News',
    description: data?.excerpt ?? undefined,
    canonicalPath: `/news/${slug}`,
    type: 'article',
    noindex: true,
  });

  return (
    <article className="ed-shell pb-16" style={{ paddingTop: 'clamp(3rem,8vw,5.5rem)' }}>
      <Link to="/news" className="t-caption inline-flex items-center gap-2 transition-opacity hover:opacity-70">
        <ArrowLeft className="h-3.5 w-3.5" />
        All news
      </Link>

      {loading && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {error && (
        <div className="mt-8">
          <ErrorState title="This article could not be loaded" onRetry={reload} />
        </div>
      )}

      {!loading && !error && !data && (
        <div className="mt-8">
          <EmptyState
            title="Article not found"
            description="This article may have been unpublished or the address may be incorrect."
            action={
              <Link to="/news" className="t-caption underline t-accent">
                Back to all news
              </Link>
            }
          />
        </div>
      )}

      {!loading && !error && data && (
        <header className="mt-8 max-w-3xl">
          {formatDate(data.published_at) && <span className="t-meta">{formatDate(data.published_at)}</span>}
          <h1 className="t-h1 mt-3">{data.title}</h1>
          {data.excerpt && (
            <p className="t-body mt-5" style={{ fontSize: '1.15rem' }}>
              {data.excerpt}
            </p>
          )}
        </header>
      )}

      {!loading && !error && data?.cover_image_url && (
        <img
          src={data.cover_image_url}
          alt=""
          className="mt-8 h-64 w-full object-cover sm:h-[28rem]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      {!loading && !error && data && (
        <div className="ed-shell-narrow mt-10" style={{ paddingInline: 0 }}>
          {data.content ? (
            data.content.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="t-body mb-5">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="t-body-sm" style={{ color: 'var(--ed-muted)' }}>
              Full article content has not been published yet.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
