import {CheckCheck} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {Notification} from '../../types';

type TypeTone = 'neutral' | 'info' | 'success' | 'danger' | 'gold';

const TYPE_TONES: Record<Notification['type'], TypeTone> = {
  info: 'info',
  request: 'gold',
  membership: 'gold',
  experience: 'success',
  account: 'neutral',
  system: 'neutral',
};

export function ManagementNotificationsPage() {
  const {session} = useAuth();
  const me = session?.user.id ?? '';
  const navigate = useNavigate();

  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', me)
        .order('created_at', {ascending: false})
        .limit(100);
      if (resError) throw new Error(resError.message);
      setRows((data as Notification[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(
    async (notification: Notification) => {
      setActionError(null);
      try {
        const {error: updateError} = await supabase
          .from('notifications')
          .update({read_at: new Date().toISOString()})
          .eq('id', notification.id)
          .is('read_at', null);
        if (updateError) throw new Error(updateError.message);
        if (notification.link && notification.link.startsWith('/')) {
          navigate(notification.link);
        }
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not mark the notification read.');
      }
    },
    [load, navigate],
  );

  const markAllRead = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const {data, error: updateError} = await supabase
        .from('notifications')
        .update({read_at: new Date().toISOString()})
        .eq('user_id', me)
        .is('read_at', null)
        .select('id');
      if (updateError) throw new Error(updateError.message);
      if (!data || data.length === 0) {
        setNotice('Everything was already read.');
      } else {
        setNotice(`${data.length} notification${data.length === 1 ? '' : 's'} marked read.`);
      }
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update notifications.');
    } finally {
      setBusy(false);
    }
  }, [load, me]);

  if (loading) return <Spinner label="Loading notifications" />;

  const unreadCount = rows.filter((row) => !row.read_at).length;
  const visible = filter === 'unread' ? rows.filter((row) => !row.read_at) : rows;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        description="Everything the platform has flagged for your account."
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" loading={busy} onClick={() => void markAllRead()}>
              <CheckCheck className="size-4" aria-hidden /> Mark all as read
            </Button>
          ) : null
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className="surface p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`btn ${filter === value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            {unreadCount} unread of {rows.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? 'Nothing unread.' : 'You are all caught up.'}
            description="New notices appear here the moment the platform has something for you."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {visible.map((notification) => {
              const inner = (
                <>
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-charcoal">
                      {notification.title}
                    </span>
                    <Chip tone={TYPE_TONES[notification.type]}>{notification.type}</Chip>
                  </span>
                  {notification.body ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {notification.body}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {formatDateTime(notification.created_at)}
                  </span>
                </>
              );
              return (
                <li key={notification.id}>
                  {notification.read_at ? (
                    <div className="block py-3 opacity-70">{inner}</div>
                  ) : (
                    <button
                      type="button"
                      className="block w-full border-l-2 border-gold py-3 pl-3 text-left hover:bg-stone/40"
                      onClick={() => void markRead(notification)}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        Notifications for other parts of your account live in{' '}
        <Link to="/dashboard/notifications" className="text-gold-deep hover:underline">
          your dashboard
        </Link>
        .
      </p>
    </div>
  );
}
