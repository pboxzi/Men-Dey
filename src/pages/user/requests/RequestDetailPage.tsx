import {ArrowLeft, CircleCheck, Clock} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {Alert} from '../../../components/ui/Alert';
import {Button} from '../../../components/ui/Button';
import {Chip} from '../../../components/ui/Chip';
import {FullPageLoader} from '../../../components/ui/FullPageLoader';
import {formatDate, formatDateTime} from '../../../lib/format';
import {onRowInserted} from '../../../lib/realtime';
import {
  CONTACT_METHOD_LABELS,
  REQUEST_EVENT_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  requestCategoryLabel,
} from '../../../lib/requests';
import {supabase} from '../../../lib/supabase';
import type {Request, RequestEvent} from '../../../types';
import {ErrorNote} from '../components/SectionCard';

function DetailRow({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-charcoal">{value}</dd>
    </div>
  );
}

export function RequestDetailPage() {
  const {id = ''} = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [requestRes, eventsRes] = await Promise.all([
        supabase.from('requests').select('*').eq('id', id).maybeSingle(),
        supabase.from('request_events').select('*').eq('request_id', id).order('created_at', {ascending: true}),
      ]);
      if (requestRes.error) throw new Error(requestRes.error.message);
      if (eventsRes.error) throw new Error(eventsRes.error.message);
      if (!requestRes.data) throw new Error('This request could not be found.');
      setRequest(requestRes.data as Request);
      setEvents((eventsRes.data as RequestEvent[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const stop = onRowInserted('request_events', () => void load());
    return stop;
  }, [load]);

  const withdraw = useCallback(async () => {
    if (!request) return;
    setWithdrawing(true);
    setActionError(null);
    try {
      const {error: updateError} = await supabase
        .from('requests')
        .update({status: 'cancelled'})
        .eq('id', request.id);
      if (updateError) throw new Error(updateError.message);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not withdraw this request.');
    } finally {
      setWithdrawing(false);
      setConfirmWithdraw(false);
    }
  }, [load, request]);

  if (loading) return <FullPageLoader />;

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/requests" className="nav-link inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Requests
        </Link>
        <ErrorNote message={error ?? 'Request not found.'} onRetry={() => void load()} />
      </div>
    );
  }

  const canWithdraw = request.status === 'submitted';

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <Link to="/dashboard/requests" className="nav-link mb-2 inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Requests
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">{requestCategoryLabel(request.type)}</p>
            <h1 className="text-3xl md:text-4xl">{request.title}</h1>
            <p className="mt-2 text-sm text-muted">Reference {request.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="neutral">{requestCategoryLabel(request.type)}</Chip>
            <Chip tone={REQUEST_STATUS_TONES[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Chip>
          </div>
        </div>
      </div>

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              What you asked for
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
              {request.description || 'No description was provided.'}
            </p>
            {request.additional_requirements ? (
              <>
                <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Additional requirements
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{request.additional_requirements}</p>
              </>
            ) : null}
          </section>

          <section className="surface p-6">
            <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Details
            </h2>
            <dl className="divide-y divide-stone">
              <DetailRow label="Preferred date" value={formatDate(request.preferred_date)} />
              <DetailRow label="Preferred time" value={request.preferred_time} />
              <DetailRow label="Location" value={request.location} />
              <DetailRow label="Participants" value={request.participants} />
              <DetailRow label="Contact method" value={request.contact_method ? CONTACT_METHOD_LABELS[request.contact_method] ?? request.contact_method : null} />
              <DetailRow label="Submitted" value={formatDateTime(request.submitted_at)} />
              {request.resolved_at ? <DetailRow label="Resolved" value={formatDateTime(request.resolved_at)} /> : null}
            </dl>
          </section>

          {canWithdraw ? (
            <div className="surface p-5">
              <p className="text-sm text-muted">
                No longer want to pursue this? You can withdraw your own request while it is still
                submitted.
              </p>
              <div className="mt-3 flex gap-2">
                {confirmWithdraw ? (
                  <>
                    <Button variant="secondary" onClick={() => setConfirmWithdraw(false)} disabled={withdrawing}>
                      Keep request
                    </Button>
                    <Button variant="primary" onClick={() => void withdraw()} loading={withdrawing}>
                      Yes, withdraw
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>
                    Withdraw request
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <section className="surface p-6">
          <h2 className="mb-5 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Timeline
          </h2>
          {events.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="size-4" aria-hidden />
              No events recorded yet.
            </div>
          ) : (
            <ol className="relative space-y-6 border-l border-stone pl-6">
              {events.map((event, index) => (
                <li key={event.id} className="relative">
                  <span
                    className={`absolute -left-[31px] flex size-5 items-center justify-center rounded-full ${
                      index === events.length - 1 ? 'bg-gold text-charcoal' : 'bg-stone text-muted'
                    }`}
                    aria-hidden
                  >
                    <CircleCheck className="size-3" />
                  </span>
                  <p className="text-sm font-medium text-charcoal">
                    {REQUEST_EVENT_LABELS[event.event_type] ?? event.event_type}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(event.created_at)}</p>
                  {event.note ? <p className="mt-1 text-sm text-muted">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-6 border-t border-stone pt-4 text-xs text-muted">
            Only events that have actually happened are shown.
          </p>
        </section>
      </div>
    </div>
  );
}
