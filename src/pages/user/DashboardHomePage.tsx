import {ArrowUpRight, CalendarDays, FileText, MessagesSquare, Send, UserRound} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Chip} from '../../components/ui/Chip';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {loadConversationSummaries, type ConversationSummary} from '../../lib/conversations';
import {formatDateTime, greetingForNow, relativeTime} from '../../lib/format';
import {useLiveRefresh} from '../../hooks/useLiveRefresh';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES, EXPERIENCE_REQUEST_TYPES} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {
  ApplicantProfile,
  Appointment,
  Membership,
  Notification,
  Request,
} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

interface DashboardData {
  applicant: ApplicantProfile | null;
  membership: Membership | null;
  conversation: ConversationSummary | null;
  requests: Request[];
  appointments: Appointment[];
  notifications: Notification[];
}

const EMPTY: DashboardData = {
  applicant: null,
  membership: null,
  conversation: null,
  requests: [],
  appointments: [],
  notifications: [],
};

const CONVERSATION_STATUS: Record<string, string> = {
  open: 'Open',
  waiting: 'Awaiting reply',
  closed: 'Closed',
};

function StatCard({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  to?: string;
}) {
  const body = (
    <div className="surface flex h-full flex-col justify-between p-5 transition-colors hover:border-gold">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-4 text-2xl font-medium text-charcoal">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
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

      setData({
        applicant: (applicantRes.data as ApplicantProfile | null) ?? null,
        membership: (membershipRes.data as Membership | null) ?? null,
        conversation: conversationSummary.conversations[0] ?? null,
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
      <div className="space-y-4">
        <h1 className="text-3xl">Dashboard</h1>
        <ErrorNote message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (role === 'management' || role === 'admin') return <Navigate to="/management" replace />;

  const firstName = profile?.full_name?.split(' ')[0];
  const openRequests = data.requests.filter(
    (r) => !['completed', 'declined', 'cancelled'].includes(r.status),
  );
  const experienceRequests = data.requests.filter(
    (r) => EXPERIENCE_REQUEST_TYPES.includes(r.type) || r.experience_id !== null,
  );
  const lastMessage = data.conversation?.last;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2">Dashboard</p>
        <h1 className="text-3xl md:text-4xl">
          {greetingForNow()}
          {firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="mt-2 text-muted">Everything with management, in one operational view.</p>
      </div>

      {data.applicant && data.applicant.status === 'new' ? (
        <div className="surface border-l-2 border-l-gold p-5">
          <p className="text-lg leading-relaxed text-charcoal">
            You are connected with management. Your next step is to tell us what you would like
            to explore.
          </p>
          <p className="mt-2 text-sm text-muted">
            Application status: <span className="font-medium text-gold-deep">Received — awaiting review</span>. Management
            will be in touch through this platform.
          </p>
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Membership"
          value={data.membership ? data.membership.status : 'Not a member yet'}
          hint={data.membership ? 'Membership managed by management' : 'Invitations are issued by management'}
          to="/dashboard/membership"
        />
        <StatCard
          label="Management"
          value={
            data.conversation
              ? (CONVERSATION_STATUS[data.conversation.status] ?? data.conversation.status)
              : 'No conversation yet'
          }
          hint={
            data.conversation
              ? lastMessage
                ? `Last activity ${relativeTime(lastMessage.created_at)}`
                : data.conversation.subject
              : 'Start a private conversation'
          }
          to="/dashboard/messages"
        />
        <StatCard
          label="Requests"
          value={openRequests.length > 0 ? `${openRequests.length} open` : 'None yet'}
          hint={openRequests.length > 0 ? 'In progress with management' : 'Send your first request'}
          to="/dashboard/requests"
        />
        <StatCard
          label="Experiences"
          value={experienceRequests.length > 0 ? String(experienceRequests.length) : 'None yet'}
          hint={experienceRequests.length > 0 ? 'Requests being arranged' : 'Arranged through management'}
          to="/dashboard/experiences"
        />
      </div>

      {/* Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Your Requests" action={{to: '/dashboard/requests', label: 'View all'}}>
          {data.requests.length === 0 ? (
            <EmptyNote
              title="Nothing here yet."
              description="When management receives your first request, it will appear here."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {data.requests.slice(0, 4).map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/dashboard/requests/${request.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-charcoal">{request.title}</span>
                      <span className="block text-xs text-muted">{relativeTime(request.created_at)}</span>
                    </span>
                    <Chip tone={REQUEST_STATUS_TONES[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Management" action={{to: '/dashboard/messages', label: 'Open messages'}}>
          {data.conversation ? (
            <div>
              <p className="text-sm font-medium text-charcoal">{data.conversation.subject}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {lastMessage ? lastMessage.body : 'No messages yet.'}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Chip tone="info">
                  {CONVERSATION_STATUS[data.conversation.status] ?? data.conversation.status}
                </Chip>
                <Link
                  to={`/dashboard/messages/${data.conversation.id}`}
                  className="text-xs font-medium uppercase tracking-wider text-gold-deep hover:underline"
                >
                  Continue
                </Link>
              </div>
            </div>
          ) : (
            <EmptyNote
              title="No conversation yet."
              description="Your private conversation with the management office will appear here."
            />
          )}
        </SectionCard>

        <SectionCard title="Upcoming" action={{to: '/dashboard/experiences', label: 'Experiences'}}>
          {data.appointments.length === 0 ? (
            <EmptyNote
              title="Nothing scheduled yet."
              description="Appointments and experiences confirmed for you will appear here."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {data.appointments.map((appointment) => (
                <li key={appointment.id} className="flex items-start justify-between gap-3 py-3">
                  <span>
                    <span className="block text-sm font-medium text-charcoal">{appointment.title}</span>
                    <span className="block text-xs text-muted">{formatDateTime(appointment.starts_at)}</span>
                  </span>
                  <Chip tone="success">{appointment.status}</Chip>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Membership" action={{to: '/dashboard/membership', label: 'Details'}}>
          {data.membership ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                <Chip tone={data.membership.status === 'active' ? 'success' : 'neutral'}>
                  {data.membership.status}
                </Chip>
              </div>
              {data.membership.membership_number ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Member number</span>
                  <span className="text-sm font-medium text-charcoal">{data.membership.membership_number}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyNote
              title="No membership yet."
              description="If management invites you to apply for membership, it will appear here."
            />
          )}
        </SectionCard>

        <SectionCard title="Notifications" action={{to: '/dashboard/notifications', label: 'View all'}}>
          {data.notifications.length === 0 ? (
            <EmptyNote
              title="You’re up to date."
              description="Notifications about your requests, membership and experiences will appear here."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {data.notifications.slice(0, 4).map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={`/dashboard/notifications/${notification.id}`}
                    className="flex items-start justify-between gap-3 py-3 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-charcoal">{notification.title}</span>
                      <span className="block text-xs text-muted">{relativeTime(notification.created_at)}</span>
                    </span>
                    {notification.read_at ? null : (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid gap-3">
            <Link to="/dashboard/messages" className="btn btn-secondary justify-between">
              <span className="flex items-center gap-2">
                <MessagesSquare className="size-4" aria-hidden /> Talk to management
              </span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link to="/dashboard/requests/new" className="btn btn-secondary justify-between">
              <span className="flex items-center gap-2">
                <Send className="size-4" aria-hidden /> Send a request
              </span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link to="/dashboard/membership" className="btn btn-secondary justify-between">
              <span className="flex items-center gap-2">
                <FileText className="size-4" aria-hidden /> Explore membership
              </span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link to="/dashboard/profile" className="btn btn-secondary justify-between">
              <span className="flex items-center gap-2">
                <UserRound className="size-4" aria-hidden /> Update your profile
              </span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link to="/dashboard/documents" className="btn btn-secondary justify-between">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden /> Documents
              </span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
