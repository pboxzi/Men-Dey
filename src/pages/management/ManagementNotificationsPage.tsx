import {CheckCheck, Megaphone, Send} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {ListToolbar} from '../../components/ui/ListToolbar';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime} from '../../lib/format';
import {reportError} from '../../lib/errors';
import {notificationTypeLabel} from '../../lib/notification';
import {onRowInserted} from '../../lib/realtime';
import {supabase} from '../../lib/supabase';
import type {Notification} from '../../types';

type TypeTone = 'neutral' | 'info' | 'success' | 'danger' | 'gold';

const TYPE_TONES: Record<Notification['type'], TypeTone> = {
  new_message: 'info',
  request_update: 'gold',
  information_required: 'gold',
  membership_offer: 'gold',
  membership_accepted: 'success',
  payment_requested: 'gold',
  payment_received: 'success',
  membership_activated: 'success',
  experience_proposal: 'info',
  experience_confirmed: 'success',
  experience_scheduled: 'info',
  experience_cancelled: 'danger',
  document_uploaded: 'info',
  management_announcement: 'gold',
  system: 'neutral',
  info: 'info',
  request: 'gold',
  membership: 'gold',
  experience: 'success',
  account: 'neutral',
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
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [announceLink, setAnnounceLink] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementNotice, setAnnouncementNotice] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!me) return;
    if (!silent) setLoading(true);
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

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const stop = onRowInserted('notifications', refreshLive);
    return stop;
  }, [refreshLive]);

  const sendAnnouncement = useCallback(async () => {
    const title = announceTitle.trim();
    const body = announceBody.trim();
    if (!title || !body) return;
    setSendingAnnouncement(true);
    setAnnouncementError(null);
    setAnnouncementNotice(null);
    try {
      const {data, error: rpcError} = await supabase.rpc('send_announcement', {
        p_title: title,
        p_body: body,
        p_link: announceLink.trim() || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      const count = typeof data === 'number' ? data : 0;
      setAnnounceTitle('');
      setAnnounceBody('');
      setAnnounceLink('');
      setAnnouncementNotice(
        `Announcement sent to ${count} ${count === 1 ? 'member' : 'members'}.`,
      );
      await load();
    } catch (e) {
      setAnnouncementError(await reportError('management.announcement', e));
    } finally {
      setSendingAnnouncement(false);
    }
  }, [announceBody, announceLink, announceTitle, load]);

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
    <div className="space-y-6 sm:space-y-8">
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

      <section className="surface p-4 sm:p-6">
        <ListToolbar
          count={`${unreadCount} unread of ${rows.length}`}
          filter={{
            value: filter,
            onChange: (value) => setFilter(value as typeof filter),
            label: 'Notification status',
            options: (['all', 'unread'] as const).map((value) => ({
              value,
              label: value === 'all' ? 'All notifications' : 'Unread only',
            })),
          }}
        />

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
                  <span className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                    <span className="truncate text-sm font-medium text-charcoal">
                      {notification.title}
                    </span>
                    <Chip tone={TYPE_TONES[notification.type]}>
                      {notificationTypeLabel(notification.type)}
                    </Chip>
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

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Megaphone className="size-4 text-gold-deep" aria-hidden />
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Send an announcement
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Delivers a platform notification to every active member of the platform. Members see it
          on their notifications page and dashboard immediately.
        </p>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
            <input
              type="text"
              className="field-input"
              maxLength={140}
              value={announceTitle}
              onChange={(event) => setAnnounceTitle(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Message</span>
            <textarea
              className="field-input min-h-24 resize-y"
              rows={4}
              value={announceBody}
              onChange={(event) => setAnnounceBody(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Link (optional)
            </span>
            <input
              type="text"
              className="field-input"
              placeholder="/dashboard/membership"
              value={announceLink}
              onChange={(event) => setAnnounceLink(event.target.value)}
            />
          </label>
          {announcementError ? <Alert tone="error">{announcementError}</Alert> : null}
          {announcementNotice ? <Alert tone="success">{announcementNotice}</Alert> : null}
          <div className="flex justify-center sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => void sendAnnouncement()}
              loading={sendingAnnouncement}
              disabled={!announceTitle.trim() || !announceBody.trim()}
            >
              <Send className="size-4" aria-hidden /> Send announcement
            </Button>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted">
        Notifications for other parts of your account live in{' '}
        <Link to="/dashboard/notifications" className="text-gold-deep hover:underline py-3 sm:py-0">
          your dashboard
        </Link>
        .
      </p>
    </div>
  );
}
