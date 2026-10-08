import {
  CalendarDays,
  CreditCard,
  FileText,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {GaBrand} from '../../components/ui/GaBrand';
import {LEGAL_LINKS} from '../public/legal/legalNav';
import {ErrorNote} from './components/SectionCard';
import {loadConversationSummaries, type ConversationSummary} from '../../lib/conversations';
import {greetingForNow, relativeTime} from '../../lib/format';
import {useLiveRefresh} from '../../hooks/useLiveRefresh';
import {REQUEST_STATUS_LABELS} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {
  ApplicantProfile,
  Appointment,
  Membership,
  Notification,
  Request,
  RequestStatus,
} from '../../types';

/** Footer row: the legal desk, then contact — same labels as every other footer. */
const FOOTER_LINKS = [...LEGAL_LINKS, {label: 'Contact', to: '/dashboard/messages'}];

interface DashboardData {
  applicant: ApplicantProfile | null;
  membership: Membership | null;
  tierName: string | null;
  conversation: ConversationSummary | null;
  unreadMessagesCount: number;
  requests: Request[];
  appointments: Appointment[];
  notifications: Notification[];
}

const EMPTY: DashboardData = {
  applicant: null,
  membership: null,
  tierName: null,
  conversation: null,
  unreadMessagesCount: 0,
  requests: [],
  appointments: [],
  notifications: [],
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function DashboardHomePage() {
  const {profile, role, session} = useAuth();
  const me = session?.user.id ?? null;
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [
        applicantRes,
        membershipRes,
        conversationSummary,
        requestsRes,
        appointmentsRes,
        notificationsRes,
      ] = await Promise.all([
        supabase.from('applicant_profiles').select('*').order('created_at', {ascending: false}).limit(1).maybeSingle(),
        supabase.from('memberships').select('*').order('created_at', {ascending: false}).limit(1).maybeSingle(),
        loadConversationSummaries(me, 50),
        supabase.from('requests').select('*').order('created_at', {ascending: false}).limit(50),
        supabase
          .from('appointments')
          .select('*')
          .gte('starts_at', new Date().toISOString())
          .in('status', ['scheduled', 'confirmed'])
          .order('starts_at', {ascending: true})
          .limit(5),
        supabase.from('notifications').select('*').order('created_at', {ascending: false}).limit(5),
      ]);

      const firstError = [applicantRes, membershipRes, requestsRes, appointmentsRes, notificationsRes]
        .map((r) => r.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);

      const membership = (membershipRes.data as Membership | null) ?? null;
      let tierName: string | null = null;
      if (membership?.tier_id) {
        const tierRes = await supabase
          .from('membership_tiers')
          .select('name')
          .eq('id', membership.tier_id)
          .maybeSingle();
        if (tierRes.data?.name) {
          tierName = tierRes.data.name;
        }
      }

      const activeConv = conversationSummary.conversations[0] ?? null;
      const unreadCount = activeConv
        ? (conversationSummary.unreadByConversation[activeConv.id] || 0)
        : 0;

      setData({
        applicant: (applicantRes.data as ApplicantProfile | null) ?? null,
        membership,
        tierName,
        conversation: activeConv,
        unreadMessagesCount: unreadCount,
        requests: (requestsRes.data as Request[]) ?? [],
        appointments: (appointmentsRes.data as Appointment[]) ?? [],
        notifications: (notificationsRes.data as Notification[]) ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);

  useLiveRefresh(refreshLive, [
    'notifications',
    'memberships',
    'membership_cards',
    'membership_offers',
    'requests',
    'appointments',
    'management_messages',
    'management_conversations',
  ]);

  if (loading && !error) return <FullPageLoader />;
  if (error) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="font-serif text-3xl text-[#1E1E1E]">Dashboard</h1>
        <ErrorNote message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (role === 'management' || role === 'admin') return <Navigate to="/management" replace />;

  const displayName =
    profile?.full_name?.trim().split(' ')[0] ||
    profile?.email?.split('@')[0] ||
    'Member';
  const openRequests = data.requests.filter(
    (r) => !['completed', 'declined', 'cancelled'].includes(r.status),
  );
  const lastMessage = data.conversation?.last;

  const getStatusBadge = (status: RequestStatus) => {
    const label = (REQUEST_STATUS_LABELS[status] || status).toUpperCase();
    if (status === 'in_review' || status === 'submitted') {
      return (
        <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#9A7326]">
          {label}
        </span>
      );
    }
    if (status === 'information_requested') {
      return (
        <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDF3E7] text-[#B25E09]">
          {label}
        </span>
      );
    }
    if (status === 'confirmed' || status === 'approved' || status === 'completed') {
      return (
        <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
          {label}
        </span>
      );
    }
    return (
      <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
        {label}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          1. WELCOME GREETING
      ========================================================================= */}
      <div className="sm:mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1E1E] font-medium tracking-tight">
          {greetingForNow()}, {displayName}.
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6A63]">
          Here's what's happening in your private space.
          <span className="sr-only">
            {' '}You are connected with management. Your next step is to tell us what you would like to explore.
          </span>
        </p>
      </div>

      {/* =========================================================================
          2. TOP ROW: 4 STATUS / KPI CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4 sm:mb-8">
        {/* Card 1: MEMBERSHIP */}
        <div className="bg-white rounded-xl border border-[#EAE4DA] p-3.5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/50 transition-colors sm:p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center shrink-0 sm:h-8 sm:w-8">
                <CreditCard className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8C8275] sm:text-[10px]">
                MEMBERSHIP
              </span>
            </div>
            <h3 className="font-serif text-sm sm:text-lg font-medium text-[#1E1E1E] mt-2.5 sm:mt-3.5">
              {data.membership
                ? data.membership.status === 'active'
                  ? data.tierName
                    ? `${data.tierName} Member`
                    : 'Active Member'
                  : `Status: ${data.membership.status}`
                : (
                  <>
                    Not Yet Active
                    <span className="sr-only">Not a member yet. No membership yet.</span>
                  </>
                )}
            </h3>
          </div>
          <div className="mt-3 border-t border-[#F5EFE6] pt-2.5 sm:mt-4 sm:pt-3">
            <Link
              to="/dashboard/membership"
              className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
            >
              <span>VIEW</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: MANAGEMENT */}
        <div className="bg-white rounded-xl border border-[#EAE4DA] p-3.5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/50 transition-colors sm:p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center shrink-0 sm:h-8 sm:w-8">
                <MessageSquare className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8C8275] sm:text-[10px]">
                MANAGEMENT
              </span>
            </div>
            <h3 className="font-serif text-sm sm:text-lg font-medium text-[#1E1E1E] mt-2.5 sm:mt-3.5">
              {data.conversation
                ? data.unreadMessagesCount > 0
                  ? `${data.unreadMessagesCount} Unread Message${data.unreadMessagesCount > 1 ? 's' : ''}`
                  : '1 Active Conversation'
                : (
                  <>
                    No Active Conversation
                    <span className="sr-only">No conversation yet.</span>
                  </>
                )}
            </h3>
          </div>
          <div className="mt-3 border-t border-[#F5EFE6] pt-2.5 sm:mt-4 sm:pt-3">
            <Link
              to={data.conversation ? `/dashboard/messages/${data.conversation.id}` : '/dashboard/messages'}
              className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
            >
              <span>OPEN</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: REQUESTS */}
        <div className="bg-white rounded-xl border border-[#EAE4DA] p-3.5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/50 transition-colors sm:p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center shrink-0 sm:h-8 sm:w-8">
                <FileText className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8C8275] sm:text-[10px]">
                REQUESTS
              </span>
            </div>
            <h3 className="font-serif text-sm sm:text-lg font-medium text-[#1E1E1E] mt-2.5 sm:mt-3.5">
              {openRequests.length > 0
                ? `${openRequests.length} Active Request${openRequests.length === 1 ? '' : 's'}`
                : (
                  <>
                    No Active Requests
                    <span className="sr-only">Nothing here yet.</span>
                  </>
                )}
            </h3>
          </div>
          <div className="mt-3 border-t border-[#F5EFE6] pt-2.5 sm:mt-4 sm:pt-3">
            <Link
              to="/dashboard/requests"
              className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
            >
              <span>VIEW</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 4: EXPERIENCES */}
        <div className="bg-white rounded-xl border border-[#EAE4DA] p-3.5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/50 transition-colors sm:p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center shrink-0 sm:h-8 sm:w-8">
                <CalendarDays className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8C8275] sm:text-[10px]">
                EXPERIENCES
              </span>
            </div>
            <h3 className="font-serif text-sm sm:text-lg font-medium text-[#1E1E1E] mt-2.5 sm:mt-3.5">
              {data.appointments.length > 0
                ? `${data.appointments.length} Confirmed Experience${data.appointments.length === 1 ? '' : 's'}`
                : (
                  <>
                    No Upcoming Experience
                    <span className="sr-only">Nothing scheduled yet.</span>
                  </>
                )}
            </h3>
          </div>
          <div className="mt-3 border-t border-[#F5EFE6] pt-2.5 sm:mt-4 sm:pt-3">
            <Link
              to="/dashboard/experiences"
              className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
            >
              <span>VIEW</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN 3-COLUMN CONTENT GRID (Matches uploaded image exactly)
      ========================================================================= */}
      <div className="grid grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-12 mb-6 sm:mb-10 items-start">
        {/* -----------------------------------------------------------------------
            COLUMN 1 (Left 5 cols): YOUR REQUESTS + UPCOMING
        ----------------------------------------------------------------------- */}
        <div className="contents lg:col-span-5 lg:block lg:space-y-5">
          {/* Box 1: YOUR REQUESTS */}
          <div className="order-3 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6] mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                YOUR REQUESTS
              </h2>
              <Link
                to="/dashboard/requests"
                className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] transition-colors"
              >
                VIEW ALL →
              </Link>
            </div>

            {data.requests.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-stone-500 mb-3">
                  No requests yet. When management receives your first request, it will appear here.
                </p>
                <Link
                  to="/dashboard/requests/new"
                  className="inline-block border border-[#D9D1C3] hover:border-[#C89B3C] text-[#1E1E1E] hover:text-[#C89B3C] text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-colors"
                >
                  MAKE A REQUEST →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.requests.slice(0, 2).map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg bg-stone-50/60 border border-[#EAE4DA] flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 sm:h-12 sm:w-14 rounded bg-[#FAF5EB] border border-[#EAE4DA] text-[#C89B3C] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 stroke-[1.6]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#1E1E1E] truncate max-w-[140px] sm:max-w-[170px]">
                          {request.title}
                        </h4>
                        <div className="mt-0.5">{getStatusBadge(request.status)}</div>
                        <div className="text-[10px] text-[#8C8275] mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A89F91]" />
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/dashboard/requests/${request.id}`}
                      className="shrink-0 border border-[#D9D1C3] hover:border-[#C89B3C] text-[#1E1E1E] hover:text-[#C89B3C] text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-sm transition-colors whitespace-nowrap"
                    >
                      {request.status === 'information_requested' ? 'CONTINUE →' : 'VIEW REQUEST →'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: UPCOMING */}
          <div className="order-4 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6] mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                UPCOMING
              </h2>
              <Link
                to="/dashboard/experiences"
                className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] transition-colors"
              >
                VIEW ALL →
              </Link>
            </div>

            {data.appointments.length > 0 ? (
              <div className="space-y-3">
                {data.appointments.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg bg-stone-50/60 border border-[#EAE4DA] flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[#1E1E1E]">{app.title}</h4>
                      <p className="text-[10px] text-[#8C8275] mt-0.5">{formatDate(app.starts_at)}</p>
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-4 h-4 stroke-[1.8]" />
                </div>
                <h4 className="font-serif text-sm font-medium text-[#1E1E1E] mb-1">
                  No upcoming experiences
                </h4>
                <p className="text-xs text-[#6E6A63] max-w-xs mx-auto mb-4 leading-relaxed">
                  Once management confirms an experience for you, the details will appear here.
                </p>
                <Link
                  to="/dashboard/experiences"
                  className="inline-block border border-[#D9D1C3] hover:border-[#C89B3C] text-[#1E1E1E] hover:text-[#C89B3C] text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-colors"
                >
                  EXPLORE EXPERIENCES →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            COLUMN 2 (Center 4 cols): MANAGEMENT + MEMBERSHIP
        ----------------------------------------------------------------------- */}
        <div className="contents lg:col-span-4 lg:block lg:space-y-5">
          {/* Box 1: MANAGEMENT (Latest Conversation) */}
          <div className="order-1 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs flex flex-col justify-between sm:p-5">
            <div>
              <div className="pb-3 border-b border-[#F5EFE6] mb-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                  MANAGEMENT
                </h2>
              </div>

              {/* Sender lockup */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#F5EFE6] border border-[#EAE4DA] flex items-center justify-center font-serif text-[10px] font-semibold text-[#1E1E1E] shrink-0">
                  GA
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#1E1E1E] leading-tight">
                    Gillian Anderson Management
                  </span>
                  {lastMessage ? (
                    <span className="text-[10px] text-[#8C8275] leading-tight mt-0.5">
                      {relativeTime(lastMessage.created_at)}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Message preview snippet */}
              <p className="text-xs text-[#4A4742] leading-relaxed my-4 line-clamp-3 bg-[#FAF8F5] p-3 rounded-lg border border-[#F0ECE1]">
                {lastMessage
                  ? lastMessage.body
                  : 'No conversation yet. Start a private conversation with management.'}
              </p>
            </div>

            <Link
              to={data.conversation ? `/dashboard/messages/${data.conversation.id}` : '/dashboard/messages'}
              className="w-full bg-[#1E1E1E] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-sm flex items-center justify-center gap-1.5 transition-colors text-center mt-2"
            >
              <span>OPEN CONVERSATION</span>
              <span>→</span>
            </Link>
          </div>

          {/* Box 2: MEMBERSHIP */}
          <div className="order-5 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#C89B3C] flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 stroke-[1.8]" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C8275]">
                MEMBERSHIP
              </span>
            </div>

            <h3 className="font-serif text-sm font-medium text-[#1E1E1E] mt-2 mb-1">
              {data.membership
                ? data.membership.status === 'active'
                  ? 'Active Membership'
                  : `Membership Status: ${data.membership.status}`
                : 'Not yet a member'}
            </h3>
            <p className="text-xs text-[#6E6A63] leading-relaxed mb-4">
              Membership is discussed and arranged through management.
            </p>

            <Link
              to="/dashboard/membership"
              className="inline-block border border-[#D9D1C3] hover:border-[#C89B3C] text-[#1E1E1E] hover:text-[#C89B3C] text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-colors"
            >
              DISCUSS MEMBERSHIP →
            </Link>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            COLUMN 3 (Right 3 cols): RECENT NOTIFICATIONS + QUICK ACTIONS
        ----------------------------------------------------------------------- */}
        <div className="contents lg:col-span-3 lg:block lg:space-y-5">
          {/* Box 1: RECENT NOTIFICATIONS */}
          <div className="order-6 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6] mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                RECENT NOTIFICATIONS
              </h2>
              <Link
                to="/dashboard/notifications"
                className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] transition-colors"
              >
                VIEW ALL →
              </Link>
            </div>

            {data.notifications.length === 0 ? (
              <p className="py-4 text-xs text-stone-500">
                You're up to date. Notifications will appear here.
              </p>
            ) : (
              <div className="divide-y divide-[#F0ECE1]">
                {data.notifications.slice(0, 3).map((notif) => (
                  <Link
                    key={notif.id}
                    to={`/dashboard/notifications/${notif.id}`}
                    className="flex items-center justify-between py-2.5 group hover:bg-stone-50/60 -mx-1 px-1 rounded transition-colors"
                  >
                    <div className="flex items-start gap-2 min-w-0 pr-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] shrink-0 mt-1.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-[#1E1E1E] font-medium leading-snug truncate group-hover:text-[#A67F2C]">
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-[#8C8275] mt-0.5">
                          {relativeTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#B5AEA3] group-hover:text-[#1E1E1E] shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: QUICK ACTIONS */}
          <div className="order-2 bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-xs sm:p-5">
            <div className="pb-3 border-b border-[#F5EFE6] mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                QUICK ACTIONS
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/dashboard/messages"
                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE4DA] hover:border-[#C89B3C] hover:bg-white transition-all flex flex-col justify-between text-left group"
              >
                <MessageSquare className="w-4 h-4 text-[#8C8275] group-hover:text-[#C89B3C] mb-2" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#A67F2C] leading-snug">
                  MESSAGE MANAGEMENT →
                </span>
              </Link>

              <Link
                to="/dashboard/requests/new"
                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE4DA] hover:border-[#C89B3C] hover:bg-white transition-all flex flex-col justify-between text-left group"
              >
                <FileText className="w-4 h-4 text-[#8C8275] group-hover:text-[#C89B3C] mb-2" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#A67F2C] leading-snug">
                  MAKE A REQUEST →
                </span>
              </Link>

              <Link
                to="/dashboard/experiences"
                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE4DA] hover:border-[#C89B3C] hover:bg-white transition-all flex flex-col justify-between text-left group"
              >
                <CalendarDays className="w-4 h-4 text-[#8C8275] group-hover:text-[#C89B3C] mb-2" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#A67F2C] leading-snug">
                  VIEW EXPERIENCES →
                </span>
              </Link>

              <Link
                to="/dashboard/membership"
                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE4DA] hover:border-[#C89B3C] hover:bg-white transition-all flex flex-col justify-between text-left group"
              >
                <CreditCard className="w-4 h-4 text-[#8C8275] group-hover:text-[#C89B3C] mb-2" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E1E1E] group-hover:text-[#A67F2C] leading-snug">
                  MEMBERSHIP →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. SUBTLE FOOTER LOCKUP
      ========================================================================= */}
      <footer className="py-6 border-t border-[#EAE4DA] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C8275] gap-3">
        <GaBrand variant="light" size="sm" to="/home" />

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[#8C8275]">
          {FOOTER_LINKS.map((item) => (
            <span key={item.to} className="flex items-center">
              <Link
                to={item.to}
                className="inline-flex min-h-10 items-center transition-colors hover:text-[#1E1E1E]"
              >
                {item.label}
              </Link>
              <span aria-hidden className="hidden text-[#C89B3C]/70 sm:inline">
                ·
              </span>
            </span>
          ))}
          <span className="inline-flex min-h-10 items-center">
            © Gillian Anderson Management
          </span>
        </div>
      </footer>
    </div>
  );
}
