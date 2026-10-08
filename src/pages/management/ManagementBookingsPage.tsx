import {CalendarDays} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime, relativeTime} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {Appointment} from '../../types';

interface AppointmentRow extends Appointment {
  user?: {email: string | null; full_name: string | null} | null;
  request?: {title: string | null} | null;
}

const APPOINTMENT_STATUS_LABELS: Record<Appointment['status'], string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No show',
};

const APPOINTMENT_STATUS_TONES: Record<Appointment['status'], 'neutral' | 'success' | 'danger' | 'gold' | 'info'> = {
  scheduled: 'info',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'neutral',
  no_show: 'danger',
};

const FILTERS: Array<{value: 'upcoming' | 'past' | Appointment['status']; label: string}> = [
  {value: 'upcoming', label: 'Upcoming'},
  {value: 'past', label: 'Past'},
  {value: 'scheduled', label: 'Scheduled'},
  {value: 'confirmed', label: 'Confirmed'},
  {value: 'completed', label: 'Completed'},
  {value: 'cancelled', label: 'Cancelled'},
  {value: 'no_show', label: 'No show'},
];

function memberLabel(row: AppointmentRow): string {
  return row.user?.full_name || row.user?.email || (row.user_id ? row.user_id.slice(0, 8) : 'No member');
}

export function ManagementBookingsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [filter, setFilter] = useState<'upcoming' | 'past' | Appointment['status']>('upcoming');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: loadError} = await supabase
        .from('appointments')
        .select(
          '*, user:profiles!appointments_user_id_fkey(full_name, email), request:requests(title)',
        )
        .order('starts_at', {ascending: true})
        .limit(200);
      if (loadError) throw new Error(loadError.message);
      setAppointments((data as AppointmentRow[]) ?? []);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = useCallback(
    (appointment: AppointmentRow, next: Appointment['status'], message: string) => {
      setBusy(true);
      setActionError(null);
      setNotice(null);
      void (async () => {
        try {
          const {error: updateError} = await supabase
            .from('appointments')
            .update({status: next})
            .eq('id', appointment.id);
          if (updateError) throw new Error(updateError.message);
          setNotice(message);
          await load();
        } catch (e) {
          setActionError(e instanceof Error ? e.message : 'The action could not be completed.');
        } finally {
          setBusy(false);
          setConfirmId(null);
        }
      })();
    },
    [load],
  );

  const rows = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    if (filter === 'upcoming') {
      return sorted.filter(
        (row) => new Date(row.starts_at).getTime() >= now && !['cancelled'].includes(row.status),
      );
    }
    if (filter === 'past') {
      return sorted.filter(
        (row) => new Date(row.starts_at).getTime() < now || row.status === 'cancelled',
      );
    }
    return sorted.filter((row) => row.status === filter);
  }, [appointments, filter, now]);

  if (loading) return <Spinner />;

  const renderStatusActions = (row: AppointmentRow) => (
    <>
      {row.status === 'scheduled' ? (
        <Button
          variant="secondary"
          loading={busy}
          onClick={() => setStatus(row, 'confirmed', 'Appointment confirmed.')}
        >
          Confirm
        </Button>
      ) : null}
      {row.status === 'scheduled' || row.status === 'confirmed' ? (
        <Button
          variant="secondary"
          loading={busy}
          onClick={() => setStatus(row, 'completed', 'Appointment completed.')}
        >
          Complete
        </Button>
      ) : null}
      {row.status === 'scheduled' || row.status === 'confirmed' ? (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => setConfirmId(confirmId === row.id ? null : row.id)}
        >
          Cancel
        </Button>
      ) : null}
      {row.status === 'scheduled' || row.status === 'confirmed' ? (
        <Button
          variant="ghost"
          loading={busy}
          onClick={() => setStatus(row, 'no_show', 'Marked as no show.')}
        >
          No show
        </Button>
      ) : null}
    </>
  );

  const renderCancelConfirm = (row: AppointmentRow) =>
    confirmId === row.id ? (
      <div className="mt-3 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm">
        <p className="text-danger">
          Cancel “{row.title}”? The member is notified of the cancellation.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmId(null)}>
            Keep booking
          </Button>
          <Button
            variant="secondary"
            loading={busy}
            onClick={() => setStatus(row, 'cancelled', 'Appointment cancelled.')}
          >
            Yes, cancel booking
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Calendar"
        title="Bookings"
        description="Every scheduled experience appointment, with its member, request and status."
        actions={
          <Link to="/management/calendar" className="btn btn-secondary">
            <CalendarDays className="size-4" aria-hidden /> Availability &amp; schedule
          </Link>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`btn ${filter === option.value ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={filter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="surface p-4 sm:p-6">
        {rows.length === 0 ? (
          <EmptyState
            title="No bookings here."
            description="Appointments appear when management schedules a confirmed experience."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {rows.map((row) => (
                  <li key={row.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal">{row.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {memberLabel(row)}
                          {row.request?.title ? ` · ${row.request.title}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {formatDateTime(row.starts_at)} – {formatDateTime(row.ends_at)}
                          {row.timezone ? ` (${row.timezone})` : ''} · {relativeTime(row.starts_at)}
                        </p>
                        {row.location || row.virtual_link ? (
                          <p className="mt-1 text-xs text-muted">
                            {row.location ?? ''}
                            {row.location && row.virtual_link ? ' · ' : ''}
                            {row.virtual_link ?? ''}
                          </p>
                        ) : null}
                        {row.request_id ? (
                          <Link
                            to={`/management/experiences/${row.request_id}`}
                            className="mt-1 inline-block text-xs font-medium text-gold-deep underline underline-offset-2 py-3.5 sm:py-0"
                          >
                            Open request
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={APPOINTMENT_STATUS_TONES[row.status]}>
                          {APPOINTMENT_STATUS_LABELS[row.status]}
                        </Chip>
                        {renderStatusActions(row)}
                      </div>
                    </div>
                    {renderCancelConfirm(row)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white border border-[#EAE4DA] rounded-lg p-4 space-y-1.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                      {row.title}
                    </span>
                    <span className="shrink-0">
                      <Chip tone={APPOINTMENT_STATUS_TONES[row.status]}>
                        {APPOINTMENT_STATUS_LABELS[row.status]}
                      </Chip>
                    </span>
                  </div>
                  <p className="break-words text-xs text-muted">
                    {memberLabel(row)}
                    {row.request?.title ? ` · ${row.request.title}` : ''}
                  </p>
                  <p className="break-words text-xs text-muted">
                    {formatDateTime(row.starts_at)} – {formatDateTime(row.ends_at)}
                    {row.timezone ? ` (${row.timezone})` : ''} · {relativeTime(row.starts_at)}
                  </p>
                  {row.location || row.virtual_link ? (
                    <p className="break-words text-xs text-muted">
                      {row.location ?? ''}
                      {row.location && row.virtual_link ? ' · ' : ''}
                      {row.virtual_link ?? ''}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">{renderStatusActions(row)}</div>
                  {renderCancelConfirm(row)}
                  {row.request_id ? (
                    <Link
                      to={`/management/experiences/${row.request_id}`}
                      className="flex items-center justify-between min-h-11 border-t border-[#EAE4DA] pt-2 text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-gold"
                    >
                      <span>Open request</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
