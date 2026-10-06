import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {useLiveRefresh} from '../../hooks/useLiveRefresh';
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

type View = 'day' | 'week' | 'month';
type Tone = 'info' | 'gold' | 'danger' | 'neutral';

interface CalendarEntry {
  id: string;
  iso: string;
  title: string;
  meta: string;
  label: string;
  tone: Tone;
  href: string | null;
  scheduleId?: string;
}

const WEEKDAY_LONG = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function keyFromIso(iso: string): string {
  return localDayKey(new Date(iso));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

function sameDay(a: Date, b: Date): boolean {
  return localDayKey(a) === localDayKey(b);
}

function timezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local time';
  }
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

  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const tz = timezoneLabel();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [blocksRes, schedulesRes, appointmentsRes] = await Promise.all([
        supabase.from('availability_blocks').select('*').order('starts_at', {ascending: true}).limit(200),
        supabase.from('experience_schedules').select('*').order('starts_at', {ascending: true}).limit(200),
        supabase.from('appointments').select('*').order('starts_at', {ascending: true}).limit(200),
      ]);
      const firstError = [blocksRes, schedulesRes, appointmentsRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setBlocks((blocksRes.data as AvailabilityBlock[]) ?? []);
      setSchedules((schedulesRes.data as ExperienceSchedule[]) ?? []);
      setAppointments((appointmentsRes.data as Appointment[]) ?? []);
      setNowMs(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);
  useLiveRefresh(refreshLive, ['experience_schedules', 'appointments']);

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
        const startsAt = new Date(form.starts_at);
        const endsAt = new Date(form.ends_at);
        if (endsAt <= startsAt) throw new Error('The end must be after the start.');
        const {error: insertError} = await supabase.from('availability_blocks').insert({
          title: form.title.trim(),
          kind: 'blocked',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          timezone: tz,
          note: form.note.trim() || null,
        });
        if (insertError) throw new Error(insertError.message);
        setForm({starts_at: '', ends_at: '', title: '', note: ''});
        return 'Availability blocked. It now appears as unavailable.';
      }),
    [form, run, tz],
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

  if (loading) return <Spinner label="Loading the calendar" />;

  const entriesByDay = new Map<string, CalendarEntry[]>();
  const push = (iso: string, entry: CalendarEntry) => {
    const key = keyFromIso(iso);
    const list = entriesByDay.get(key) ?? [];
    list.push(entry);
    entriesByDay.set(key, list);
  };

  for (const schedule of schedules) {
    push(schedule.starts_at, {
      id: `schedule-${schedule.id}`,
      iso: schedule.starts_at,
      title: schedule.title,
      meta: `${schedule.location ?? schedule.virtual_link ?? 'No location yet'} · ${SCHEDULE_STATUS_LABELS[schedule.status]}`,
      label: SCHEDULE_STATUS_LABELS[schedule.status],
      tone: SCHEDULE_STATUS_TONES[schedule.status],
      href: schedule.request_id ? `/management/experiences/${schedule.request_id}` : null,
      scheduleId: schedule.id,
    });
  }
  for (const appointment of appointments) {
    push(appointment.starts_at, {
      id: `appointment-${appointment.id}`,
      iso: appointment.starts_at,
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
    push(block.starts_at, {
      id: `block-${block.id}`,
      iso: block.starts_at,
      title: block.title || 'Blocked — unavailable',
      meta: `${formatDateTime(block.starts_at)} – ${formatDateTime(block.ends_at)}${block.note ? ` · ${block.note}` : ''}`,
      label: 'Blocked',
      tone: 'neutral',
      href: null,
    });
  }

  for (const list of entriesByDay.values()) {
    list.sort((a, b) => a.iso.localeCompare(b.iso));
  }

  const today = new Date(nowMs);
  const todayKey = localDayKey(today);

  const rangeStart = view === 'day' ? cursor : view === 'week' ? startOfWeek(cursor) : new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const rangeEnd =
    view === 'day'
      ? addDays(cursor, 1)
      : view === 'week'
        ? addDays(startOfWeek(cursor), 7)
        : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const monthCells: Date[] = [];
  if (view === 'month') {
    const gridStart = startOfWeek(rangeStart);
    for (let i = 0; i < 42; i += 1) monthCells.push(addDays(gridStart, i));
  }
  const weekDays: Date[] = [];
  if (view === 'week') {
    const weekStart = startOfWeek(cursor);
    for (let i = 0; i < 7; i += 1) weekDays.push(addDays(weekStart, i));
  }

  const heading =
    view === 'day'
      ? cursor.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
      : view === 'week'
        ? `${rangeStart.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} – ${addDays(rangeStart, 6).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}`
        : cursor.toLocaleDateString('en-GB', {month: 'long', year: 'numeric'});

  const step = (direction: -1 | 1) => {
    if (view === 'day') setCursor((prev) => addDays(prev, direction));
    else if (view === 'week') setCursor((prev) => addDays(prev, direction * 7));
    else setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const dayEntries = (key: string) => entriesByDay.get(key) ?? [];

  const entryRow = (entry: CalendarEntry) => (
    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="text-sm tabular-nums text-muted">{entry.iso.slice(11, 16)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-charcoal">{entry.title}</p>
          <p className="truncate text-xs text-muted">{entry.meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Chip tone={entry.tone}>{entry.label}</Chip>
        {entry.href ? (
          <Link
            to={entry.href}
            className="text-xs font-medium text-gold-deep underline underline-offset-2"
          >
            Open
          </Link>
        ) : null}
      </div>
    </li>
  );

  const dayBlock = (key: string, compact: boolean) => {
    const entries = dayEntries(key);
    if (entries.length === 0) {
      return compact ? null : (
        <p className="py-3 text-sm text-muted">Nothing scheduled on this day.</p>
      );
    }
    if (compact) {
      return (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[11px] tabular-nums text-muted">{entry.iso.slice(11, 16)}</span>
                <span
                  className={`truncate text-[11px] ${
                    entry.tone === 'danger'
                      ? 'text-red-700'
                      : entry.tone === 'gold'
                        ? 'text-gold-deep'
                        : 'text-charcoal'
                  }`}
                >
                  {entry.title}
                </span>
              </span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ul className="divide-y divide-stone border-t border-stone">{entries.map(entryRow)}</ul>
    );
  };

  const nowIso = new Date(nowMs).toISOString();
  const upcomingBlocks = blocks.filter((block) => block.ends_at >= nowIso);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Calendar"
        title="Availability & schedule"
        description={`Block unavailable time, review experience schedules and see every booking — shown in ${tz}.`}
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
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              From ({tz})
            </span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm((prev) => ({...prev, starts_at: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              To ({tz})
            </span>
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

      <section className="surface p-6" aria-label="Schedule calendar">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`btn ${view === value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setView(value)}
              >
                {value === 'day' ? 'Day' : value === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <span className="min-w-40 text-center text-sm font-medium text-charcoal">
              {heading}
            </span>
            <Button variant="ghost" onClick={() => step(1)} aria-label="Next">
              <ChevronRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
            >
              Today
            </Button>
          </div>
        </div>

        {view === 'day' ? (
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">
              {formatDate(localDayKey(cursor))}
              {localDayKey(cursor) === todayKey ? ' · today' : ''}
            </p>
            {dayEntries(localDayKey(cursor)).length === 0 ? (
              <EmptyState
                title="Nothing scheduled."
                description="Confirmed experiences are scheduled from the experience detail page."
              />
            ) : (
              <>
                {dayBlock(localDayKey(cursor), false)}
                <div className="mt-3 space-y-2">
                  {dayEntries(localDayKey(cursor))
                    .filter((entry) => entry.scheduleId)
                    .map((entry) => {
                      const schedule = schedules.find(
                        (row) => row.id === entry.scheduleId,
                      );
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
              </>
            )}
          </div>
        ) : view === 'week' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day) => {
              const key = localDayKey(day);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`min-h-40 rounded-sm border p-3 ${
                    isToday ? 'border-gold bg-stone/50' : 'border-stone'
                  }`}
                >
                  <button
                    type="button"
                    className="mb-2 block w-full text-left"
                    onClick={() => {
                      setCursor(day);
                      setView('day');
                    }}
                  >
                    <span className="block text-[11px] uppercase tracking-wider text-muted">
                      {WEEKDAY_LONG[(day.getDay() + 6) % 7]}
                    </span>
                    <span
                      className={`block text-lg font-light ${isToday ? 'text-gold-deep' : 'text-charcoal'}`}
                    >
                      {day.getDate()}
                    </span>
                  </button>
                  {dayEntries(key).length === 0 ? (
                    <p className="text-xs text-muted">—</p>
                  ) : (
                    dayBlock(key, true)
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted">
              {WEEKDAY_SHORT.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((day) => {
                const key = localDayKey(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = key === todayKey;
                const entries = dayEntries(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`min-h-24 rounded-sm border p-1.5 text-left transition-colors hover:bg-stone/50 ${
                      isToday
                        ? 'border-gold bg-stone/50'
                        : inMonth
                          ? 'border-stone'
                          : 'border-stone/40 opacity-50'
                    }`}
                    onClick={() => {
                      setCursor(day);
                      setView('day');
                    }}
                  >
                    <span
                      className={`block text-xs ${
                        isToday ? 'font-semibold text-gold-deep' : 'text-charcoal'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span className="mt-1 block space-y-0.5">
                      {entries.slice(0, 3).map((entry) => (
                        <span
                          key={entry.id}
                          className={`block truncate text-[11px] ${
                            entry.tone === 'danger'
                              ? 'text-red-700'
                              : entry.tone === 'gold'
                                ? 'text-gold-deep'
                                : 'text-muted'
                          }`}
                        >
                          {entry.iso.slice(11, 16)} {entry.title}
                        </span>
                      ))}
                      {entries.length > 3 ? (
                        <span className="block text-[11px] text-muted">
                          +{entries.length - 3} more
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
