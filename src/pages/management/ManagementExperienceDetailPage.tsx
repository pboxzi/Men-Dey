import {ArrowLeft, Check, X} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime, relativeTime} from '../../lib/format';
import {formatPrice} from '../../lib/membership';
import {PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES} from '../../lib/payments';
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TONES,
  REQUEST_EVENT_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  requestCategoryLabel,
} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {
  Appointment,
  ExperiencePayment,
  ExperienceProposal,
  ExperienceRequirement,
  Request,
  RequestEvent,
  RequirementCategory,
} from '../../types';

const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  'membership_tier',
  'availability',
  'location',
  'age',
  'documents',
  'dress',
  'arrival_instructions',
  'participants',
  'payment',
  'special_conditions',
  'other',
];

const TERMINAL = ['completed', 'declined', 'cancelled'];

function Row({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-charcoal">{value}</dd>
    </div>
  );
}

export function ManagementExperienceDetailPage() {
  const {id = ''} = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [proposals, setProposals] = useState<ExperienceProposal[]>([]);
  const [requirements, setRequirements] = useState<ExperienceRequirement[]>([]);
  const [payments, setPayments] = useState<ExperiencePayment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const [reqForm, setReqForm] = useState({
    label: '',
    category: 'other' as RequirementCategory,
    description: '',
    is_required: true,
  });
  const [proposalForm, setProposalForm] = useState({
    summary: '',
    proposed_date: '',
    proposed_time: '',
    location: '',
    duration: '',
    participants: '',
    amount: '',
    currency: 'USD',
    terms: '',
    notes: '',
    expires: '',
  });
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    starts_at: '',
    ends_at: '',
    timezone: 'UTC',
    location: '',
    virtual_link: '',
    instructions: '',
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [requestRes, eventsRes, proposalsRes, requirementsRes, paymentsRes, appointmentRes] =
        await Promise.all([
          supabase.from('requests').select('*').eq('id', id).maybeSingle(),
          supabase.from('request_events').select('*').eq('request_id', id).order('created_at', {ascending: true}),
          supabase.from('experience_proposals').select('*').eq('request_id', id).order('version', {ascending: false}),
          supabase.from('experience_requirements').select('*').eq('request_id', id).order('created_at', {ascending: true}),
          supabase.from('experience_payments').select('*').eq('request_id', id).order('created_at', {ascending: false}),
          supabase.from('appointments').select('*').eq('request_id', id).order('created_at', {ascending: false}).limit(1).maybeSingle(),
        ]);
      if (requestRes.error) throw new Error(requestRes.error.message);
      if (eventsRes.error) throw new Error(eventsRes.error.message);
      if (proposalsRes.error) throw new Error(proposalsRes.error.message);
      if (requirementsRes.error) throw new Error(requirementsRes.error.message);
      if (paymentsRes.error) throw new Error(paymentsRes.error.message);
      if (appointmentRes.error) throw new Error(appointmentRes.error.message);
      if (!requestRes.data) throw new Error('This request could not be found.');

      const row = requestRes.data as Request;
      setRequest(row);
      setEvents((eventsRes.data as RequestEvent[]) ?? []);
      setProposals((proposalsRes.data as ExperienceProposal[]) ?? []);
      setRequirements((requirementsRes.data as ExperienceRequirement[]) ?? []);
      setPayments((paymentsRes.data as ExperiencePayment[]) ?? []);
      setAppointment((appointmentRes.data as Appointment | null) ?? null);

      const profileRes = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', row.user_id)
        .maybeSingle();
      if (profileRes.error) throw new Error(profileRes.error.message);
      const profile = profileRes.data as {full_name: string | null; email: string | null} | null;
      setUserName(profile?.full_name || profile?.email || row.user_id.slice(0, 8));

      setScheduleForm((prev) => ({
        ...prev,
        title: prev.title || row.title,
        location: prev.location || row.location || '',
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<string | void>) => {
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        const result = await fn();
        if (result) setNotice(result);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'The action could not be completed.');
      } finally {
        setBusy(false);
        setConfirmAction(null);
      }
    },
    [load],
  );

  const setStatus = useCallback(
    (next: Request['status'], message: string) =>
      run(async () => {
        if (!request) throw new Error('Request not loaded.');
        const {error: updateError} = await supabase
          .from('requests')
          .update({status: next})
          .eq('id', request.id);
        if (updateError) throw new Error(updateError.message);
        return message;
      }),
    [request, run],
  );

  const addRequirement = useCallback(
    () =>
      run(async () => {
        if (!request) throw new Error('Request not loaded.');
        if (!reqForm.label.trim()) throw new Error('Requirement label is required.');
        const {error: insertError} = await supabase.from('experience_requirements').insert({
          request_id: request.id,
          label: reqForm.label.trim(),
          category: reqForm.category,
          description: reqForm.description.trim() || null,
          is_required: reqForm.is_required,
        });
        if (insertError) throw new Error(insertError.message);
        if (['submitted', 'in_review'].includes(request.status)) {
          const {error: statusError} = await supabase
            .from('requests')
            .update({status: 'information_requested'})
            .eq('id', request.id);
          if (statusError) throw new Error(statusError.message);
        }
        setReqForm({label: '', category: 'other', description: '', is_required: true});
        return 'Requirement added. It now appears on the member’s request.';
      }),
    [reqForm, request, run],
  );

  const createProposal = useCallback(
    (send: boolean) =>
      run(async () => {
        if (!request) throw new Error('Request not loaded.');
        if (!proposalForm.summary.trim()) throw new Error('Proposal summary is required.');
        const version = proposals.reduce((max, row) => Math.max(max, row.version), 0) + 1;
        const {data: created, error: insertError} = await supabase
          .from('experience_proposals')
          .insert({
            request_id: request.id,
            version,
            summary: proposalForm.summary.trim(),
            terms: proposalForm.terms.trim() || null,
            amount_cents:
              proposalForm.amount.trim() === ''
                ? null
                : Math.max(0, Math.round(Number(proposalForm.amount) * 100)),
            currency: proposalForm.currency.trim().toUpperCase() || 'USD',
            proposed_date: proposalForm.proposed_date || null,
            proposed_time: proposalForm.proposed_time || null,
            location: proposalForm.location.trim() || null,
            duration_minutes: proposalForm.duration.trim() === '' ? null : Number(proposalForm.duration),
            participants: proposalForm.participants.trim() || null,
            notes: proposalForm.notes.trim() || null,
            expires_at: proposalForm.expires
              ? new Date(`${proposalForm.expires}T23:59:59`).toISOString()
              : null,
            status: 'draft',
          })
          .select('id')
          .single();
        if (insertError) throw new Error(insertError.message);

        if (send) {
          const {error: sendError} = await supabase
            .from('experience_proposals')
            .update({status: 'sent'})
            .eq('id', created.id);
          if (sendError) throw new Error(sendError.message);
        }
        setProposalForm({
          summary: '',
          proposed_date: '',
          proposed_time: '',
          location: '',
          duration: '',
          participants: '',
          amount: '',
          currency: 'USD',
          terms: '',
          notes: '',
          expires: '',
        });
        return send
          ? `Proposal v${version} sent to ${userName ?? 'the member'}. The request now awaits their response.`
          : `Proposal v${version} saved as a draft.`;
      }),
    [proposalForm, proposals, request, run, userName],
  );

  const markPaymentPaid = useCallback(
    (payment: ExperiencePayment) =>
      run(async () => {
        const {error: updateError} = await supabase
          .from('experience_payments')
          .update({status: 'paid'})
          .eq('id', payment.id);
        if (updateError) throw new Error(updateError.message);
        return 'Payment recorded as paid. Confirm the experience when you are ready.';
      }),
    [run],
  );

  const schedule = useCallback(
    () =>
      run(async () => {
        if (!request) throw new Error('Request not loaded.');
        if (!scheduleForm.starts_at || !scheduleForm.ends_at) {
          throw new Error('Start and end date/time are required.');
        }
        const {error: rpcError} = await supabase.rpc('schedule_experience', {
          p_request_id: request.id,
          p_title: scheduleForm.title.trim() || request.title,
          p_starts_at: new Date(scheduleForm.starts_at).toISOString(),
          p_ends_at: new Date(scheduleForm.ends_at).toISOString(),
          p_timezone: scheduleForm.timezone.trim() || 'UTC',
          p_location: scheduleForm.location.trim() || null,
          p_virtual_link: scheduleForm.virtual_link.trim() || null,
          p_meeting_instructions: scheduleForm.instructions.trim() || null,
        });
        if (rpcError) throw new Error(rpcError.message);
        return `Experience scheduled. Appointment created for ${userName ?? 'the member'}.`;
      }),
    [request, run, scheduleForm, userName],
  );

  if (loading) return <Spinner />;

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Link to="/management/experiences" className="nav-link inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Experiences
        </Link>
        <Alert tone="error">{error ?? 'Request not found.'}</Alert>
      </div>
    );
  }

  const latestProposal = proposals[0] ?? null;
  const latestPayment = payments[0] ?? null;
  const activeProposal =
    proposals.find((proposal) => proposal.status === 'sent' || proposal.status === 'viewed') ?? null;
  const hasPendingPayment = payments.some(
    (payment) => payment.status === 'pending' || payment.status === 'processing',
  );
  const status = request.status;
  const terminal = TERMINAL.includes(status);
  const canPropose =
    ['submitted', 'in_review', 'information_requested'].includes(status) && !activeProposal;
  const canRequire = ['submitted', 'in_review', 'information_requested'].includes(status);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={requestCategoryLabel(request.type)}
        title={request.title}
        description={`${userName ?? 'Member'} · reference ${request.id.slice(0, 8).toUpperCase()}`}
        actions={
          <Link to="/management/experiences" className="btn btn-secondary">
            <ArrowLeft className="size-4" aria-hidden /> All requests
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={REQUEST_STATUS_TONES[status]}>{REQUEST_STATUS_LABELS[status]}</Chip>
        <Chip tone="neutral">{requestCategoryLabel(request.type)}</Chip>
        <span className="text-xs text-muted">Submitted {relativeTime(request.submitted_at)}</span>
      </div>

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className="surface p-6">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Lifecycle
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'submitted' ? (
            <Button onClick={() => void setStatus('in_review', 'Review started.')} loading={busy}>
              Start review
            </Button>
          ) : null}
          {status === 'proposal' ? (
            <span className="text-sm text-muted">
              Awaiting the member’s response to the proposal.
            </span>
          ) : null}
          {status === 'payment_required' ? (
            <>
              <span className="text-sm text-muted">
                {hasPendingPayment
                  ? 'Payment is pending — mark it paid once received, then confirm.'
                  : 'Payment recorded — confirm the experience.'}
              </span>
              <Button
                onClick={() =>
                  void setStatus('confirmed', 'Experience confirmed. The member has been notified.')
                }
                loading={busy}
                disabled={hasPendingPayment || busy}
                title={hasPendingPayment ? 'Payment must be marked paid first' : undefined}
              >
                <Check className="size-4" aria-hidden /> Confirm experience
              </Button>
            </>
          ) : null}
          {status === 'confirmed' ? (
            <span className="text-sm text-muted">Confirmed — schedule the date and time below.</span>
          ) : null}
          {status === 'scheduled' || status === 'confirmed' ? (
            <Button onClick={() => setConfirmAction('complete')} disabled={busy}>
              Mark completed
            </Button>
          ) : null}
          {!terminal && status !== 'payment_required' ? (
            <Button variant="ghost" onClick={() => setConfirmAction('decline')} disabled={busy}>
              <X className="size-4" aria-hidden /> Decline request
            </Button>
          ) : null}
          {terminal ? (
            <span className="text-sm text-muted">
              This request is closed ({REQUEST_STATUS_LABELS[status].toLowerCase()}).
            </span>
          ) : null}
        </div>

        {confirmAction === 'decline' ? (
          <div className="mt-4 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm">
            <p className="text-danger">
              Decline this request? The member is notified and the request is resolved.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={busy}>
                Keep request
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => void setStatus('declined', 'Request declined.')}
              >
                Yes, decline
              </Button>
            </div>
          </div>
        ) : null}
        {confirmAction === 'complete' ? (
          <div className="mt-4 rounded-sm border border-gold/40 bg-gold/5 p-3 text-sm">
            <p className="text-charcoal">Mark this experience as completed?</p>
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={busy}>
                Not yet
              </Button>
              <Button loading={busy} onClick={() => void setStatus('completed', 'Experience completed.')}>
                Yes, completed
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Request details
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
            {request.description || 'No description provided.'}
          </p>
          <dl className="mt-4 divide-y divide-stone border-t border-stone">
            <Row label="Preferred date" value={formatDate(request.preferred_date)} />
            <Row label="Preferred time" value={request.preferred_time} />
            <Row label="Location" value={request.location} />
            <Row label="Participants" value={request.participants} />
            <Row label="Contact method" value={request.contact_method} />
            <Row label="Additional" value={request.additional_requirements} />
          </dl>
        </section>

        <section className="surface p-6">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Requirements
          </h2>
          {requirements.length > 0 ? (
            <ul className="mb-4 divide-y divide-stone">
              {requirements.map((requirement) => (
                <li key={requirement.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-charcoal">{requirement.label}</p>
                    <Chip tone={requirement.responded_at ? 'success' : 'gold'}>
                      {requirement.responded_at ? 'Answered' : 'Awaiting answer'}
                    </Chip>
                  </div>
                  {requirement.description ? (
                    <p className="mt-1 text-xs text-muted">{requirement.description}</p>
                  ) : null}
                  {requirement.response ? (
                    <p className="mt-2 rounded-sm border border-stone bg-stone/40 p-3 text-sm text-ink">
                      <span className="text-xs uppercase tracking-wider text-muted">Answer:</span>{' '}
                      {requirement.response}
                    </p>
                  ) : null}
                  {requirement.responded_at ? (
                    <p className="mt-1 text-xs text-muted">
                      Answered {formatDateTime(requirement.responded_at)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted">No requirements added yet.</p>
          )}

          {canRequire ? (
            <div className="grid gap-3 rounded-sm border border-stone bg-stone/40 p-4">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Label</span>
                <input
                  className="field-input"
                  value={reqForm.label}
                  placeholder="Proof of membership tier"
                  onChange={(event) => setReqForm((prev) => ({...prev, label: event.target.value}))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Category</span>
                <select
                  className="field-input"
                  value={reqForm.category}
                  onChange={(event) =>
                    setReqForm((prev) => ({
                      ...prev,
                      category: event.target.value as RequirementCategory,
                    }))
                  }
                >
                  {REQUIREMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Description
                </span>
                <textarea
                  className="field-input min-h-16 resize-y"
                  rows={2}
                  value={reqForm.description}
                  onChange={(event) =>
                    setReqForm((prev) => ({...prev, description: event.target.value}))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={reqForm.is_required}
                  onChange={(event) =>
                    setReqForm((prev) => ({...prev, is_required: event.target.checked}))
                  }
                />
                Required before confirmation
              </label>
              <Button onClick={() => void addRequirement()} loading={busy}>
                Add requirement
              </Button>
            </div>
          ) : null}
        </section>

        <section className="surface p-6">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Proposal
          </h2>
          {latestProposal ? (
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-charcoal">v{latestProposal.version}</p>
                <Chip tone={PROPOSAL_STATUS_TONES[latestProposal.status]}>
                  {PROPOSAL_STATUS_LABELS[latestProposal.status]}
                </Chip>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
                {latestProposal.summary}
              </p>
              <dl className="mt-3 divide-y divide-stone border-t border-stone">
                <Row label="Date" value={formatDate(latestProposal.proposed_date)} />
                <Row label="Time" value={latestProposal.proposed_time} />
                <Row label="Location" value={latestProposal.location} />
                <Row
                  label="Duration"
                  value={
                    latestProposal.duration_minutes ? `${latestProposal.duration_minutes} min` : null
                  }
                />
                <Row label="Participants" value={latestProposal.participants} />
                <Row
                  label="Price"
                  value={
                    latestProposal.amount_cents !== null && latestProposal.amount_cents !== undefined
                      ? formatPrice(latestProposal.amount_cents, latestProposal.currency)
                      : null
                  }
                />
                <Row
                  label="Sent"
                  value={latestProposal.sent_at ? formatDateTime(latestProposal.sent_at) : null}
                />
                <Row
                  label="Responded"
                  value={
                    latestProposal.responded_at ? formatDateTime(latestProposal.responded_at) : null
                  }
                />
              </dl>
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted">No proposal yet.</p>
          )}

          {canPropose ? (
            <div className="grid gap-3 rounded-sm border border-stone bg-stone/40 p-4">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Summary</span>
                <textarea
                  className="field-input min-h-20 resize-y"
                  rows={3}
                  value={proposalForm.summary}
                  placeholder="What the member will experience, where and how."
                  onChange={(event) =>
                    setProposalForm((prev) => ({...prev, summary: event.target.value}))
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Date</span>
                  <input
                    className="field-input"
                    type="date"
                    value={proposalForm.proposed_date}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, proposed_date: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Time</span>
                  <input
                    className="field-input"
                    type="time"
                    value={proposalForm.proposed_time}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, proposed_time: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
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
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Participants
                  </span>
                  <input
                    className="field-input"
                    value={proposalForm.participants}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, participants: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Price</span>
                  <input
                    className="field-input"
                    inputMode="decimal"
                    value={proposalForm.amount}
                    placeholder="blank = no price"
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, amount: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Currency
                  </span>
                  <input
                    className="field-input"
                    value={proposalForm.currency}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, currency: event.target.value}))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                    Respond by
                  </span>
                  <input
                    className="field-input"
                    type="date"
                    value={proposalForm.expires}
                    onChange={(event) =>
                      setProposalForm((prev) => ({...prev, expires: event.target.value}))
                    }
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Terms</span>
                <textarea
                  className="field-input min-h-16 resize-y"
                  rows={2}
                  value={proposalForm.terms}
                  onChange={(event) =>
                    setProposalForm((prev) => ({...prev, terms: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm">
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
              <div className="flex gap-2">
                <Button onClick={() => void createProposal(true)} loading={busy}>
                  Save & send
                </Button>
                <Button variant="secondary" onClick={() => void createProposal(false)} loading={busy}>
                  Save draft
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface p-6">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Payment
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">
              No payment yet. One is created automatically when the member accepts a priced
              proposal.
            </p>
          ) : (
            <ul className="divide-y divide-stone">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {formatPrice(payment.amount_cents, payment.currency)}
                    </p>
                    <p className="text-xs text-muted">
                      requested {formatDate(payment.created_at)}
                      {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                      {payment.reference ? ` · ref ${payment.reference}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Chip>
                    {payment.status === 'pending' || payment.status === 'processing' ? (
                      <Button variant="secondary" loading={busy} onClick={() => void markPaymentPaid(payment)}>
                        Mark paid
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-stone pt-3 text-xs text-muted">
            Marking paid never confirms the experience — confirmation is a separate, explicit
            action. Never record card numbers.
          </p>
        </section>

        <section className="surface p-6 lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Scheduling
          </h2>
          {appointment ? (
            <div className="mb-4 rounded-sm border border-gold/40 bg-gold/5 p-4">
              <p className="text-sm font-medium text-charcoal">{appointment.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDateTime(appointment.starts_at)} – {formatDateTime(appointment.ends_at)}
                {appointment.location ? ` · ${appointment.location}` : ''} ·{' '}
                {appointment.status}
              </p>
            </div>
          ) : null}
          {status === 'confirmed' || status === 'scheduled' ? (
            <div className="grid gap-3 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
                <input
                  className="field-input"
                  value={scheduleForm.title}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, title: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Starts</span>
                <input
                  className="field-input"
                  type="datetime-local"
                  value={scheduleForm.starts_at}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, starts_at: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Ends</span>
                <input
                  className="field-input"
                  type="datetime-local"
                  value={scheduleForm.ends_at}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, ends_at: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Timezone
                </span>
                <input
                  className="field-input"
                  value={scheduleForm.timezone}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, timezone: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Location
                </span>
                <input
                  className="field-input"
                  value={scheduleForm.location}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, location: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Meeting link
                </span>
                <input
                  className="field-input"
                  value={scheduleForm.virtual_link}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, virtual_link: event.target.value}))
                  }
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Meeting instructions
                </span>
                <textarea
                  className="field-input min-h-16 resize-y"
                  rows={2}
                  value={scheduleForm.instructions}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({...prev, instructions: event.target.value}))
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <Button onClick={() => void schedule()} loading={busy}>
                  {status === 'scheduled' ? 'Reschedule experience' : 'Schedule experience'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Scheduling opens after the experience is confirmed. Payment must be recorded and the
              experience explicitly confirmed first.
            </p>
          )}
        </section>
      </div>

      <section className="surface p-6">
        <h2 className="mb-5 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Timeline
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">No events recorded yet.</p>
        ) : (
          <ol className="relative space-y-5 border-l border-stone pl-6">
            {events.map((event, index) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[31px] flex size-5 items-center justify-center rounded-full ${
                    index === events.length - 1 ? 'bg-gold text-charcoal' : 'bg-stone text-muted'
                  }`}
                  aria-hidden
                >
                  <Check className="size-3" />
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
      </section>


    </div>
  );
}
