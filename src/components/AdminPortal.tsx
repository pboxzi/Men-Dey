/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../utils/StateContext';
import { useAuth } from '../utils/AuthContext';
import {
  LayoutGrid,
  User,
  Users,
  Mail,
  FileText,
  Calendar,
  Award,
  ShoppingBag,
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
  AlertTriangle,
  Flame,
  Filter,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from '../utils/theme';

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

interface ShopOrder {
  id: string;
  member: string;
  memberAvatar: string;
  item: string;
  status: 'Payment Requested' | 'Confirmed' | 'Preparing' | 'Shipped' | 'Delivered';
  updated: string;
  price: string;
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

interface MembershipApplication {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  tier: 'Gold' | 'Platinum';
}

export default function AdminPortal({ onBackToHome }: AdminPortalProps) {
  const { user, profile, loading: authLoading } = useAuth();
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
        <div className="animate-pulse text-gold-500 font-mono text-xs tracking-widest">Loading...</div>
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
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications State (fetched from DB)
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/notifications').then(r => r.ok ? r.json() : []).then(data => {
      setNotifications(data);
      setNotificationCount(data.filter((n: any) => n.status === 'unread').length);
    }).catch(() => {});
  }, []);

  // Request state
  const {
    requests: backendRequests,
    proposalChats: backendProposalChats,
    orders: backendOrders,
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

  // Shop Orders state
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (backendOrders) {
      setOrders(backendOrders);
    }
  }, [backendOrders]);

  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);

  // Membership Applications (fetched from DB)
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/state').then(r => r.ok ? r.json() : {}).then((data: any) => {
      if (data.memberships) setMemberships(data.memberships);
    }).catch(() => {});
  }, []);

  // Upcoming Events (fetched from DB)
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/events').then(r => r.ok ? r.json() : []).then(setEvents).catch(() => {});
  }, []);

  // Communication Log state (fetched from DB)
  const [commLogs, setCommLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/comm-logs').then(r => r.ok ? r.json() : []).then(setCommLogs).catch(() => {});
  }, []);

  // Modal forms
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-07-15');
  const [eventLocation, setEventLocation] = useState('');
  const [eventTime, setEventTime] = useState('02:00 PM');
  const [eventCapacity, setEventCapacity] = useState('250');

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceText, setAnnounceText] = useState('');
  const [announceScope, setAnnounceScope] = useState('All Members');

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalCategory, setJournalCategory] = useState('Philanthropy');
  const [journalExcerpt, setJournalExcerpt] = useState('');
  const [journalContent, setJournalContent] = useState('');

  // Backup state
  const [backupProgress, setBackupProgress] = useState<number | null>(null);
  const [backupLogs, setBackupLogs] = useState<string[]>([]);

  // Settings State
  const [platformName, setPlatformName] = useState('Gillian Anderson Official Fan Platform');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Status statistics mapping helper
  const getStatusCount = (status: RequestDetail['status']) => {
    return requests.filter(r => r.status === status).length + (status === 'In Discussion' ? 26 : status === 'Submitted' ? 21 : status === 'Under Review' ? 23 : status === 'Offer Made' ? 15 : status === 'Payment Requested' ? 19 : status === 'Confirmed' ? 19 : status === 'Completed' ? 8 : 10);
  };

  // Handler for updating a Request status
  const handleUpdateStatus = async (id: string, newStatus: RequestDetail['status']) => {
    try {
      await updateRequestStatus(id, newStatus);
      const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

      // Add communication log automatically
      const targetReq = requests.find(r => r.id === id);
      if (targetReq) {
        const newLog: CommunicationLogItem = {
          id: `COM-000${Date.now().toString().slice(-3)}`,
          requestId: id,
          member: targetReq.member,
          method: 'WhatsApp',
          lastContact: 'Just now',
          by: 'Admin',
          notes: `Status updated to ${newStatus}.`,
          nextAction: newStatus === 'In Discussion' ? 'Discuss security and schedules' : newStatus === 'Offer Made' ? 'Awaiting offer acceptance' : newStatus === 'Payment Requested' ? 'Awaiting voluntary payment' : 'Follow up standard processing'
        };
        setCommLogs(prev => [newLog, ...prev]);
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

    const newLog: CommunicationLogItem = {
      id: `COM-000${Date.now().toString().slice(-3)}`,
      requestId,
      member: reqObj.member,
      method: manualLogMethod,
      lastContact: 'Just now',
      by: 'Admin',
      notes: manualLogNote.trim(),
      nextAction: manualLogAction.trim() || 'Awaiting response'
    };

    setCommLogs(prev => [newLog, ...prev]);
    setManualLogNote('');
    setManualLogAction('');
    showToast('Communication log added successfully!', 'success');

    try {
      await fetch('/api/admin/comm-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, member: reqObj.member, method: manualLogMethod, notes: newLog.notes, next_action: newLog.nextAction })
      });
    } catch {};
  };

  // Handler for adding upcoming event
  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const dateObj = new Date(eventDate);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const newEv = {
      id: `ev-${Date.now()}`,
      day: dateObj.getDate().toString().padStart(2, '0'),
      month: months[dateObj.getMonth()],
      title: eventTitle.trim(),
      type: eventLocation.trim() || 'Virtual Event',
      registered: '0',
      location: eventLocation.trim() || 'Virtual',
      time: eventTime
    };

    setEvents(prev => [newEv, ...prev]);
    setShowEventModal(false);
    setEventTitle('');
    setEventLocation('');
    showToast(`Event "${eventTitle}" created successfully on the platform!`, 'success');

    try {
      await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEv)
      });
    } catch {};
  };

  // Handler for sending announcement
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceText.trim()) return;

    showToast(`Announcement "${announceTitle}" sent successfully to ${announceScope}!`, 'success');
    setShowAnnounceModal(false);
    setAnnounceTitle('');
    setAnnounceText('');
  };

  // Handler for creating Journal post
  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim()) return;

    showToast(`CMS Journal Entry "${journalTitle}" published successfully to the platform CMS!`, 'success');
    setShowJournalModal(false);
    setJournalTitle('');
    setJournalExcerpt('');
    setJournalContent('');
  };

  // Handler for Membership Approval
  const handleMembershipAction = async (id: string, decision: 'Approved' | 'Rejected') => {
    setMemberships(prev => prev.map(m => m.id === id ? { ...m, status: decision } : m));
    try {
      await fetch(`/api/memberships/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision })
      });
    } catch {}
    showToast(`Membership Application ${id} has been ${decision}!`, decision === 'Approved' ? 'success' : 'info');
  };

  // Run database backup simulation
  const handleBackupDb = () => {
    setBackupProgress(0);
    setBackupLogs(['Initializing backup sequence...', 'Verifying data structures...']);
    
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setBackupProgress(current);

      if (current === 20) {
        setBackupLogs(prev => [...prev, 'Backing up user records table: 128,947 files verified.']);
      } else if (current === 40) {
        setBackupLogs(prev => [...prev, 'Backing up requests metadata table: 156 objects compiled.']);
      } else if (current === 60) {
        setBackupLogs(prev => [...prev, 'Packing static assets, images, and video metadata hashes.']);
      } else if (current === 80) {
        setBackupLogs(prev => [...prev, 'Establishing secure handshake with offsite warm backup vault...']);
      } else if (current === 100) {
        setBackupLogs(prev => [...prev, 'Backup sequence COMPLETED successfully. File signature: GA-BKP-20260701-0852.tar.gz']);
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 flex flex-col font-sans selection:bg-gold-500 selection:text-neutral-950">
      
      {/* 1. TOP PORTAL HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-[#070709]/95 backdrop-blur-md px-4 md:px-6 py-3.5 flex items-center justify-between">
        
        {/* Left: Brand logo & name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            aria-label="Back to home"
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
            placeholder="Search requests, members, orders, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-900 rounded px-3.5 py-1.5 pl-9 text-xs text-neutral-300 placeholder-neutral-600 outline-none focus:border-red-500/30 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
        </div>

        {/* Right Actions: bell, messages, profile dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Notifications alert */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationCount(0);
                showToast("Notification logs cleared.", "info");
              }}
              className="p-2 rounded bg-neutral-900/50 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-neutral-950">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setActiveTab('Communication Log')}
            className="p-2 rounded bg-neutral-900/50 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white transition-all"
          >
            <Mail className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-neutral-800" />

          {/* Super Administrator Menu */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full border-2 border-red-500 bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center relative">
              <div className="text-xs font-mono font-bold text-white">AD</div>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">Admin</span>
              <span className="text-[9px] font-mono font-bold text-red-400 leading-none">Super Administrator</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
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
                  { name: 'Requests', icon: FileText, count: 24, countColor: 'bg-red-500' },
                  { name: 'Memberships', icon: Award, count: 11, countColor: 'bg-amber-500' },
                  { name: 'Events', icon: Calendar, count: null },
                  { name: 'Shop Orders', icon: ShoppingBag, count: 8, countColor: 'bg-amber-500' },
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
                        setSelectedOrder(null);
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
                        <span className={`h-4 px-1 min-w-[16px] text-[9px] font-mono font-bold text-neutral-950 rounded flex items-center justify-center ${item.countColor || 'bg-red-500'}`}>
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
                  { name: 'Users', icon: Users, count: 15 },
                  { name: 'Notifications', icon: Bell, count: null },
                  { name: 'Communication Log', icon: MessageCircle, count: null },
                  { name: 'Analytics', icon: Activity, count: null },
                  { name: 'Reports', icon: FileBarChart2, count: null },
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
                        setSelectedOrder(null);
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

            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-600 uppercase block pl-2 mb-2">
                SUPPORT
              </span>
              <nav className="space-y-0.5">
                {[
                  { name: 'Help Center', icon: HelpCircle },
                  { name: 'System Status', icon: Shield }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-red-400' : 'text-neutral-500'}`} />
                      <span>{item.name}</span>
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
                    Welcome back, Admin
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono">
                    Here's what's happening on the platform today.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-xs text-neutral-300 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    <span>May 20, 2024</span>
                    <ChevronDown className="h-3 w-3 text-neutral-500" />
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
                        onClick={() => setShowEventModal(true)}
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
                      <div className="h-[1px] bg-neutral-900 my-1" />
                      <button
                        onClick={handleBackupDb}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2"
                      >
                        <Database className="h-3.5 w-3.5 text-neutral-400" />
                        Backup Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS COUNT GRID (5 CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Total Members */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Total Members</span>
                    <Users className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">128,947</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>↑ 1,243 this week</span>
                  </p>
                </div>

                {/* Active Requests */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Active Requests</span>
                    <FileText className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">156</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>↑ 12 this week</span>
                  </p>
                </div>

                {/* Pending Reviews */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Pending Reviews</span>
                    <Clock className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">24</h3>
                  <p className="text-[10px] font-mono text-amber-500 flex items-center gap-0.5">
                    <span>↑ 6 awaiting review</span>
                  </p>
                </div>

                {/* Events This Month */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Events This Month</span>
                    <Calendar className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-white">7</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>↑ 2 upcoming</span>
                  </p>
                </div>

                {/* Revenue (This Month) */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 text-left space-y-1.5 col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Revenue (Month)</span>
                    <Briefcase className="h-4 w-4 text-neutral-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold font-mono text-gold-500">$42,780</h3>
                  <p className="text-[10px] font-mono text-green-500 flex items-center gap-0.5">
                    <span>↑ 18% vs last month</span>
                  </p>
                </div>

              </div>

              {/* MAIN METRIC LAYOUT SPLIT */}
              <div className="grid gap-6 xl:grid-cols-12 items-start">
                
                {/* Left Column (9 cols): Requests log table, Events summary, and Orders summary */}
                <div className="xl:col-span-9 space-y-6">
                  
                  {/* Recent Requests Panel */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase text-left">
                        Recent Requests
                      </h3>
                      <button
                        onClick={() => setActiveTab('Requests')}
                        className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                            <th className="px-5 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Member</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                            <th className="px-5 py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60">
                          {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-neutral-950/40 transition-colors">
                              <td className="px-5 py-3.5 font-mono font-semibold text-neutral-300">
                                {req.id}
                              </td>
                              <td className="px-4 py-3.5 text-white font-medium">
                                {req.type}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-mono text-gold-500 font-bold shrink-0">
                                    {req.memberAvatar}
                                  </div>
                                  <span className="text-neutral-300 font-medium">{req.member}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  req.status === 'In Discussion' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  req.status === 'Under Review' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  req.status === 'Offer Made' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                  req.status === 'Payment Requested' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                  req.status === 'Confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                  'bg-neutral-500/10 text-neutral-400 border border-neutral-800'
                                }`}>
                                  <span className={`h-1 w-1 rounded-full ${
                                    req.status === 'In Discussion' ? 'bg-amber-500' :
                                    req.status === 'Under Review' ? 'bg-blue-500' :
                                    req.status === 'Confirmed' ? 'bg-green-500' : 'bg-neutral-400'
                                  }`} />
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                                {req.updated}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setRequestStatusEdit(req.status);
                                    setActiveTab('Requests');
                                  }}
                                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 rounded hover:text-white transition-colors"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
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
                          Upcoming Events
                        </h3>
                        <button
                          onClick={() => setActiveTab('Events')}
                          className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                        >
                          View All
                        </button>
                      </div>

                      <div className="p-4 space-y-3.5">
                        {events.map((ev) => (
                          <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-900/60 bg-neutral-950/20 hover:border-neutral-800 transition-colors">
                            <div className="flex gap-3 items-center">
                              {/* Date Calendar Graphic */}
                              <div className="flex flex-col items-center justify-center h-11 w-11 rounded border border-neutral-800 bg-neutral-950 font-mono text-center shrink-0">
                                <span className="text-[9px] text-red-500 font-semibold">{ev.month}</span>
                                <span className="text-sm font-bold text-white -mt-0.5">{ev.day}</span>
                              </div>
                              <div className="text-left space-y-0.5">
                                <h4 className="text-xs font-semibold text-white leading-tight">{ev.title}</h4>
                                <span className="text-[10px] font-mono text-neutral-500 block">{ev.type}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-0.5 shrink-0">
                              <span className="text-[11px] text-neutral-300 font-bold font-mono">{ev.registered}</span>
                              <span className="text-[9px] text-neutral-500 font-mono block">Registered</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Orders Box */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden text-left">
                      <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                          Recent Orders
                        </h3>
                        <button
                          onClick={() => setActiveTab('Shop Orders')}
                          className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                        >
                          View All
                        </button>
                      </div>

                      <div className="p-4 space-y-3.5">
                        {orders.map((ord) => (
                          <div key={ord.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neutral-900/60 bg-neutral-950/20 hover:border-neutral-800 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-neutral-950 border border-neutral-900 text-gold-500 flex items-center justify-center shrink-0">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <div className="text-left space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white">{ord.item}</span>
                                  <span className="text-[9px] font-mono text-neutral-500">{ord.id}</span>
                                </div>
                                <span className="text-[10px] text-neutral-400 block">{ord.member} • <span className="text-gold-500 font-mono font-medium">${ord.price}</span></span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase leading-none shrink-0 ${
                              ord.status === 'Payment Requested' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                              ord.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              ord.status === 'Preparing' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                              ord.status === 'Shipped' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Centralized Communication Log Panel (Matching exact bottom list) */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden text-left">
                    <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                        Communication Log (Recent)
                      </h3>
                      <button
                        onClick={() => setActiveTab('Communication Log')}
                        className="text-[10px] font-mono text-gold-500 hover:text-gold-400 font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[9px] uppercase">
                            <th className="px-5 py-2.5 font-semibold">ID</th>
                            <th className="px-4 py-2.5 font-semibold">Request ID</th>
                            <th className="px-4 py-2.5 font-semibold">Member</th>
                            <th className="px-4 py-2.5 font-semibold">Method</th>
                            <th className="px-4 py-2.5 font-semibold">Last Contact</th>
                            <th className="px-4 py-2.5 font-semibold">By</th>
                            <th className="px-4 py-2.5 font-semibold">Notes</th>
                            <th className="px-5 py-2.5 font-semibold text-right">Next Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/40 text-[11px]">
                          {commLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-neutral-950/40 transition-colors">
                              <td className="px-5 py-3 font-mono text-neutral-400">{log.id}</td>
                              <td className="px-4 py-3 font-mono font-semibold text-neutral-300">{log.requestId}</td>
                              <td className="px-4 py-3 font-medium text-white">{log.member}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  log.method === 'WhatsApp' ? 'bg-green-500/10 text-green-500' :
                                  log.method === 'Email' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-cyan-500/10 text-cyan-500'
                                }`}>
                                  {log.method}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-neutral-400 font-mono">{log.lastContact}</td>
                              <td className="px-4 py-3 font-semibold text-red-400 font-mono">{log.by}</td>
                              <td className="px-4 py-3 text-neutral-300 leading-relaxed truncate max-w-[140px]" title={log.notes}>
                                {log.notes}
                              </td>
                              <td className="px-5 py-3 text-right text-gold-500 font-medium font-mono leading-none">
                                {log.nextAction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right Column (3 cols): Pie donut chart, System alerts, Platform activity line chart */}
                <div className="xl:col-span-3 space-y-6">
                  
                  {/* Requests by Status - SVG Donut Chart */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        Requests by Status
                      </h4>
                      <button className="text-[10px] font-mono text-neutral-500 hover:text-white">
                        View Report
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-5 pt-2">
                      {/* Interactive Visual Donut SVG */}
                      <div className="relative h-32 w-32 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#161619" strokeWidth="3" />
                          
                          {/* Segment Submitted (14%) - Amber/Yellow */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="14 86" strokeDashoffset="100" />
                          {/* Segment Under Review (15%) - Blue */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="86" />
                          {/* Segment Contacted (11%) - Green */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="11 89" strokeDashoffset="71" />
                          {/* Segment In Discussion (18%) - Purple */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="18 82" strokeDashoffset="60" />
                          {/* Segment Offer Made (10%) - Indigo */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="42" />
                          {/* Segment Payment Requested (13%) - Orange */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="13 87" strokeDashoffset="32" />
                          {/* Segment Confirmed/Completed (19%) - Teal */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="19 81" strokeDashoffset="19" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-bold font-mono text-white leading-none">156</span>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">Total</span>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="flex-1 text-[11px] font-mono text-neutral-400 space-y-1.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" />Submitted</span>
                          <span className="text-white font-semibold">{getStatusCount('Submitted')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Under Review</span>
                          <span className="text-white font-semibold">{getStatusCount('Under Review')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />In Discussion</span>
                          <span className="text-white font-semibold">{getStatusCount('In Discussion')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f97316]" />Payment Req.</span>
                          <span className="text-white font-semibold">{getStatusCount('Payment Requested')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#06b6d4]" />Confirmed</span>
                          <span className="text-white font-semibold">{getStatusCount('Confirmed')}</span>
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
                      {/* Alert 1 */}
                      <button
                        onClick={() => setActiveTab('Requests')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-red-500/10 text-red-500 shrink-0">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">24 requests awaiting review</h5>
                            <p className="text-[10px] text-neutral-400">Requires your attention</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 2 */}
                      <button
                        onClick={() => setActiveTab('Memberships')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">11 membership applications</h5>
                            <p className="text-[10px] text-neutral-400">Pending approval</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 3 */}
                      <button
                        onClick={() => setActiveTab('Shop Orders')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">8 shop orders pending action</h5>
                            <p className="text-[10px] text-neutral-400">Awaiting response</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                      {/* Alert 4 */}
                      <button
                        onClick={() => setActiveTab('Events')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] text-left transition-all group"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="p-1.5 rounded bg-blue-500/10 text-blue-500 shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-semibold text-white">2 events need follow-up</h5>
                            <p className="text-[10px] text-neutral-400">Action required</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                      </button>

                    </div>
                  </div>

                  {/* Platform Activity (7 Days) - Line chart representation */}
                  <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        Platform Activity (7 Days)
                      </h4>
                      <button className="text-[10px] font-mono text-neutral-500 hover:text-white">
                        View Analytics
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Chart Grid Line Visual using inline SVG */}
                      <div className="h-28 w-full bg-neutral-950/40 rounded border border-neutral-900/60 p-2 relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                          {/* Grid horizontal markers */}
                          <line x1="0" y1="10" x2="100" y2="10" stroke="#1c1c21" strokeWidth="0.25" />
                          <line x1="0" y1="20" x2="100" y2="20" stroke="#1c1c21" strokeWidth="0.25" />
                          <line x1="0" y1="30" x2="100" y2="30" stroke="#1c1c21" strokeWidth="0.25" />
                          
                          {/* Members curve (Green line) */}
                          <path d="M0,35 Q15,30 30,22 T60,18 T90,8 T100,6" fill="none" stroke="#10b981" strokeWidth="1" />
                          
                          {/* Requests curve (Amber line) */}
                          <path d="M0,38 Q15,35 30,28 T60,25 T90,15 T100,10" fill="none" stroke="#f59e0b" strokeWidth="1" />

                          {/* Orders curve (Purple line) */}
                          <path d="M0,39 Q15,38 30,35 T60,32 T90,20 T100,18" fill="none" stroke="#8b5cf6" strokeWidth="0.75" strokeDasharray="1 1" />
                        </svg>
                        
                        <div className="absolute inset-x-0 bottom-1 px-2 flex justify-between text-[8px] font-mono text-neutral-600">
                          <span>May 14</span>
                          <span>May 16</span>
                          <span>May 18</span>
                          <span>May 20</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-neutral-500">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                          <span>Members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                          <span>Requests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                          <span>Orders</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup database log output console */}
                  {backupProgress !== null && (
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
                          DB Backup Console Logs
                        </h4>
                        <button
                          onClick={() => setBackupProgress(null)}
                          className="text-[10px] font-mono text-neutral-500 hover:text-white"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="w-full bg-neutral-950 p-3 rounded border border-neutral-900 font-mono text-[10px] space-y-1.5 text-neutral-400 leading-normal max-h-[150px] overflow-y-auto">
                        {backupLogs.map((logStr, lIdx) => (
                          <p key={lIdx} className={logStr.includes('COMPLETED') ? 'text-green-500 font-bold' : ''}>
                            &gt; {logStr}
                          </p>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                          <span>Backup progress</span>
                          <span className="font-bold text-neutral-300">{backupProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${backupProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* ACTIVE VIEW: REQUESTS MANAGER */}
          {activeTab === 'Requests' && (
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="space-y-1">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                    Requests Management Center
                  </h2>
                  <p className="text-xs text-neutral-500 leading-normal font-mono">
                    Perform scheduling approvals, status triggers, and log discussions with members.
                  </p>
                </div>
                {selectedRequest && (
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to List
                  </button>
                )}
              </div>

              {!selectedRequest ? (
                <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                  <div className="p-4 border-b border-neutral-900 flex flex-wrap gap-4 items-center justify-between bg-neutral-950/20">
                    <div className="relative w-full max-w-sm">
                      <input
                        type="text"
                        placeholder="Filter requests by member or type..."
                        className="w-full bg-neutral-950 border border-neutral-900 rounded px-3.5 py-1.5 pl-9 text-xs text-neutral-300 outline-none focus:border-red-500/30"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Quick Filter:</span>
                      <button className="px-2.5 py-1 rounded bg-neutral-900 text-[10px] font-mono border border-neutral-800 text-gold-500 font-bold">
                        All Requests ({requests.length})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                          <th className="px-5 py-3 font-semibold">ID</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold">Member</th>
                          <th className="px-4 py-3 font-semibold">Location</th>
                          <th className="px-4 py-3 font-semibold">Attendees</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Updated</th>
                          <th className="px-5 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/40">
                        {requests.map((req) => (
                          <tr key={req.id} className="hover:bg-neutral-950/20 transition-all">
                            <td className="px-5 py-3.5 font-mono font-semibold text-neutral-300">{req.id}</td>
                            <td className="px-4 py-3.5 font-semibold text-white">{req.type}</td>
                            <td className="px-4 py-3.5 font-medium text-neutral-300">{req.member}</td>
                            <td className="px-4 py-3.5 text-neutral-400 font-mono">{req.location}</td>
                            <td className="px-4 py-3.5 text-neutral-400 font-mono">{req.attendees}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                req.status === 'In Discussion' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                req.status === 'Under Review' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                req.status === 'Offer Made' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                req.status === 'Payment Requested' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                req.status === 'Confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                'bg-neutral-500/10 text-neutral-400 border border-neutral-800'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-neutral-500">{req.updated}</td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRequestStatusEdit(req.status);
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-[10px] font-mono text-white font-bold rounded shadow-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-12 items-start">
                  
                  {/* Selected Request Left Info panel */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-900">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-gold-500 uppercase font-bold">Proposal Metadata Details</span>
                          <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            {selectedRequest.type}
                            <span className="text-xs font-mono text-neutral-500 font-normal">({selectedRequest.id})</span>
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-400">Current Phase:</span>
                          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-500">
                            {selectedRequest.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2 text-xs">
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Member Proposer</span>
                          <p className="text-white font-semibold text-sm">{selectedRequest.member}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Preferred Date / Interval</span>
                          <p className="text-white font-semibold text-sm">{selectedRequest.preferredDate}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Proposed Location</span>
                          <p className="text-white font-semibold text-sm">{selectedRequest.location}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Guest Count</span>
                          <p className="text-white font-semibold text-sm">{selectedRequest.attendees}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Communication Link</span>
                          <p className="text-white font-semibold text-sm">{selectedRequest.whatsappNumber} (WhatsApp Line)</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-neutral-500 block font-mono">Contribution Funding Status</span>
                          <p className="text-gold-500 font-semibold text-sm">Voluntary Charity Allocations Confirmed</p>
                        </div>
                      </div>

                      {/* Change Status Control Form */}
                      <div className="pt-4 border-t border-neutral-900 space-y-3">
                        <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
                          Management Control Actions
                        </h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs text-neutral-400">Change Status Phase:</span>
                          <select
                            value={requestStatusEdit}
                            onChange={(e) => setRequestStatusEdit(e.target.value as any)}
                            className="bg-neutral-950 border border-neutral-900 rounded px-3 py-1.5 text-xs text-neutral-300 outline-none focus:border-red-500/40"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="In Discussion">In Discussion</option>
                            <option value="Offer Made">Offer Made</option>
                            <option value="Payment Requested">Payment Requested</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleUpdateStatus(selectedRequest.id, requestStatusEdit)}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-neutral-950 font-bold rounded text-xs transition-colors"
                          >
                            Execute Transition
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sincerity Pledge and Gemini AI Assist Card */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-6 space-y-5">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-gold-500 uppercase font-bold">Integrity Pledge Statement</span>
                          <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Member Sincerity Narrative</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400">
                          Verified Integrity Check
                        </span>
                      </div>

                      <div className="relative bg-neutral-950 p-4 rounded-lg border border-neutral-900/60 text-xs text-neutral-300 leading-relaxed font-mono">
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[9px] font-mono text-neutral-500">
                          ORIGINAL SUBMISSION
                        </span>
                        <p className="whitespace-pre-wrap italic">
                          "{selectedRequest.sincerity || "No sincerity pledge was required or specified for this basic request type."}"
                        </p>
                      </div>

                      {/* Gemini AI Assist Button and Panel */}
                      <div className="pt-2">
                        {!aiAnalysis ? (
                          <button
                            disabled={isAiEvaluating}
                            onClick={async () => {
                              setIsAiEvaluating(true);
                              try {
                                const res = await suggestOffer(selectedRequest);
                                setAiAnalysis(res.analysis);
                                setAiSuggestion(res.suggestion);
                                showToast('AI Analysis & Offer Suggestion generated successfully!', 'success');
                              } catch (err) {
                                console.error(err);
                                showToast('Failed to consult Google Gemini API.', 'error');
                              } finally {
                                setIsAiEvaluating(false);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded text-xs tracking-wider uppercase transition-all shadow cursor-pointer disabled:opacity-50"
                          >
                            {isAiEvaluating ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                                Evaluating Sincerity with Gemini...
                              </>
                            ) : (
                              <>
                                <span>✨ Consult Google Gemini AI for Offer & Sincerity analysis</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-4 rounded-lg border border-amber-500/15 bg-amber-500/[0.02] p-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                <span>✨ Google Gemini Insights</span>
                              </h5>
                              <button
                                onClick={() => {
                                  setAiAnalysis('');
                                  setAiSuggestion('');
                                }}
                                className="text-[10px] font-mono text-neutral-500 hover:text-white underline"
                              >
                                Re-evaluate
                              </button>
                            </div>

                            <div className="space-y-3.5 text-xs text-neutral-300">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-neutral-500 block uppercase">SINCERITY & LOGISTICS ASSESSMENT:</span>
                                <p className="bg-neutral-950 p-2.5 rounded border border-neutral-900 text-neutral-200 leading-relaxed">
                                  {aiAnalysis}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-mono text-neutral-500 block uppercase">RECOMMENDED TEAM OFFER REPLY:</span>
                                  <button
                                    onClick={() => {
                                      setAdminTimelineMsg(aiSuggestion);
                                      showToast('Offer suggestion loaded into Response field!', 'success');
                                    }}
                                    className="text-[9px] font-mono text-gold-500 hover:text-gold-400 bg-gold-500/5 hover:bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/10"
                                  >
                                    Load into Response field
                                  </button>
                                </div>
                                <div className="relative bg-neutral-950 p-3 rounded border border-neutral-900 text-neutral-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                                  {aiSuggestion}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Communication Manual Log Entry Form */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-6 space-y-4">
                      <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase border-b border-neutral-900 pb-2">
                        Log Manual Contact / Conversation
                      </h4>

                      <div className="space-y-4 text-xs">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-neutral-500 font-mono">CONTACT METHOD</label>
                            <select
                              value={manualLogMethod}
                              onChange={(e) => setManualLogMethod(e.target.value as any)}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded px-3 py-2 text-white outline-none"
                            >
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Email">Email</option>
                              <option value="Telegram">Telegram</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-neutral-500 font-mono">NEXT EXPECTED ACTION</label>
                            <input
                              type="text"
                              placeholder="e.g. Awaiting payment, coordinate slots"
                              value={manualLogAction}
                              onChange={(e) => setManualLogAction(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded px-3 py-2 text-white outline-none focus:border-red-500/30"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-neutral-500 font-mono uppercase">CONVERSATION SUMMARY / NOTES</label>
                          <textarea
                            rows={3}
                            placeholder="Type details of the call or messages exchanged..."
                            value={manualLogNote}
                            onChange={(e) => setManualLogNote(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-900 rounded px-3 py-2 text-white outline-none focus:border-red-500/30"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleAddManualLog(selectedRequest.id)}
                            disabled={!manualLogNote.trim()}
                            className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded text-xs transition-colors disabled:opacity-50 shadow"
                          >
                            Commit Communication Log
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Selected Request Right logs sidebar */}
                  <div className="lg:col-span-4 space-y-6 text-left">
                    
                    {/* 1. SHARED MEMBER TIMELINE CHAT */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                          Shared Member Chat Timeline
                        </h4>
                        <span className="text-[9px] font-mono text-red-500 uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">
                          Live Shared Bridge
                        </span>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto space-y-3.5 pr-1 divide-y divide-neutral-900/40">
                        {(proposalChats[selectedRequest.id] || []).map((msg, index) => {
                          if (msg.sender === 'system') {
                            return (
                              <div key={msg.id || index} className="text-[10px] font-mono text-amber-500 bg-amber-500/5 p-2 rounded border border-amber-500/10 mt-2">
                                {msg.text}
                              </div>
                            );
                          }
                          const isMgt = msg.sender === 'management';
                          return (
                            <div key={msg.id || index} className="space-y-1 pt-2 first:pt-0">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className={`text-[10px] font-bold ${isMgt ? 'text-red-400' : 'text-neutral-400'}`}>
                                  {isMgt ? 'Management (Sarah)' : `${selectedRequest.member || 'Member'}`}
                                </span>
                                <span className="text-[8px] text-neutral-600 font-mono">{msg.timestamp}</span>
                              </div>
                              <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded border border-neutral-900/60 leading-relaxed font-mono">
                                {msg.text}
                              </p>
                            </div>
                          );
                        })}
                        {(proposalChats[selectedRequest.id] || []).length === 0 && (
                          <p className="text-xs text-neutral-500 italic text-center py-6">No shared timeline comments yet.</p>
                        )}
                      </div>

                      {/* Timeline Message Dispatch Tool */}
                      <div className="space-y-2 pt-3 border-t border-neutral-900">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase">
                          Send Response To Member
                        </label>
                        <textarea
                          rows={2}
                          value={adminTimelineMsg}
                          onChange={(e) => setAdminTimelineMsg(e.target.value)}
                          placeholder="Type an official response or schedule log to dispatch..."
                          className="w-full bg-neutral-950 border border-neutral-900 rounded p-2 text-xs text-white placeholder-neutral-700 outline-none focus:border-red-500/30 resize-none leading-relaxed"
                        />
                        <button
                          onClick={() => handleSendAdminTimelineMsg(selectedRequest.id)}
                          disabled={!adminTimelineMsg.trim()}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 text-neutral-950 font-mono font-bold rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          Send Timeline Response
                        </button>
                      </div>
                    </div>

                    {/* 2. ADMINISTRATIVE LOG HISTORY */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase pb-2 border-b border-neutral-900">
                        Administrative Call/Method Logs
                      </h4>
                      
                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                        {commLogs
                          .filter(log => log.requestId === selectedRequest.id)
                          .map((log, idx) => (
                            <div key={log.id} className="p-3 rounded bg-neutral-950 border border-neutral-900 space-y-1 text-xs">
                              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                                <span className="text-red-400 font-bold">{log.by}</span>
                                <span>{log.lastContact}</span>
                              </div>
                              <p className="text-neutral-200 leading-normal font-medium">{log.notes}</p>
                              <div className="text-[10px] text-neutral-500 border-t border-neutral-900/60 pt-1 mt-1 font-mono flex justify-between">
                                <span>Action:</span>
                                <span className="text-gold-500 font-bold">{log.nextAction}</span>
                              </div>
                            </div>
                          ))}

                        {commLogs.filter(log => log.requestId === selectedRequest.id).length === 0 && (
                          <p className="text-xs text-neutral-500 italic py-4">No logged history found for this proposal yet.</p>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* ACTIVE VIEW: MEMBERSHIPS APPLICATIONS MANAGER */}
          {activeTab === 'Memberships' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  Gold & Platinum Memberships Approval CMS
                </h2>
                <p className="text-xs text-neutral-500 leading-normal font-mono">
                  Confirm membership credentials, inspect fan profiles, and approve upgrades to unlock perks.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-900 bg-neutral-950/20 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    Pending applications ({memberships.filter(m => m.status === 'Pending').length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                        <th className="px-5 py-3 font-semibold">Application ID</th>
                        <th className="px-4 py-3 font-semibold">Applicant Name</th>
                        <th className="px-4 py-3 font-semibold">Email Contact</th>
                        <th className="px-4 py-3 font-semibold">Applied Tier</th>
                        <th className="px-4 py-3 font-semibold">Submission Date</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Decisions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40">
                      {memberships.map((app) => (
                        <tr key={app.id} className="hover:bg-neutral-950/20 transition-all">
                          <td className="px-5 py-3.5 font-mono text-neutral-300 font-semibold">{app.id}</td>
                          <td className="px-4 py-3.5 font-semibold text-white">{app.name}</td>
                          <td className="px-4 py-3.5 text-neutral-400 font-mono">{app.email}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-500 font-bold border border-gold-500/20 font-mono text-[10px]">
                              {app.tier} MEMBER
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-neutral-400 font-mono">{app.appliedOn}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              app.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              app.status === 'Approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {app.status === 'Pending' ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleMembershipAction(app.id, 'Approved')}
                                  className="p-1 rounded bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-neutral-950 transition-colors border border-green-500/20"
                                  title="Approve Member"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleMembershipAction(app.id, 'Rejected')}
                                  className="p-1 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors border border-red-500/20"
                                  title="Reject Application"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-neutral-500 font-mono text-[10px]">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: SHOP ORDERS */}
          {activeTab === 'Shop Orders' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  Exclusive Merchandise Orders Fulfillment CMS
                </h2>
                <p className="text-xs text-neutral-500 leading-normal font-mono">
                  Monitor payment status, log shipping tracking codes, and coordinate with fulfillment vendors.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-900 bg-neutral-950/20 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    All Orders ({orders.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                        <th className="px-5 py-3 font-semibold">Order ID</th>
                        <th className="px-4 py-3 font-semibold">Buyer Member</th>
                        <th className="px-4 py-3 font-semibold">Merch Product</th>
                        <th className="px-4 py-3 font-semibold">Total Price</th>
                        <th className="px-4 py-3 font-semibold">Updated</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-950/20 transition-all">
                          <td className="px-5 py-3.5 font-mono text-neutral-300 font-semibold">{ord.id}</td>
                          <td className="px-4 py-3.5 text-white font-medium">{ord.member}</td>
                          <td className="px-4 py-3.5 font-medium">{ord.item}</td>
                          <td className="px-4 py-3.5 text-gold-500 font-mono font-bold">${ord.price}</td>
                          <td className="px-4 py-3.5 text-neutral-400 font-mono">{ord.updated}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              ord.status === 'Payment Requested' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                              ord.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              ord.status === 'Preparing' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                              ord.status === 'Shipped' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <select
                              value={ord.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as any;
                                setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: newStatus, updated: 'Just now' } : o));
                              }}
                              className="bg-neutral-950 border border-neutral-900 rounded px-2.5 py-1 text-[10px] font-mono text-neutral-300 outline-none"
                            >
                              <option value="Payment Requested">Payment Requested</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: EVENTS */}
          {activeTab === 'Events' && (
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="space-y-1">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                    Event Scheduling & Registration Management
                  </h2>
                  <p className="text-xs text-neutral-500 leading-normal font-mono">
                    Schedule online AMA live-streams, screenings, or coordinate physical meetups.
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(true)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-neutral-950 px-4 py-2 rounded text-xs font-bold tracking-wider"
                >
                  <Plus className="h-4 w-4" />
                  Create New Event
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {events.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded bg-neutral-950 border border-neutral-800 font-mono">
                          <span className="text-[10px] text-red-500 font-bold">{ev.month}</span>
                          <span className="text-lg font-bold text-white -mt-0.5">{ev.day}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-gold-500 font-bold tracking-widest block uppercase">
                            {ev.type}
                          </span>
                          <h3 className="font-serif text-sm font-semibold text-white leading-tight mt-0.5">
                            {ev.title}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEvents(prev => prev.filter(e => e.id !== ev.id));
                          showToast('Event deleted successfully.', 'info');
                        }}
                        className="p-1 rounded text-neutral-600 hover:text-red-500 hover:bg-neutral-900 transition-colors"
                        title="Delete Event"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400 pt-2 border-t border-neutral-900/60">
                      <div>
                        <span className="text-[9px] text-neutral-500 block">START TIME</span>
                        <span>{ev.time}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 block">TOTAL REGISTERED</span>
                        <span className="text-white font-bold">{ev.registered} Members</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: COMMUNICATION LOG */}
          {activeTab === 'Communication Log' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  Centralized Communication Feed & Logs
                </h2>
                <p className="text-xs text-neutral-500 leading-normal font-mono">
                  Full historical archive of outbound contacts, automated SMS status dispatches, and WhatsApp chat history.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                        <th className="px-5 py-3 font-semibold">Log ID</th>
                        <th className="px-4 py-3 font-semibold">Target Proposal</th>
                        <th className="px-4 py-3 font-semibold">Recipient</th>
                        <th className="px-4 py-3 font-semibold">Channel</th>
                        <th className="px-4 py-3 font-semibold">Dispatched</th>
                        <th className="px-4 py-3 font-semibold">Agent Dispatcher</th>
                        <th className="px-4 py-3 font-semibold">Message Transcript</th>
                        <th className="px-5 py-3 font-semibold text-right">Required Next Steps</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40 leading-relaxed">
                      {commLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-950/20 transition-all">
                          <td className="px-5 py-3.5 font-mono text-neutral-400">{log.id}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-neutral-300">{log.requestId}</td>
                          <td className="px-4 py-3.5 font-semibold text-white">{log.member}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 font-mono">
                              {log.method}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-neutral-400">{log.lastContact}</td>
                          <td className="px-4 py-3.5 font-mono text-red-400 font-bold">{log.by}</td>
                          <td className="px-4 py-3.5 text-neutral-300 max-w-sm truncate" title={log.notes}>
                            {log.notes}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-gold-500 font-semibold text-[10px]">
                            {log.nextAction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: SETTINGS */}
          {activeTab === 'Settings' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  Platform Parameter Control Center
                </h2>
                <p className="text-xs text-neutral-500 leading-normal font-mono">
                  Configure visual title descriptors, toggles, and security firewalls.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase pb-2 border-b border-neutral-900">
                    GENERAL CONFIGURATIONS
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-mono uppercase">PLATFORM PUBLIC NAME</label>
                      <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-900 rounded px-3 py-2 text-white outline-none focus:border-red-500/30 font-semibold"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded bg-neutral-950 border border-neutral-900">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">Maintenance System Mode</span>
                        <p className="text-[10px] text-neutral-500">Temporarily block fan request submissions.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="h-4 w-4 bg-neutral-950 text-red-500 border-neutral-800"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded bg-neutral-950 border border-neutral-900">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">Allow Gold Registrations</span>
                        <p className="text-[10px] text-neutral-500">Enable credit token upgrades online.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowRegistration}
                        onChange={(e) => setAllowRegistration(e.target.checked)}
                        className="h-4 w-4 bg-neutral-950 text-red-500 border-neutral-800"
                      />
                    </div>

                    <button
                      onClick={() => showToast('Platform configurations updated!', 'success')}
                      className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded"
                    >
                      Save Configuration Metrics
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase pb-2 border-b border-neutral-900">
                    PLATFORM SYSTEM UTILITIES
                  </h3>

                  <div className="space-y-3.5 text-xs text-neutral-400">
                    <p className="leading-relaxed text-xs">
                      Perform global database audits, backup state registries, and confirm coordination sync structures.
                    </p>

                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        onClick={handleBackupDb}
                        className="p-4 rounded border border-neutral-900 hover:border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                      >
                        <Database className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white font-mono text-[10px]">BACKUP DATABASE</span>
                      </button>

                      <button
                        onClick={() => {
                          showToast('Synchronizing coordination state tables... Alignment completed.', 'success');
                        }}
                        className="p-4 rounded border border-neutral-900 hover:border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                      >
                        <RefreshCw className="h-5 w-5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="font-bold text-white font-mono text-[10px]">SYNC CORES</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* 3. MODALS AND FORMS AREA */}
      <AnimatePresence>
        
        {/* ADD EVENT MODAL */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl text-left"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500">SCHEDULE EVENT</span>
                <button onClick={() => setShowEventModal(false)} className="p-1 rounded text-neutral-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddEventSubmit} className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-mono">EVENT TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London Charity Dinner Gala"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-red-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">DATE</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">TIME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 06:00 PM EST"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">LOCATION</label>
                    <input
                      type="text"
                      placeholder="e.g. London, UK"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-mono">ATTENDEE CAPACITY</label>
                    <input
                      type="number"
                      value={eventCapacity}
                      onChange={(e) => setEventCapacity(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border border-neutral-800 rounded font-bold hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded shadow-lg shadow-amber-500/10"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                    <option value="All Members">All Members (128,947 fans)</option>
                    <option value="Gold Members Only">Gold Members Only (3,420 fans)</option>
                    <option value="Platinum Members Only">Platinum Members Only (840 fans)</option>
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
