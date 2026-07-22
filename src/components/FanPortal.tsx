/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGlobalState } from '../utils/StateContext';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import { notifyRewardRedeemed } from '../utils/notifications';
import NotificationBell from './NotificationBell';
import MyMembershipDashboard from './MyMembershipDashboard';
import ProfileSection from './ProfileSection';
import FanExperienceBookings from './FanExperienceBookings';
import {
  LayoutGrid,
  User,
  Users,
  FileText,
  Home,
  Calendar,
  Award,
  Crown,
  Compass,
  Gift,
  Bell,
  Settings,
  ChevronDown,
  Search,
  MessageSquare,
  Copy,
  Check, CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Download,
  Send,
  MessageCircle,
  MapPin,
  ShieldAlert,
  Heart,
  Plus,
  Lock,
  Sparkles,
  Ticket,
  Star,
  Globe,
  Upload,
  ThumbsUp,
  Menu,
  X,
  Mail,
  Loader2,
  Palette,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from '../utils/theme';
import { TermsOfServiceModal, PrivacyPolicyModal } from './LegalModals';
import FanEvents from './FanEvents';
import AskGillianChat from './AskGillianChat';
import FanAdminChat from './FanAdminChat';

interface FanPortalProps {
  onBackToHome: () => void;
}

// Interfaces
interface RequestDetail {
  id: string;
  type: string;
  preferredDate: string;
  location: string;
  attendees: string;
  whatsappNumber: string;
  status: 'Submitted' | 'Under Review' | 'In Discussion' | 'Offer Made' | 'Payment Requested' | 'Confirmed' | 'Completed';
  submittedOn: string;
  lastUpdated: string;
  sincerity: string;
  member?: string;
  memberAvatar?: string;
  updated?: string;
}

interface FanArtItem {
  id: string;
  title: string;
  category: 'Fan Art' | 'Fan Story' | 'Fan Video' | 'Photography';
  author: string;
  description: string;
  likes: number;
  hasLiked?: boolean;
}

interface DiscussionReply {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface DiscussionPost {
  id: string;
  author: string;
  text: string;
  time: string;
  replies: DiscussionReply[];
}

const getLoyaltyRank = (points: number) => {
  if (points <= 1500) {
    return {
      name: 'Bronze Catalyst',
      badgeColor: 'border-amber-700/40 bg-amber-950/20 text-amber-500',
      icon: '🥉',
      min: 0,
      max: 1500,
      next: 'Silver Guardian'
    };
  } else if (points <= 3500) {
    return {
      name: 'Silver Guardian',
      badgeColor: 'border-slate-500/40 bg-slate-900/20 text-slate-400',
      icon: '🥈',
      min: 1500,
      max: 3500,
      next: 'Gold Ambassador'
    };
  } else if (points <= 6500) {
    return {
      name: 'Gold Ambassador',
      badgeColor: 'border-gold-500/30 bg-gold-500/10 text-gold-500',
      icon: '👑',
      min: 3500,
      max: 6500,
      next: 'Platinum Custodian'
    };
  } else if (points <= 10000) {
    return {
      name: 'Platinum Custodian',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      icon: '🔮',
      min: 6500,
      max: 10000,
      next: 'Diamond Luminary'
    };
  } else {
    return {
      name: 'Diamond Luminary',
      badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      icon: '💎',
      min: 10000,
      max: 20000,
      next: 'Max Rank'
    };
  }
};

export default function FanPortal({ onBackToHome }: FanPortalProps) {
  // Authentication
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, profile, loading: sessionLoading, signIn, signUp, signOut, updateProfile } = useAuth();
  const isLoggedIn = !!user;

  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'login' ? 'login' : 'register'
  );
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authCountry, setAuthCountry] = useState('USA');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Sync auth mode with URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login' || mode === 'register') {
      setAuthMode(mode);
    }
  }, [searchParams]);

  // Sync profile data into local state when logged in
  useEffect(() => {
    if (profile) {
      setAuthName(profile.name);
      setAuthEmail(profile.email);
      setAuthCountry(profile.country || 'Global');
    } else if (user) {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Fan';
      setAuthName(name);
      setAuthEmail(user.email || '');
    }
  }, [profile, user]);

  // Portal State
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Profile' | 'Community' | 'Messages' | 'Ask Gillian' | 'Events' | 'Experiences' | 'Membership' | 'My Journey' | 'Rewards' | 'Notifications' | 'Settings'>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  // Selected single request detail expansion
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const {
    requests: backendRequests,
    proposalChats: backendProposalChats,
    discussions: backendDiscussions,
    posts: backendPosts,
    content: backendContent,
    addPost,
    deletePost,
    likePost,
    commentPost,
    replyComment,
    addDiscussionPost,
    addDiscussionReply,
    addNotification,
  } = useGlobalState();

  const [userRequests, setUserRequests] = useState<RequestDetail[]>([]);

  useEffect(() => {
    if (backendRequests) {
      setUserRequests(backendRequests);
    }
  }, [backendRequests]);

  // Legal Modals triggers
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);


  // Communication bridge modal — removed (feature deprecated)

  // Storage synchronization listener so Fan and Admin portals update reactively in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kr_requests_shared' && e.newValue) {
        try {
          setUserRequests(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'kr_proposal_chats_shared' && e.newValue) {
        try {
          setProposalChats(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Scroll to top immediately whenever activeTab, login status, or active request changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, isLoggedIn, selectedRequestId]);

  // Request wizard in portal
  // (request wizard state removed — feature deprecated)

  // Community State
  const [communitySubTab, setCommunitySubTab] = useState<'Feed' | 'Discussions' | 'Fan Works'>('Feed');
  const [activeCountryClub, setActiveCountryClub] = useState<string>('Global');
  const [clubDiscussions, setClubDiscussions] = useState<{ [club: string]: DiscussionPost[] }>({});

  useEffect(() => {
    if (backendDiscussions && Object.keys(backendDiscussions).length > 0) {
      setClubDiscussions(backendDiscussions);
    }
  }, [backendDiscussions]);
  const [newDiscussionText, setNewDiscussionText] = useState('');
  const [replyInputs, setReplyInputs] = useState<{ [postId: string]: string }>({});

  // Posts Feed State
  const [postCommentInputs, setPostCommentInputs] = useState<{ [postId: string]: string }>({});
  const [postReplyInputs, setPostReplyInputs] = useState<{ [postId: string]: string }>({});
  const [showPostComments, setShowPostComments] = useState<{ [postId: string]: boolean }>({});
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('All');
  const postCategories = ['All', 'FAN ART', 'LETTERS', 'ENCOUNTERS'];
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  // Fan Creativity Board
  const [creations, setCreations] = useState<FanArtItem[]>([]);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('fan_creations').select('*').order('created_at', { ascending: false });
      if (!error && data) setCreations(data);
    })();
  }, []);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Fan Art' | 'Fan Story' | 'Fan Video' | 'Photography'>('Fan Art');
  const [uploadDesc, setUploadDesc] = useState('');

  // Experience browser state
  const [expSubTab, setExpSubTab] = useState<'browse' | 'bookings'>('browse');
  const [fanExperiences, setFanExperiences] = useState<any[]>([]);
  const [fanExpSearch, setFanExpSearch] = useState('');
  const [fanExpCategory, setFanExpCategory] = useState('ALL');
  const [fanExpLoading, setFanExpLoading] = useState(true);

  useEffect(() => {
    if (expSubTab === 'browse') {
      setFanExpLoading(true);
      supabase.from('experiences').select('*').order('sort_order').order('title').then(({ data, error }) => {
        if (!error && data) setFanExperiences(data || []);
        setFanExpLoading(false);
      });
    }
  }, [expSubTab]);

  // Portal rewards from DB
  const [portalRewards, setPortalRewards] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('portal_rewards').select('*');
      if (!error && data) setPortalRewards(data);
    })();
  }, []);

  // Messages State for 3 active channels

  // Loyalty & Rewards State
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [membership, setMembership] = useState<any>(null);

  const normalizeMembership = (row: any): any => {
    if (!row) return null;
    let msg: any = {};
    try { msg = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {}); } catch {}
    let nts: any = {};
    try { nts = typeof row.notes === 'string' ? JSON.parse(row.notes) : (row.notes || {}); } catch {}
    return {
      id: row.id, user_id: row.user_id,
      status: row.status === 'suspended' ? 'expired' : row.status,
      tier_id: msg.tier_id || row.tier,
      tier_name: msg.tier_name || row.tier,
      tier_price: msg.tier_price || msg.price || '',
      card_name: row.full_name || '',
      card_serial: msg.card_serial || '',
      member_name: msg.member_name || row.full_name || '',
      member_email: row.email || '',
      member_phone: msg.phone || '',
      member_country: row.country || '',
      profile_photo: msg.profile_photo || '',
      comm_method: msg.comm_method || '',
      membership_number: nts.membership_number || '',
      activation_date: row.reviewed_at || '',
      expiration_date: nts.expiration_date || '',
      cancel_reason: nts.cancel_reason || '',
      admin_notes: nts.admin_notes || '',
      created_at: row.created_at,
    };
  };

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const [{ data: pts }, { data: card }] = await Promise.all([
        supabase.from('loyalty_points').select('total').eq('user_id', user.id).limit(1),
        supabase.from('membership_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (pts && pts.length > 0) setLoyaltyPoints(pts[0].total);
      if (card) setMembership(normalizeMembership(card));
    })();
  }, [user, activeTab]);

  const rank = getLoyaltyRank(loyaltyPoints);
  // Override rank display with membership tier if active
  const displayRank = (membership?.status === 'active') ? {
    name: membership.tier_name,
    badgeColor: 'border-gold-500/30 bg-gold-500/10 text-gold-500',
    icon: '👑',
    min: rank.min,
    max: rank.max,
    next: rank.next
  } : rank;

  const progressPercent = Math.min(100, Math.max(0, ((loyaltyPoints - displayRank.min) / (displayRank.max - displayRank.min)) * 100));
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data, error } = await supabase.from('user_badges').select('*').eq('user_id', user.id);
      if (!error && data) setBadges(data);
    })();
  }, [user]);

  // Additional dashboard stats
  const [fanStats, setFanStats] = useState({ bookings: 0, events: 0, posts: 0, memberSince: '' });
  useEffect(() => {
    if (!user?.id || activeTab !== 'Dashboard') return;
    void (async () => {
      const [{ count: bookingCount }, { count: eventCount }, { count: postCount }, { data: prof }] = await Promise.all([
        supabase.from('experience_requests').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('profiles').select('created_at').eq('id', user.id).maybeSingle(),
      ]);
      setFanStats({
        bookings: bookingCount ?? 0,
        events: eventCount ?? 0,
        posts: postCount ?? 0,
        memberSince: prof?.created_at || '',
      });
    })();
  }, [user, activeTab]);

  // Kindness log & Journey timeline State
  const [journeyLog, setJourneyLog] = useState([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      // Fetch all journey_log entries (table may not have user_id column)
      const { data: journeyData, error: journeyError } = await supabase.from('journey_log').select('*').order('created_at', { ascending: false });

      // Fetch user's experience bookings as journey entries
      const { data: bookings } = await supabase
        .from('experience_requests')
        .select('id, experience_title, created_at, submitted_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const journeyEntries = (!journeyError && journeyData) ? journeyData : [];
      const bookingEntries = (bookings || []).map((b: any) => ({
        id: `bk-${b.id}`,
        title: `Booked: ${b.experience_title}`,
        description: `Booking submitted for "${b.experience_title}"`,
        color: 'bg-blue-500',
        created_at: b.submitted_date || b.created_at,
      }));

      // Merge, dedup by title
      const allTitles = new Set(bookingEntries.map((e: any) => e.title));
      const uniqueJourney = journeyEntries.filter((e: any) => !allTitles.has(e.title));
      setJourneyLog([...bookingEntries, ...uniqueJourney]);
    })();
  }, [user]);

  const [newKindnessTitle, setNewKindnessTitle] = useState('');
  const [newKindnessDesc, setNewKindnessDesc] = useState('');

  // Portal Theme Customizer
  const [accentColor, setAccentColor] = useState<'gold' | 'red' | 'green' | 'blue'>('gold');

  // Messages State for management channel
  const [newMessage, setNewMessage] = useState('');
  const [channelMessages, setChannelMessages] = useState<{ id: string; sender: 'management' | 'user'; text: string; timestamp: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase.from('channel_messages').select('*').eq('name', 'management');
        if (!error && data) setChannelMessages(data);
      } catch {}
    })();
  }, []);

  // Active Proposal Inner Chat Timeline
  const [proposalChats, setProposalChats] = useState<{ [proposalId: string]: { id: string; sender: 'management' | 'user' | 'system'; text: string; timestamp: string }[] }>({});

  useEffect(() => {
    if (backendProposalChats) {
      setProposalChats(backendProposalChats);
    }
  }, [backendProposalChats]);

  const [timelineCommentText, setTimelineCommentText] = useState('');

  // (request wizard step removed — feature deprecated)

  // Notifications State (per-user from notifications table)
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setNotifications(data);
    })();
  }, [user]);

  // Helper helper to generate dynamic portal notifications
  const pushNotification = (text: string) => {
    addNotification('Sanction Update', text, 'update');
    setNotifications(prev => [
      {
        id: `n-${Date.now()}`,
        text,
        time: new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        unread: true
      },
      ...prev
    ]);
  };

  // Helper to append dynamic journey milestones
  const addJourneyMilestone = async (title: string, description: string, color: string = 'bg-gold-500') => {
    try {
      await supabase.from('journey_log').insert({ title, description, color });
    } catch {}
    setJourneyLog(prev => [
      {
        id: `j-${Date.now()}`,
        title,
        date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
        description,
        color
      },
      ...prev
    ]);
  };

  // Theme Accent Getter
  const getThemeColorClass = (type: 'text' | 'bg' | 'border' | 'hoverBg' | 'glow' | 'accent' | 'bg10') => {
    if (accentColor === 'red') {
      return {
        text: 'text-red-500',
        bg: 'bg-red-500',
        border: 'border-red-500',
        hoverBg: 'hover:bg-red-600',
        glow: 'shadow-red-500/10 border-red-500/30',
        accent: 'red',
        bg10: 'bg-red-500/10'
      }[type];
    }
    if (accentColor === 'green') {
      return {
        text: 'text-emerald-500',
        bg: 'bg-emerald-500',
        border: 'border-emerald-500',
        hoverBg: 'hover:bg-emerald-600',
        glow: 'shadow-emerald-500/10 border-emerald-500/30',
        accent: 'emerald',
        bg10: 'bg-emerald-500/10'
      }[type];
    }
    if (accentColor === 'blue') {
      return {
        text: 'text-cyan-500',
        bg: 'bg-cyan-500',
        border: 'border-cyan-500',
        hoverBg: 'hover:bg-cyan-600',
        glow: 'shadow-cyan-500/10 border-cyan-500/30',
        accent: 'cyan',
        bg10: 'bg-cyan-500/10'
      }[type];
    }
    return {
      text: 'text-gold-500',
      bg: 'bg-gold-500',
      border: 'border-gold-500',
      hoverBg: 'hover:bg-gold-400',
      glow: 'shadow-gold-500/10 border-gold-500/30',
      accent: 'gold',
      bg10: 'bg-gold-500/10'
    }[type];
  };

  // Settings State
  const [portalAccent, setPortalAccent] = useState<PaletteType>(() => {
    return (localStorage.getItem('kr_portal_accent') as PaletteType) || 'Gibson Gold';
  });

  useEffect(() => {
    applyTheme(portalAccent);
    localStorage.setItem('kr_portal_accent', portalAccent);
  }, [portalAccent]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kr_portal_accent' && e.newValue) {
        setPortalAccent(e.newValue as PaletteType);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [settingsWebhooks, setSettingsWebhooks] = useState(true);
  const [settingsLogs, setSettingsLogs] = useState(false);
  const [settingsTwoFactor, setSettingsTwoFactor] = useState(true);
  const [settingsEmailAlerts, setSettingsEmailAlerts] = useState(true);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // General helpers
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Upgrade Membership inside Portal Modal
  const [showPortalMembershipModal, setShowPortalMembershipModal] = useState(false);
  const [mTierId, setMTierId] = useState('');
  const [mReason, setMReason] = useState('');
  const [mContact, setMContact] = useState<'whatsapp' | 'email'>('email');
  const [mContactVal, setMContactVal] = useState('');
  const [mUpgrading, setMUpgrading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userText = newMessage.trim();
    const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `chat-${Date.now()}`,
      sender: 'user' as const,
      text: userText,
      timestamp
    };

    try {
      await supabase.from('channel_messages').insert({
        name: 'management', sender: 'user', text: userText
      });
    } catch {}

    setChannelMessages((prev) => [...prev, newMsg]);
    setNewMessage('');

    await addJourneyMilestone(
      'Dispatched Message: Management',
      `Secure communication logged regarding portal inquiry: "${userText.substring(0, 30)}..."`,
      'bg-blue-500'
    );
  };

  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim()) return;

    try {
      const newDisc = await addDiscussionPost(activeCountryClub, newDiscussionText.trim(), authName);
      setClubDiscussions((prev) => ({
        ...prev,
        [activeCountryClub]: [newDisc as DiscussionPost, ...(prev[activeCountryClub] || [])]
      }));
      setNewDiscussionText('');
      showToast('Discussion posted!', 'success');
    } catch {
      showToast('Failed to post discussion.', 'error');
    }
  };

  const handleAddReply = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyInputs[postId]?.trim();
    if (!replyText) return;

    try {
      const newReply = await addDiscussionReply(activeCountryClub, postId, replyText, authName);
      setClubDiscussions((prev) => {
        const currentList = prev[activeCountryClub] || [];
        const updatedList = currentList.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              replies: [...(post.replies || []), newReply as DiscussionReply]
            };
          }
          return post;
        });
        return {
          ...prev,
          [activeCountryClub]: updatedList
        };
      });
      setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      showToast('Reply added to thread!', 'success');
    } catch {
      showToast('Failed to add reply.', 'error');
    }
  };

  const handleLikeCreation = async (id: string) => {
    setCreations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, likes: c.hasLiked ? c.likes - 1 : c.likes + 1, hasLiked: !c.hasLiked };
        }
        return c;
      })
    );
    try {
      const { data: item } = await supabase.from('fan_creations').select('likes').eq('id', id).single();
      if (item) {
        await supabase.from('fan_creations').update({ likes: (item.likes || 0) + 1 }).eq('id', id);
      }
    } catch {}
  };

  // Posts Feed Handlers
  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const handlePostLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch {
      showToast('Could not send your heart. Please try again.', 'error');
    }
  };

  const handlePostComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = postCommentInputs[postId]?.trim();
    if (!text) return;
    try {
      await commentPost(postId, text, user?.user_metadata?.name || authName || 'A kindred spirit');
      setPostCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      showToast('Your kind word was shared.', 'success');
    } catch {
      showToast('Could not share your words. Please try again.', 'error');
    }
  };

  const handlePostReply = async (postId: string, commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = postReplyInputs[commentId]?.trim();
    if (!text) return;
    try {
      await replyComment(postId, commentId, text, user?.user_metadata?.name || authName || 'A kindred spirit');
      setPostReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
      showToast('Your reply was shared with kindness.', 'success');
    } catch {
      showToast('Could not send your reply. Please try again.', 'error');
    }
  };

  const handlePostDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setDeleteConfirmId(null);
      showToast('Story removed.', 'success');
    } catch {
      showToast('Could not remove the story.', 'error');
    }
  };

  const handleUploadCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadDesc.trim()) return;

    const newC: FanArtItem = {
      id: `c-${Date.now()}`,
      title: uploadTitle.trim(),
      category: uploadCategory,
      author: authName,
      description: uploadDesc.trim(),
      likes: 0
    };

    try {
      const { data, error } = await supabase.from('fan_creations').insert({
        title: newC.title, category: newC.category, description: newC.description, author: newC.author
      }).select().single();
      if (!error && data) {
        setCreations((prev) => [{ ...newC, id: String(data.id) }, ...prev]);
      } else {
        setCreations((prev) => [newC, ...prev]);
      }
    } catch {
      setCreations((prev) => [newC, ...prev]);
    }

    setShowUploadModal(false);
    setUploadTitle('');
    setUploadDesc('');
    addJourneyMilestone('Uploaded Creation', `Shared "${newC.title}" on the creativity board`, 'bg-purple-500');
    pushNotification('Your creation has been shared with the community!');
    showToast('Creation uploaded successfully!', 'success');
  };

  // (handlePortalSubmitRequest removed — feature deprecated)

  const handleUpdateReqStatus = (requestId: string, newStatus: string) => {
    const reqObj = userRequests.find(r => r.id === requestId);
    if (!reqObj || reqObj.status === newStatus) return;

    const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    setUserRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: newStatus,
          lastUpdated: timestamp
        };
      }
      return r;
    }));

    // Append systemic event on the timeline
    const systemLog = {
      id: `pmsg-sys-man-${Date.now()}`,
      sender: 'system' as const,
      text: `USER ACTION: Manually adjusted proposal tracking state to [${newStatus.toUpperCase()}]`,
      timestamp
    };

    setProposalChats(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), systemLog]
    }));

    showToast(`Status updated to ${newStatus}`, 'success');
  };

  const handleAddTimelineComment = async (requestId: string, textToPost: string, targetStatus?: string) => {
    if (!textToPost.trim()) return;

    const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `pmsg-${Date.now()}`,
      sender: 'user' as const,
      text: textToPost.trim(),
      timestamp
    };

    // Update status reactively. If targetStatus is supplied, use it; otherwise update to In Discussion if it was Submitted.
    const reqObj = userRequests.find(r => r.id === requestId);
    let nextStatus = reqObj?.status || 'In Discussion';
    if (targetStatus) {
      nextStatus = targetStatus;
    } else if (reqObj?.status === 'Submitted') {
      nextStatus = 'In Discussion';
    }

    // 1. Add User Message and update request status
    setProposalChats(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), userMsg]
    }));

    setUserRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: nextStatus,
          lastUpdated: timestamp
        };
      }
      return r;
    }));

    // Add systemic event on the timeline if status changed
    if (reqObj && reqObj.status !== nextStatus) {
      const systemLog = {
        id: `pmsg-sys-${Date.now()}`,
        sender: 'system' as const,
        text: `SYSTEM STATE CHANGE: Status changed from [${reqObj.status}] to [${nextStatus}]`,
        timestamp
      };
      setProposalChats(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), systemLog]
      }));
    }

    setTimelineCommentText('');
    showToast('Your comment has been securely posted to the timeline.', 'success');

    // Send the message to the backend
    try {
      await supabase.from('proposal_chats').insert({ request_id: requestId, sender: 'user', text: textToPost });
    } catch {}
  };

  const handlePortalMembershipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTierId || !mReason.trim() || !mContactVal.trim() || !user) return;
    setMUpgrading(true);
    try {
      const tiers = backendContent?.membershipTiers || [];
      const t = tiers.find((x: any) => x.id === mTierId);
      const serial = `GA-MEM-${Date.now().toString(36).toUpperCase()}`;
      const messageData = {
        card_serial: serial, comm_method: mContact,
        tier_price: t?.price || '', tier_name: t?.name || '',
        tier_id: mTierId, phone: mContactVal, member_name: authName || '',
      };
      const { error } = await supabase.from('membership_applications').insert({
        user_id: user.id, email: profile?.email || user.email || '',
        full_name: authName || 'Member', country: authCountry || 'Global',
        tier: mTierId, status: 'pending',
        message: JSON.stringify(messageData), notes: '',
      }).select('*').single();
      if (error) { showToast(error.message || 'Upgrade failed', 'error'); setMUpgrading(false); return; }
      showToast('Your membership upgrade request has been submitted!', 'success');
      setShowPortalMembershipModal(false);
      setMTierId('');
      setMReason('');
      setMContactVal('');
      setActiveTab('Membership');
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    }
    setMUpgrading(false);
  };

  const handleAddKindnessAct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKindnessTitle.trim()) return;
    const newLog = {
      id: `j-${Date.now()}`,
      title: `Kindness Act: ${newKindnessTitle}`,
      date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
      description: newKindnessDesc.trim() || 'Logged an act of daily compassion.',
      color: 'bg-gold-500'
    };
    setJourneyLog(prev => [newLog, ...prev]);
    setNewKindnessTitle('');
    setNewKindnessDesc('');
    pushNotification('Your act of kindness has been logged to your sanctuary timeline!');
    showToast('Your act of kindness has been logged to your sanctuary timeline!', 'success');
    try {
      await supabase.from('journey_log').insert({ title: newLog.title, description: newLog.description, color: newLog.color });
    } catch {}
  };

  const handleRedeemReward = async (item: typeof portalRewards[0]) => {
    if (loyaltyPoints < item.cost) {
      showToast('Insufficient loyalty points for this redemption.', 'error');
      return;
    }
    
    if (badges.some(b => b.title === item.title)) {
      showToast('You have already redeemed this reward!', 'info');
      return;
    }

    setLoyaltyPoints(prev => prev - item.cost);
    
    const newBadge = {
      id: `b-${Date.now()}`,
      title: item.title,
      desc: `Redeemed via Loyalty Rewards Point Store`,
      date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
      icon: item.icon
    };
    setBadges(prev => [...prev, newBadge]);

    const journeyMilestone = {
      id: `j-${Date.now()}`,
      title: `Redeemed: ${item.title}`,
      date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
      description: `Exchanged ${item.cost} points to unlock exclusive digital collectible access.`,
      color: 'bg-gold-500'
    };
    setJourneyLog(prev => [journeyMilestone, ...prev]);

    setNotifications(prev => [
      {
        id: `n-${Date.now()}`,
        text: `Successfully redeemed loyalty reward: ${item.title}. Check your unlocked badges!`,
        time: 'Just now',
        unread: true
      },
      ...prev
    ]);

    showToast(`Successfully redeemed: ${item.title}!`, 'success');

    try {
      await supabase.from('user_badges').insert({ user_id: user?.id, title: newBadge.title, description: newBadge.desc, icon: newBadge.icon });
      await supabase.from('loyalty_points').upsert({ user_id: user?.id, total: loyaltyPoints - item.cost, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      await supabase.from('journey_log').insert({ title: journeyMilestone.title, description: journeyMilestone.description, color: journeyMilestone.color });
      await supabase.from('fan_notifications').insert({ text: `Successfully redeemed loyalty reward: ${item.title}. Check your unlocked badges!` });

      // Create notification
      if (user?.id) notifyRewardRedeemed(user.id, item.title, item.cost);
    } catch {}
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification cleared.', 'info');
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await signIn(authEmail, authPassword);
        if (error) {
          setAuthError(error);
          return;
        }
        setShowWelcome(true);
      } else {
        if (authPassword !== authConfirmPassword) {
          setAuthError('Passwords do not match.');
          return;
        }
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters.');
          return;
        }
        const { error, user: newUser } = await signUp(authEmail, authPassword, authName);
        if (error) {
          setAuthError(error);
          return;
        }
        if (newUser) {
          setShowEmailVerification(true);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Admin users cannot access fan portal
  if (!sessionLoading && profile?.role === 'admin') {
    navigate('/admin', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans selection:bg-gold-500 selection:text-neutral-950 flex flex-col justify-between overflow-x-clip">
      
      {/* 1. AUTHENTICATION GATE SCREEN */}
      {!isLoggedIn || !profile ? (
        <div className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,186,137,0.03),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {showEmailVerification ? (
              <motion.div
                key="email-verification-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-xl border border-gold-500/20 bg-neutral-950 p-8 shadow-2xl text-center space-y-6"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/30">
                  <Mail className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest block font-bold">
                    CHECK YOUR INBOX
                  </span>
                  <h4 className="font-serif text-xl font-bold tracking-wider text-white">
                    Verify Your Email
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    We've sent a verification link to <span className="text-gold-500 font-medium">{authEmail}</span>. Please check your inbox (and spam folder) and click the link to activate your account.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { setShowEmailVerification(false); setAuthMode('login'); }}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-sm tracking-wider hover:from-gold-400 hover:to-amber-400 transition-all"
                  >
                    GO TO SIGN IN
                  </button>
                  <button
                    onClick={() => setShowEmailVerification(false)}
                    className="text-[10px] text-neutral-500 hover:text-gold-500 transition-colors font-mono tracking-wider"
                  >
                    ← Back to Registration
                  </button>
                </div>
              </motion.div>
            ) : showWelcome ? (
              <motion.div
                key="welcome-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-xl border border-gold-500/20 bg-neutral-950 p-8 shadow-2xl text-center space-y-6"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/30">
                  <Star className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest block font-bold">
                    WELCOME TO YOUR SANCTUARY
                  </span>
                  <h4 className="font-serif text-xl font-bold tracking-wider text-white">
                    You're All Set!
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Your account is ready. Access your personal portal to manage your profile, connect with the community, and explore exclusive experiences.
                  </p>
                </div>
                <button
                  onClick={() => { setShowWelcome(false); setActiveTab('Dashboard'); }}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-sm tracking-wider hover:from-gold-400 hover:to-amber-400 transition-all"
                >
                  ENTER MY PORTAL
                </button>
                <p className="text-[8px] text-neutral-600 font-mono uppercase tracking-widest">
                  Find your portal anytime in the profile menu above
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form-panel"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="w-full max-w-sm rounded-2xl border border-neutral-800/60 bg-[#0a0a0c] p-8 shadow-2xl relative overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle_at_top_right,rgba(223,186,137,0.06),transparent)] pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-gold-500" />
                  </div>
                  <h2 className="font-serif text-lg font-bold text-white tracking-wide">
                    {authMode === 'register' ? 'Join the Sanctuary' : 'Welcome Back'}
                  </h2>
                  <p className="text-[10px] text-neutral-500 mt-1.5 font-mono tracking-wider">
                    {authMode === 'register' ? 'Create your account to get started' : 'Sign in to your portal'}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-neutral-900/50 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-md transition-all ${
                      authMode === 'register' ? 'bg-gold-500 text-neutral-950' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    SIGN UP
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-md transition-all ${
                      authMode === 'login' ? 'bg-gold-500 text-neutral-950' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    SIGN IN
                  </button>
                </div>

                {/* Error */}
                {authError && (
                  <div className="mb-4 border border-red-900/40 bg-red-950/20 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-red-400">{authError}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === 'register' && (
                    <div>
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-gold-500/50 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5 block">Email</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-gold-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5 block">Password</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-gold-500/50 transition-colors"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-gold-500/50 transition-colors"
                      />
                    </div>
                  )}

                  {authMode === 'register' && (
                    <div>
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5 block">Country</label>
                      <select
                        value={authCountry}
                        onChange={(e) => setAuthCountry(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-sm text-neutral-300 outline-none focus:border-gold-500/50 transition-colors"
                      >
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Japan">Japan</option>
                        <option value="Germany">Germany</option>
                        <option value="Brazil">Brazil</option>
                        <option value="France">France</option>
                        <option value="India">India</option>
                        <option value="Mexico">Mexico</option>
                        <option value="South Africa">South Africa</option>
                        <option value="South Korea">South Korea</option>
                        <option value="Italy">Italy</option>
                        <option value="Spain">Spain</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Ireland">Ireland</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Global">Other</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-3 rounded-lg text-xs tracking-widest transition-all active:scale-[0.98] mt-2"
                  >
                    {authLoading ? 'PLEASE WAIT...' : authMode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                  </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6">
                  <button
                    onClick={onBackToHome}
                    className="text-[10px] text-neutral-600 hover:text-gold-500 transition-colors font-mono tracking-wider"
                  >
                    ← Back to Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        
        /* 2. PORTAL WORKSPACE */
          <div className="flex flex-col min-h-screen bg-[#050505]">
          
          {/* STICKY HEADER */}
          <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-[#050505]/95 backdrop-blur-md px-3 sm:px-4 md:px-8 flex items-center justify-between h-14 md:h-16 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold tracking-wider text-white leading-tight">
                    Fan Portal
                  </span>
                  <span className="font-mono text-[7px] tracking-[0.2em] text-gold-500/60 font-semibold uppercase leading-none">
                    Member Workspace
                  </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-500/5 border border-gold-500/15 text-[10px] font-mono text-gold-400/80 font-medium">
                <span className="text-gold-500/60">✦</span>
                <span>{loyaltyPoints.toLocaleString()} pts</span>
              </div>

              <NotificationBell />

              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/25 flex items-center justify-center text-[9px] font-bold text-gold-500 font-serif">
                {authName.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="flex flex-1 relative overflow-hidden">

            {/* FIXED SIDEBAR — desktop only */}
            <aside
              className={`
                bg-[#0a0a0c] border-r border-neutral-900/60 flex flex-col justify-between transition-all duration-300 z-30
                hidden md:flex
                fixed inset-y-0 left-0 w-64 md:translate-x-0 pt-16
              `}
            >
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
                <span className="text-[7px] font-mono font-semibold tracking-[0.2em] text-neutral-600 uppercase pl-3 pb-2 block">
                  Navigation
                </span>
                {[
                  { name: 'Dashboard', icon: LayoutGrid },
                  { name: 'Profile', icon: User },
                  { name: 'Community', icon: Users },
                  { name: 'Messages', icon: MessageSquare },
                  { name: 'Ask Gillian', icon: MessageCircle },
                  { name: 'Experiences', icon: Star },
                  { name: 'Events', icon: Calendar },
                  { name: 'Membership', icon: Award },
                  { name: 'My Journey', icon: Compass },
                  { name: 'Rewards', icon: Gift },
                  { name: 'Notifications', icon: Bell },
                  { name: 'Settings', icon: Settings }
                ].map((item) => {
                  const Icon = item.icon;
                  const isUnread = item.name === 'Notifications' && notifications.some(n => !n.is_read);
                  const isSelected = activeTab === item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name as any);
                        setSelectedRequestId(null);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all text-left rounded-lg relative ${
                        isSelected
                          ? 'bg-gold-500/10 text-gold-400 font-medium'
                          : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/40'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-gold-500/70" />
                      )}
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-gold-500/80' : 'text-neutral-600'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isUnread ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500/80" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Member Card */}
              <div className="px-3 py-4 border-t border-neutral-900/60">
                <div className="rounded-xl bg-neutral-950/40 border border-neutral-900 p-3.5 space-y-3 shadow-lg shadow-black/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/25 flex items-center justify-center text-[10px] font-bold text-gold-500 font-serif shrink-0">
                      {authName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="text-xs font-medium text-neutral-100 truncate">{authName}</span>
                      <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">{displayRank.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-500">
                      <span>Progress</span>
                      <span className="text-gold-500/60">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 bg-neutral-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-500/40 to-gold-500/70 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[7px] font-mono text-neutral-600 pt-1 border-t border-neutral-900/60">
                    <span>ID: {user?.id?.substring(0, 8).toUpperCase() || 'PENDING'}</span>
                    <span>{authCountry.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-clip bg-[#050505] p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8 pb-24 lg:pb-8">
            
            {/* VIEW RENDERING 1: DASHBOARD — Cinematic Rebuild */}
            {activeTab === 'Dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto relative">

                {/* ── ATMOSPHERE: Layered light orbs ── */}
                <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-gold-500/[0.04] rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[130px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-rose-500/[0.015] rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-gold-500/30 rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-amber-400/20 rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-rose-400/20 rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '2s' }} />

                {/* ── HERO: Rank Crest + Cinematic Welcome ── */}
                <div className="relative mb-14">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-5 flex-1">
                      {/* Rank crest + greeting */}
                      <div className="flex items-center gap-4">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.1 }}
                          className="relative h-14 w-14 shrink-0"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/10 blur-sm" />
                          <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/5 border border-gold-500/30 flex items-center justify-center text-2xl shadow-lg shadow-gold-500/5">
                            {displayRank.icon || '✦'}
                          </div>
                        </motion.div>
                        <div className="space-y-1.5">
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 font-mono text-[7px] text-gold-500/80 tracking-[0.15em] uppercase font-semibold">
                              {displayRank.name}
                            </span>
                          </motion.div>
                          <motion.h1
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="font-elegant text-3xl md:text-4xl font-bold text-white tracking-tight leading-[1.15]"
                          >
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {authName.split(' ')[0]}
                          </motion.h1>
                        </div>
                      </div>

                      {/* Time-aware message + signature quote */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="pl-0 sm:pl-[4.25rem] space-y-3"
                      >
                        <p className="text-sm text-neutral-400 font-elegant leading-relaxed max-w-xl">
                          {new Date().getHours() < 12
                            ? 'The world wakes with possibility. Every great story begins with a single step — and yours is already being written.'
                            : new Date().getHours() < 18
                            ? 'Light bends golden through the afternoon. This is your space to create, connect, and belong to something extraordinary.'
                            : 'As the stars take their watch, remember: the most meaningful connections are often forged in quiet moments. You are home here.'}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="h-px w-6 bg-gold-500/30" />
                          <span className="font-elegant text-[10px] italic text-gold-500/50 tracking-wide">— Gillian</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Date medallion */}
                    <motion.div
                      initial={{ y: -15, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 14 }}
                      className="hidden md:flex flex-col items-center justify-center h-18 w-18 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-neutral-800/80 font-mono shrink-0 shadow-2xl shadow-black/40"
                    >
                      <span className="text-2xl font-bold text-white leading-none tracking-tight">{new Date().getDate()}</span>
                      <span className="text-[7px] font-semibold text-gold-500/70 tracking-widest mt-0.5 uppercase">{new Date().toLocaleString('en', { month: 'short' })}</span>
                    </motion.div>
                  </div>

                  {/* Signature divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    className="h-px bg-gradient-to-r from-gold-500/40 via-gold-500/15 to-transparent mt-8 origin-left"
                  />
                </div>

                {/* ── STAT ROW: Glass-panel achievements ── */}
                <motion.div
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
                >
                  {[
                    {
                      isCard: true,
                      card: membership,
                      fallbackName: displayRank.name,
                    },
                    { label: 'Bookings', value: fanStats.bookings.toString(), accent: 'blue', icon: '★' },
                    { label: 'Events', value: fanStats.events.toString(), accent: 'emerald', icon: '●' },
                    { label: 'Posts', value: fanStats.posts.toString(), accent: 'violet', icon: '✎' },
                  ].map((stat: any, i) => {
                    if (stat.isCard) {
                      const c = stat.card;
                      const isActive = c?.status === 'active';
                      return (
                        <motion.div
                          key="membership-card"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 14 }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br from-gold-500/[0.07] via-gold-500/[0.02] to-transparent backdrop-blur-sm p-4 text-left shadow-lg shadow-gold-500/5 transition-all duration-300 group"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-500/[0.05] to-transparent rounded-bl-full pointer-events-none" />
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">👑</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-[11px] font-bold text-white leading-tight truncate">{c?.card_name || 'Member'}</p>
                              <div className="flex items-center gap-1">
                                <span className="font-sans text-[8px] text-gold-500/90 font-semibold truncate">{c?.tier_name || stat.fallbackName}</span>
                                {isActive && <span className="h-1 w-1 rounded-full bg-green-500" />}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-gold-500/10 pt-1.5">
                            <div>
                              <span className="font-sans text-[7px] text-neutral-500 font-medium uppercase tracking-wider block">Member #</span>
                              <span className="font-sans text-[8px] text-neutral-200 font-semibold truncate block">{c?.membership_number || '—'}</span>
                            </div>
                            <div>
                              <span className="font-sans text-[7px] text-neutral-500 font-medium uppercase tracking-wider block">Serial</span>
                              <span className="font-sans text-[8px] text-neutral-200 font-semibold truncate block">{c?.card_serial || '—'}</span>
                            </div>
                            <div>
                              <span className="font-sans text-[7px] text-neutral-500 font-medium uppercase tracking-wider block">Activated</span>
                              <span className="font-sans text-[8px] text-neutral-200 font-semibold">{c?.activation_date ? new Date(c.activation_date).toLocaleDateString() : '—'}</span>
                            </div>
                            <div>
                              <span className="font-sans text-[7px] text-neutral-500 font-medium uppercase tracking-wider block">Expires</span>
                              <span className="font-sans text-[8px] text-neutral-200 font-semibold">{c?.expiration_date ? new Date(c.expiration_date).toLocaleDateString() : '—'}</span>
                            </div>
                          </div>
                          {!c && <p className="font-mono text-[7px] text-neutral-600 mt-1">No card</p>}
                        </motion.div>
                      );
                    }
                    const accentMap: Record<string, string> = {
                      blue: 'border-blue-500/20 from-blue-500/[0.06] via-blue-500/[0.015] to-transparent shadow-blue-500/5',
                      emerald: 'border-emerald-500/20 from-emerald-500/[0.06] via-emerald-500/[0.015] to-transparent shadow-emerald-500/5',
                      violet: 'border-violet-500/20 from-violet-500/[0.06] via-violet-500/[0.015] to-transparent shadow-violet-500/5',
                    };
                    const textAccent: Record<string, string> = {
                      blue: 'text-blue-400', emerald: 'text-emerald-400', violet: 'text-violet-400',
                    };
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 120, damping: 14 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentMap[stat.accent]} backdrop-blur-sm p-5 text-left shadow-lg transition-all duration-300 group`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-bl-full" />
                        <span className="text-xl block mb-2 opacity-50 group-hover:opacity-80 transition-opacity">{stat.icon}</span>
                        <p className={`font-elegant text-2xl font-bold tracking-tight ${textAccent[stat.accent]}`}>
                          {String(stat.value)}
                        </p>
                        <p className="font-mono text-[8px] text-neutral-600 uppercase tracking-wider mt-1 font-medium">{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* ── TWO-COLUMN CONTENT ── */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-14">

                  {/* LEFT COL: Journey + activity (3/5) */}
                  <div className="md:col-span-3 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <Compass className="h-3 w-3 text-gold-500/70" />
                      </div>
                      <span className="font-mono text-[9px] text-gold-500/70 uppercase tracking-[0.15em] font-bold">Your Journey</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-neutral-900/80 to-transparent" />
                      <button onClick={() => setActiveTab('My Journey')} className="font-mono text-[7px] text-neutral-600 hover:text-gold-500/60 uppercase tracking-wider transition-colors">View all</button>
                    </div>

                    {journeyLog.length > 0 ? (
                      <div className="relative">
                        {/* Timeline vertical track */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-500/30 via-gold-500/10 to-transparent pointer-events-none" />

                        <div className="space-y-1">
                          {journeyLog.slice(0, 5).map((log, i) => (
                            <motion.div
                              key={log.id || i}
                              initial={{ x: -12, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.06, type: 'spring', stiffness: 100 }}
                              className="flex gap-4 group"
                            >
                              <div className="flex flex-col items-center pt-[6px] relative z-10">
                                <div className={`h-3 w-3 rounded-full ${log.color || 'bg-gold-500/50'} ring-[3px] ring-[#050505] shadow-sm group-hover:shadow-md group-hover:shadow-gold-500/20 transition-shadow duration-300`} />
                              </div>
                              <div className="flex-1 min-w-0 pb-[14px]">
                                <p className="font-elegant text-sm font-bold text-neutral-200 group-hover:text-gold-500/60 transition-colors duration-300 tracking-wide">{log.title}</p>
                                {log.description && (
                                  <p className="text-[11px] text-neutral-500 font-sans mt-0.5 leading-relaxed line-clamp-2">{log.description}</p>
                                )}
                                <p className="font-mono text-[7px] text-neutral-700 mt-1 tracking-wide">{log.date || (log.created_at ? new Date(log.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) : '')}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-neutral-900/60 bg-neutral-950/20 p-10 text-center">
                        <Compass className="h-6 w-6 text-neutral-700 mx-auto mb-3" />
                        <p className="font-elegant text-sm text-neutral-500">Your journey begins here</p>
                        <p className="text-xs text-neutral-600 mt-1 font-sans max-w-xs mx-auto">Book an experience or register for an event to log your first milestone.</p>
                      </div>
                    )}

                    {/* Explore CTA */}
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveTab('Experiences')}
                      className="group w-full rounded-2xl border border-dashed border-neutral-900/50 bg-neutral-950/10 p-4 hover:border-gold-500/30 hover:bg-gold-500/[0.02] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-gold-500/60" />
                          </div>
                          <span className="font-elegant text-xs font-bold text-neutral-400 group-hover:text-gold-500/60 transition-colors tracking-wide uppercase">Discover experiences crafted for you</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-gold-500/60 transition-colors" />
                      </div>
                    </motion.button>
                  </div>

                  {/* RIGHT COL: Events + Community + Quick access (2/5) */}
                  <div className="md:col-span-2 space-y-5">

                    <FanEvents
                      embedded
                      onNavigate={setActiveTab as any}
                      showToast={showToast}
                      addJourneyMilestone={addJourneyMilestone}
                      pushNotification={pushNotification}
                    />

                    {/* ── Community chatter ── */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.38 }}
                      className="rounded-2xl border border-neutral-900/70 bg-neutral-950/20 overflow-hidden shadow-xl shadow-black/20 hover:border-gold-500/20 transition-colors duration-500"
                    >
                      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-neutral-900/30">
                        <div className="h-5 w-5 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                          <Users className="h-3 w-3 text-gold-500/70" />
                        </div>
                        <span className="font-mono text-[9px] text-gold-500/70 uppercase tracking-[0.15em] font-bold">Community</span>
                      </div>
                      <div className="p-4 space-y-2">
                        {(clubDiscussions[activeCountryClub] || []).length > 0 ? (
                          (clubDiscussions[activeCountryClub] || []).slice(0, 2).map((post) => (
                            <button
                              key={post.id}
                              onClick={() => setActiveTab('Community')}
                              className="w-full text-left group rounded-xl p-3 hover:bg-gold-500/[0.03] transition-colors"
                            >
                              <p className="font-elegant text-xs font-semibold text-neutral-200 group-hover:text-gold-500/60 transition-colors leading-snug">
                                {post.text.length > 80 ? post.text.substring(0, 80) + '…' : post.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="font-mono text-[7px] text-neutral-500">{post.author}</span>
                                <span className="h-1 w-1 rounded-full bg-neutral-700" />
                                <span className="font-mono text-[7px] text-neutral-500">{post.replies?.length || 0} replies</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <button onClick={() => setActiveTab('Community')} className="w-full text-center py-4 group rounded-xl hover:bg-gold-500/[0.02] transition-colors">
                            <Users className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
                            <p className="font-elegant text-xs text-neutral-500 group-hover:text-gold-500/60 transition-colors">Be the first to start a conversation</p>
                          </button>
                        )}
                        <button onClick={() => setActiveTab('Community')}
                          className="w-full text-center pt-3 border-t border-neutral-900/30 font-mono text-[7px] text-neutral-600 hover:text-gold-500/60 uppercase tracking-wider transition-colors"
                        >
                          Browse all discussions
                        </button>
                      </div>
                    </motion.div>

                    {/* ── Quick Access ── */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.46 }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-5 w-5 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                          <LayoutGrid className="h-3 w-3 text-gold-500/70" />
                        </div>
                        <span className="font-mono text-[9px] text-gold-500/70 uppercase tracking-[0.15em] font-bold">Quick Access</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Experiences', icon: Star, tab: 'Experiences' as const },
                          { label: 'Membership', icon: Award, tab: 'Membership' as const },
                          { label: 'Messages', icon: MessageSquare, tab: 'Messages' as const },
                          { label: 'Rewards', icon: Gift, tab: 'Rewards' as const },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <motion.button
                              key={item.label}
                              whileHover={{ y: -1, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setActiveTab(item.tab)}
                              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-neutral-900/60 bg-neutral-950/20 hover:border-gold-500/30 hover:bg-gold-500/[0.03] transition-all text-left group shadow-lg shadow-black/10"
                            >
                              <div className="h-7 w-7 rounded-lg bg-neutral-900/80 border border-neutral-800/60 flex items-center justify-center group-hover:bg-gold-500/10 group-hover:border-gold-500/30 transition-all">
                                <Icon className="h-3.5 w-3.5 text-neutral-500 group-hover:text-gold-500/70 transition-colors" />
                              </div>
                              <span className="font-elegant text-[11px] font-bold text-neutral-300 group-hover:text-gold-500/60 transition-colors tracking-wide">{item.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>

                  </div>
                </div>

                {/* ── BOTTOM: Action cards with elegance ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
                  {[
                    {
                      icon: Users, label: 'Community', sub: 'Connect with fellow members in your country club.',
                      color: 'from-gold-500/15 via-gold-500/5 to-transparent border-gold-500/25',
                      iconBg: 'bg-gold-500/15 border-gold-500/25',
                      iconColor: 'text-gold-500/80',
                      glow: 'bg-gold-500/[0.06]',
                      action: () => setActiveTab('Community'),
                    },
                    {
                      icon: Gift, label: 'Loyalty Rewards', sub: `${loyaltyPoints.toLocaleString()} points ready to redeem.`,
                      color: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/25',
                      iconBg: 'bg-amber-500/15 border-amber-500/25',
                      iconColor: 'text-amber-500/80',
                      glow: 'bg-amber-500/[0.06]',
                      action: () => setActiveTab('Rewards'),
                    },
                    {
                      icon: Star, label: 'Book Experiences', sub: 'Exclusive intimate moments await you.',
                      color: 'from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/25',
                      iconBg: 'bg-blue-500/15 border-blue-500/25',
                      iconColor: 'text-blue-500/80',
                      glow: 'bg-blue-500/[0.06]',
                      action: () => setActiveTab('Experiences'),
                    },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.button
                        key={card.label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 + i * 0.08 }}
                        whileHover={{ y: -3, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={card.action}
                        className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${card.color} p-5 text-left shadow-xl shadow-black/30 transition-all duration-300`}
                      >
                        <div className={`absolute -top-10 -right-10 w-24 h-24 ${card.glow} rounded-full blur-[50px]`} />
                        <div className="relative flex items-center gap-3.5">
                          <div className={`h-10 w-10 rounded-xl ${card.iconBg} border flex items-center justify-center shrink-0 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-elegant text-sm font-bold text-neutral-100 group-hover:text-white transition-colors tracking-wide">{card.label}</p>
                            <p className="font-mono text-[8px] text-neutral-500 mt-0.5">{card.sub}</p>
                          </div>
                        </div>
                        {/* Shine sweep on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                      </motion.button>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/*             {/* VIEW RENDERING 2: MY REQUESTS (REMOVED - merged into Experiences) */}


            {/* VIEW RENDERING 3: EVENTS */}
            {activeTab === 'Events' && (
              <FanEvents
                showToast={showToast}
                addJourneyMilestone={addJourneyMilestone}
                pushNotification={pushNotification}
              />
            )}

            {/* VIEW RENDERING 4: MEMBERSHIP (Status-aware dashboard) */}
            {activeTab === 'Membership' && (
              <MyMembershipDashboard userId={user?.id} authName={authName} rank={displayRank} progressPercent={progressPercent} content={backendContent} />
            )}

            {/* VIEW RENDERING 5: EXPERIENCES */}
            {activeTab === 'Experiences' && (
              <div className="space-y-6">
                {/* Sub-tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                      Experiences
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      Browse the catalogue or manage your bookings.
                    </p>
                  </div>
                  <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
                    {[
                      { id: 'browse' as const, label: 'Browse', icon: Compass },
                      { id: 'bookings' as const, label: 'My Bookings', icon: Ticket },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setExpSubTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
                          expSubTab === tab.id
                            ? 'bg-gold-500 text-neutral-950 font-bold'
                            : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {expSubTab === 'browse' ? (
                  <div className="space-y-5">
                    {/* Search + Category Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type="text"
                          value={fanExpSearch}
                          onChange={e => setFanExpSearch(e.target.value)}
                          placeholder="Search experiences..."
                          className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 transition-colors"
                        />
                      </div>
                      <select
                        value={fanExpCategory}
                        onChange={e => setFanExpCategory(e.target.value)}
                        className="bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
                      >
                        <option value="ALL">All Categories</option>
                        {['Meet & Greet', 'Creative', 'Philanthropy', 'Adventure', 'Literary', 'Behind-the-Scenes'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Grid */}
                    {fanExpLoading ? (
                      <div className="text-center py-16">
                        <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-neutral-500 mt-4 font-mono">Loading experiences...</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(fanExpCategory === 'ALL'
                          ? fanExperiences
                          : fanExperiences.filter((e: any) => e.category === fanExpCategory)
                        ).filter((e: any) => {
                          if (!fanExpSearch.trim()) return true;
                          const q = fanExpSearch.toLowerCase();
                          return e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
                        }).map((exp: any) => {
                          const spotsLeft = (exp.spots || 10) - (exp.spots_taken || 0);
                          const isFull = spotsLeft <= 0;
                          return (
                            <div key={exp.id} className="group bg-neutral-950/40 border border-neutral-900 rounded-xl overflow-hidden hover:border-gold-500/20 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.08)] transition-all duration-300 flex flex-col">
                              <div className="relative h-32 bg-neutral-900/60 overflow-hidden">
                                {exp.image ? (
                                  <img src={exp.image} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Star className="h-8 w-8 text-neutral-700" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2">
                                  <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider border bg-neutral-900/80 border-neutral-800 text-neutral-400">
                                    {exp.category}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 space-y-2 flex-1">
                                <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">{exp.title}</h3>
                                <p className="text-[10px] text-neutral-400 line-clamp-2">{exp.description}</p>
                                <div className="flex items-center gap-2 text-[8px] font-mono text-neutral-500 pt-1.5 border-t border-neutral-900/60">
                                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{exp.location}</span>
                                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{exp.duration}</span>
                                </div>
                              </div>
                              <div className="px-3 pb-3 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold text-white">{exp.price || 'Complimentary'}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => !isFull && navigate(`/experiences/book/${exp.id}`)}
                                    disabled={isFull}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-mono tracking-wider uppercase transition-all ${
                                      isFull
                                        ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                        : 'bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold'
                                    }`}
                                  >
                                    {isFull ? 'Full' : 'Book Now'}
                                    {!isFull && <ChevronRight className="h-2.5 w-2.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!fanExpLoading && fanExperiences.length === 0 && (
                      <div className="text-center py-16 border border-dashed border-neutral-900 rounded-xl">
                        <p className="text-sm text-neutral-500">No experiences available yet.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <FanExperienceBookings showToast={showToast} />
                )}
              </div>
            )}

            {/* VIEW RENDERING 7: COMMUNITY (Feed, Country Clubs, and Fan Works) */}
            {activeTab === 'Community' && (
              <div className="space-y-6 text-left relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gold-400 tracking-widest uppercase">
                      <Sparkles className="h-3 w-3" />
                      Welcome back, kindred spirit
                    </div>
                    <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                      Your Sanctuary
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      A cozy corner for the community — share, connect, and celebrate together.
                    </p>
                  </div>
                  {communitySubTab === 'Fan Works' && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-1.5 px-4 rounded text-xs uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Upload className="h-4 w-4" /> Share Your Creation
                    </button>
                  )}
                </div>

                {/* Sub-tab navigation */}
                <div className="flex gap-1 bg-neutral-950/60 border border-neutral-900 rounded-lg p-0.5 w-fit">
                  {[
                    { id: 'Feed' as const, label: 'The Feed', icon: MessageSquare },
                    { id: 'Discussions' as const, label: 'Country Clubs', icon: Globe },
                    { id: 'Fan Works' as const, label: 'Fan Works', icon: Palette },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setCommunitySubTab(sub.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
                        communitySubTab === sub.id
                          ? 'bg-gold-500 text-neutral-950 font-bold'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <sub.icon className="h-3 w-3" />
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Feed Sub-Tab */}
                {communitySubTab === 'Feed' && (
                  <div className="space-y-5">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search stories, names, or words..."
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-8 py-2 text-xs text-white outline-none focus:border-gold-500/40 placeholder-neutral-600 transition-all duration-300"
                      />
                      {postSearchQuery && (
                        <button onClick={() => setPostSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Category filters */}
                    <div className="flex flex-wrap gap-1.5">
                      {postCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPostCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded text-[10px] font-mono font-medium border transition-all ${
                            postCategoryFilter === cat
                              ? 'bg-gold-500/10 border-gold-500 text-gold-500'
                              : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cat === 'All' ? 'All Stories' : cat === 'FAN ART' ? 'Art & Creativity' : cat === 'LETTERS' ? 'Letters of Light' : 'Encounters & Moments'}
                        </button>
                      ))}
                    </div>

                    {/* Posts Feed */}
                    <div className="space-y-4">
                      {(backendPosts || [])
                        .filter((p) => postCategoryFilter === 'All' || (p.category || 'FAN ART') === postCategoryFilter)
                        .filter((p) => !postSearchQuery || p.username?.toLowerCase().includes(postSearchQuery.toLowerCase()) || p.content?.toLowerCase().includes(postSearchQuery.toLowerCase()) || p.handle?.toLowerCase().includes(postSearchQuery.toLowerCase()))
                        .map((post) => (
                        <div key={post.id} className="relative group rounded-xl border border-neutral-900 bg-gradient-to-b from-neutral-950/60 to-neutral-950/20 p-4.5 space-y-3.5 text-left hover:border-gold-500/20 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.08)] transition-all duration-500 overflow-hidden">
                          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Post Header */}
                          <div className="flex items-center justify-between relative">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-500/20 via-amber-500/10 to-neutral-900 border border-gold-500/20 flex items-center justify-center text-[10px] font-mono font-medium text-gold-400 shrink-0">
                                {post.avatarText || post.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-white">{post.username}</span>
                                <span className="text-[9px] font-mono text-neutral-500 ml-2">{post.handle}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${
                                post.category === 'FAN ART' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                post.category === 'LETTERS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {post.category || 'Story'}
                              </span>
                              <span className="text-[9px] font-mono text-neutral-600 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {(post as any).created_at ? getRelativeTime((post as any).created_at) : ''}
                              </span>
                            </div>
                          </div>

                          {/* Post Content */}
                          <p className="text-xs text-neutral-300 leading-relaxed relative">{post.content}</p>

                          {/* Post Image */}
                          {post.image && (
                            <div className="relative rounded-xl overflow-hidden border border-neutral-900/60 group/img">
                              <img src={post.image} alt="" className="w-full h-40 object-cover brightness-[0.85] saturate-[0.9] group-hover/img:brightness-100 group-hover/img:saturate-100 group-hover/img:scale-[1.02] transition-all duration-700" />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500" />
                            </div>
                          )}

                          {/* Like & Comments Row */}
                          <div className="flex items-center gap-5 text-[10px] font-mono text-neutral-500 border-t border-neutral-900/50 pt-3 relative">
                            <button
                              onClick={() => handlePostLike(post.id)}
                              className={`flex items-center gap-1.5 transition-colors ${
                                post.liked ? 'text-red-500 font-semibold' : 'hover:text-white'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${post.liked ? 'fill-red-500 stroke-red-500' : ''}`} />
                              <span>{post.likes} {post.likes === 1 ? 'Heart' : 'Hearts'}</span>
                            </button>
                            <button
                              onClick={() => setShowPostComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                                showPostComments[post.id] ? 'text-gold-500' : ''
                              }`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{post.replies} {post.replies === 1 ? 'Response' : 'Responses'}</span>
                            </button>

                            {/* Delete own post */}
                            <div className="ml-auto">
                              {deleteConfirmId === post.id ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
                                  <span className="text-[8px] font-mono text-red-400 uppercase">Remove?</span>
                                  <button onClick={() => handlePostDelete(post.id)} className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-400 text-neutral-950 font-bold text-[8px] font-mono uppercase">Yes</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 rounded border border-neutral-700 text-neutral-400 hover:text-white text-[8px] font-mono uppercase">No</button>
                                </div>
                              ) : (
                                (user?.user_metadata?.name || authName) && post.username === (user?.user_metadata?.name || authName) && (
                                  <button onClick={() => setDeleteConfirmId(post.id)} className="text-neutral-600 hover:text-red-400 transition-colors" title="Remove your story">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Comments Section */}
                          {showPostComments[post.id] && (
                            <div className="space-y-3.5 pt-3 border-t border-neutral-900/50 relative">
                              {post.comments && post.comments.length > 0 ? (
                                post.comments.map((comment) => (
                                  <div key={comment.id} className="p-3 rounded-lg border border-neutral-900/60 bg-neutral-900/15 space-y-2 text-xs">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                      <span className="text-gold-500/90 font-bold flex items-center gap-1.5">
                                        <span className="h-5 w-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-medium text-gold-500 shrink-0">
                                          {comment.avatarText || comment.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {comment.username}
                                      </span>
                                      <span>{comment.timestamp}</span>
                                    </div>
                                    <p className="text-neutral-200 leading-relaxed">{comment.content}</p>

                                    {comment.replies && comment.replies.length > 0 && (
                                      <div className="pl-4 ml-2 border-l border-gold-500/15 space-y-2 pt-1">
                                        {comment.replies.map((reply) => (
                                          <div key={reply.id} className="bg-neutral-950/40 p-2 rounded-lg border border-neutral-900/40 space-y-1">
                                            <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                                              <span className="text-neutral-300 font-semibold flex items-center gap-1">
                                                <span className="h-4.5 w-4.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[8px] font-medium text-neutral-400 shrink-0">
                                                  {reply.avatarText || reply.username?.charAt(0).toUpperCase() || '?'}
                                                </span>
                                                {reply.username}
                                              </span>
                                              <span>{reply.timestamp}</span>
                                            </div>
                                            <p className="text-neutral-300 text-[11px] leading-relaxed">{reply.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <form onSubmit={(e) => handlePostReply(post.id, comment.id, e)} className="flex gap-2 pt-1.5">
                                      <input
                                        type="text"
                                        value={postReplyInputs[comment.id] || ''}
                                        onChange={(e) => setPostReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                        placeholder={`Reply to ${comment.username}...`}
                                        className="flex-1 bg-neutral-900 text-[11px] border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/30"
                                      />
                                      <button type="submit" disabled={!(postReplyInputs[comment.id] || '').trim()} className="px-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded text-[10px] uppercase transition-colors">Reply</button>
                                    </form>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-neutral-600 italic py-2">No kind words yet. Yours would be a gift.</p>
                              )}

                              <form onSubmit={(e) => handlePostComment(post.id, e)} className="flex gap-2 pt-2 border-t border-neutral-900/30">
                                <input
                                  type="text"
                                  value={postCommentInputs[post.id] || ''}
                                  onChange={(e) => setPostCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder="Share a kind thought..."
                                  className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-gold-500/40"
                                />
                                <button type="submit" disabled={!(postCommentInputs[post.id] || '').trim()} className="px-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded text-[10px] uppercase transition-colors">Share</button>
                              </form>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!backendPosts || backendPosts.length === 0) && (
                        <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gold-500/10 to-neutral-900 border border-gold-500/20 flex items-center justify-center mx-auto">
                            <Heart className="h-6 w-6 text-gold-500/60" />
                          </div>
                          <p className="text-sm text-neutral-400">The feed is quiet... for now.</p>
                          <p className="text-[10px] text-neutral-600 font-mono">Be the first to share a story, a piece of art, or a memory.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Discussions Sub-Tab */}
                {communitySubTab === 'Discussions' && (
                  <div className="space-y-4">
                    {/* Country clubs selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                        Choose your Country Club
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap py-1 scrollbar-none">
                        {['Global', 'USA', 'Canada', 'UK', 'Australia', 'New Zealand', 'Japan', 'Germany', 'Brazil', 'France', 'India', 'Mexico', 'South Africa', 'South Korea', 'Italy', 'Spain', 'Argentina', 'Philippines', 'Singapore', 'Ireland', 'Netherlands'].map((club) => (
                          <button
                            key={club}
                            onClick={() => setActiveCountryClub(club)}
                            className={`px-3.5 py-1.5 rounded text-xs font-mono font-medium border transition-all ${
                              activeCountryClub === club
                                ? 'bg-gold-500/10 border-gold-500 text-gold-500'
                                : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {club === 'Global' ? <Globe className="h-3.5 w-3.5 inline mr-1" /> : null}
                            {club} Club
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-900 bg-gradient-to-b from-neutral-950/80 to-neutral-950/40 p-4.5 space-y-4 min-h-[400px] flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5 text-gold-500" />
                          {activeCountryClub} Club Conversations
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                          {(clubDiscussions[activeCountryClub] || []).length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                              <p>No conversations yet in this club.</p>
                              <p className="text-neutral-600 mt-1">Start one — your voice is welcome here.</p>
                            </div>
                          ) : (
                            (clubDiscussions[activeCountryClub] || []).map((disc) => (
                              <div key={disc.id || `disc-${Math.random()}`} className="p-3.5 rounded-xl border border-neutral-900/60 bg-neutral-900/10 text-xs text-left space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                  <span className="text-gold-500 font-bold flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-neutral-600" /> {disc.author}
                                  </span>
                                  <span>{disc.time}</span>
                                </div>
                                <p className="text-neutral-200 leading-relaxed font-sans text-xs">{disc.text}</p>
                                {disc.replies && disc.replies.length > 0 && (
                                  <div className="pl-4 border-l-2 border-gold-500/20 space-y-2.5 pt-1">
                                    {disc.replies.map((reply) => (
                                      <div key={reply.id} className="bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-900/40 space-y-1">
                                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                                          <span className="text-neutral-400 font-semibold flex items-center gap-1">
                                            <User className="h-3 w-3 text-neutral-600" /> {reply.author}
                                          </span>
                                          <span>{reply.time}</span>
                                        </div>
                                        <p className="text-neutral-300 text-[11px] leading-relaxed">{reply.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <form onSubmit={(e) => handleAddReply(disc.id, e)} className="flex gap-2 pt-2 border-t border-neutral-900/30">
                                  <input
                                    type="text"
                                    value={replyInputs[disc.id] || ''}
                                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [disc.id]: e.target.value }))}
                                    placeholder="Join the conversation..."
                                    className="flex-1 rounded bg-[#0c0c0e] border border-neutral-900/80 px-3 py-1.5 text-[11px] text-white placeholder-neutral-600 outline-none focus:border-gold-500/30"
                                  />
                                  <button type="submit" disabled={!(replyInputs[disc.id] || '').trim()} className="px-3 bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-medium text-gold-500 hover:text-white rounded disabled:opacity-50 transition-colors uppercase">
                                    Reply
                                  </button>
                                </form>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <form onSubmit={handleAddDiscussion} className="flex gap-2 border-t border-neutral-900 pt-3 mt-4">
                        <input
                          type="text"
                          value={newDiscussionText}
                          onChange={(e) => setNewDiscussionText(e.target.value)}
                          placeholder={`Start a conversation in the ${activeCountryClub} Club...`}
                          className="flex-1 rounded border border-neutral-900 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-gold-500/40"
                        />
                        <button type="submit" disabled={!newDiscussionText.trim()} className="px-4 bg-gold-500 text-neutral-950 hover:bg-gold-400 disabled:opacity-50 font-bold rounded text-xs transition-all uppercase font-mono">
                          Post
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Fan Works Sub-Tab */}
                {communitySubTab === 'Fan Works' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-neutral-900 bg-gradient-to-b from-neutral-950/80 to-neutral-950/40 p-4.5 space-y-4 min-h-[300px]">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-gold-500" />
                        From the Hearts of Fellow Fans
                      </h3>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {creations.length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                            <p>No creations shared yet.</p>
                            <p className="text-neutral-600 mt-1">Be the first to share your art, poetry, or tribute.</p>
                          </div>
                        ) : (
                          creations.map((item) => (
                            <div key={item.id} className="p-3 border border-neutral-900/50 rounded bg-neutral-900/10 space-y-2 text-xs hover:border-gold-500/20 transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20 mb-1">
                                    {item.category}
                                  </span>
                                  <h4 className="font-bold text-white">{item.title}</h4>
                                </div>
                                <button
                                  onClick={() => handleLikeCreation(item.id)}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                                    item.hasLiked ? 'bg-gold-500/15 border border-gold-500/30 text-gold-500' : 'bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white'
                                  }`}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{item.likes}</span>
                                </button>
                              </div>
                              <p className="text-neutral-400 text-[11px] leading-relaxed">{item.description}</p>
                              <p className="text-[9px] font-mono text-neutral-500">Created by: <span className="text-neutral-400">{item.author}</span></p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW RENDERING 7: MESSAGES */}
            {activeTab === 'Messages' && user && (
              <FanAdminChat userId={user.id} showToast={showToast} />
            )}

            {/* VIEW RENDERING 7b: ASK GILLIAN */}
            {activeTab === 'Ask Gillian' && user && (
              <AskGillianChat userId={user.id} showToast={showToast} />
            )}

            {/* VIEW RENDERING 8: PROFILE */}
            {activeTab === 'Profile' && (
              <ProfileSection
                authName={authName}
                authEmail={authEmail}
                authCountry={authCountry}
                onAuthNameChange={setAuthName}
                onAuthCountryChange={setAuthCountry}
                rank={displayRank}
                progressPercent={progressPercent}
                loyaltyPoints={loyaltyPoints}
                membership={membership}
                showToast={showToast}
              />
            )}

            {/* VIEW RENDERING 9: MY JOURNEY (Vertical Timeline) */}
            {activeTab === 'My Journey' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Your Sanctuary Journey Log
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Tracking historic timeline interactions on the official bridge & logging your kindness acts.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left: Dynamic Timeline */}
                  <div className="md:col-span-7 rounded-xl border border-neutral-900 bg-neutral-950 p-6 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-gold-500 uppercase tracking-widest pb-1 border-b border-neutral-900/40">
                      Chronology of Compassion & Progress
                    </h3>
                    <div className="relative pl-6 border-l border-neutral-900 space-y-6">
                      {journeyLog.map((log) => (
                        <div key={log.id} className="relative">
                          <span className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full ${log.color || 'bg-green-500'} border-4 border-[#070709]`} />
                          <h4 className="text-xs font-bold text-white">{log.title}</h4>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{log.date || (log.created_at ? new Date(log.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) : '')}</p>
                          {log.description && (
                            <p className="text-xs text-neutral-400 mt-1 leading-normal">{log.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Log an Act of Kindness Card */}
                  <div className="md:col-span-5 rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4 h-fit">
                    <div className="space-y-1">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                        Log Daily Compassion
                      </h3>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        "Be excellent to each other."
                      </p>
                    </div>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Share a quiet act of kindness you performed today. It will be logged to your Sanctuary Journey Log.
                    </p>

                    <form onSubmit={(e) => {
                      handleAddKindnessAct(e);
                    }} className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase">Kindness Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Helped elderly neighbor with groceries"
                          value={newKindnessTitle}
                          onChange={(e) => setNewKindnessTitle(e.target.value)}
                          className="w-full bg-neutral-900 text-xs border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/50"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase">Context or Reflection</label>
                        <textarea
                          rows={3}
                          placeholder="What did you feel? How did they respond?"
                          value={newKindnessDesc}
                          onChange={(e) => setNewKindnessDesc(e.target.value)}
                          className="w-full bg-neutral-900 text-xs border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/50 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs transition-all uppercase tracking-wider text-center"
                      >
                        Authorize & Log Act
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW RENDERING 10: REWARDS (Loyalty progress and badges) */}
            {activeTab === 'Rewards' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Sanctuary Rewards & Points
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Earn points by sharing direct stories of kindness, and redeem them for digital rewards.
                  </p>
                </div>

                {/* Point Balance Header */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">Available Point Wallet</span>
                    <h3 className="text-3xl font-bold text-white font-mono">{loyaltyPoints.toLocaleString()} <span className="text-gold-500">PTS</span></h3>
                    <p className="text-xs text-neutral-400">Log kindness acts inside "My Journey" to earn 250 PTS per log!</p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 flex items-center justify-center text-xl shrink-0">
                    👑
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left Column: Earned Badges */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-900/40">
                      Your Unlocked Sanctuary Badges
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <div key={badge.id} className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 text-center space-y-3 flex flex-col justify-between items-center">
                          <div className="text-3xl">{badge.icon}</div>
                          <div className="space-y-1 leading-tight">
                            <h4 className="text-xs font-bold text-white">{badge.title}</h4>
                            <p className="text-[10px] text-neutral-500 leading-normal">{badge.desc}</p>
                          </div>
                          <p className="text-[9px] text-gold-500 font-mono uppercase tracking-widest font-semibold pt-1 border-t border-neutral-900 w-full">Unlocked: {badge.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Point Store */}
                  <div className="md:col-span-5 rounded-xl border border-neutral-900 bg-neutral-950 p-4.5 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-gold-500 uppercase tracking-widest pb-1 border-b border-neutral-900/40">
                      Loyalty Point Store
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      Exchanges are immediate. Unlocked rewards will instantly grant permanent badges and show up on your timeline.
                    </p>

                    <div className="space-y-3.5 pt-2">
                      {portalRewards.map((item) => {
                        const isUnlocked = badges.some(b => b.title === item.title);
                        return (
                          <div key={item.id} className="p-3 border border-neutral-900/60 rounded bg-neutral-900/20 text-xs text-left space-y-2 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{item.icon}</span>
                                <h4 className="font-bold text-white">{item.title}</h4>
                              </div>
                              <span className="text-gold-500 font-mono font-bold shrink-0">{item.cost} PTS</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-normal">{item.description}</p>
                            <button
                              onClick={() => handleRedeemReward(item)}
                              disabled={isUnlocked}
                              className={`w-full font-mono font-bold py-1.5 rounded text-[10px] transition-colors uppercase tracking-wider ${
                                isUnlocked 
                                  ? 'bg-neutral-900 border border-neutral-950 text-neutral-600 cursor-not-allowed'
                                  : 'bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-gold-500 hover:text-white'
                              }`}
                            >
                              {isUnlocked ? '✓ Reward Claimed' : 'Redeem collectible'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW RENDERING 11: NOTIFICATIONS */}
            {activeTab === 'Notifications' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4 flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                      Sanctuary Inbox Messages
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      Management review alerts, direct status updates, and ticket notifications.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user?.id).eq('is_read', false);
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                    }}
                    className="text-[10px] font-mono text-gold-500 hover:text-white"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="rounded-xl border border-neutral-900 p-12 text-center text-neutral-500 text-xs font-mono">
                      Your sanctuary inbox is completely clear. No active alerts.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border text-xs text-left flex justify-between items-center gap-4 transition-all ${
                          !notif.is_read
                            ? 'border-gold-500/30 bg-gold-500/[0.01]'
                            : 'border-neutral-900 bg-neutral-950/40'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-white font-bold text-[11px]">{notif.title}</p>
                          <p className="text-neutral-400 leading-normal">{notif.message}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[9px] font-mono text-neutral-500">{new Date(notif.created_at).toLocaleString()}</p>
                            {!notif.is_read && (
                              <button
                                onClick={async () => {
                                  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notif.id);
                                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                }}
                                className="text-[9px] font-mono text-gold-500/70 hover:text-gold-500 cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-gold-500 shrink-0" />
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-900/60 transition-colors"
                            title="Clear Alert"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW RENDERING 12: SETTINGS */}
            {activeTab === 'Settings' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Sanctuary Bridge Configuration
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Under private administration security protocols. Configure your portal preference variables.
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4 max-w-xl">
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-900">
                      Security & Privacy Logs
                    </h4>
                    
                    {/* Webhook tracker */}
                    <div className="flex justify-between items-center text-xs py-2 border-b border-neutral-900/40">
                      <div>
                        <p className="text-white font-semibold">Active Webhook Trackers</p>
                        <p className="text-[10px] text-neutral-400">Direct notifications forwarded to communications bridge.</p>
                      </div>
                      <button
                        onClick={() => {
                          const val = !settingsWebhooks;
                          setSettingsWebhooks(val);
                          showToast(`Webhook Trackers turned ${val ? 'ON' : 'OFF'}.`, 'info');
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all uppercase ${
                          settingsWebhooks 
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {settingsWebhooks ? 'ON / ACTIVE' : 'DISABLED'}
                      </button>
                    </div>

                    {/* Diagnostic Terminal Logs */}
                    <div className="flex justify-between items-center text-xs py-2 border-b border-neutral-900/40">
                      <div>
                        <p className="text-white font-semibold">Diagnostic Terminal Logs</p>
                        <p className="text-[10px] text-neutral-400">Store offline session states in local browser cache.</p>
                      </div>
                      <button
                        onClick={() => {
                          const val = !settingsLogs;
                          setSettingsLogs(val);
                          showToast(`Diagnostic Terminal Logs set to ${val ? 'ACTIVE SESSION' : 'OFFLINE ONLY'}.`, 'info');
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all uppercase ${
                          settingsLogs 
                            ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {settingsLogs ? 'ACTIVE SESSION' : 'OFFLINE ONLY'}
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="flex justify-between items-center text-xs py-2 border-b border-neutral-900/40">
                      <div>
                        <p className="text-white font-semibold">Two-Factor Authentication</p>
                        <p className="text-[10px] text-neutral-400">Require cryptographically signed SMS or OTP access tokens.</p>
                      </div>
                      <button
                        onClick={() => {
                          const val = !settingsTwoFactor;
                          setSettingsTwoFactor(val);
                          showToast(`Two-Factor Auth turned ${val ? 'ON' : 'OFF'}.`, 'info');
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all uppercase ${
                          settingsTwoFactor 
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {settingsTwoFactor ? 'SECURE' : 'INSECURE'}
                      </button>
                    </div>

                    {/* Email Alerts */}
                    <div className="flex justify-between items-center text-xs py-2">
                      <div>
                        <p className="text-white font-semibold">Instant Email Alerts</p>
                        <p className="text-[10px] text-neutral-400">Receive dispatch summaries of proposal updates immediately.</p>
                      </div>
                      <button
                        onClick={() => {
                          const val = !settingsEmailAlerts;
                          setSettingsEmailAlerts(val);
                          showToast(`Email Alerts turned ${val ? 'ON' : 'OFF'}.`, 'info');
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all uppercase ${
                          settingsEmailAlerts 
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {settingsEmailAlerts ? 'SUBSCRIBED' : 'MUTED'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-900 flex justify-between items-center">
                    <button
                      onClick={signOut}
                      className="px-5 py-2 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-500 font-bold rounded text-xs uppercase tracking-wider transition-colors"
                    >
                      Disconnect Connection Bridge
                    </button>
                    <button
                      onClick={() => {
                        showToast('Bridge synchronization logs generated.', 'success');
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white font-mono text-[10px] rounded transition-colors uppercase"
                    >
                      Sync State
                    </button>
                  </div>
                </div>

                {/* Portal Accent Customizer Card */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-500 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-gold-500 animate-pulse" />
                      Visual Environment Configuration
                    </span>
                    <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest pb-1 border-b border-neutral-900">
                      Portal Accent Customizer
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Globally re-wire the primary color-grid of the sanctuary. Selection synchronizes instantly across all portals.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { name: 'Gibson Gold', colorBg: 'bg-[#dfba89]', colorText: 'text-[#dfba89]', desc: 'Original Elegant' },
                      { name: 'Scully Red', colorBg: 'bg-[#dc2626]', colorText: 'text-[#dc2626]', desc: 'Forensic Crimson' },
                      { name: 'X-Files Green', colorBg: 'bg-[#16a34a]', colorText: 'text-[#16a34a]', desc: 'Extraterrestrial Glow' },
                      { name: 'Cyber Blue', colorBg: 'bg-[#0284c7]', colorText: 'text-[#0284c7]', desc: 'Therapist Azure' }
                    ].map((pal) => {
                      const isSelected = portalAccent === pal.name;
                      return (
                        <motion.button
                          key={pal.name}
                          type="button"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setPortalAccent(pal.name as PaletteType);
                            showToast(`Sanctuary grid re-wired to ${pal.name}.`, 'success');
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? 'bg-neutral-900 border-gold-500/60 shadow-md shadow-gold-500/5' 
                              : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/30'
                          }`}
                        >
                          {/* Active border/background slide using framer-motion layoutId */}
                          {isSelected && (
                            <motion.div
                              layoutId="activePaletteOutline"
                              className="absolute inset-0 border border-gold-500 rounded-xl pointer-events-none z-20"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}

                          <div className="flex items-center gap-2.5 relative z-10">
                            {/* Color Swatch Circle */}
                            <span className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center border border-black/40 relative overflow-hidden ${pal.colorBg}`}>
                              {isSelected && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="h-1.5 w-1.5 rounded-full bg-black block" 
                                />
                              )}
                            </span>
                            
                            <div className="space-y-0.5">
                              <p className={`text-xs font-bold font-mono tracking-wide ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                                {pal.name}
                              </p>
                              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">
                                {pal.desc}
                              </p>
                            </div>
                          </div>

                          {/* Subtle active glow light block */}
                          {isSelected && (
                            <motion.div 
                              layoutId="activePaletteGlow"
                              className="absolute inset-0 bg-gradient-to-r from-gold-500/5 to-transparent pointer-events-none"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    )}

      {/* MOBILE BOTTOM NAV BAR */}
      {isLoggedIn && profile && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-neutral-900 bg-[#050505]/98 backdrop-blur-md flex items-stretch justify-around shadow-2xl shadow-black/80 overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {[
              { tab: 'Dashboard' as const, icon: LayoutGrid, label: 'Home' },
              { tab: 'Community' as const, icon: Users, label: 'Connect' },
              { icon: Home, isHome: true },
              { tab: 'Experiences' as const, icon: Star, label: 'Book' },
            ].map((item, i) => {
              if ('isHome' in item) {
                return (
                  <button
                    key="home"
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all text-neutral-500"
                  >
                    <Home className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                );
              }
              const Icon = item.icon;
              const isSelected = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setSelectedRequestId(null); }}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${isSelected ? 'text-gold-500' : 'text-neutral-500'}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={isSelected ? 2.5 : 1.5} />
                  <span className="text-[8px] font-bold tracking-widest uppercase">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${isMoreMenuOpen ? 'text-gold-500' : 'text-neutral-500'}`}
            >
              <Menu className="h-5 w-5" strokeWidth={isMoreMenuOpen ? 2.5 : 1.5} />
              <span className="text-[8px] font-bold tracking-widest uppercase">More</span>
            </button>
          </div>

          {/* MOBILE MORE SHEET */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMoreMenuOpen(false)} />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a] border-t border-neutral-800 rounded-t-2xl max-h-[80vh] overflow-y-auto"
                  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-neutral-700" />
                  </div>
                  <div className="px-5 pb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-wide">More</h3>
                    <button onClick={() => setIsMoreMenuOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors">
                      <X className="h-4 w-4 text-neutral-400" />
                    </button>
                  </div>
                  <div className="px-5 pb-6 grid grid-cols-3 gap-3">
                    {[
                      { icon: User, label: 'Profile', nav: 'Profile' },
                      { icon: MessageCircle, label: 'Ask Gillian', nav: 'Ask Gillian' },
                      { icon: Calendar, label: 'Events', nav: 'Events' },
                      { icon: Award, label: 'Membership', nav: 'Membership' },
                      { icon: Compass, label: 'Journey', nav: 'My Journey' },
                      { icon: Gift, label: 'Rewards', nav: 'Rewards' },
                      { icon: MessageSquare, label: 'Messages', nav: 'Messages' },
                      { icon: Bell, label: 'Alerts', nav: 'Notifications' },
                      { icon: Settings, label: 'Settings', nav: 'Settings' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.nav;
                      return (
                        <button
                          key={item.nav}
                          onClick={() => { setActiveTab(item.nav as any); setSelectedRequestId(null); setIsMoreMenuOpen(false); }}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-gold-500/10 border-gold-500/30 text-gold-500'
                              : 'bg-neutral-950/50 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* FOOTER BAR */}
      <footer className="border-t border-white/[0.03] bg-[#070709] py-5 px-4 md:px-8 hidden md:block">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] font-mono text-white/20">
          <span>&copy; 2026 Gillian Anderson Co-op. All rights reserved.</span>
          <div className="flex gap-5">
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-gold-500/60 transition-colors bg-transparent border-none cursor-pointer">Terms</button>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-gold-500/60 transition-colors bg-transparent border-none cursor-pointer">Privacy</button>
          </div>
        </div>
      </footer>

      {/* DYNAMIC PORTAL REQUEST WIZARD — removed (feature deprecated) */}

      {/* PORTAL MEMBERSHIP UPGRADE MODAL */}
      <AnimatePresence>
        {showPortalMembershipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPortalMembershipModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950 p-6.5 shadow-2xl z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-serif text-base tracking-wider text-gold-500 uppercase">
                Membership Upgrade
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                Upgrade to a higher tier to unlock more benefits and experiences.
                {membership?.status === 'active' && (
                  <> Current tier: <span className="text-gold-500">{membership.tier_name}</span></>
                )}
              </p>

              <form onSubmit={handlePortalMembershipRequest} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase">DESIRED TIER</label>
                  <div className="grid gap-2">
                    {(backendContent?.membershipTiers || []).filter((t: any) => {
                      if (!membership) return true;
                      const order = ['scully', 'gibson', 'milburn'];
                      return order.indexOf(t.id) > order.indexOf(membership.tier_id);
                    }).map((t: any) => (
                      <button key={t.id} type="button" onClick={() => setMTierId(t.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${mTierId === t.id ? 'border-gold-500/50 bg-gold-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{t.name}</p>
                          <p className="text-[9px] font-mono text-neutral-500">{t.price}</p>
                        </div>
                        {mTierId === t.id && <Check className="h-4 w-4 text-gold-500" />}
                      </button>
                    ))}
                    {(backendContent?.membershipTiers || []).length === 0 && (
                      <p className="text-[10px] font-mono text-neutral-600 italic">No upgrade tiers available.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase">CONTACT METHOD</label>
                    <div className="flex gap-2">
                      {(['whatsapp', 'email'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setMContact(m)}
                          className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all text-[10px] font-mono ${
                            mContact === m
                              ? (m === 'whatsapp' ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-gold-500/50 bg-gold-500/5 text-gold-500')
                              : 'border-neutral-900 text-neutral-500 hover:text-white'
                          }`}
                        >
                          {m === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                          {m === 'whatsapp' ? 'WhatsApp' : 'Email'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase">CONTACT INFO</label>
                    <input type="text" required value={mContactVal} onChange={(e) => setMContactVal(e.target.value)}
                      placeholder={mContact === 'whatsapp' ? '+1 (555) 000-0000' : 'you@example.com'}
                      className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase">WHY DO YOU WISH TO UPGRADE?</label>
                  <textarea required rows={3} value={mReason} onChange={(e) => setMReason(e.target.value)}
                    placeholder="Tell us why you'd like to upgrade and what benefits you're most excited about."
                    className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPortalMembershipModal(false)}
                    className="flex-1 py-2.5 rounded border border-neutral-900 text-neutral-400 text-[10px] font-mono font-bold uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={!mTierId || !mReason.trim() || !mContactVal.trim() || mUpgrading}
                    className="flex-1 py-2.5 rounded bg-gold-500 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gold-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mUpgrading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</> : 'Submit Upgrade Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PORTAL UPLOAD CREATIVE WORK MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950 p-6 shadow-2xl z-10 text-left space-y-4"
            >
              <h3 className="font-serif text-base tracking-wider text-gold-500 uppercase">
                Share Creative Fan Work
              </h3>

              <form onSubmit={handleUploadCreation} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase">TITLE</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Scully Drawing / My Mentorship Journey"
                    className="w-full rounded border border-neutral-900 bg-[#0c0c0e] px-3.5 py-2 text-white outline-none focus:border-gold-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase">CATEGORY</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full rounded border border-neutral-900 bg-[#0c0c0e] px-3.5 py-2 text-white outline-none focus:border-gold-500/50"
                  >
                    <option value="Fan Art">Fan Art</option>
                    <option value="Fan Story">Fan Story / Testimony</option>
                    <option value="Fan Video">Fan Video</option>
                    <option value="Photography">Photography</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase">DESCRIPTION</label>
                  <textarea
                    required
                    rows={4}
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Describe your creation or share your complete story..."
                    className="w-full rounded border border-neutral-900 bg-[#0c0c0e] px-3.5 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs tracking-wider transition-colors uppercase"
                >
                  Publish to Community Board
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPPORT MODAL (MOCK HELPDESK) */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHelpModal(false);
                setHelpSubmitted(false);
                setHelpText('');
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl z-10 text-left space-y-4"
            >
              <h3 className="font-serif text-base tracking-wider text-gold-500 uppercase">
                Official Support Desk
              </h3>

              {!helpSubmitted ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setHelpSubmitted(true);
                  }}
                  className="space-y-4 text-xs"
                >
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Experiencing coordination issues? Submit a message directly to Sarah and our security compliance team.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">MESSAGE</label>
                    <textarea
                      required
                      rows={3}
                      value={helpText}
                      onChange={(e) => setHelpText(e.target.value)}
                      placeholder="Explain your inquiry in detail..."
                      className="w-full rounded border border-neutral-900 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-gold-500/50 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs tracking-wider transition-colors"
                  >
                    Send Ticket
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/30">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Ticket Submitted</h4>
                    <p className="text-neutral-400 leading-relaxed">Sarah and the security compliance desk will respond on WhatsApp shortly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHelpModal(false);
                      setHelpSubmitted(false);
                      setHelpText('');
                    }}
                    className="px-5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 text-xs font-semibold text-white rounded transition-colors"
                  >
                    Close Support Desk
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMUNICATION BRIDGE DISPATCH MODAL — removed (feature deprecated) */}

      {/* SYSTEM TOAST NOTIFICATIONS */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-2xl max-w-[calc(100vw-2rem)] ${
              toast.type === 'error'
                ? 'border-red-500/50 bg-[#0a0a0c] shadow-red-500/10'
                : 'border-gold-500 bg-[#0a0a0c] shadow-gold-500/10'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-gold-500'} animate-pulse`} />
            <div className="flex-1 text-xs text-left">
              <p className={`font-mono uppercase tracking-widest font-bold text-[9px] ${toast.type === 'error' ? 'text-red-400' : 'text-gold-500'}`}>
                {toast.type === 'error' ? 'NOTICE' : 'SYSTEM MSG'}
              </p>
              <p className="text-white mt-0.5 leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />


    </div>
  );
}
