import {ArrowLeft, ArrowUpRight} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';

import {notificationIcon} from '../../../lib/notification';
import {Chip} from '../../../components/ui/Chip';
import {FullPageLoader} from '../../../components/ui/FullPageLoader';
import {formatDateTime} from '../../../lib/format';
import {onRowInserted} from '../../../lib/realtime';
import {supabase} from '../../../lib/supabase';
import type {Notification} from '../../../types';
import {ErrorNote} from '../components/SectionCard';

const TYPE_LABELS: Record<Notification['type'], string> = {
  info: 'Information',
  request: 'Request',
  membership: 'Membership',
  experience: 'Experience',
  account: 'Account',
  system: 'Platform',
};

export function NotificationDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (resError) throw new Error(resError.message);
      if (!data) throw new Error('This notification could not be found.');
      const row = data as Notification;
      setNotification(row);
      if (!row.read_at) {
        const {error: updateError} = await supabase
          .from('notifications')
          .update({read_at: new Date().toISOString()})
          .eq('id', row.id);
        if (!updateError) setNotification({...row, read_at: new Date().toISOString()});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this notification.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => onRowInserted('notifications', () => void load()), [load]);

  if (loading) return <FullPageLoader />;

  if (error || !notification) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/notifications" className="nav-link inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Notifications
        </Link>
        <ErrorNote message={error ?? 'Notification not found.'} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/dashboard/notifications" className="nav-link inline-flex items-center gap-1">
        <ArrowLeft className="size-4" aria-hidden /> Notifications
      </Link>

      <article className="surface p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            {notificationIcon(notification.type)}
          </span>
          <Chip tone="neutral">{TYPE_LABELS[notification.type]}</Chip>
        </div>
        <h1 className="text-2xl md:text-3xl">{notification.title}</h1>
        <p className="mt-1 text-sm text-muted">{formatDateTime(notification.created_at)}</p>
        {notification.body ? (
          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink">{notification.body}</p>
        ) : null}
        <p className="mt-6 border-t border-stone pt-4 text-xs uppercase tracking-[0.18em] text-muted">
          Gillian Anderson Management
        </p>
      </article>

      <div className="flex flex-wrap gap-3">
        {notification.link ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate(notification.link!)}>
            Open related page
            <ArrowUpRight className="size-4" aria-hidden />
          </button>
        ) : null}
        <Link to="/dashboard/notifications" className="btn btn-secondary">
          Back to notifications
        </Link>
      </div>
    </div>
  );
}
