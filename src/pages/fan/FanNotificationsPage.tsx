import { Bell } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { fetchAnnouncements, fetchMyNotifications, markNotificationRead } from '../../services/fan';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/States';
import Button from '../../components/ui/Button';

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

export default function FanNotificationsPage() {
  const { user } = useAuth();

  const notifications = useAsync(
    () => (user ? fetchMyNotifications(user.id) : Promise.resolve({ data: [], error: null })),
    [user?.id],
  );

  const announcements = useAsync(() => fetchAnnouncements(), []);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    notifications.reload();
  };

  const all = notifications.data ?? [];
  const unreadCount = all.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8">
      <header>
        <span className="t-meta">Fan Area</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
          Notifications
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
            : 'Updates sent to you by the management office.'}
        </p>
      </header>

      <section aria-labelledby="personal-notifications">
        <h2 id="personal-notifications" className="t-h2" style={{ fontSize: '1.3rem' }}>
          Sent to you
        </h2>
        <hr className="ed-rule-accent mt-3" />

        <div className="mt-5 space-y-3">
          {notifications.loading && (
            <div className="space-y-3">
              <Skeleton style={{ height: '4.5rem' }} />
              <Skeleton style={{ height: '4.5rem' }} />
            </div>
          )}
          {notifications.error && (
            <ErrorState title="Notifications unavailable" onRetry={notifications.reload} />
          )}
          {!notifications.loading && !notifications.error && all.length === 0 && (
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title="Nothing here yet"
              description="When management sends you an update, it will appear here."
            />
          )}

          {all.map((item) => (
            <article
              key={item.id}
              className="ed-card p-5"
              style={{
                borderColor: item.is_read ? 'var(--ed-line)' : 'var(--ed-accent)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                    {formatDateTime(item.created_at)}
                  </p>
                  <h3 className="t-h3 mt-1" style={{ fontSize: '1.05rem' }}>
                    {item.title}
                  </h3>
                  {item.message && (
                    <p className="t-body-sm mt-2" style={{ color: 'var(--ed-muted)' }}>
                      {item.message}
                    </p>
                  )}
                </div>
                {!item.is_read && (
                  <Button variant="secondary" size="sm" onClick={() => markRead(item.id)}>
                    Mark as read
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="office-announcements">
        <h2 id="office-announcements" className="t-h2" style={{ fontSize: '1.3rem' }}>
          Office announcements
        </h2>
        <hr className="ed-rule-accent mt-3" />

        <div className="mt-5 space-y-3">
          {announcements.loading && <LoadingState label="Loading announcements" />}
          {announcements.error && (
            <ErrorState title="Announcements unavailable" onRetry={announcements.reload} />
          )}
          {!announcements.loading && !announcements.error && (announcements.data?.length ?? 0) === 0 && (
            <EmptyState
              title="No announcements"
              description="General announcements from the management office will appear here."
            />
          )}
          {announcements.data?.map((item) => (
            <article key={item.id} className="ed-card p-5">
              <p className="t-body-sm">{item.text}</p>
              <p className="t-caption mt-2" style={{ color: 'var(--ed-muted)' }}>
                {item.notif_time || formatDateTime(item.created_at)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
