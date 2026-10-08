import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Inbox,
  Mail,
  MessageSquare,
  MessagesSquare,
  Send,
  UserPlus,
  Users,
} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime, relativeTime} from '../../lib/format';
import {MEMBERSHIP_STATUS_LABELS, MEMBERSHIP_STATUS_TONES} from '../../lib/membership';
import {PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES} from '../../lib/payments';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {ChipTone} from '../../lib/requests';
import {APPLICANT_STATUS_LABELS, APPLICANT_STATUS_TONES} from './shared';
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
      }
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

/**
 * Restrained per-category tints: a very pale surface, a hairline border and a
 * darkened label shade that keeps small uppercase text above 4.5:1. Every
 * class is written out literally so Tailwind's scanner can see it.
 */
const ACCENTS = {
  purple: {
    card: 'bg-[#F1EFFE] border-[#E4E0FC]',
    hover: 'hover:border-[#7C6CF2]/45',
    iconBg: 'bg-[#7C6CF2]/15',
    ring: 'ring-[#7C6CF2]/25',
    icon: 'text-[#7C6CF2]',
    label: 'text-[#5A4BCF]',
  },
  green: {
    card: 'bg-[#EBF8F1] border-[#D3F0E1]',
    hover: 'hover:border-[#45B987]/50',
    iconBg: 'bg-[#45B987]/16',
    ring: 'ring-[#45B987]/30',
    icon: 'text-[#39A87A]',
    label: 'text-[#256B4E]',
  },
  blue: {
    card: 'bg-[#EDF3FE] border-[#D9E6FD]',
    hover: 'hover:border-[#4F8EF7]/50',
    iconBg: 'bg-[#4F8EF7]/14',
    ring: 'ring-[#4F8EF7]/25',
    icon: 'text-[#4F8EF7]',
    label: 'text-[#2A61C7]',
  },
  orange: {
    card: 'bg-[#FEF3E7] border-[#FBE5CE]',
    hover: 'hover:border-[#F3A64A]/55',
    iconBg: 'bg-[#F3A64A]/16',
    ring: 'ring-[#F3A64A]/30',
    icon: 'text-[#DE8B22]',
    label: 'text-[#9A5B12]',
  },
  violet: {
    card: 'bg-[#F3F1FE] border-[#E6E1FD]',
    hover: 'hover:border-[#9A8AF7]/50',
    iconBg: 'bg-[#9A8AF7]/16',
    ring: 'ring-[#9A8AF7]/30',
    icon: 'text-[#8B7CF6]',
    label: 'text-[#5F51D8]',
  },
  rose: {
    card: 'bg-[#FCF0F6] border-[#F8DBEA]',
    hover: 'hover:border-[#D875A5]/50',
    iconBg: 'bg-[#D875A5]/15',
    ring: 'ring-[#D875A5]/30',
    icon: 'text-[#D875A5]',
    label: 'text-[#A63F73]',
  },
  cyan: {
    card: 'bg-[#EAF7F9] border-[#CFEEF3]',
    hover: 'hover:border-[#3CBFCF]/55',
    iconBg: 'bg-[#3CBFCF]/16',
    ring: 'ring-[#3CBFCF]/30',
    icon: 'text-[#2AA7B8]',
    label: 'text-[#126E7C]',
  },
  gold: {
    card: 'bg-[#FAF4E8] border-[#EFE1C6]',
    hover: 'hover:border-[#C99A3D]/55',
    iconBg: 'bg-[#C99A3D]/16',
    ring: 'ring-[#C99A3D]/30',
    icon: 'text-[#C99A3D]',
    label: 'text-[#8A6520]',
  },
} as const;

type AccentKey = keyof typeof ACCENTS;

interface StatMetric {
  key: string;
  label: string;
  value: number;
  to: string;
  icon: ReactNode;
  accent: AccentKey;
  note?: string;
}

interface QuickAction {
  key: string;
  label: string;
  to: string;
  accent: AccentKey;
  icon: ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'requests',
    label: 'Open requests',
    to: '/management/requests',
    accent: 'orange',
    icon: <Inbox className="size-5" aria-hidden />,
  },
  {
    key: 'messages',
    label: 'Messages',
    to: '/management/messages',
    accent: 'purple',
    icon: <MessageSquare className="size-5" aria-hidden />,
  },
  {
    key: 'applicants',
    label: 'Applicants',
    to: '/management/applicants',
    accent: 'green',
    icon: <Users className="size-5" aria-hidden />,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    to: '/management/calendar',
    accent: 'blue',
    icon: <CalendarDays className="size-5" aria-hidden />,
  },
  {
    key: 'memberships',
    label: 'Memberships',
    to: '/management/memberships',
    accent: 'rose',
    icon: <BadgeCheck className="size-5" aria-hidden />,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    to: '/management/bookings',
    accent: 'gold',
    icon: <CalendarClock className="size-5" aria-hidden />,
  },
];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function personName(person: MaybePerson): string {
  const ref = first(person);
  return ref?.full_name || ref?.email || 'Account';
}

/** Statistic card: tinted surface, colored icon well, label over a dominant number. */
function StatCard({metric, className = ''}: {metric: StatMetric; className?: string}) {
  const a = ACCENTS[metric.accent];
  return (
    <Link
      to={metric.to}
      className={`group flex min-w-0 flex-col gap-3 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-16px_rgba(16,24,40,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 ${a.card} ${a.hover} ${className}`}
    >
      <span
        className={`grid size-10 place-items-center rounded-xl ring-1 ${a.iconBg} ${a.ring} ${a.icon}`}
      >
        {metric.icon}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-[11px] font-semibold uppercase tracking-[0.12em] ${a.label}`}
        >
          {metric.label}
        </span>
        <span className="mt-1 block text-[28px] font-semibold leading-none tabular-nums text-charcoal sm:text-[32px]">
          {metric.value}
        </span>
        {metric.note ? (
          <span className="mt-1.5 block text-xs text-muted">{metric.note}</span>
        ) : null}
      </span>
    </Link>
  );
}

/**
 * Activity panel: accent icon well, understated text action top-right,
 * children hold the list or the polished empty state.
 */
function PanelCard({
  title,
  icon,
  accent,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  accent: AccentKey;
  action: {label: string; to: string};
  children: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-[#ECE9E2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${a.iconBg} ${a.ring} ${a.icon}`}
          >
            {icon}
          </span>
          <h2 className="min-w-0 truncate font-sans text-xs font-semibold uppercase tracking-[0.14em] text-charcoal">
            {title}
          </h2>
        </span>
        <Link
          to={action.to}
          className="shrink-0 text-xs font-semibold text-[#8A6520] underline-offset-4 transition hover:underline motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Empty state that keeps the card's accent instead of leaving a blank box. */
function PanelEmpty({
  icon,
  accent,
  children,
}: {
  icon: ReactNode;
  accent: AccentKey;
  children: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-9 text-center ${a.card}`}
    >
      <span
        className={`grid size-11 place-items-center rounded-2xl ring-1 ${a.iconBg} ${a.ring} ${a.icon}`}
      >
        {icon}
      </span>
      <p className="text-sm font-medium text-charcoal">{children}</p>
    </div>
  );
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
          .in('status', ['open', 'waiting', 'closed'])
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
  const unreadConversationIds = new Set(
    data.unreadMessages.map((message) => message.conversation_id),
  );
  const activeConversationCount = data.conversations.filter(
    (conversation) =>
      conversation.status !== 'closed' || unreadConversationIds.has(conversation.id),
  ).length;
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

  const metrics: StatMetric[] = [
    {
      key: 'unread',
      label: 'Unread',
      value: data.unreadMessages.length,
      to: '/management/messages',
      icon: <Mail className="size-5" aria-hidden />,
      accent: 'purple',
      note: unread ? `Newest ${relativeTime(unread.created_at)}` : '',
    },
    {
      key: 'applicants',
      label: 'New applicants',
      value: data.applicants.length,
      to: '/management/applicants',
      icon: <UserPlus className="size-5" aria-hidden />,
      accent: 'green',
      note: '',
    },
    {
      key: 'conversations',
      label: 'Active conversations',
      value: activeConversationCount,
      to: '/management/messages',
      icon: <MessagesSquare className="size-5" aria-hidden />,
      accent: 'blue',
      note: '',
    },
    {
      key: 'requests',
      label: 'Open requests',
      value: data.requests.length,
      to: '/management/requests',
      icon: <Inbox className="size-5" aria-hidden />,
      accent: 'orange',
      note: '',
    },
    {
      key: 'reviews',
      label: 'Membership reviews',
      value: data.memberships.length,
      to: '/management/memberships',
      icon: <BadgeCheck className="size-5" aria-hidden />,
      accent: 'violet',
      note: '',
    },
    {
      key: 'proposals',
      label: 'Pending proposals',
      value: pendingProposalCount,
      to: '/management/proposals',
      icon: <Send className="size-5" aria-hidden />,
      accent: 'rose',
      note: '',
    },
    {
      key: 'upcoming',
      label: 'Upcoming experiences',
      value: upcomingCount,
      to: '/management/calendar',
      icon: <CalendarClock className="size-5" aria-hidden />,
      accent: 'cyan',
      note: '',
    },
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
      icon: <Inbox className="size-4" aria-hidden />,
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
      icon: <Inbox className="size-4" aria-hidden />,
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

  const primaryMetrics = metrics.slice(0, 4);
  const secondaryMetrics = metrics.slice(4);

  return (
    <div className="-mx-4 -my-6 bg-[#F7F7F5] px-4 py-6 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10 lg:-ml-8 lg:pl-8">
      <div className="space-y-5 sm:space-y-8">
        <header className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6520]">
            Overview
          </p>
          <h1 className="mt-1.5 break-words text-[26px] leading-tight sm:text-[30px] lg:text-[36px]">
            Management home
          </h1>
          <p className="mt-2 break-words text-sm leading-relaxed text-muted sm:text-[15px]">
            The bridge between every user and Gillian — everything that needs the team right now.
          </p>
        </header>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <section
          aria-label="Priority attention"
          className="overflow-hidden rounded-2xl border border-[#EBDCBB] bg-gradient-to-br from-[#FDF8EE] via-[#FCF5E7] to-[#F9F1DF] shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE3C8] px-4 py-3 sm:px-5">
            <span className="flex items-center gap-2.5">
              <span
                className="size-1.5 rounded-full bg-[#D4A94F] ring-4 ring-[#D4A94F]/20"
                aria-hidden
              />
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#7F5C17]">
                Priority attention
              </h2>
            </span>
            <span className="rounded-full border border-[#E4D2A8] bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] tabular-nums text-[#7F5C17]">
              {attention.length} {attention.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-8 text-center sm:px-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/70 text-[#C99A3D] ring-1 ring-[#E4D2A8]">
                <BadgeCheck className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-charcoal">Nothing needs attention.</p>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                New applicants, requests, messages, payments and appointments appear here as soon as
                they arrive.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EFE3C8]/80">
              {attention.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className="group flex min-h-11 flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-white/60 sm:gap-4 sm:px-5"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F3A64A]/15 text-[#C07C1E] ring-1 ring-[#F3A64A]/25">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-charcoal">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block break-words text-[13px] text-muted">
                        {item.detail}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      {item.chip ? <Chip tone={item.chip.tone}>{item.chip.label}</Chip> : null}
                      <ArrowRight
                        className="size-4 text-[#B0A795] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Key metrics" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {primaryMetrics.map((metric) => (
              <StatCard key={metric.key} metric={metric} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {secondaryMetrics.map((metric, index) => (
              <StatCard
                key={metric.key}
                metric={metric}
                className={
                  index === secondaryMetrics.length - 1 ? 'max-sm:col-span-2 lg:col-span-2' : ''
                }
              />
            ))}
          </div>
        </section>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <PanelCard
            title="Latest applicants"
            icon={<Users className="size-4" aria-hidden />}
            accent="green"
            action={{label: 'View all', to: '/management/applicants'}}
          >
            {data.applicants.length === 0 ? (
              <PanelEmpty icon={<Users className="size-5" aria-hidden />} accent="green">
                No applicants waiting for review.
              </PanelEmpty>
            ) : (
              <ul className="divide-y divide-stone/70">
                {data.applicants.slice(0, 5).map((applicant) => (
                  <li key={applicant.id}>
                    <Link
                      to={`/management/applicants/${applicant.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 transition-colors hover:bg-stone/40"
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
                          APPLICANT_STATUS_TONES[
                            applicant.status as keyof typeof APPLICANT_STATUS_TONES
                          ] ?? 'neutral'
                        }
                      >
                        {APPLICANT_STATUS_LABELS[
                          applicant.status as keyof typeof APPLICANT_STATUS_LABELS
                        ] ?? applicant.status}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Open requests"
            icon={<Inbox className="size-4" aria-hidden />}
            accent="orange"
            action={{label: 'View all', to: '/management/requests'}}
          >
            {data.requests.length === 0 ? (
              <PanelEmpty icon={<Inbox className="size-5" aria-hidden />} accent="orange">
                No open requests right now.
              </PanelEmpty>
            ) : (
              <ul className="divide-y divide-stone/70">
                {data.requests.slice(0, 5).map((request) => (
                  <li key={request.id}>
                    <Link
                      to={`/management/requests/${request.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 transition-colors hover:bg-stone/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-charcoal">
                          {request.title}
                        </span>
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
          </PanelCard>

          <PanelCard
            title="Upcoming schedule"
            icon={<CalendarDays className="size-4" aria-hidden />}
            accent="blue"
            action={{label: 'Calendar', to: '/management/calendar'}}
          >
            {upcomingAppointments.length === 0 && data.schedules.length === 0 ? (
              <PanelEmpty icon={<CalendarDays className="size-5" aria-hidden />} accent="blue">
                Nothing scheduled ahead.
              </PanelEmpty>
            ) : (
              <ul className="divide-y divide-stone/70">
                {upcomingAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      to="/management/bookings"
                      className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-2.5 transition-colors hover:bg-stone/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-charcoal">
                          {appointment.title}
                        </span>
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
                      className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-2.5 transition-colors hover:bg-stone/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-charcoal">
                          {schedule.title}
                        </span>
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
          </PanelCard>
        </div>

        <section aria-label="Quick actions">
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-charcoal">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((action) => {
              const a = ACCENTS[action.accent];
              return (
                <Link
                  key={action.key}
                  to={action.to}
                  className={`group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border px-3 py-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-16px_rgba(16,24,40,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${a.card} ${a.hover}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full ring-1 ${a.iconBg} ${a.ring} ${a.icon}`}
                  >
                    {action.icon}
                  </span>
                  <span className="min-w-0 break-words text-[13px] font-medium leading-tight text-charcoal">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
