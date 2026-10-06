import {ArrowLeft, CircleCheck, Clock, Send} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../../auth/AuthContext';
import {Alert} from '../../../components/ui/Alert';
import {Button} from '../../../components/ui/Button';
import {Chip} from '../../../components/ui/Chip';
import {FullPageLoader} from '../../../components/ui/FullPageLoader';
import {reportError} from '../../../lib/errors';
import {formatDate, formatDateTime} from '../../../lib/format';
import {formatPrice} from '../../../lib/membership';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  fetchPaymentSettings,
  paymentMethodLabel,
  type PaymentSettings,
} from '../../../lib/payments';
import {onRowInserted, onRowUpdated} from '../../../lib/realtime';
import {
  CONTACT_METHOD_LABELS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TONES,
  REQUEST_EVENT_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  requestCategoryLabel,
} from '../../../lib/requests';
import {supabase} from '../../../lib/supabase';
import type {
  Appointment,
  ExperiencePayment,
  ExperienceProposal,
  ExperienceRequirement,
  Request,
  RequestEvent,
  RequestMessage,
} from '../../../types';
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

function proposalExpired(proposal: ExperienceProposal): boolean {
  if (!proposal.expires_at) return false;
  const t = new Date(proposal.expires_at).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function RequestDetailPage() {
  const {id = ''} = useParams();
  const {session} = useAuth();
  const me = session?.user.id ?? null;
  const [request, setRequest] = useState<Request | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [proposals, setProposals] = useState<ExperienceProposal[]>([]);
  const [requirements, setRequirements] = useState<ExperienceRequirement[]>([]);
  const [payments, setPayments] = useState<ExperiencePayment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [confirmDeclineProposal, setConfirmDeclineProposal] = useState<string | null>(null);
  const [requirementDrafts, setRequirementDrafts] = useState<Record<string, string>>({});
  const [savingRequirement, setSavingRequirement] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [requestRes, eventsRes, messagesRes, proposalsRes, requirementsRes, paymentsRes, appointmentRes, settingsRes] =
        await Promise.all([
          supabase.from('requests').select('*').eq('id', id).maybeSingle(),
          supabase
            .from('request_events')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: true}),
          supabase
            .from('request_messages')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: true}),
          supabase
            .from('experience_proposals')
            .select('*')
            .eq('request_id', id)
            .order('version', {ascending: false}),
          supabase
            .from('experience_requirements')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: true}),
          supabase
            .from('experience_payments')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: false}),
          supabase
            .from('appointments')
            .select('*')
            .eq('request_id', id)
            .order('created_at', {ascending: false})
            .limit(1)
            .maybeSingle(),
          fetchPaymentSettings(),
        ]);
      if (requestRes.error) throw new Error(requestRes.error.message);
      if (eventsRes.error) throw new Error(eventsRes.error.message);
      if (messagesRes.error) throw new Error(messagesRes.error.message);
      if (proposalsRes.error) throw new Error(proposalsRes.error.message);
      if (requirementsRes.error) throw new Error(requirementsRes.error.message);
      if (paymentsRes.error) throw new Error(paymentsRes.error.message);
      if (appointmentRes.error) throw new Error(appointmentRes.error.message);
      if (!requestRes.data) throw new Error('This request could not be found.');

      const messageRows = (messagesRes.data as RequestMessage[]) ?? [];
      const unreadIncoming = messageRows.filter(
        (m) => m.sender_id !== me && m.sender_id !== null && !m.read_at,
      );
      if (unreadIncoming.length > 0) {
        await supabase
          .from('request_messages')
          .update({read_at: new Date().toISOString()})
          .in(
            'id',
            unreadIncoming.map((m) => m.id),
          );
        for (const m of unreadIncoming) m.read_at = new Date().toISOString();
      }

      setRequest(requestRes.data as Request);
      setEvents((eventsRes.data as RequestEvent[]) ?? []);
      setMessages(messageRows);
      const proposalRows = (proposalsRes.data as ExperienceProposal[]) ?? [];
      setProposals(proposalRows);
      setRequirements((requirementsRes.data as ExperienceRequirement[]) ?? []);
      setPayments((paymentsRes.data as ExperiencePayment[]) ?? []);
      setAppointment((appointmentRes.data as Appointment | null) ?? null);
      setSettings(settingsRes.settings);
      if (!silent) setRequirementDrafts({});
    } catch (e) {
      setError(await reportError('request-detail.load', e));
    } finally {
      setLoading(false);
    }
  }, [id, me]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const stops = [
      onRowInserted('request_events', refreshLive),
      onRowInserted('request_messages', refreshLive),
      onRowUpdated('requests', `id=eq.${id}`, refreshLive),
      onRowUpdated('experience_proposals', `request_id=eq.${id}`, refreshLive),
    ];
    return () => {
      for (const stop of stops) stop();
    };
  }, [id, refreshLive]);

  const sendMessage = useCallback(async () => {
    const body = messageDraft.trim();
    if (!body || !me || !id) return;
    setSendingMessage(true);
    setActionError(null);
    try {
      const {data, error: insertError} = await supabase
        .from('request_messages')
        .insert({request_id: id, sender_id: me, body, is_internal: false})
        .select('*')
        .single();
      if (insertError) throw new Error(insertError.message);
      setMessages((rows) => [...rows, data as RequestMessage]);
      setMessageDraft('');
      await load(true);
    } catch (e) {
      setActionError(await reportError('request-detail.message', e));
    } finally {
      setSendingMessage(false);
    }
  }, [id, load, me, messageDraft]);

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

  const respondToProposal = useCallback(
    async (proposal: ExperienceProposal, next: 'accepted' | 'declined') => {
      setProposalBusy(proposal.id);
      setActionError(null);
      try {
        const {error: updateError} = await supabase
          .from('experience_proposals')
          .update({status: next})
          .eq('id', proposal.id);
        if (updateError) throw new Error(updateError.message);
        await load();
      } catch (e) {
        setActionError(
          e instanceof Error ? e.message : `Could not ${next === 'accepted' ? 'accept' : 'decline'} this proposal.`,
        );
      } finally {
        setProposalBusy(null);
        setConfirmDeclineProposal(null);
      }
    },
    [load],
  );

  const saveRequirement = useCallback(
    async (requirement: ExperienceRequirement) => {
      setSavingRequirement(requirement.id);
      setActionError(null);
      try {
        const draft = requirementDrafts[requirement.id] ?? requirement.response ?? '';
        const {error: updateError} = await supabase
          .from('experience_requirements')
          .update({response: draft.trim() || null})
          .eq('id', requirement.id);
        if (updateError) throw new Error(updateError.message);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not save your response.');
      } finally {
        setSavingRequirement(null);
      }
    },
    [load, requirementDrafts],
  );

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
  const canCancel = request.status === 'proposal' || request.status === 'payment_required';
  const latestProposal = proposals[0] ?? null;
  const latestPayment = payments[0] ?? null;
  const proposalActionable =
    latestProposal !== null &&
    (latestProposal.status === 'sent' || latestProposal.status === 'viewed') &&
    !proposalExpired(latestProposal);
  const unansweredRequirements = requirements.filter((requirement) => !requirement.responded_at);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <Link
          to={request.experience_id ? '/dashboard/experiences' : '/dashboard/requests'}
          className="nav-link mb-2 inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-4" aria-hidden />{' '}
          {request.experience_id ? 'Experiences' : 'Requests'}
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
              Conversation
            </h2>
            {messages.length === 0 ? (
              <p className="text-sm text-muted">
                No messages on this request yet. Management will reply here.
              </p>
            ) : (
              <ul className="space-y-3">
                {messages.map((message) => {
                  const mine = message.sender_id !== null && message.sender_id === me;
                  return (
                    <li key={message.id} className={mine ? 'flex justify-end' : ''}>
                      <div
                        className={
                          mine
                            ? 'max-w-[85%] rounded-sm border border-gold/40 bg-gold/10 p-3'
                            : 'max-w-[85%] rounded-sm border border-stone bg-stone/40 p-3'
                        }
                      >
                        <p className="text-xs uppercase tracking-wider text-muted">
                          {mine ? 'You' : 'Management'} · {formatDateTime(message.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                          {message.body}
                        </p>
                        {mine ? (
                          <p className="mt-1 text-right text-[11px] uppercase tracking-wider text-stone">
                            {message.read_at ? 'Read' : 'Sent'}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 border-t border-stone pt-4">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Message management about this request
                </span>
                <textarea
                  className="field-input min-h-20 resize-y"
                  rows={3}
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                />
              </label>
              <div className="mt-2 flex justify-end">
                <Button onClick={() => void sendMessage()} loading={sendingMessage} disabled={!messageDraft.trim()}>
                  <Send className="size-4" aria-hidden /> Send
                </Button>
              </div>
            </div>
          </section>

          {latestProposal ? (
            <section className="surface p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                  Proposal from management
                </h2>
                <Chip tone={PROPOSAL_STATUS_TONES[latestProposal.status]}>
                  {PROPOSAL_STATUS_LABELS[latestProposal.status]}
                </Chip>
              </div>

              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {latestProposal.summary}
              </p>

              <dl className="mt-4 divide-y divide-stone border-t border-stone">
                <DetailRow label="Date" value={formatDate(latestProposal.proposed_date)} />
                <DetailRow label="Time" value={latestProposal.proposed_time} />
                <DetailRow label="Location" value={latestProposal.location} />
                <DetailRow
                  label="Duration"
                  value={
                    latestProposal.duration_minutes ? `${latestProposal.duration_minutes} minutes` : null
                  }
                />
                <DetailRow label="Participants" value={latestProposal.participants} />
                <DetailRow
                  label="Price"
                  value={
                    latestProposal.amount_cents !== null && latestProposal.amount_cents !== undefined
                      ? formatPrice(latestProposal.amount_cents, latestProposal.currency)
                      : null
                  }
                />
                <DetailRow
                  label="Respond by"
                  value={latestProposal.expires_at ? formatDateTime(latestProposal.expires_at) : null}
                />
              </dl>

              {latestProposal.notes ? (
                <p className="mt-4 whitespace-pre-line rounded-sm border border-stone bg-stone/40 p-4 text-sm leading-relaxed text-ink">
                  {latestProposal.notes}
                </p>
              ) : null}

              {latestProposal.terms ? (
                <>
                  <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
                    Terms
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                    {latestProposal.terms}
                  </p>
                </>
              ) : null}

              {proposalActionable ? (
                confirmDeclineProposal === latestProposal.id ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                    <p className="text-sm text-muted">
                      Decline this proposal? Management will be informed and the request will be
                      cancelled.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmDeclineProposal(null)}
                        disabled={proposalBusy === latestProposal.id}
                      >
                        Keep proposal
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => void respondToProposal(latestProposal, 'declined')}
                        loading={proposalBusy === latestProposal.id}
                      >
                        Yes, decline
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                    <p className="text-sm text-muted">
                      Accepting confirms the proposal. A payment is requested next, and management
                      confirms your experience after verification.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmDeclineProposal(latestProposal.id)}
                        disabled={proposalBusy === latestProposal.id}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => void respondToProposal(latestProposal, 'accepted')}
                        loading={proposalBusy === latestProposal.id}
                      >
                        Accept proposal
                      </Button>
                    </div>
                  </div>
                )
              ) : latestProposal.status === 'accepted' ? (
                <p className="mt-5 border-t border-stone pt-4 text-sm text-muted">
                  You accepted this proposal. Management verifies the payment and confirms your
                  experience next.
                </p>
              ) : latestProposal.status === 'declined' || latestProposal.status === 'cancelled' ? (
                <p className="mt-5 border-t border-stone pt-4 text-sm text-muted">
                  This proposal is no longer active.
                </p>
              ) : proposalExpired(latestProposal) ? (
                <p className="mt-5 border-t border-stone pt-4 text-sm text-muted">
                  This proposal has expired. Message management if you would like a new one.
                </p>
              ) : null}
            </section>
          ) : null}

          {requirements.length > 0 ? (
            <section className="surface p-6">
              <h2 className="mb-1 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                Requirements
              </h2>
              <p className="mb-4 text-sm text-muted">
                {unansweredRequirements.length > 0
                  ? `Management needs ${unansweredRequirements.length} more ${
                      unansweredRequirements.length === 1 ? 'answer' : 'answers'
                    } before this experience can move forward.`
                  : 'You have answered every requirement. Management reviews answers personally.'}
              </p>
              <ul>
                {requirements.map((requirement) => {
                  const draft = requirementDrafts[requirement.id] ?? requirement.response ?? '';
                  const dirty = draft !== (requirement.response ?? '');
                  return (
                    <li key={requirement.id} className="border-t border-stone py-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-charcoal">
                          {requirement.label}
                          {requirement.is_required ? (
                            <span className="ml-2 text-xs font-normal text-gold-deep">Required</span>
                          ) : null}
                        </p>
                        <Chip tone={requirement.responded_at ? 'success' : 'gold'}>
                          {requirement.responded_at ? 'Answered' : 'Your answer needed'}
                        </Chip>
                      </div>
                      {requirement.description ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {requirement.description}
                        </p>
                      ) : null}
                      <textarea
                        className="field-input mt-3 min-h-20 resize-y"
                        rows={3}
                        aria-label={`Your answer for ${requirement.label}`}
                        value={draft}
                        onChange={(event) =>
                          setRequirementDrafts((prev) => ({...prev, [requirement.id]: event.target.value}))
                        }
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">
                          {requirement.responded_at
                            ? `Answered ${formatDateTime(requirement.responded_at)}`
                            : 'Management reads every answer personally.'}
                        </span>
                        <Button
                          variant="secondary"
                          disabled={!dirty}
                          loading={savingRequirement === requirement.id}
                          onClick={() => void saveRequirement(requirement)}
                        >
                          Save answer
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {payments.length > 0 || request.status === 'payment_required' ? (
            <section className="surface p-6">
              <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                Payment
              </h2>
              {latestPayment ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xl text-charcoal">
                      {formatPrice(latestPayment.amount_cents, latestPayment.currency)}
                    </p>
                    <Chip tone={PAYMENT_STATUS_TONES[latestPayment.status]}>
                      {PAYMENT_STATUS_LABELS[latestPayment.status]}
                    </Chip>
                  </div>
                  <p className="text-sm text-muted">
                    {latestPayment.paid_at
                      ? `Recorded ${formatDateTime(latestPayment.paid_at)}`
                      : `Requested ${formatDateTime(latestPayment.created_at)}`}
                  </p>
                  <div className="rounded-sm border border-gold/40 bg-gold/5 p-4">
                    <p className="text-sm font-medium text-charcoal">
                      {settings ? paymentMethodLabel(settings) : 'Managed payment'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {settings?.instructions ??
                        'Management will confirm the accepted payment method for your experience.'}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Never send card numbers, CVVs or passwords through this platform. Management
                      records and verifies the payment manually — paying never confirms the
                      experience automatically.
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {latestPayment.status === 'paid'
                      ? 'Payment recorded. Management confirms your experience next.'
                      : 'Once you have paid through the confirmed method, management verifies the payment and confirms your experience.'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Management is preparing the payment for this experience. You will see the amount
                  and instructions here.
                </p>
              )}
            </section>
          ) : null}

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

          {appointment ? (
            <section className="surface p-6">
              <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                Confirmed booking
              </h2>
              <dl className="divide-y divide-stone">
                <DetailRow
                  label="When"
                  value={`${formatDateTime(appointment.starts_at)}${
                    appointment.ends_at ? ` – ${formatDateTime(appointment.ends_at)}` : ''
                  }`}
                />
                <DetailRow label="Location" value={appointment.location} />
                <DetailRow label="Instructions" value={appointment.meeting_instructions} />
              </dl>
              {appointment.virtual_link ? (
                <a
                  href={appointment.virtual_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary mt-4 inline-flex"
                >
                  Open meeting link
                </a>
              ) : null}
              <p className="mt-4 border-t border-stone pt-3 text-xs text-muted">
                Scheduled by management. The date, time and meeting details above are the confirmed
                arrangement for this experience.
              </p>
            </section>
          ) : null}

          {canWithdraw || canCancel ? (
            <div className="surface p-5">
              <p className="text-sm text-muted">
                {canWithdraw
                  ? 'No longer want to pursue this? You can withdraw your own request while it is still submitted.'
                  : 'No longer want to pursue this? You can cancel the request while the proposal is awaiting your response.'}
              </p>
              <div className="mt-3 flex gap-2">
                {confirmWithdraw ? (
                  <>
                    <Button variant="secondary" onClick={() => setConfirmWithdraw(false)} disabled={withdrawing}>
                      Keep request
                    </Button>
                    <Button variant="primary" onClick={() => void withdraw()} loading={withdrawing}>
                      Yes, {canWithdraw ? 'withdraw' : 'cancel'}
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>
                    {canWithdraw ? 'Withdraw request' : 'Cancel request'}
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
