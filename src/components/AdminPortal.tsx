/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../utils/StateContext';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import {
  LayoutGrid,
  User,
  Users,
  Mail,
  FileText,
  Calendar,
  Award,
  Bell,
  Settings,
  ChevronDown,
  Search,
  Copy,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Download,
  Send,
  MessageCircle,
  HelpCircle,
  Activity,
  FileBarChart2,
  AlertCircle,
  Plus,
  Check,
  X,
  Menu,
  Shield,
  RefreshCw,
  Database,
  Briefcase,
  Star,
  AlertTriangle,
  Flame,
  Filter,
  CheckSquare,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from '../utils/theme';
import AdminMembershipReview from './AdminMembershipReview';
import AdminExperiences from './AdminExperiences';
import AdminEventManagement from './AdminEventManagement';
import AdminCommunityManagement from './AdminCommunityManagement';
import AdminMediaLibrary from './AdminMediaLibrary';
import AdminJournalCMS from './AdminJournalCMS';
import AdminAskGillian from './AdminAskGillian';
import AdminRewards from './AdminRewards';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AdminMessages from './AdminMessages';
import { notifyAnnouncement, broadcastNotification } from '../utils/notifications';

interface AdminPortalProps {
  onBackToHome: () => void;
}

// Interfaces
interface RequestDetail {
  id: string;
  type: string;
  member: string;
  memberAvatar: string;
  status: 'In Discussion' | 'Submitted' | 'Under Review' | 'Offer Made' | 'Payment Requested' | 'Confirmed' | 'Completed';
  updated: string;
  preferredDate: string;
  location: string;
  attendees: string;
  whatsappNumber: string;
}

interface CommunicationLogItem {
  id: string;
  requestId: string;
  member: string;
  method: 'WhatsApp' | 'Email' | 'Telegram';
  lastContact: string;
  by: string;
  notes: string;
  nextAction: string;
}

export default function AdminPortal({ onBackToHome }: AdminPortalProps) {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Admin auth gate
  if (!authLoading && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-[#070709] text-neutral-200 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-white tracking-wider">Access Restricted</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              This area is for administrators only. Please sign in with an admin account to access the management portal.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono tracking-wider transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070709] text-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-xl font-bold text-white tracking-widest">WELCOME, ADMIN</h1>
            <p className="text-xs font-mono text-neutral-500 tracking-wider">Preparing your command center...</p>
          </div>
          <div className="w-48 h-1 mx-auto bg-neutral-900 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full" style={{ animation: 'shimmer 1.5s ease-in-out infinite', width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Search input
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showNotifications || showProfileMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications, showProfileMenu]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  // Notifications State (fetched from DB)
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setNotifications(data);
      setNotificationCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Request state
  const {
    requests: backendRequests,
    proposalChats: backendProposalChats,
    updateRequestStatus,
    addRequestChatMessage,
    suggestOffer
  } = useGlobalState();

  const [requests, setRequests] = useState<RequestDetail[]>([]);

  useEffect(() => {
    if (backendRequests) {
      setRequests(backendRequests);
    }
  }, [backendRequests]);

  // Shared Proposal Chats state
  const [proposalChats, setProposalChats] = useState<{ [proposalId: string]: { id: string; sender: 'management' | 'user' | 'system'; text: string; timestamp: string }[] }>({});

  useEffect(() => {
    if (backendProposalChats) {
      setProposalChats(backendProposalChats);
    }
  }, [backendProposalChats]);

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })), 60000);
    return () => clearInterval(t);
  }, []);

  // Scroll to top immediately whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Load and apply portal accent theme
  useEffect(() => {
    const saved = localStorage.getItem('kr_portal_accent') as PaletteType;
    if (saved) {
      applyTheme(saved);
    }
    const handleThemeChange = (e: StorageEvent) => {
      if (e.key === 'kr_portal_accent' && e.newValue) {
        applyTheme(e.newValue as PaletteType);
      }
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);



  // Selected Request for detailed View/Edit
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [requestStatusEdit, setRequestStatusEdit] = useState<RequestDetail['status']>('In Discussion');
  const [adminTimelineMsg, setAdminTimelineMsg] = useState('');

  // AI Recommendation states
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Reset AI states when selected request changes
  useEffect(() => {
    setAiAnalysis('');
    setAiSuggestion('');
  }, [selectedRequest?.id]);

  // Keep selected request detail in sync with real-time updates
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find(r => r.id === selectedRequest.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedRequest)) {
        setSelectedRequest(updated);
      }
    }
  }, [requests, selectedRequest]);


  // Platform Activity (daily aggregates)
  const [activityData, setActivityData] = useState<{
      today: { bookings: number; orders: number; members: number };
      week: { bookings: number; orders: number; members: number };
      dailyBars: { label: string; bookings: number; orders: number; members: number }[];
  }>({ today: { bookings: 0, orders: 0, members: 0 }, week: { bookings: 0, orders: 0, members: 0 }, dailyBars: [] });

  const fetchActivityData = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    const sevenDays: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400000);
      return d;
    });

    const { data: allBookings } = await supabase.from('experience_requests').select('created_at');
    const { data: allProfiles } = await supabase.from('profiles').select('created_at');

    const dailyBars = sevenDays.map((day) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
      return {
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        bookings: (allBookings || []).filter((b: any) => b.created_at && new Date(b.created_at) >= new Date(dayStart) && new Date(b.created_at) < new Date(dayEnd)).length,
        orders: 0,
        members: (allProfiles || []).filter((p: any) => p.created_at && new Date(p.created_at) >= new Date(dayStart) && new Date(p.created_at) < new Date(dayEnd)).length,
      };
    });

    const todayBookings = (allBookings || []).filter((b: any) => b.created_at && new Date(b.created_at) >= new Date(todayStart)).length;
    const todayMembers = (allProfiles || []).filter((p: any) => p.created_at && new Date(p.created_at) >= new Date(todayStart)).length;
    const weekBookings = (allBookings || []).filter((b: any) => b.created_at && new Date(b.created_at) >= new Date(weekAgo)).length;
    const weekMembers = (allProfiles || []).filter((p: any) => p.created_at && new Date(p.created_at) >= new Date(weekAgo)).length;

    setActivityData({
      today: { bookings: todayBookings, orders: 0, members: todayMembers },
      week: { bookings: weekBookings, orders: 0, members: weekMembers },
      dailyBars,
    });
  };

  // Recent Experience Bookings (for dashboard panel)
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('experience_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentBookings(data);
  };

  // Dashboard live stats (fetched independently)
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    totalExperiences: 0,
    experienceBookings: 0,
    pendingBookings: 0,
    subscriberCount: 0,
    eventRegistrations: 0,
    pendingMemberships: 0,
    activeConversations: 0,
    notificationsSent: 0,
    totalRewardsRedeemed: 0,
  });
  const [dashboardEvents, setDashboardEvents] = useState<any[]>([]);

  const [bookingStatusCounts, setBookingStatusCounts] = useState({ confirmed: 0, pending: 0, cancelled: 0 });

  // Recent activity feed
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardStats = async () => {
    const [
      { count: profileCount },
      { count: expCount },
      { count: expBookings },
      { count: pendingB },
      { count: confirmedB },
      { count: cancelledB },
      { count: subsCount },
      { count: eventRegCount },
      { count: pendingMemCount },
      { count: activeConvCount },
      { count: notifCount },
      { count: rewardsCount },
      { data: eventsData },
      { data: activityData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('experiences').select('*', { count: 'exact', head: true }),
      supabase.from('experience_requests').select('*', { count: 'exact', head: true }),
      supabase.from('experience_requests').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'under_review']),
      supabase.from('experience_requests').select('*', { count: 'exact', head: true }).in('status', ['discussion', 'active', 'completed']),
      supabase.from('experience_requests').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
      supabase.from('membership_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('fan_admin_conversations').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('user_badges').select('*', { count: 'exact', head: true }),
      supabase.from('admin_events').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('id, title, message, type, created_at, is_read').order('created_at', { ascending: false }).limit(8),
    ]);
    setDashboardStats({
      totalMembers: profileCount ?? 0,
      totalExperiences: expCount ?? 0,
      experienceBookings: expBookings ?? 0,
      pendingBookings: pendingB ?? 0,
      subscriberCount: subsCount ?? 0,
      eventRegistrations: eventRegCount ?? 0,
      pendingMemberships: pendingMemCount ?? 0,
      activeConversations: activeConvCount ?? 0,
      notificationsSent: notifCount ?? 0,
      totalRewardsRedeemed: rewardsCount ?? 0,
    });
    setBookingStatusCounts({
      confirmed: confirmedB ?? 0,
      pending: pendingB ?? 0,
      cancelled: cancelledB ?? 0,
    });
    if (eventsData) setDashboardEvents(eventsData);
    if (activityData) setRecentActivity(activityData);
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchActivityData();
    fetchRecentBookings();
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchActivityData();
      fetchRecentBookings();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Modal forms
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceText, setAnnounceText] = useState('');
  const [announceScope, setAnnounceScope] = useState('All Members');

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalCategory, setJournalCategory] = useState('Philanthropy');
  const [journalExcerpt, setJournalExcerpt] = useState('');
  const [journalContent, setJournalContent] = useState('');

  // Settings State


  // Handler for updating a Request status
  const handleUpdateStatus = async (id: string, newStatus: RequestDetail['status']) => {
    try {
      await updateRequestStatus(id, newStatus);
      const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

      // Add communication log automatically (local + DB)
      const targetReq = requests.find(r => r.id === id);
      if (targetReq) {
        const nextAction = newStatus === 'In Discussion' ? 'Discuss security and schedules' : newStatus === 'Offer Made' ? 'Awaiting offer acceptance' : newStatus === 'Payment Requested' ? 'Awaiting voluntary payment' : 'Follow up standard processing';
        const notes = `Status updated to ${newStatus}.`;
        await supabase.from('communication_logs').insert({
          request_id: id,
          member: targetReq.member,
          method: 'WhatsApp',
          notes,
          next_action: nextAction,
          last_contact: new Date().toISOString(),
          by: 'management',
        }).then(() => {});
      }

      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus, updated: 'Just now', lastUpdated: timestamp } : null);
      }
      showToast(`Status updated successfully to ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status on server.', 'error');
    }
  };

  // Send message on shared timeline
  const handleSendAdminTimelineMsg = async (requestId: string) => {
    if (!adminTimelineMsg.trim()) return;
    try {
      await addRequestChatMessage(requestId, 'management', adminTimelineMsg.trim());
      setAdminTimelineMsg('');
      showToast('Your response has been sent to the member timeline!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send message to member timeline.', 'error');
    }
  };

  // Add communication log manually
  const [manualLogNote, setManualLogNote] = useState('');
  const [manualLogMethod, setManualLogMethod] = useState<'WhatsApp' | 'Email' | 'Telegram'>('WhatsApp');
  const [manualLogAction, setManualLogAction] = useState('');

  const handleAddManualLog = async (requestId: string) => {
    const reqObj = requests.find(r => r.id === requestId);
    if (!reqObj || !manualLogNote.trim()) return;

    setManualLogNote('');
    setManualLogAction('');
    showToast('Communication log added successfully!', 'success');

    try {
      await supabase.from('communication_logs').insert({
        request_id: requestId,
        member: reqObj.member,
        method: manualLogMethod,
        notes: manualLogNote.trim(),
        next_action: manualLogAction.trim() || 'Awaiting response',
        last_contact: new Date().toISOString(),
        by: 'management',
      });
    } catch {};
  };

  // Handler for sending announcement (inserts into admin_notifications)
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceText.trim()) return;

    const { error } = await supabase.from('admin_notifications').insert({
      text: announceTitle.trim(),
      status: 'unread',
      notif_time: new Date().toISOString(),
    });
    if (error) {
      showToast('Failed to send announcement: ' + error.message, 'error');
      return;
    }

    // Fan-out notification to all non-admin users
    const { data: fans } = await supabase.from('profiles').select('id').neq('role', 'admin');
    if (fans && fans.length > 0) {
      const fanIds = fans.map((f: { id: string }) => f.id);
      await notifyAnnouncement(fanIds, announceTitle.trim(), announceText.trim());
    }

    showToast(`Announcement "${announceTitle}" sent successfully to ${announceScope}!`, 'success');
    setShowAnnounceModal(false);
    setAnnounceTitle('');
    setAnnounceText('');
  };

  // Handler for creating Journal post (inserts into journal_entries)
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim()) return;

    const { error } = await supabase.from('journal_entries').insert({
      title: journalTitle.trim(),
      category: journalCategory || 'General',
      excerpt: journalExcerpt.trim() || '',
      content: journalContent.trim() || '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      read_time: '3 min read',
      image: '',
    });
    if (error) {
      showToast('Failed to publish journal entry: ' + error.message, 'error');
      return;
    }
    showToast(`CMS Journal Entry "${journalTitle}" published successfully to the platform CMS!`, 'success');
    setShowJournalModal(false);
    setJournalTitle('');
    setJournalExcerpt('');
    setJournalContent('');
  };

  // Handled by AdminMembershipReview component

  const bTotal = bookingStatusCounts.pending + bookingStatusCounts.confirmed + bookingStatusCounts.cancelled;
  let bCumPct = 0;
  const bookingArcs = bTotal > 0 ? [
    { key: 'Pending', color: '#f59e0b', count: bookingStatusCounts.pending },
    { key: 'Confirmed', color: '#10b981', count: bookingStatusCounts.confirmed },
    { key: 'Cancelled', color: '#ef4444', count: bookingStatusCounts.cancelled },
  ].map(d => {
    const pct = Math.round((d.count / bTotal) * 100);
    const offset = 100 - bCumPct;
    bCumPct += pct;
    return { ...d, pct, offset, dasharray: `${pct} ${100 - pct}` };
  }) : [];

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 flex flex-col font-sans selection:bg-gold-500 selection:text-neutral-950">
      
      {/* 1. TOP PORTAL HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-[#070709]/95 backdrop-blur-md px-4 md:px-6 py-3.5 flex items-center justify-between">
        
        {/* Left: Brand logo & name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            aria-label="Sign out"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold tracking-widest text-gold-500">
              GA
            </span>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex flex-col text-left">
              <span className="font-serif text-[10px] font-bold tracking-widest text-neutral-300">
                GILLIAN ANDERSON
              </span>
              <span className="font-mono text-[7px] tracking-[0.2em] text-red-500 font-bold uppercase">
                OFFICIAL MANAGEMENT PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search requests */}
        <div className="hidden lg:flex items-center relative w-full max-w-md ml-4">
          <input
            type="text"
            placeholder="Search bookings, members, orders, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-900 rounded px-3.5 py-1.5 pl-9 text-xs text-neutral-300 placeholder-neutral-600 outline-none focus:border-red-500/30 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
        </div>

        {/* Right Actions: bell, messages, profile dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Notifications alert with dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded bg-neutral-900/50 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-neutral-950">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-950 border border-neutral-900 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Notifications</h4>
                  <button
                    onClick={() => {
                      setNotificationCount(0);
                      showToast('Notifications cleared.', 'info');
                    }}
                    className="text-[9px] font-mono text-neutral-500 hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-900/40">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[10px] font-mono text-neutral-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) {
                            supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', n.id).then(() => {
                              setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                              setNotificationCount(prev => Math.max(0, prev - 1));
                            });
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-neutral-900/40 transition-colors ${!n.is_read ? 'bg-amber-500/[0.03] border-l-2 border-l-amber-500' : ''}`}
                      >
                        <h5 className="text-xs font-semibold text-white">{n.title}</h5>
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[8px] font-mono text-neutral-600 mt-1 block">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-neutral-900 text-center">
                  <button
                    onClick={() => { setShowNotifications(false); setActiveTab('Notifications'); }}
                    className="text-[10px] font-mono text-gold-500 hover:text-gold-400"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('Communication Log')}
            className="relative p-2 rounded bg-neutral-900/50 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white transition-all"
          >
            <Mail className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 text-[7px] font-bold text-white flex items-center justify-center border border-neutral-950">
                {notificationCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-neutral-800" />

          {/* Super Administrator Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 hover:bg-neutral-900/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full border-2 border-red-500 bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center relative">
                <div className="text-xs font-mono font-bold text-white">{((profile?.name || user?.email?.split('@')[0] || 'Admin').match(/\b\w/g) || []).join('').toUpperCase().slice(0, 2) || 'AD'}</div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">{profile?.name || user?.email?.split('@')[0] || 'Admin'}</span>
                <span className="text-[9px] font-mono font-bold text-red-400 leading-none">Super Administrator</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-950 border border-neutral-900 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-1">
                  <button
                    onClick={() => { signOut(); navigate('/'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-red-500/10 transition-colors group"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-[11px] font-semibold text-neutral-300 group-hover:text-red-400">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded bg-neutral-900/50 border border-neutral-900 text-neutral-400 hover:text-white transition-all ml-1"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

        </div>

      </header>

      {/* 2. BODY CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT NAV SIDEBAR */}
        <aside className={`w-60 border-r border-neutral-900 bg-[#070709] shrink-0 overflow-y-auto text-left flex flex-col justify-between p-4 transition-all duration-300 z-50 ${isMobileMenuOpen ? 'fixed top-[65px] left-0 bottom-0 w-64 bg-[#070709] border-r border-neutral-900 shadow-2xl flex' : 'hidden md:flex'}`}>
          
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-600 uppercase block pl-2 mb-2">
                MAIN
              </span>
              <nav className="space-y-0.5">
                {[
                  { name: 'Dashboard', icon: LayoutGrid, count: null },
                  { name: 'Experiences', icon: Star, count: null },
                  { name: 'Memberships', icon: Award, count: null },
                  { name: 'Events', icon: Calendar, count: null },
                  { name: 'Community', icon: Users, count: null },
                  { name: 'Media Library', icon: Briefcase, count: null },
                  { name: 'Journal CMS', icon: FileSpreadsheet, count: null },
                  { name: 'Ask Gillian', icon: HelpCircle, count: null },
                  { name: 'Rewards & Badges', icon: Shield, count: null }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        setSelectedRequest(null);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-red-400' : 'text-neutral-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.count !== null && (
                        <span className="h-4 px-1 min-w-[16px] text-[9px] font-mono font-bold text-neutral-950 rounded flex items-center justify-center bg-red-500">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-600 uppercase block pl-2 mb-2">
                SYSTEM
              </span>
              <nav className="space-y-0.5">
                {[
                  { name: 'Users', icon: Users, count: null },
                  { name: 'Messages', icon: MessageCircle, count: null },
                  { name: 'Notifications', icon: Bell, count: null },
                  { name: 'Settings', icon: Settings, count: null }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        setSelectedRequest(null);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-red-400' : 'text-neutral-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.count !== null && (
                        <span className="h-4 px-1 min-w-[16px] text-[9px] font-mono font-bold text-neutral-950 bg-red-500 rounded flex items-center justify-center">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Bottom logout branding */}
          <div className="pt-4 border-t border-neutral-900 text-[10px] text-neutral-500 font-mono">
            <p>Version 2.4.0-Prod</p>
            <p className="mt-0.5 text-[9px] text-neutral-600">© Gillian Anderson representation</p>
          </div>

        </aside>

        {/* MAIN WORKSPACE SCREEN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#070709] p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* ACTIVE VIEW RENDERING: DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              
              {/* TOP HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <h1 className="font-serif text-2xl font-bold tracking-wider text-white">
                    Welcome back, {profile?.name || user?.email?.split('@')[0] || 'Admin'}
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono">
                    Here's what's happening on the platform today.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-xs text-neutral-300 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-neutral-600 mx-0.5">·</span>
                    <span className="text-neutral-400">{currentTime}</span>
                  </div>

                  {/* Quick Actions Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 px-4 py-1.5 rounded text-xs font-bold tracking-wide transition-colors">
                      Quick Actions
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Hover menu */}
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-neutral-950 border border-neutral-900 rounded-lg shadow-xl py-1 z-30 hidden group-hover:block">
                      <button
                        onClick={() => { setActiveTab('Events'); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-500" />
                        Add New Event
                      </button>
                      <button
                        onClick={() => setShowAnnounceModal(true)}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2"
                      >
                        <Bell className="h-3.5 w-3.5 text-amber-500" />
                        Send Announcement
                      </button>
                      <button
                        onClick={() => setShowJournalModal(true)}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />
                        Create Journal Post
                      </button>

                    </div>
                  </div>
                </div>
              </div>

              {/* STATS COUNT GRID (6 LIVE CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                
                {/* Total Members */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Total Members</span>
                    <Users className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">{dashboardStats.totalMembers}</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>Registered profiles</span>
                  </p>
                </div>

                {/* Event Registrations */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Event Regs</span>
                    <Calendar className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">{dashboardStats.eventRegistrations}</h3>
                  <p className="text-[10px] font-mono text-blue-500 flex items-center gap-0.5">
                    <span>Total registrations</span>
                  </p>
                </div>

                {/* Experience Bookings */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Bookings</span>
                    <Star className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">{dashboardStats.experienceBookings}</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>Experience requests</span>
                  </p>
                </div>

                {/* Pending Memberships */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Pending</span>
                    <Clock className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-amber-500">{dashboardStats.pendingMemberships + dashboardStats.pendingBookings}</h3>
                  <p className="text-[10px] font-mono text-amber-500 flex items-center gap-0.5">
                    <span>Awaiting review</span>
                  </p>
                </div>

                {/* Active Conversations */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Conversations</span>
                    <MessageCircle className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">{dashboardStats.activeConversations}</h3>
                  <p className="text-[10px] font-mono text-blue-500 flex items-center gap-0.5">
                    <span>Active chats</span>
                  </p>
                </div>

                {/* Rewards Redeemed */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Rewards</span>
                    <Award className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">{dashboardStats.totalRewardsRedeemed}</h3>
                  <p className="text-[10px] font-mono text-purple-500 flex items-center gap-0.5">
                    <span>Badges earned</span>
                  </p>
                </div>

              </div>

              {/* MAIN METRIC LAYOUT SPLIT */}
              <div className="grid gap-6 xl:grid-cols-12 items-start">
                
                {/* Left Column (9 cols): Requests log table, Events summary, and Orders summary */}
                <div className="xl:col-span-9 space-y-6">
                  
                  {/* Recent Experience Bookings Panel */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase text-left">
                        Recent Experience Bookings
                      </h3>
                      <button
                        onClick={() => setActiveTab('Experiences')}
                        className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                            <th className="px-5 py-3 font-semibold">Booking Ref</th>
                            <th className="px-4 py-3 font-semibold">Member</th>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Participants</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-5 py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60">
                          {(searchQuery
                            ? recentBookings.filter(bk =>
                                (bk.member_name || bk.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (bk.booking_reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (bk.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
                              )
                            : recentBookings
                          ).map((bk) => {
                            const statusLabel = ({ submitted: 'Pending', pending: 'Pending', under_review: 'Pending', discussion: 'Discussion', active: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' } as Record<string, string>)[bk.status] || 'Pending';
                            const statusColor = statusLabel === 'Confirmed' || statusLabel === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              statusLabel === 'Cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              statusLabel === 'Discussion' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20';
                            return (
                              <tr key={bk.id} className="hover:bg-neutral-950/40 transition-colors">
                                <td className="px-5 py-3.5 font-mono font-semibold text-neutral-300">
                                  {bk.booking_reference || bk.id?.toString().slice(0, 8)}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-mono text-gold-500 font-bold shrink-0">
                                      {bk.member_avatar || (bk.member_name || '?').slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-neutral-300 font-medium">{bk.member_name || bk.full_name || 'Anonymous'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                                  {bk.preferred_date || bk.confirmed_date || '-'}
                                </td>
                                <td className="px-4 py-3.5 text-neutral-300 font-mono">
                                  {bk.participants || 1}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${statusColor}`}>
                                    <span className={`h-1 w-1 rounded-full ${
                                      statusLabel === 'Confirmed' || statusLabel === 'Completed' ? 'bg-green-500' : statusLabel === 'Cancelled' ? 'bg-red-500' : statusLabel === 'Discussion' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`} />
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => setActiveTab('Experiences')}
                                    className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 rounded hover:text-white transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {recentBookings.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-8 text-center text-[10px] font-mono text-neutral-500">
                                No experience bookings yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Split grid: Events list + Shop orders list */}
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Upcoming Events Box */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden text-left">
                      <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                          Upcoming Events <span className="text-neutral-500 font-normal">({dashboardEvents.length})</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab('Events')}
                          className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                        >
                          Manage
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        {dashboardEvents.length === 0 ? (
                          <div className="p-4 text-center">
                            <Calendar className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
                            <p className="text-xs text-neutral-500 font-mono">No events scheduled yet.</p>
                          </div>
                        ) : (
                          dashboardEvents.slice(0, 5).map((ev: any) => (
                            <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-900/60 bg-neutral-950/20 hover:border-neutral-800 transition-colors group">
                              <div className="h-9 w-9 rounded-lg bg-neutral-950 border border-neutral-900 flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-white leading-none">{ev.day || '--'}</span>
                                <span className="text-[7px] font-mono text-gold-500 uppercase">{ev.month?.slice(0, 3) || '---'}</span>
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-semibold text-white truncate group-hover:text-gold-500/80 transition-colors">{ev.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-mono text-neutral-500">{ev.event_time || ev.time}</span>
                                  <span className="h-1 w-1 rounded-full bg-neutral-800" />
                                  <span className="text-[9px] font-mono text-neutral-500 truncate">{ev.location || 'TBA'}</span>
                                </div>
                              </div>
                              <span className="shrink-0 self-center text-[8px] font-mono px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-500">
                                {ev.event_type || ev.type || 'Event'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden text-left">
                      <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                          Recent Activity
                        </h3>
                        <span className="text-[8px] font-mono bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold uppercase">
                          LIVE
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        {recentActivity.length === 0 ? (
                          <div className="p-4 text-center">
                            <Bell className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
                            <p className="text-xs text-neutral-500 font-mono">No activity yet.</p>
                          </div>
                        ) : (
                          recentActivity.map((act: any) => {
                            const typeIcon: Record<string, string> = {
                              membership: '👤', experience: '⭐', event: '📅',
                              message: '💬', reward: '🏆', announcement: '📢', system: '⚙️',
                            };
                            const typeColor: Record<string, string> = {
                              membership: 'border-green-500/20', experience: 'border-blue-500/20',
                              event: 'border-purple-500/20', message: 'border-amber-500/20',
                              reward: 'border-pink-500/20', announcement: 'border-red-500/20',
                              system: 'border-neutral-700',
                            };
                            return (
                              <div key={act.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${typeColor[act.type] || 'border-neutral-900/60'} bg-neutral-950/20 transition-colors`}>
                                <span className="text-sm mt-0.5 shrink-0">{typeIcon[act.type] || '📌'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-white truncate">{act.title}</p>
                                  <p className="text-[10px] text-neutral-500 truncate">{act.message}</p>
                                </div>
                                <span className="text-[8px] font-mono text-neutral-600 shrink-0 mt-0.5">
                                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Column (3 cols): Pie donut chart, System alerts, Platform activity line chart */}
                <div className="xl:col-span-3 space-y-6">
                  
                  {/* Booking Status - SVG Donut Chart */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        Booking Status
                      </h4>
                      <button
                        onClick={() => setActiveTab('Experiences')}
                        className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-5 pt-2">
                      {/* Interactive Visual Donut SVG */}
                      <div className="relative h-32 w-32 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#161619" strokeWidth="3" />
                          {bookingArcs.map((d) => (
                            <circle key={d.key} cx="18" cy="18" r="15.915" fill="none" stroke={d.color} strokeWidth="3" strokeDasharray={d.dasharray} strokeDashoffset={d.offset} />
                          ))}
                        </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold font-mono text-white leading-none">{dashboardStats.experienceBookings}</span>
                        <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">Total</span>
                      </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="flex-1 text-[11px] font-mono text-neutral-400 space-y-1.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" />Pending</span>
                          <span className="text-white font-semibold">{bookingStatusCounts.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10b981]" />Confirmed</span>
                          <span className="text-white font-semibold">{bookingStatusCounts.confirmed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Cancelled</span>
                          <span className="text-white font-semibold">{bookingStatusCounts.cancelled}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Alerts */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        System Alerts
                      </h4>
                      <span className="text-[8px] font-mono bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                        LIVE MONITOR
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Alert 1 - Experience Bookings */}
                      <button
                        onClick={() => setActiveTab('Experiences')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">{dashboardStats.pendingBookings} experience bookings pending</h5>
                            <p className="text-[10px] text-neutral-400">Awaiting confirmation</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 2 - Memberships */}
                      <button
                        onClick={() => setActiveTab('Memberships')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">{dashboardStats.pendingMemberships} membership applications</h5>
                            <p className="text-[10px] text-neutral-400">Pending approval</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 3 - Conversations */}
                      <button
                        onClick={() => setActiveTab('Messages')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-blue-500/10 text-blue-500 shrink-0">
                            <MessageCircle className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">{dashboardStats.activeConversations} active conversations</h5>
                            <p className="text-[10px] text-neutral-400">Fan messages awaiting response</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 4 */}
                      <button
                        onClick={() => setActiveTab('Events')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/[0.02] hover:bg-purple-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-purple-500/10 text-purple-500 shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">{dashboardStats.eventRegistrations} event registrations</h5>
                            <p className="text-[10px] text-neutral-400">Total across all events</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                    </div>
                  </div>

                  {/* Platform Activity (7 Days) - Live bar chart */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        Platform Activity (7 Days)
                      </h4>
                      <span className="text-[10px] font-mono text-neutral-500">
                        Today: <span className="text-white font-semibold">{activityData.today.bookings + activityData.today.orders + activityData.today.members}</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Daily Bar Chart */}
                      <div className="h-28 w-full bg-neutral-950/40 rounded border border-neutral-900/60 p-3 flex items-end gap-1.5">
                          {activityData.dailyBars.map((day, i) => {
                          const maxVal = Math.max(...activityData.dailyBars.map(d => Math.max(d.bookings, d.orders, d.members, 1)));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                              <div className="w-full flex gap-[2px] items-end justify-center" style={{ height: '100%' }}>
                                <div
                                  className="w-1.5 rounded-t-sm bg-[#10b981] transition-all duration-300"
                                  style={{ height: `${(day.members / maxVal) * 80}%` }}
                                  title={`${day.members} members`}
                                />
                                <div
                                  className="w-1.5 rounded-t-sm bg-[#f59e0b] transition-all duration-300"
                                  style={{ height: `${(day.bookings / maxVal) * 80}%` }}
                                  title={`${day.bookings} bookings`}
                                />
                                <div
                                  className="w-1.5 rounded-t-sm bg-[#8b5cf6] transition-all duration-300"
                                  style={{ height: `${(day.orders / maxVal) * 80}%` }}
                                  title={`${day.orders} orders`}
                                />
                              </div>
                              <span className="text-[7px] font-mono text-neutral-500 leading-none">{day.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary + Legend */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                            <span>Members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                            <span>Bookings</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                            <span>Orders</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono text-neutral-500">
                          <span className="text-white font-semibold">{activityData.week.bookings + activityData.week.orders + activityData.week.members}</span> this week
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ACTIVE VIEW: MEMBERSHIPS APPLICATIONS MANAGER */}
          {activeTab === 'Memberships' && <AdminMembershipReview />}
          {activeTab === 'Experiences' && <AdminExperiences showToast={showToast} />}

          {/* ACTIVE VIEW: EVENTS */}
          {activeTab === 'Events' && <AdminEventManagement showToast={showToast} />}

          {/* ACTIVE VIEW: NOTIFICATIONS */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Notifications</h2>
                <p className="text-xs text-neutral-500 font-mono">Platform notifications and announcements.</p>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="rounded-xl border border-neutral-900 p-12 text-center text-neutral-500 text-xs font-mono">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className={`p-4 rounded-xl border text-xs text-left flex justify-between items-start gap-4 transition-all ${
                      !n.is_read ? 'border-gold-500/30 bg-gold-500/[0.02]' : 'border-neutral-900 bg-neutral-950/40'
                    }`}>
                      <div className="space-y-1 flex-1">
                        <p className="text-white font-bold text-[11px]">{n.title}</p>
                        <p className="text-neutral-400 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-[9px] font-mono text-neutral-500">{new Date(n.created_at).toLocaleString()}</p>
                          {n.type && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">{n.type}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-gold-500" />
                        )}
                        <button
                          onClick={async () => {
                            await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', n.id);
                            setNotifications(prev => prev.map((x: any) => x.id === n.id ? { ...x, is_read: true } : x));
                            setNotificationCount(prev => Math.max(0, prev - 1));
                          }}
                          className="text-[9px] font-mono text-gold-500/70 hover:text-gold-500 cursor-pointer"
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: COMMUNITY MANAGEMENT */}
          {activeTab === 'Community' && <AdminCommunityManagement showToast={showToast} />}

          {/* ACTIVE VIEW: MEDIA LIBRARY */}
          {activeTab === 'Media Library' && <AdminMediaLibrary showToast={showToast} />}

          {/* ACTIVE VIEW: JOURNAL CMS */}
          {activeTab === 'Journal CMS' && <AdminJournalCMS showToast={showToast} />}

          {/* ACTIVE VIEW: ASK GILLIAN */}
          {activeTab === 'Ask Gillian' && <AdminAskGillian showToast={showToast} adminUserId={user?.id} />}

          {/* ACTIVE VIEW: REWARDS & BADGES */}
          {activeTab === 'Rewards & Badges' && <AdminRewards showToast={showToast} />}

          {/* ACTIVE VIEW: USERS */}
          {activeTab === 'Users' && <AdminUsers showToast={showToast} />}

          {/* ACTIVE VIEW: MESSAGES */}
          {activeTab === 'Messages' && <AdminMessages showToast={showToast} adminUserId={user?.id} />}



          {/* ACTIVE VIEW: SETTINGS */}
          {activeTab === 'Settings' && <AdminSettings showToast={showToast} />}

        </main>

      </div>

      {/* 3. MODALS AND FORMS AREA */}
      <AnimatePresence>
        
        {/* SEND ANNOUNCEMENT MODAL */}
        {showAnnounceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl text-left"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500">DISPATCH ANNOUNCEMENT</span>
                <button onClick={() => setShowAnnounceModal(false)} className="p-1 rounded text-neutral-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSendAnnouncement} className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">RECIPIENT SCOPE</label>
                  <select
                    value={announceScope}
                    onChange={(e) => setAnnounceScope(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none"
                  >
                    <option value="All Members">All Members</option>
                    <option value="Gold Members Only">Gold Members Only</option>
                    <option value="Platinum Members Only">Platinum Members Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">ANNOUNCEMENT TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exclusive Signed Posters Stock Update"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">MESSAGE TRANSLATER</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type details of the announcement to dispatch via email/push notices..."
                    value={announceText}
                    onChange={(e) => setAnnounceText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40 leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAnnounceModal(false)}
                    className="px-4 py-2 border border-neutral-800 rounded font-bold hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded shadow-lg shadow-amber-500/10"
                  >
                    Dispatch Notice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* JOURNAL CMS CREATE MODAL */}
        {showJournalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl text-left"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500">CMS JOURNAL PUBLISH</span>
                <button onClick={() => setShowJournalModal(false)} className="p-1 rounded text-neutral-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateJournal} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">POST TITLE</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gillian's Philanthropic Milestone"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">CATEGORY</label>
                    <select
                      value={journalCategory}
                      onChange={(e) => setJournalCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none"
                    >
                      <option value="Philanthropy">Philanthropy</option>
                      <option value="Behind the Scenes">Behind the Scenes</option>
                      <option value="Movie Insights">Movie Insights</option>
                      <option value="Announcements">Announcements</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">EXCERPT (SHORT PITCH)</label>
                  <input
                    type="text"
                    required
                    placeholder="Short summary for homepage cards..."
                    value={journalExcerpt}
                    onChange={(e) => setJournalExcerpt(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">FULL BODY TEXT (CMS)</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Full storytelling body text to read on the portal..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJournalModal(false)}
                    className="px-4 py-2 border border-neutral-800 rounded font-bold hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded shadow-lg shadow-amber-500/10"
                  >
                    Publish to CMS
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* SYSTEM TOAST NOTIFICATIONS */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-red-500 bg-[#0a0a0c] px-4 py-3 shadow-2xl shadow-red-500/10 min-w-[300px]"
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex-1 text-xs text-left">
              <p className="font-mono text-red-500 uppercase tracking-widest font-bold text-[9px]">SYSTEM MSG</p>
              <p className="text-white mt-0.5 leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
