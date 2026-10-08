import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Mail,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime, relativeTime} from '../../lib/format';
import {MEMBERSHIP_STATUS_LABELS, MEMBERSHIP_STATUS_TONES} from '../../lib/membership';
import {PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES} from '../../lib/payments';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {ChipTone} from '../../lib/requests';
import {
  APPLICANT_STATUS_LABELS,
  APPLICANT_STATUS_TONES,
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_STATUS_TONES,
} from './shared';
import type {
  Appointment,
  ExperiencePayment,
  ExperienceProposal,
  ExperienceSchedule,
  ManagementConversation,
  Membership,
  MembershipOffer,
  Request,
} from '../../types';

interface PersonRef {
  email: string | null;
  full_name: string | null;
}

type MaybePerson = PersonRef[] | PersonRef | null | undefined;

interface ApplicantHit {
  id: string;
  status: string;
  headline: string | null;
  created_at: string;
  user?: MaybePerson;
}

interface RequestHit extends Request {
  user?: MaybePerson;
}

interface ConversationHit extends ManagementConversation {
  user?: MaybePerson;
}

interface MembershipHit extends Membership {
  user?: MaybePerson;
  tier?: {name: string}[] | {name: string} | null;
}

interface OfferHit extends MembershipOffer {
  user?: MaybePerson;
  tier?: {name: string}[] | {name: string} | null;
}

interface ProposalHit extends ExperienceProposal {
  request?:
    | {
        id: string;
        title: string;
        status: string;
        user?: MaybePerson;
      }[]
    | {
        id: string;
        title: string;
        status: string;
        user?: MaybePerson;
      }
    | null;
}

interface ExperiencePaymentHit extends ExperiencePayment {
  request?:
    | {id: string; title: string; status: string}[]
    | {id: string; title: string; status: string}
    | null;
}

interface AttentionItem {
  key: string;
  icon: ReactNode;
  title: string;
  detail: string;
  to: string;
  chip?: {label: string; tone: ChipTone};
}

interface ScheduleRow {
  key: string;
  title: string;
  when: string;
  meta: string;
  status: string;
  tone: ChipTone;
  href: string;
}

interface DashboardData {
  applicants: ApplicantHit[];
  requests: RequestHit[];
  conversations: ConversationHit[];
  memberships: MembershipHit[];
  offers: OfferHit[];
  proposals: ProposalHit[];
  experiencePayments: ExperiencePaymentHit[];
  schedules: ExperienceSchedule[];
  appointments: Appointment[];
  unreadMessages: Array<{conversation_id: string; created_at: string}>;
}

const EMPTY_DATA: DashboardData = {
  applicants: [],
  requests: [],
  conversations: [],
  memberships: [],
  offers: [],
  proposals: [],
  experiencePayments: [],
  schedules: [],
  appointments: [],
  unreadMessages: [],
};

const OPEN_REQUEST_STATUSES = [
  'submitted',
  'in_review',
  'information_requested',
  'proposal',
  'payment_required',
  'confirmed',
  'approved',
  'scheduled',
];

const QUICK_ACTIONS = [
  {key: 'requests', label: 'Open requests', to: '/management/requests'},
  {key: 'messages', label: 'Messages', to: '/management/messages'},
  {key: 'applicants', label: 'Applicants', to: '/management/applicants'},
  {key: 'calendar', label: 'Calendar', to: '/management/calendar'},
  {key: 'memberships', label: 'Memberships', to: '/management/memberships'},
  {key: 'bookings', label: 'Bookings', to: '/management/bookings'},
];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function personName(person: MaybePerson): string {
  const ref = first(person);
  return ref?.full_name || ref?.email || 'Account';
}

export function ManagementDashboardPage() {
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const weekIso = new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();

      const results = await Promise.all([
        supabase
          .from('applicant_profiles')
          .select(
            'id, status, headline, created_at, user:profiles!applicant_profiles_user_id_fkey(email, full_name)',
          )
          .in('status', ['new', 'submitted', 'in_review'])
          .order('created_at', {ascending: false})
          .limit(200),
        supabase
          .from('requests')
          .select('*, user:profiles!requests_user_id_fkey(email, full_name)')
          .in('status', OPEN_REQUEST_STATUSES)
          .order('submitted_at', {ascending: false})
          .limit(200),
        supabase
          .from('management_conversations')
          .select('*, user:profiles!management_conversations_user_id_fkey(email, full_name)')
          .in('status', ['open', 'waiting'])
          .order('updated_at', {ascending: false})
          .limit(200),
        supabase
          .from('memberships')
          .select('*, user:profiles(email, full_name), tier:membership_tiers(name)')
          .eq('status', 'verification')
          .order('updated_at', {ascending: false})
          .limit(50),
        supabase
          .from('membership_offers')
          .select('*, user:profiles(email, full_name), tier:membership_tiers(name)')
          .in('status', ['draft', 'sent', 'viewed'])
          .order('created_at', {ascending: false})
          .limit(50),
        supabase
          .from('experience_proposals')
          .select(
            '*, request:requests(id, title, status, user:profiles!requests_user_id_fkey(email, full_name))',
          )
          .in('status', ['draft', 'sent', 'viewed'])
          .order('created_at', {ascending: false})
          .limit(50),
        supabase
          .from('experience_payments')
          .select('*, request:requests(id, title, status)')
          .eq('status', 'paid')
          .order('paid_at', {ascending: false})
          .limit(50),
        supabase
          .from('experience_schedules')
          .select('*')
          .gte('starts_at', nowIso)
          .in('status', ['scheduled', 'changed'])
          .order('starts_at', {ascending: true})
          .limit(50),
        supabase
          .from('appointments')
          .select('*')
          .gte('starts_at', nowIso)
          .lte('starts_at', weekIso)
          .in('status', ['scheduled', 'confirmed'])
          .order('starts_at', {ascending: true})
          .limit(50),
        supabase
          .from('management_messages')
          .select('conversation_id, created_at')
          .is('read_at', null)
          .neq('sender_id', me)
          .order('created_at', {ascending: false})
          .limit(50),
      ]);

      const firstError = results.map((result) => result.error).find(Boolean);
      if (firstError) throw new Error(firstError.message);

      const [
        applicantsRes,
        requestsRes,
        conversationsRes,
        membershipsRes,
        offersRes,
        proposalsRes,
        experiencePaymentsRes,
        schedulesRes,
        appointmentsRes,
        unreadRes,
      ] = results;

      setData({
        applicants: (applicantsRes.data as ApplicantHit[]) ?? [],
        requests: (requestsRes.data as RequestHit[]) ?? [],
        conversations: (conversationsRes.data as ConversationHit[]) ?? [],
        memberships: (membershipsRes.data as MembershipHit[]) ?? [],
        offers: (offersRes.data as OfferHit[]) ?? [],
        proposals: (proposalsRes.data as ProposalHit[]) ?? [],
        experiencePayments: (experiencePaymentsRes.data as ExperiencePaymentHit[]) ?? [],
        schedules: (schedulesRes.data as ExperienceSchedule[]) ?? [],
        appointments: (appointmentsRes.data as Appointment[]) ?? [],
        unreadMessages: (unreadRes.data as Array<{conversation_id: string; created_at: string}>) ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the management dashboard.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading the dashboard" />;

  const pendingProposalCount = data.proposals.length + data.offers.length;
  const upcomingCount = data.schedules.length + data.appointments.length;
  const awaitingConfirmation = data.experiencePayments.filter(
    (payment) => first(payment.request)?.status === 'payment_required',
  );
  const upcomingAppointments = data.appointments.slice(0, 5);
  const scheduleRows: ScheduleRow[] = [
    ...upcomingAppointments.map((appointment) => ({
      key: `appointment-${appointment.id}`,
      title: appointment.title,
      when: formatDateTime(appointment.starts_at),
      meta: appointment.location ?? appointment.virtual_link ?? 'No location yet',
      status: appointment.status,
      tone: 'info' as ChipTone,
      href: '/management/bookings',
    })),
    ...data.schedules.slice(0, 5 - upcomingAppointments.length).map((schedule) => ({
      key: `schedule-${schedule.id}`,
      title: schedule.title,
      when: formatDateTime(schedule.starts_at),
      meta: schedule.location ?? schedule.virtual_link ?? 'No location yet',
      status: schedule.status,
      tone: 'gold' as ChipTone,
      href: '/management/calendar',
    })),
  ];
  const unreadConversationIds = new Set(
    data.unreadMessages.map((message) => message.conversation_id),
  );
  const newestApplicant = data.applicants.find(
    (applicant) => applicant.status === 'new' || applicant.status === 'submitted',
  );
  const newestSubmittedRequest = data.requests.find((request) => request.status === 'submitted');
  const reviewRequest = data.requests.find((request) => request.status === 'in_review');
  const unread = data.unreadMessages[0];
  const membershipReview = data.memberships[0];
  const pendingProposal = data.proposals[0];
  const pendingOffer = data.offers[0];
  const paidAwaitingConfirm = awaitingConfirmation[0];
  const upcomingAppointment = data.appointments[0];

  const metrics: Array<{key: string; label: string; value: number; to: string}> = [
    {key: 'applicants', label: 'New applicants', value: data.applicants.length, to: '/management/applicants'},
    {key: 'conversations', label: 'Active conversations', value: data.conversations.length, to: '/management/messages'},
    {key: 'requests', label: 'Open requests', value: data.requests.length, to: '/management/requests'},
    {key: 'reviews', label: 'Membership reviews', value: data.memberships.length, to: '/management/memberships'},
    {key: 'proposals', label: 'Pending proposals', value: pendingProposalCount, to: '/management/proposals'},
    {key: 'upcoming', label: 'Upcoming experiences', value: upcomingCount, to: '/management/calendar'},
  ];

  const attention: AttentionItem[] = [];
  if (newestApplicant) {
    attention.push({
      key: `applicant-${newestApplicant.id}`,
      icon: <UserPlus className="size-4" aria-hidden />,
      title: 'New applicant awaiting review',
      detail: `${personName(newestApplicant.user)}${newestApplicant.headline ? ` — ${newestApplicant.headline}` : ''}`,
      to: `/management/applicants/${newestApplicant.id}`,
      chip: {label: APPLICANT_STATUS_LABELS[newestApplicant.status as keyof typeof APPLICANT_STATUS_LABELS] ?? newestApplicant.status, tone: APPLICANT_STATUS_TONES[newestApplicant.status as keyof typeof APPLICANT_STATUS_TONES] ?? 'neutral'},
    });
  }
  if (unread) {
    attention.push({
      key: `message-${unread.conversation_id}-${unread.created_at}`,
      icon: <MessageSquare className="size-4" aria-hidden />,
      title: 'Message requiring a response',
      detail: `Newest unread reply ${relativeTime(unread.created_at)}`,
      to: `/management/messages/${unread.conversation_id}`,
      chip: {label: 'Unread', tone: 'gold'},
    });
  }
  if (membershipReview) {
    attention.push({
      key: `membership-${membershipReview.id}`,
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      title: 'Membership awaiting verification',
      detail: `${personName(membershipReview.user)} — ${first(membershipReview.tier)?.name ?? 'Membership'} · ${membershipReview.membership_number ?? 'no number yet'}`,
      to: `/management/memberships/${membershipReview.id}`,
      chip: {
        label: MEMBERSHIP_STATUS_LABELS[membershipReview.status] ?? membershipReview.status,
        tone: MEMBERSHIP_STATUS_TONES[membershipReview.status] ?? 'neutral',
      },
    });
  }
  if (newestSubmittedRequest) {
    attention.push({
      key: `request-${newestSubmittedRequest.id}`,
      icon: <ArrowRight className="size-4" aria-hidden />,
      title: 'New request awaiting review',
      detail: `${newestSubmittedRequest.title} — ${personName(newestSubmittedRequest.user)}`,
      to: `/management/requests/${newestSubmittedRequest.id}`,
      chip: {
        label: REQUEST_STATUS_LABELS[newestSubmittedRequest.status] ?? newestSubmittedRequest.status,
        tone: REQUEST_STATUS_TONES[newestSubmittedRequest.status] ?? 'neutral',
      },
    });
  } else if (reviewRequest) {
    attention.push({
      key: `request-${reviewRequest.id}`,
      icon: <ArrowRight className="size-4" aria-hidden />,
      title: 'Request in review',
      detail: `${reviewRequest.title} — ${personName(reviewRequest.user)}`,
      to: `/management/requests/${reviewRequest.id}`,
      chip: {
        label: REQUEST_STATUS_LABELS[reviewRequest.status] ?? reviewRequest.status,
        tone: REQUEST_STATUS_TONES[reviewRequest.status] ?? 'neutral',
      },
    });
  }
  if (pendingProposal) {
    attention.push({
      key: `proposal-${pendingProposal.id}`,
      icon: <Mail className="size-4" aria-hidden />,
      title: 'Proposal awaiting the member',
      detail: first(pendingProposal.request)?.title ?? 'Experience proposal',
      to: `/management/requests/${pendingProposal.request_id}`,
      chip: {label: pendingProposal.status, tone: pendingProposal.status === 'draft' ? 'neutral' : 'gold'},
    });
  } else if (pendingOffer) {
    attention.push({
      key: `offer-${pendingOffer.id}`,
      icon: <Mail className="size-4" aria-hidden />,
      title: 'Membership offer awaiting a response',
      detail: `${personName(pendingOffer.user)} — ${first(pendingOffer.tier)?.name ?? 'Offer'}`,
      to: '/management/proposals',
      chip: {label: pendingOffer.status, tone: pendingOffer.status === 'draft' ? 'neutral' : 'gold'},
    });
  }
  if (paidAwaitingConfirm) {
    attention.push({
      key: `payment-${paidAwaitingConfirm.id}`,
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      title: 'Payment verified — confirmation required',
      detail: first(paidAwaitingConfirm.request)?.title ?? 'Experience payment',
      to: `/management/requests/${paidAwaitingConfirm.request_id}`,
      chip: {
        label: PAYMENT_STATUS_LABELS[paidAwaitingConfirm.status] ?? paidAwaitingConfirm.status,
        tone: PAYMENT_STATUS_TONES[paidAwaitingConfirm.status] ?? 'neutral',
      },
    });
  }
  if (upcomingAppointment) {
    attention.push({
      key: `appointment-${upcomingAppointment.id}`,
      icon: <CalendarClock className="size-4" aria-hidden />,
      title: 'Upcoming appointment',
      detail: `${upcomingAppointment.title} — ${formatDateTime(upcomingAppointment.starts_at)}`,
      to: '/management/bookings',
      chip: {label: 'Scheduled', tone: 'info'},
    });
  }

  return (
    <div className="flex flex-col space-y-5 sm:space-y-10">
      <div className="order-1 lg:order-1">
        <PageHeader
          eyebrow="Overview"
          title="Management home"
          description="The bridge between every user and Gillian — everything that needs the team right now."
        />
      </div>

      {error ? (
        <div className="order-2 lg:order-2">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <section className="surface order-3 p-4 sm:p-6 lg:order-4" aria-label="Priority attention">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Priority attention
          </h2>
          <span className="text-xs text-muted">{attention.length} items</span>
        </div>
        {attention.length === 0 ? (
          <EmptyState
            title="Nothing needs attention."
            description="New applicants, requests, messages, payments and appointments appear here as soon as they arrive."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {attention.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="flex flex-wrap min-h-11 items-center justify-between gap-3 py-3.5 hover:bg-stone/40 sm:gap-4"
                >
                  <span className="flex flex-wrap min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-stone text-gold-deep">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium text-charcoal">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.detail}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap shrink-0 items-center gap-3">
                    {item.chip ? <Chip tone={item.chip.tone}>{item.chip.label}</Chip> : null}
                    <ArrowRight className="size-4 text-muted" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="order-4 lg:order-3" aria-label="Key metrics">
        {/* Phone: one panel of compact summary rows — label left, value right. */}
        <div className="surface divide-y divide-stone sm:hidden">
          {metrics.map((metric) => (
            <Link
              key={metric.key}
              to={metric.to}
              className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-stone/50"
            >
              <span className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {metric.label}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-lg font-semibold tabular-nums text-charcoal">{metric.value}</span>
                <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        {/* Tablet & desktop: the original analytics card grid. */}
        <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Link
              key={metric.key}
              to={metric.to}
              className="surface group flex min-h-11 items-center justify-between gap-3 p-4 transition-colors hover:bg-stone/50 sm:p-5"
            >
              <div className="min-w-0">
                <p className="break-words text-xs uppercase tracking-widest text-muted">{metric.label}</p>
                <p className="mt-1 text-3xl font-light text-charcoal">{metric.value}</p>
              </div>
              <ArrowRight
                className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold-deep"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <div className="order-5 grid gap-4 sm:gap-6 lg:grid-cols-3 lg:order-5">
        <section className="surface p-4 sm:p-6" aria-label="Latest applicants">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Latest applicants
            </h2>
            <Link to="/management/applicants" className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0">
              View all
            </Link>
          </div>
          {data.applicants.length === 0 ? (
            <p className="text-sm text-muted">No applicants waiting for review.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.applicants.slice(0, 5).map((applicant) => (
                <li key={applicant.id}>
                  <Link
                    to={`/management/applicants/${applicant.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">
                        {personName(applicant.user)}
                      </span>
                      <span className="block text-xs text-muted">
                        {relativeTime(applicant.created_at)}
                      </span>
                    </span>
                    <Chip
                      tone={
                        APPLICANT_STATUS_TONES[applicant.status as keyof typeof APPLICANT_STATUS_TONES] ??
                        'neutral'
                      }
                    >
                      {APPLICANT_STATUS_LABELS[applicant.status as keyof typeof APPLICANT_STATUS_LABELS] ??
                        applicant.status}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-6" aria-label="Open requests">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Open requests
            </h2>
            <Link to="/management/requests" className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0">
              View all
            </Link>
          </div>
          {data.requests.length === 0 ? (
            <p className="text-sm text-muted">No open requests right now.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.requests.slice(0, 5).map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/management/requests/${request.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">{request.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {personName(request.user)} · {relativeTime(request.submitted_at)}
                      </span>
                    </span>
                    <Chip tone={REQUEST_STATUS_TONES[request.status] ?? 'neutral'}>
                      {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-6" aria-label="Upcoming schedule">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Upcoming schedule
            </h2>
            <Link to="/management/calendar" className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0">
              Calendar
            </Link>
          </div>
          {upcomingAppointments.length === 0 && data.schedules.length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled ahead.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {upcomingAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <Link
                    to="/management/bookings"
                    className="flex flex-wrap min-h-11 items-center justify-between gap-3 border-l-2 border-[#C89B3C]/45 py-3 pl-3.5 hover:bg-stone/40 lg:border-l-0 lg:pl-0 lg:py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">{appointment.title}</span>
                      <span className="block text-xs text-muted">
                        {formatDateTime(appointment.starts_at)}
                      </span>
                    </span>
                    <Chip tone="info">{appointment.status}</Chip>
                  </Link>
                </li>
              ))}
              {data.schedules.slice(0, 5 - upcomingAppointments.length).map((schedule) => (
                <li key={schedule.id}>
                  <Link
                    to="/management/calendar"
                    className="flex flex-wrap min-h-11 items-center justify-between gap-3 border-l-2 border-[#C89B3C]/45 py-3 pl-3.5 hover:bg-stone/40 lg:border-l-0 lg:pl-0 lg:py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">{schedule.title}</span>
                      <span className="block text-xs text-muted">
                        {formatDateTime(schedule.starts_at)}
                      </span>
                    </span>
                    <Chip tone="gold">{schedule.status}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="order-6 lg:order-6" aria-label="Quick actions">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.key}
              to={action.to}
              className="surface flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:border-gold hover:text-gold-deep"
            >
              <span className="min-w-0 truncate">{action.label}</span>
              <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
