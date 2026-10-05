import {ArrowLeft, Plus, Send} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime, formatDate, relativeTime} from '../../lib/format';
import {formatPrice} from '../../lib/membership';
import {PAYMENT_PROVIDER_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES} from '../../lib/payments';
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TONES,
  REQUEST_EVENT_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  requestCategoryLabel,
} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import {DOCUMENT_CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_TONES} from './shared';
import type {
  ExperiencePayment,
  ExperienceProposal,
  Profile,
  Request,
  RequestEvent,
  RequestMessage,
} from '../../types';

interface DocumentRowLite {
  id: string;
  title: string;
  category: string;
  visibility: string;
  created_at: string;
}

interface RequestData {
  request: Request | null;
  user: Profile | null;
  events: RequestEvent[];
  messages: RequestMessage[];
  proposals: ExperienceProposal[];
  payments: ExperiencePayment[];
  documents: DocumentRowLite[];
}

const EMPTY: RequestData = {
  request: null,
  user: null,
  events: [],
  messages: [],
  proposals: [],
  payments: [],
  documents: [],
};

type LifecycleAction = {
  key: string;
  label: string;
  next: Request['status'];
  event: RequestEvent['event_type'];
  note?: string;
  requiresNote?: boolean;
  tone?: 'primary' | 'secondary' | 'ghost';
};

const PERMISSION_ERROR =
  'This change was not saved. The request may be missing the requests.manage permission.';

function lifecycleActions(status: Request['status']): LifecycleAction[] {
  switch (status) {
    case 'submitted':
      return [
        {key: 'review', label: 'Start review', next: 'in_review', event: 'review_started'},
        {key: 'decline', label: 'Decline', next: 'declined', event: 'declined', requiresNote: true, tone: 'ghost'},
      ];
    case 'in_review':
      return [
        {
          key: 'info',
          label: 'Request information',
          next: 'information_requested',
          event: 'information_requested',
          requiresNote: true,
        },
        {key: 'decline', label: 'Decline', next: 'declined', event: 'declined', requiresNote: true, tone: 'ghost'},
      ];
    case 'information_requested':
      return [
        {key: 'review', label: 'Resume review', next: 'in_review', event: 'review_started'},
        {key: 'decline', label: 'Decline', next: 'declined', event: 'declined', requiresNote: true, tone: 'ghost'},
      ];
    case 'payment_required':
      return [
        {key: 'confirm', label: 'Confirm receipt', next: 'confirmed', event: 'confirmed'},
        {key: 'decline', label: 'Decline', next: 'declined', event: 'declined', requiresNote: true, tone: 'ghost'},
      ];
    case 'confirmed':
      return [{key: 'approve', label: 'Approve', next: 'approved', event: 'approved'}];
    case 'approved':
      return [
        {key: 'complete', label: 'Mark completed', next: 'completed', event: 'completed'},
        {key: 'cancel', label: 'Cancel', next: 'cancelled', event: 'cancelled', requiresNote: true, tone: 'ghost'},
      ];
    case 'scheduled':
      return [
        {key: 'complete', label: 'Mark completed', next: 'completed', event: 'completed'},
        {key: 'cancel', label: 'Cancel', next: 'cancelled', event: 'cancelled', requiresNote: true, tone: 'ghost'},
      ];
    default:
      return [];
  }
}

export function ManagementRequestDetailPage() {
  const {id = ''} = useParams();
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [data, setData] = useState<RequestData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [confirming, setConfirming] = useState<string | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);

  const [memberMessage, setMemberMessage] = useState('');
  const [internalMessage, setInternalMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    summary: '',
    amount: '',
    date: '',
    time: '',
    location: '',
    duration: '',
    notes: '',
  });
  const [creatingProposal, setCreatingProposal] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const requestRes = await supabase.from('requests').select('*').eq('id', id).maybeSingle();
      if (requestRes.error) throw new Error(requestRes.error.message);
      const request = (requestRes.data as Request | null) ?? null;
      if (!request) {
        setData(EMPTY);
        return;
      }
      const [userRes, eventsRes, messagesRes, proposalsRes, paymentsRes, documentsRes] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', request.user_id).maybeSingle(),
          supabase
            .from('request_events')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: false}),
          supabase
            .from('request_messages')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: true}),
          supabase
            .from('experience_proposals')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: false}),
          supabase
            .from('experience_payments')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: false}),
          supabase
            .from('documents')
            .select('id, title, category, visibility, created_at')
            .eq('request_id', id)
            .order('created_at', {ascending: false}),
        ]);
      const firstError = [userRes, eventsRes, messagesRes, proposalsRes, paymentsRes, documentsRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setData({
        request,
        user: (userRes.data as Profile | null) ?? null,
        events: (eventsRes.data as RequestEvent[]) ?? [],
        messages: (messagesRes.data as RequestMessage[]) ?? [],
        proposals: (proposalsRes.data as ExperienceProposal[]) ?? [],
        payments: (paymentsRes.data as ExperiencePayment[]) ?? [],
        documents: (documentsRes.data as DocumentRowLite[]) ?? [],
      });
      setConfirming(null);
      setTransitionNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyTransition = useCallback(
    async (action: LifecycleAction) => {
      if (action.requiresNote && !transitionNote.trim() && action.key !== 'review') {
        setActionError('Add a note for the member before continuing.');
        return;
      }
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('requests')
          .update({
            status: action.next,
            ...(action.next === 'completed' ? {resolved_at: new Date().toISOString()} : {}),
          })
          .eq('id', id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated) throw new Error(PERMISSION_ERROR);
        const {error: eventError} = await supabase.from('request_events').insert({
          request_id: id,
          actor_id: me,
          event_type: action.event,
          note: transitionNote.trim() || action.note || null,
        });
        if (eventError) throw new Error(eventError.message);
        setNotice(
          `Request moved to ${REQUEST_STATUS_LABELS[action.next].toLowerCase()}. The member sees this change on their timeline.`,
        );
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : PERMISSION_ERROR);
      } finally {
        setBusy(false);
        setConfirming(null);
      }
    },
    [id, load, me, transitionNote],
  );

  const sendMessage = useCallback(
    async (internal: boolean) => {
      const text = internal ? internalMessage.trim() : memberMessage.trim();
      if (!text) return;
      setSending(true);
      setActionError(null);
      setNotice(null);
      try {
        const {error: insertError} = await supabase.from('request_messages').insert({
          request_id: id,
          sender_id: me,
          body: text,
          is_internal: internal,
        });
        if (insertError) throw new Error(insertError.message);
        setNotice(internal ? 'Internal note added.' : 'Message sent to the member.');
        if (internal) setInternalMessage('');
        else setMemberMessage('');
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not send the message.');
      } finally {
        setSending(false);
      }
    },
    [id, internalMessage, load, me, memberMessage],
  );

  const updatePayment = useCallback(
    async (payment: ExperiencePayment, next: 'paid' | 'failed') => {
      setBusyPaymentId(payment.id);
      setActionError(null);
      setNotice(null);
      try {
        const payload = next === 'paid' ? {status: next, paid_at: new Date().toISOString()} : {status: next};
        const {data: updated, error: updateError} = await supabase
          .from('experience_payments')
          .update(payload)
          .eq('id', payment.id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'This update was not saved. Verifying payments requires the payments.manage permission.',
          );
        setNotice(`Payment marked ${next}.`);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the payment.');
      } finally {
        setBusyPaymentId(null);
        setConfirmPaymentId(null);
      }
    },
    [load],
  );

  const assignToMe = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const {data: updated, error: updateError} = await supabase
        .from('requests')
        .update({assigned_to: me})
        .eq('id', id)
        .select('id, assigned_to')
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);
      if (!updated) throw new Error(PERMISSION_ERROR);
      setNotice('Assigned to you.');
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not assign the request.');
    } finally {
      setBusy(false);
    }
  }, [id, load, me]);

  const createProposal = useCallback(async () => {
    setCreatingProposal(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!proposalForm.summary.trim()) throw new Error('A summary is required for the proposal.');
      const request = data.request;
      if (!request) throw new Error('Request not found.');
      const version = data.proposals.reduce((max, row) => Math.max(max, row.version), 0) + 1;
      const {data: created, error: insertError} = await supabase
        .from('experience_proposals')
        .insert({
          request_id: id,
          version,
          summary: proposalForm.summary.trim(),
          terms: null,
          amount_cents:
            proposalForm.amount.trim() === ''
              ? null
              : Math.max(0, Math.round(Number(proposalForm.amount) * 100)),
          currency: 'GBP',
          status: 'draft',
          proposed_date: proposalForm.date || null,
          proposed_time: proposalForm.time || null,
          location: proposalForm.location.trim() || null,
          duration_minutes: proposalForm.duration ? Number(proposalForm.duration) : null,
          notes: proposalForm.notes.trim() || null,
        })
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);
      const {error: touchError} = await supabase
        .from('experience_proposals')
        .update({status: 'sent', sent_at: new Date().toISOString()})
        .eq('id', created.id)
        .select('id, status')
        .maybeSingle();
      if (touchError) throw new Error(touchError.message);
      if (!request.status.startsWith('completed')) {
        const {error: statusError} = await supabase
          .from('requests')
          .update({status: 'proposal'})
          .eq('id', id)
          .select('id, status')
          .maybeSingle();
        if (statusError) throw new Error(statusError.message);
        await supabase.from('request_events').insert({
          request_id: id,
          actor_id: me,
          event_type: 'proposal_created',
          note: `Proposal v${version} sent`,
        });
      }
      setNotice('Proposal created and sent to the member.');
      setProposalOpen(false);
      setProposalForm({
        summary: '',
        amount: '',
        date: '',
        time: '',
        location: '',
        duration: '',
        notes: '',
      });
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create the proposal.');
    } finally {
      setCreatingProposal(false);
    }
  }, [data.proposals, data.request, id, load, me, proposalForm]);

  if (loading) return <Spinner label="Loading request" />;

  const {request, user} = data;
  if (!request) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Requests" title="Request not found" />
        <EmptyState
          title="No request here."
          description="It may have been removed, or the link is out of date."
        />
        <Link to="/management/requests" className="text-sm text-gold-deep hover:underline">
          Back to requests
        </Link>
      </div>
    );
  }

  const details: Array<{label: string; value: string}> = [
    {label: 'Type', value: requestCategoryLabel(request.type)},
    {label: 'Submitted', value: formatDateTime(request.submitted_at)},
    {label: 'Preferred date', value: request.preferred_date ?? ''},
    {label: 'Preferred time', value: request.preferred_time ?? ''},
    {label: 'Location', value: request.location ?? ''},
    {label: 'Participants', value: request.participants ?? ''},
    {label: 'Contact method', value: request.contact_method ?? ''},
    {label: 'Additional requirements', value: request.additional_requirements ?? ''},
    {label: 'Resolved', value: formatDate(request.resolved_at)},
  ].filter((row) => row.value);

  const actions = lifecycleActions(request.status);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Requests"
        title={request.title}
        description={`${user?.full_name || user?.email || 'Account'} · ${requestCategoryLabel(request.type)}`}
        actions={
          <Link to="/management/requests" className="btn btn-ghost">
            <ArrowLeft className="size-4" aria-hidden /> All requests
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={REQUEST_STATUS_TONES[request.status]}>
          {REQUEST_STATUS_LABELS[request.status]}
        </Chip>
        <Chip tone={PRIORITY_TONES[request.priority] ?? 'neutral'}>
          {PRIORITY_LABELS[request.priority] ?? request.priority}
        </Chip>
        <Link to={`/management/fans/${request.user_id}`} className="text-xs text-gold-deep hover:underline">
          View fan account
        </Link>
        <button type="button" className="text-xs text-gold-deep hover:underline" onClick={() => void assignToMe()}>
          Assign to me
        </button>
        {request.assigned_to === me ? <Chip tone="info">Assigned to you</Chip> : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="surface p-6" aria-label="Request details">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Request details
            </h2>
            {request.description ? (
              <p className="mb-4 whitespace-pre-wrap text-sm text-charcoal">{request.description}</p>
            ) : null}
            <dl className="grid gap-4 sm:grid-cols-2">
              {details.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs uppercase tracking-wider text-muted">{row.label}</dt>
                  <dd className="mt-0.5 break-words text-sm text-charcoal">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface p-6" aria-label="Conversation">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Messages
            </h2>
            {data.messages.length === 0 ? (
              <p className="mb-5 text-sm text-muted">No messages on this request yet.</p>
            ) : (
              <ul className="mb-5 space-y-3">
                {data.messages.map((message) => (
                  <li
                    key={message.id}
                    className={`rounded-lg px-4 py-3 ${
                      message.is_internal
                        ? 'border-l-4 border-gold bg-stone/70'
                        : message.sender_id === me
                          ? 'bg-charcoal text-ivory'
                          : 'bg-stone text-charcoal'
                    }`}
                  >
                    {message.is_internal ? (
                      <span className="mb-1 inline-block">
                        <Chip tone="gold">Internal — never visible to the member</Chip>
                      </span>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{formatDateTime(message.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-4 border-t border-stone pt-4">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Message to the member
                </span>
                <textarea
                  className="field-input min-h-20 resize-y"
                  rows={3}
                  value={memberMessage}
                  onChange={(event) => setMemberMessage(event.target.value)}
                />
              </label>
              <div className="flex justify-end">
                <Button
                  onClick={() => void sendMessage(false)}
                  loading={sending}
                  disabled={!memberMessage.trim()}
                >
                  <Send className="size-4" aria-hidden /> Send to member
                </Button>
              </div>
              <label className="block text-sm">
                <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                  Internal note <Chip tone="gold">Internal only</Chip>
                </span>
                <textarea
                  className="field-input min-h-20 resize-y"
                  rows={2}
                  value={internalMessage}
                  onChange={(event) => setInternalMessage(event.target.value)}
                />
              </label>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => void sendMessage(true)}
                  loading={sending}
                  disabled={!internalMessage.trim()}
                >
                  Save internal note
                </Button>
              </div>
            </div>
          </section>

          <section className="surface p-6" aria-label="Proposals">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                Proposals
              </h2>
              {['submitted', 'in_review', 'information_requested', 'proposal'].includes(
                request.status,
              ) ? (
                <Button variant="secondary" onClick={() => setProposalOpen((prev) => !prev)}>
                  <Plus className="size-4" aria-hidden /> New proposal
                </Button>
              ) : null}
            </div>

            {proposalOpen ? (
              <div className="mb-5 grid gap-4 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Summary
                  </span>
                  <textarea
                    className="field-input min-h-20 resize-y"
                    rows={3}
                    value={proposalForm.summary}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, summary: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Amount
                  </span>
                  <input
                    className="field-input"
                    inputMode="decimal"
                    value={proposalForm.amount}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, amount: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Duration (minutes)
                  </span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={proposalForm.duration}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, duration: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Date</span>
                  <input
                    className="field-input"
                    type="date"
                    value={proposalForm.date}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, date: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Time</span>
                  <input
                    className="field-input"
                    type="time"
                    value={proposalForm.time}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, time: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Location
                  </span>
                  <input
                    className="field-input"
                    value={proposalForm.location}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, location: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Notes</span>
                  <textarea
                    className="field-input min-h-16 resize-y"
                    rows={2}
                    value={proposalForm.notes}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, notes: event.target.value}))
                    }
                  />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button onClick={() => void createProposal()} loading={creatingProposal}>
                    Create and send
                  </Button>
                  <Button variant="ghost" onClick={() => setProposalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {data.proposals.length === 0 ? (
              <p className="text-sm text-muted">No proposals for this request yet.</p>
            ) : (
              <ul className="divide-y divide-stone">
                {data.proposals.map((proposal) => (
                  <li key={proposal.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-charcoal">
                        v{proposal.version} · {proposal.summary}
                      </p>
                      <Chip tone={PROPOSAL_STATUS_TONES[proposal.status]}>
                        {PROPOSAL_STATUS_LABELS[proposal.status]}
                      </Chip>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {proposal.amount_cents !== null
                        ? `${formatPrice(proposal.amount_cents, proposal.currency)} · `
                        : ''}
                      {proposal.proposed_date
                        ? `${proposal.proposed_date}${proposal.proposed_time ? ` ${proposal.proposed_time}` : ''}`
                        : 'No date proposed'}
                      {proposal.location ? ` · ${proposal.location}` : ''}
                      {proposal.sent_at ? ` · sent ${formatDate(proposal.sent_at)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-6" aria-label="Payments">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                Payments
              </h2>
              <Link to="/management/payments" className="text-xs text-gold-deep hover:underline">
                All payments
              </Link>
            </div>
            {data.payments.length === 0 ? (
              <p className="text-sm text-muted">No payments recorded for this request.</p>
            ) : (
              <ul className="divide-y divide-stone">
                {data.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal">
                        {formatPrice(payment.amount_cents, payment.currency)}
                      </p>
                      <p className="text-xs text-muted">
                        {PAYMENT_PROVIDER_LABELS[payment.provider ?? ''] ??
                          payment.provider ??
                          'Provider not set'}{' '}
                        · ref {payment.reference || '—'}
                        {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Chip>
                      {payment.status === 'pending' || payment.status === 'processing' ? (
                        confirmPaymentId === payment.id ? (
                          <span className="flex gap-2">
                            <Button variant="ghost" onClick={() => setConfirmPaymentId(null)}>
                              Back
                            </Button>
                            <Button
                              variant="secondary"
                              loading={busyPaymentId === payment.id}
                              onClick={() => void updatePayment(payment, 'paid')}
                            >
                              Confirm paid
                            </Button>
                          </span>
                        ) : (
                          <span className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setConfirmPaymentId(payment.id)}
                            >
                              Mark paid
                            </Button>
                            <Button
                              variant="ghost"
                              loading={busyPaymentId === payment.id}
                              onClick={() => void updatePayment(payment, 'failed')}
                            >
                              Failed
                            </Button>
                          </span>
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.documents.length > 0 ? (
            <section className="surface p-6" aria-label="Documents">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                  Documents
                </h2>
                <Link to="/management/documents" className="text-xs text-gold-deep hover:underline">
                  Document centre
                </Link>
              </div>
              <ul className="divide-y divide-stone">
                {data.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm text-charcoal">{document.title}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {DOCUMENT_CATEGORY_LABELS[document.category] ?? document.category} ·{' '}
                      {formatDate(document.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="surface p-6" aria-label="Lifecycle">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Move this request forward
            </h2>
            {actions.length === 0 ? (
              <p className="text-sm text-muted">
                This request has reached {REQUEST_STATUS_LABELS[request.status].toLowerCase()} — no
                further transitions are available.
              </p>
            ) : confirming ? (
              <div className="space-y-3 rounded-sm border border-stone bg-stone/40 p-4">
                <p className="text-sm text-charcoal">
                  {actions.find((action) => action.key === confirming)?.requiresNote
                    ? 'Add a note for the member, then confirm.'
                    : 'Confirm this change? The member sees the new status on their timeline.'}
                </p>
                {actions.find((action) => action.key === confirming)?.requiresNote ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                      Note for the member
                    </span>
                    <textarea
                      className="field-input min-h-16 resize-y"
                      rows={2}
                      value={transitionNote}
                      onChange={(event) => setTransitionNote(event.target.value)}
                    />
                  </label>
                ) : null}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setConfirming(null)}>
                    Back
                  </Button>
                  <Button
                    loading={busy}
                    onClick={() => {
                      const action = actions.find((row) => row.key === confirming);
                      if (action) void applyTransition(action);
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.tone ?? 'primary'}
                    onClick={() => {
                      setTransitionNote('');
                      setConfirming(action.key);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </section>

          <section className="surface p-6" aria-label="Timeline">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Timeline
            </h2>
            <ol className="space-y-4">
              {data.events.length === 0 ? (
                <li className="text-sm text-muted">
                  Submitted {relativeTime(request.submitted_at)} — no further events yet.
                </li>
              ) : (
                data.events.map((event) => (
                  <li key={event.id} className="border-l-2 border-stone pl-4">
                    <p className="text-sm text-charcoal">
                      {REQUEST_EVENT_LABELS[event.event_type] ?? event.event_type}
                    </p>
                    {event.note ? (
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted">{event.note}</p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatDateTime(event.created_at)}
                    </p>
                  </li>
                ))
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
