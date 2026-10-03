import { Link } from 'react-router-dom';
import { Bell, FileText, MessageSquare, UserCog, Megaphone } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { fetchAnnouncements } from '../../services/fan';
import { fetchNews } from '../../services/content';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/States';
import Button from '../../components/ui/Button';

const QUICK_LINKS = [
  { to: '/fan/messages', icon: MessageSquare, label: 'Messages', hint: 'Your conversation with management' },
  { to: '/fan/requests', icon: FileText, label: 'Requests', hint: 'Submit and track a personal request' },
  { to: '/fan/notifications', icon: Bell, label: 'Notifications', hint: 'Updates from the management office' },
  { to: '/fan/profile', icon: UserCog, label: 'Profile', hint: 'Your details and preferences' },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function FanHomePage() {
  const { user, profile } = useAuth();
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const announcements = useAsync(() => fetchAnnouncements(), []);
  const news = useAsync(async () => {
    const res = await fetchNews();
    return { data: res.data ? res.data.slice(0, 3) : [], error: res.error };
  }, []);

  return (
    <div className="space-y-10">
      <header>
        <span className="t-meta">Your Fan Area</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
          Good to see you, {firstName}.
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
          Everything you send here goes to Gillian’s management office. Replies and updates appear
          in this area.
        </p>
      </header>

      {/* Quick links */}
      <section aria-label="Fan area sections">
        <div className="grid gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="ed-card group flex items-start gap-4 p-5 transition-colors"
                style={{ borderColor: 'var(--ed-line)' }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="t-h3 block" style={{ fontSize: '1.05rem' }}>
                    {item.label}
                  </span>
                  <span className="t-body-sm mt-1 block" style={{ color: 'var(--ed-muted)' }}>
                    {item.hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* From the management office */}
      <section aria-labelledby="fan-announcements">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="fan-announcements" className="t-h2" style={{ fontSize: '1.35rem' }}>
            From the management office
          </h2>
        </div>
        <hr className="ed-rule-accent mt-3" />

        <div className="mt-5 space-y-3">
          {announcements.loading && <LoadingState label="Loading announcements" />}
          {announcements.error && (
            <ErrorState title="Announcements unavailable" onRetry={announcements.reload} />
          )}
          {!announcements.loading && !announcements.error && announcements.data?.length === 0 && (
            <EmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title="No announcements yet"
              description="Official updates from the management office will appear here."
            />
          )}
          {announcements.data?.map((item) => (
            <article key={item.id} className="ed-card p-5">
              <p className="t-body-sm">{item.text}</p>
              <p className="t-caption mt-2" style={{ color: 'var(--ed-muted)' }}>
                {item.notif_time || formatDate(item.created_at)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Latest news */}
      <section aria-labelledby="fan-news">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="fan-news" className="t-h2" style={{ fontSize: '1.35rem' }}>
            Latest news
          </h2>
          <Link to="/news" className="text-[13px] underline t-accent">
            All news
          </Link>
        </div>
        <hr className="ed-rule-accent mt-3" />

        <div className="mt-5 space-y-3">
          {news.loading && (
            <div className="space-y-3">
              <Skeleton style={{ height: '5rem' }} />
              <Skeleton style={{ height: '5rem' }} />
            </div>
          )}
          {news.error && <ErrorState title="News unavailable" onRetry={news.reload} />}
          {!news.loading && !news.error && news.data?.length === 0 && (
            <EmptyState
              title="No news published yet"
              description="Announcements and articles from the management office will appear here."
            />
          )}
          {news.data?.map((item) => (
            <article key={item.id} className="ed-card p-5">
              <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                {formatDate(item.published_at)}
              </p>
              <h3 className="t-h3 mt-1" style={{ fontSize: '1.05rem' }}>
                <Link to={`/news/${item.slug}`} className="transition-opacity hover:opacity-70">
                  {item.title}
                </Link>
              </h3>
              {item.excerpt && (
                <p className="t-body-sm mt-2" style={{ color: 'var(--ed-muted)' }}>
                  {item.excerpt}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Account footer */}
      <section className="ed-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="t-h3">Need something else?</h2>
          <p className="t-body-sm mt-1" style={{ color: 'var(--ed-muted)' }}>
            For professional, media or event enquiries, the contact form reaches the office
            directly.
          </p>
        </div>
        <Button to="/contact" variant="secondary">
          Contact Management
        </Button>
      </section>
    </div>
  );
}
