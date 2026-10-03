import { useAsync } from '../../hooks/useAsync';
import { fetchAdminOverview } from '../../services/admin';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/States';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminHomePage() {
  const { data, loading, error, reload } = useAsync(fetchAdminOverview, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingState label="Loading the office overview" />
        <Skeleton style={{ height: '7rem' }} />
        <Skeleton style={{ height: '14rem' }} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Overview unavailable" description={error} onRetry={reload} />;
  }

  const stats = [
    { label: 'New enquiries', value: data?.newInquiryCount ?? 0 },
    { label: 'Requests open', value: data?.openRequestCount ?? 0 },
    { label: 'Conversations', value: data?.conversations.length ?? 0 },
    { label: 'Published news', value: data?.publishedNews ?? 0 },
    { label: 'Published appearances', value: data?.publishedEvents ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="t-meta">Management Office</span>
          <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
            Overview
          </h1>
          <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
            Everything arriving from the public site, live from the database.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      {/* Stats */}
      <section aria-label="Counts">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="ed-card p-5">
              <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                {stat.label}
              </p>
              <p className="t-h2 mt-2" style={{ fontSize: '1.75rem' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Enquiries */}
        <section aria-labelledby="admin-inquiries">
          <h2 id="admin-inquiries" className="t-h2" style={{ fontSize: '1.3rem' }}>
            Recent enquiries
          </h2>
          <hr className="ed-rule-accent mt-3" />
          <div className="mt-4 space-y-3">
            {(data?.inquiries.length ?? 0) === 0 ? (
              <EmptyState
                title="No enquiries yet"
                description="Submissions from the contact page will appear here."
              />
            ) : (
              data?.inquiries.map((item) => (
                <article key={item.id} className="ed-card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="t-h3" style={{ fontSize: '1rem' }}>
                      {item.subject}
                    </h3>
                    <span className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="t-caption mt-1" style={{ color: 'var(--ed-muted)' }}>
                    {item.name} · {item.email} · {item.status || 'new'}
                  </p>
                  {item.message && (
                    <p className="t-body-sm mt-2" style={{ color: 'var(--ed-ink-soft)' }}>
                      {item.message.length > 180 ? `${item.message.slice(0, 180)}…` : item.message}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Requests */}
        <section aria-labelledby="admin-requests">
          <h2 id="admin-requests" className="t-h2" style={{ fontSize: '1.3rem' }}>
            Recent fan requests
          </h2>
          <hr className="ed-rule-accent mt-3" />
          <div className="mt-4 space-y-3">
            {(data?.requests.length ?? 0) === 0 ? (
              <EmptyState
                title="No requests yet"
                description="Requests submitted from fan accounts will appear here."
              />
            ) : (
              data?.requests.map((item) => (
                <article key={item.id} className="ed-card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="t-h3" style={{ fontSize: '1rem' }}>
                      {item.subject || 'Untitled request'}
                    </h3>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ borderColor: 'var(--ed-line-strong)', color: 'var(--ed-accent-strong)' }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="t-caption mt-1" style={{ color: 'var(--ed-muted)' }}>
                    {item.reference_number || item.id.slice(0, 8)} · {item.type} · {item.name} ·{' '}
                    {formatDateTime(item.created_at)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Conversations */}
        <section aria-labelledby="admin-conversations" className="lg:col-span-2">
          <h2 id="admin-conversations" className="t-h2" style={{ fontSize: '1.3rem' }}>
            Active conversations
          </h2>
          <hr className="ed-rule-accent mt-3" />
          <div className="mt-4 space-y-3">
            {(data?.conversations.length ?? 0) === 0 ? (
              <EmptyState
                title="No conversations yet"
                description="Threads started by fans in their private area will appear here."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data?.conversations.map((item) => (
                  <article key={item.id} className="ed-card p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="t-h3" style={{ fontSize: '1rem' }}>
                        {item.subject || 'Conversation'}
                      </h3>
                      <span className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                        {item.status}
                      </span>
                    </div>
                    <p className="t-caption mt-1" style={{ color: 'var(--ed-muted)' }}>
                      Last activity {formatDateTime(item.last_message_at || item.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
