import {BellRing} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {notificationIcon} from '../../../lib/notification';
import {Spinner} from '../../../components/ui/Spinner';
import {relativeTime} from '../../../lib/format';
import {onRowInserted} from '../../../lib/realtime';
import {supabase} from '../../../lib/supabase';
import type {Notification} from '../../../types';
import {EmptyNote, ErrorNote, SectionCard} from '../components/SectionCard';

export function NotificationsListPage() {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnread, setShowUnread] = useState(false);
  const [marking, setMarking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setRows((data as Notification[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => onRowInserted('notifications', () => void load()), [load]);

  const markAllRead = useCallback(async () => {
    setMarking(true);
    setActionError(null);
    try {
      const {error: updateError} = await supabase
        .from('notifications')
        .update({read_at: new Date().toISOString()})
        .is('read_at', null);
      if (updateError) throw new Error(updateError.message);
      setRows((prev) => prev.map((row) => ({...row, read_at: row.read_at ?? new Date().toISOString()})));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update notifications.');
    } finally {
      setMarking(false);
    }
  }, []);

  const unread = rows.filter((row) => !row.read_at);
  const visible = showUnread ? unread : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="eyebrow mb-2">Notifications</p>
          <h1 className="text-3xl md:text-4xl">Updates for you</h1>
          <p className="mt-2 text-muted">
            News about your requests, membership and experiences — always through management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-deep">
            {unread.length} unread
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={marking || unread.length === 0}
            onClick={() => void markAllRead()}
          >
            {marking ? <Spinner /> : null}
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex gap-1.5" role="group" aria-label="Filter notifications">
        {[
          {key: false, label: 'All'},
          {key: true, label: 'Unread'},
        ].map((option) => (
          <button
            key={String(option.key)}
            type="button"
            onClick={() => setShowUnread(option.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${
              showUnread === option.key
                ? 'border-charcoal bg-charcoal text-alabaster'
                : 'border-stone bg-white text-muted hover:border-gold'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {actionError ? <ErrorNote message={actionError} /> : null}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : visible.length === 0 ? (
        <EmptyNote
          title={showUnread ? 'Nothing unread.' : 'You’re up to date.'}
          description={
            showUnread
              ? 'All of your notifications have been read.'
              : 'Notifications about your requests, membership and experiences will appear here.'
          }
        />
      ) : (
        <SectionCard title={showUnread ? 'Unread' : 'All notifications'}>
          <ul className="divide-y divide-stone">
            {visible.map((notification) => (
              <li key={notification.id}>
                <Link
                  to={`/dashboard/notifications/${notification.id}`}
                  className="flex items-start gap-3 py-4 transition-colors hover:bg-stone/40"
                >
                  <span
                    className={`mt-0.5 flex size-9 items-center justify-center rounded-full ${
                      notification.read_at ? 'bg-stone text-muted' : 'bg-gold/15 text-gold-deep'
                    }`}
                  >
                    {notificationIcon(notification.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-charcoal">{notification.title}</span>
                      {notification.read_at ? null : (
                        <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-label="Unread" />
                      )}
                    </span>
                    {notification.body ? (
                      <span className="mt-0.5 block truncate text-sm text-muted">{notification.body}</span>
                    ) : null}
                    <span className="mt-1 block text-xs text-muted">{relativeTime(notification.created_at)}</span>
                  </span>
                  {notification.link ? (
                    <BellRing className="mt-1 size-3.5 shrink-0 text-gold-deep" aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
