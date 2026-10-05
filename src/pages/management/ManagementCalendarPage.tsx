import {CalendarDays} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {Appointment, AvailabilityBlock, ExperienceSchedule} from '../../types';

const SCHEDULE_STATUS_LABELS: Record<ExperienceSchedule['status'], string> = {
  scheduled: 'Scheduled',
  changed: 'Changed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const SCHEDULE_STATUS_TONES: Record<
  ExperienceSchedule['status'],
  'info' | 'gold' | 'danger' | 'neutral'
> = {
  scheduled: 'info',
  changed: 'gold',
  cancelled: 'danger',
  completed: 'neutral',
};

interface DayGroup {
  date: string;
  entries: Array<{
    id: string;
    time: string;
    title: string;
    meta: string;
    label: string;
    tone: 'info' | 'gold' | 'danger' | 'neutral';
    href: string | null;
  }>;
}

export function ManagementCalendarPage() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [schedules, setSchedules] = useState<ExperienceSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({starts_at: '', ends_at: '', title: '', note: ''});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, schedulesRes, appointmentsRes] = await Promise.all([
        supabase.from('availability_blocks').select('*').order('starts_at', {ascending: true}).limit(100),
        supabase.from('experience_schedules').select('*').order('starts_at', {ascending: true}).limit(100),
        supabase.from('appointments').select('*').order('starts_at', {ascending: true}).limit(200),
      ]);
      const firstError = [blocksRes, schedulesRes, appointmentsRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setBlocks((blocksRes.data as AvailabilityBlock[]) ?? []);
      setSchedules((schedulesRes.data as ExperienceSchedule[]) ?? []);
      setAppointments((appointmentsRes.data as Appointment[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<string | void>) => {
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        const message = await fn();
        if (message) setNotice(message);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'The action could not be completed.');
      } finally {
        setBusy(false);
        setConfirmId(null);
      }
    },
    [load],
  );

  const createBlock = useCallback(
    () =>
      run(async () => {
        if (!form.title.trim()) throw new Error('A title is required.');
        if (!form.starts_at || !form.ends_at) throw new Error('Start and end are required.');
        if (new Date(form.ends_at) <= new Date(form.starts_at)) {
          throw new Error('The end must be after the start.');
        }
        const {error: insertError} = await supabase.from('availability_blocks').insert({
          title: form.title.trim(),
          kind: 'blocked',
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          timezone: 'UTC',
          note: form.note.trim() || null,
        });
        if (insertError) throw new Error(insertError.message);
        setForm({starts_at: '', ends_at: '', title: '', note: ''});
        return 'Availability blocked. It now appears as unavailable.';
      }),
    [form, run],
  );

  const cancelBlock = useCallback(
    (block: AvailabilityBlock) =>
      run(async () => {
        const {error: deleteError} = await supabase
          .from('availability_blocks')
          .delete()
          .eq('id', block.id);
        if (deleteError) throw new Error(deleteError.message);
        return 'Block removed. The time is available again.';
      }),
    [run],
  );

  const cancelSchedule = useCallback(
    (schedule: ExperienceSchedule) =>
      run(async () => {
        const {error: updateError} = await supabase
          .from('experience_schedules')
          .update({status: 'cancelled'})
          .eq('id', schedule.id);
        if (updateError) throw new Error(updateError.message);
        if (schedule.request_id) {
          const {error: appointmentError} = await supabase
            .from('appointments')
            .update({status: 'cancelled'})
            .eq('request_id', schedule.request_id)
            .neq('status', 'completed');
          if (appointmentError) throw new Error(appointmentError.message);
        }
        return 'Schedule cancelled. The member is notified.';
      }),
    [run],
  );

  if (loading) return <Spinner />;

  const dayGroups: DayGroup[] = (() => {
    const nowIso = new Date().toISOString();
    const grouped = new Map<string, DayGroup['entries']>();
    const push = (iso: string, entry: DayGroup['entries'][number]) => {
      const date = iso.slice(0, 10);
      const list = grouped.get(date) ?? [];
      list.push(entry);
      grouped.set(date, list);
    };

    for (const schedule of schedules) {
      push(schedule.starts_at, {
        id: `schedule-${schedule.id}`,
        time: schedule.starts_at.slice(11, 16),
        title: schedule.title,
        meta: `${schedule.location ?? schedule.virtual_link ?? 'No location yet'} · ${SCHEDULE_STATUS_LABELS[schedule.status]}`,
        label: SCHEDULE_STATUS_LABELS[schedule.status],
        tone: SCHEDULE_STATUS_TONES[schedule.status],
        href: schedule.request_id ? `/management/experiences/${schedule.request_id}` : null,
      });
    }
    for (const appointment of appointments) {
      if (appointment.ends_at < nowIso) continue;
      push(appointment.starts_at, {
        id: `appointment-${appointment.id}`,
        time: appointment.starts_at.slice(11, 16),
        title: appointment.title,
        meta: `${appointment.location ?? appointment.virtual_link ?? 'No location yet'} · ${appointment.status}`,
        label: appointment.status === 'no_show' ? 'No show' : appointment.status,
        tone:
          appointment.status === 'cancelled' || appointment.status === 'no_show'
            ? 'danger'
            : appointment.status === 'completed'
              ? 'neutral'
              : 'info',
        href: appointment.request_id ? `/management/experiences/${appointment.request_id}` : null,
      });
    }
    for (const block of blocks) {
      if (block.ends_at < nowIso) continue;
      push(block.starts_at, {
        id: `block-${block.id}`,
        time: block.starts_at.slice(11, 16),
        title: block.title || 'Blocked — unavailable',
        meta: `${formatDateTime(block.starts_at)} – ${formatDateTime(block.ends_at)}${block.note ? ` · ${block.note}` : ''}`,
        label: 'Blocked',
        tone: 'neutral',
        href: null,
      });
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => a.time.localeCompare(b.time)),
      }));
  })();

  const nowIso = new Date().toISOString();
  const upcomingBlocks = blocks.filter((block) => block.ends_at >= nowIso);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Calendar"
        title="Availability &amp; schedule"
        description="Block unavailable time, review experience schedules and see every booking by day."
        actions={
          <Link to="/management/bookings" className="btn btn-secondary">
            <CalendarDays className="size-4" aria-hidden /> Manage bookings
          </Link>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className="surface p-6">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Block availability
        </h2>
        <div className="grid gap-3 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
            <input
              className="field-input"
              placeholder="Press travel, private commitment…"
              value={form.title}
              onChange={(event) => setForm((prev) => ({...prev, title: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">From</span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm((prev) => ({...prev, starts_at: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">To</span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.ends_at}
              onChange={(event) => setForm((prev) => ({...prev, ends_at: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Note</span>
            <input
              className="field-input"
              placeholder="Optional internal note"
              value={form.note}
              onChange={(event) => setForm((prev) => ({...prev, note: event.target.value}))}
            />
          </label>
          <div className="sm:col-span-2">
            <Button onClick={() => void createBlock()} loading={busy}>
              Block time
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-xs uppercase tracking-widest text-muted">Upcoming blocks</h3>
          {upcomingBlocks.length === 0 ? (
            <p className="text-sm text-muted">No blocked time scheduled.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {upcomingBlocks.map((block) => (
                <li key={block.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">{block.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(block.starts_at)} – {formatDateTime(block.ends_at)}
                      {block.note ? ` · ${block.note}` : ''}
                    </p>
                  </div>
                  {confirmId === `block-${block.id}` ? (
                    <div className="flex gap-2">
                      <Button variant="ghost" disabled={busy} onClick={() => setConfirmId(null)}>
                        Keep block
                      </Button>
                      <Button
                        variant="secondary"
                        loading={busy}
                        onClick={() => void cancelBlock(block)}
                      >
                        Yes, remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmId(`block-${block.id}`)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Schedule
        </h2>
        {dayGroups.length === 0 ? (
          <EmptyState
            title="Nothing scheduled."
            description="Confirmed experiences are scheduled from the experience detail page."
          />
        ) : (
          <div className="space-y-8">
            {dayGroups.map((group) => (
              <div key={group.date}>
                <p className="mb-3 text-xs uppercase tracking-widest text-muted">
                  {formatDate(group.date)}
                </p>
                <ul className="divide-y divide-stone border-t border-stone">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-baseline gap-3">
                        <span className="text-sm tabular-nums text-muted">{entry.time}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-charcoal">{entry.title}</p>
                          <p className="text-xs text-muted">{entry.meta}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip tone={entry.tone}>{entry.label}</Chip>
                        {entry.href ? (
                          <Link to={entry.href} className="text-xs font-medium text-gold-deep underline underline-offset-2">
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  {group.entries
                    .filter((entry) => entry.id.startsWith('schedule-'))
                    .map((entry) => entry.id.replace('schedule-', ''))
                    .map((scheduleId) => {
                      const schedule = schedules.find((row) => row.id === scheduleId);
                      if (!schedule || schedule.status === 'cancelled') return null;
                      return confirmId === `schedule-${schedule.id}` ? (
                        <div key={schedule.id} className="flex gap-2">
                          <Button variant="ghost" disabled={busy} onClick={() => setConfirmId(null)}>
                            Keep schedule
                          </Button>
                          <Button
                            variant="secondary"
                            loading={busy}
                            onClick={() => void cancelSchedule(schedule)}
                          >
                            Yes, cancel schedule
                          </Button>
                        </div>
                      ) : (
                        <Button
                          key={schedule.id}
                          variant="ghost"
                          disabled={busy}
                          onClick={() => setConfirmId(`schedule-${schedule.id}`)}
                        >
                          Cancel “{schedule.title}”
                        </Button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
