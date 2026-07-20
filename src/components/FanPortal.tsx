/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../utils/StateContext';
import { useAuth } from '../utils/AuthContext';
import NotificationBell from './NotificationBell';
import MyMembershipDashboard from './MyMembershipDashboard';
import ProfileSection from './ProfileSection';
import {
  LayoutGrid,
  User,
  Users,
  Mail,
  FileText,
  Calendar,
  Award,
  Crown,
  ShoppingBag,
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
  Share2,
  Send,
  ExternalLink,
  MessageCircle,
  HelpCircle,
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
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from '../utils/theme';
import { TermsOfServiceModal, PrivacyPolicyModal } from './LegalModals';

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

interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  registered: boolean;
  ticketRef?: string;
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
  const { user, session, profile, loading: sessionLoading, signIn, signUp, signOut, updateProfile } = useAuth();
  const isLoggedIn = !!user;

  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCountry, setAuthCountry] = useState('USA');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'My Requests' | 'Dashboard' | 'Profile' | 'Community' | 'Messages' | 'Events' | 'Membership' | 'Orders' | 'My Journey' | 'Rewards' | 'Notifications' | 'Settings'>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'TIMELINE' | 'DETAILS' | 'MESSAGES' | 'DOCUMENTS'>('TIMELINE');

  // Selected single request detail expansion
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const {
    requests: backendRequests,
    proposalChats: backendProposalChats,
    orders: backendOrders,
    discussions: backendDiscussions,
    content: backendContent,
    addRequest,
    addRequestChatMessage,
    addOrder,
    polishSincerity
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


  // Communication bridge modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchUrl, setDispatchUrl] = useState('');
  const [dispatchMethod, setDispatchMethod] = useState('');
  const [isCopiedDispatch, setIsCopiedDispatch] = useState(false);

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
  const [showPortalRequestWizard, setShowPortalRequestWizard] = useState(false);
  const [newRequestType, setNewRequestType] = useState('Fan Letter');
  const [newRequestDate, setNewRequestDate] = useState('');
  const [newRequestLocation, setNewRequestLocation] = useState('');
  const [newRequestAttendees, setNewRequestAttendees] = useState('1 Person');
  const [newRequestSincerity, setNewRequestSincerity] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [newRequestContact, setNewRequestContact] = useState<'Website' | 'Email' | 'WhatsApp' | 'Telegram'>('Email');
  const [newRequestContactVal, setNewRequestContactVal] = useState('');

  // Dynamic Event registrations
  const [portalEvents, setPortalEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch('/api/portal/events').then(r => r.ok ? r.json() : []).then(setPortalEvents).catch(() => {});
  }, []);

  // Community State
  const [activeCountryClub, setActiveCountryClub] = useState<string>('Global');
  const [clubDiscussions, setClubDiscussions] = useState<{ [club: string]: DiscussionPost[] }>({});

  useEffect(() => {
    if (backendDiscussions && Object.keys(backendDiscussions).length > 0) {
      setClubDiscussions(backendDiscussions);
    }
  }, [backendDiscussions]);
  const [newDiscussionText, setNewDiscussionText] = useState('');
  const [replyInputs, setReplyInputs] = useState<{ [postId: string]: string }>({});

  // Fan Creativity Board
  const [creations, setCreations] = useState<FanArtItem[]>([]);

  useEffect(() => {
    fetch('/api/portal/creations').then(r => r.ok ? r.json() : []).then(setCreations).catch(() => {});
  }, []);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Fan Art' | 'Fan Story' | 'Fan Video' | 'Photography'>('Fan Art');
  const [uploadDesc, setUploadDesc] = useState('');

  // Simulated Shop Orders tracking
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (backendOrders) {
      setOrders(backendOrders);
    }
  }, [backendOrders]);

  // Portal store items from DB
  const [storeItems, setStoreItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/portal/store-items').then(r => r.ok ? r.json() : []).then(data => {
      setStoreItems(data.map((p: any) => ({
        id: p.id,
        item: p.name,
        price: String(p.price),
        desc: p.description,
        icon: p.image_placeholder || '📦'
      })));
    }).catch(() => {});
  }, []);

  // Portal rewards from DB
  const [portalRewards, setPortalRewards] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/portal/rewards').then(r => r.ok ? r.json() : []).then(setPortalRewards).catch(() => {});
  }, []);

  // Messages State for 3 active channels

  // Loyalty & Rewards State
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    fetch('/api/portal/points').then(r => r.ok ? r.json() : { points: 0 }).then(d => setLoyaltyPoints(d.points)).catch(() => {});
  }, []);

  const rank = getLoyaltyRank(loyaltyPoints);
  const progressPercent = Math.min(100, Math.max(0, ((loyaltyPoints - rank.min) / (rank.max - rank.min)) * 100));
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    fetch('/api/portal/badges').then(r => r.ok ? r.json() : []).then(setBadges).catch(() => {});
  }, []);

  // Kindness log & Journey timeline State
  const [journeyLog, setJourneyLog] = useState([]);

  useEffect(() => {
    fetch('/api/portal/journey').then(r => r.ok ? r.json() : []).then(setJourneyLog).catch(() => {});
  }, []);

  const [newKindnessTitle, setNewKindnessTitle] = useState('');
  const [newKindnessDesc, setNewKindnessDesc] = useState('');

  // Portal Theme Customizer
  const [accentColor, setAccentColor] = useState<'gold' | 'red' | 'green' | 'blue'>('gold');

  // Selected Avatar Preset
  const [selectedAvatar, setSelectedAvatar] = useState<{ id: string; name: string; emoji: string } | null>(null);

  // Avatar Options
  const avatarPresets = [
    { id: 'scully', name: 'Dana Scully (The X-Files)', emoji: '🔬' },
    { id: 'gibson', name: 'Stella Gibson (The Fall)', emoji: '🕵️‍♀️' },
    { id: 'milburn', name: 'Jean Milburn (Sex Education)', emoji: '📚' },
    { id: 'bedford', name: 'Lady Dedlock (Bleak House)', emoji: '🕯️' },
    { id: 'margaret', name: 'Margaret Thatcher (The Crown)', emoji: '👑' }
  ];

  // Daily Quiz Trivia
  const [dailyQuizAnswered, setDailyQuizAnswered] = useState(false);
  const [dailyQuizChoice, setDailyQuizChoice] = useState<string | null>(null);
  const [dailyQuizResult, setDailyQuizResult] = useState<'correct' | 'incorrect' | null>(null);

  // Community Comments & Topics
  const [activeTopicFilter, setActiveTopicFilter] = useState<'#All' | '#XFiles' | '#TheFall' | '#SexEducation' | '#FanArt'>('#All');
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Messages State for 3 active channels
  const [currentChannel, setCurrentChannel] = useState<'management' | 'events' | 'vault'>('management');
  const [newMessage, setNewMessage] = useState('');
  const [channelMessages, setChannelMessages] = useState<{
    management: { id: string; sender: 'management' | 'user'; text: string; timestamp: string }[];
    events: { id: string; sender: 'management' | 'user'; text: string; timestamp: string }[];
    vault: { id: string; sender: 'management' | 'user'; text: string; timestamp: string }[];
  }>({ management: [], events: [], vault: [] });

  useEffect(() => {
    const channels = ['management', 'events', 'vault'] as const;
    channels.forEach(async (channel) => {
      try {
        const res = await fetch(`/api/portal/channels/${channel}`);
        if (res.ok) {
          const data = await res.json();
          setChannelMessages(prev => ({ ...prev, [channel]: data }));
        }
      } catch {}
    });
  }, []);

  // Shop Cart State
  const [cart, setCart] = useState<{ id: string; item: string; price: string; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCryptoWallet, setCheckoutCryptoWallet] = useState('');

  // Live Virtual Event Stage State
  const [activeEventStageId, setActiveEventStageId] = useState<string | null>(null);
  const [eventClaps, setEventClaps] = useState(0);
  const [userEventMessage, setUserEventMessage] = useState('');

  // Active Proposal Inner Chat Timeline
  const [proposalChats, setProposalChats] = useState<{ [proposalId: string]: { id: string; sender: 'management' | 'user' | 'system'; text: string; timestamp: string }[] }>({});

  useEffect(() => {
    if (backendProposalChats) {
      setProposalChats(backendProposalChats);
    }
  }, [backendProposalChats]);

  const [newProposalMsg, setNewProposalMsg] = useState('');
  const [timelineCommentText, setTimelineCommentText] = useState('');

  // Step-by-step Request Wizard tabs
  const [requestWizardStep, setRequestWizardStep] = useState(1);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/portal/notifications').then(r => r.ok ? r.json() : []).then(setNotifications).catch(() => {});
  }, []);

  // Helper helper to generate dynamic portal notifications
  const pushNotification = (text: string) => {
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
  const addJourneyMilestone = (title: string, description: string, color: string = 'bg-gold-500') => {
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
  const [copied, setCopied] = useState(false);
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Upgrade Membership inside Portal Modal
  const [showPortalMembershipModal, setShowPortalMembershipModal] = useState(false);
  const [mType, setMType] = useState('gold');
  const [mReason, setMReason] = useState('');
  const [mContact, setMContact] = useState<'Website' | 'Email' | 'WhatsApp' | 'Telegram'>('Email');
  const [mContactVal, setMContactVal] = useState('');

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
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

    setChannelMessages((prev) => ({
      ...prev,
      [currentChannel]: [...(prev[currentChannel] || []), newMsg]
    }));
    setNewMessage('');

    // Prepend a journey milestone for direct communication
    addJourneyMilestone(
      `Dispatched Message: ${currentChannel === 'management' ? 'Management' : currentChannel === 'events' ? 'Event Coordinator' : 'Vault Support'}`,
      `Secure communication logged regarding portal inquiry: "${userText.substring(0, 30)}..."`,
      'bg-blue-500'
    );
  };

  const handleAddDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim()) return;

    const newDisc: DiscussionPost = {
      id: `disc-${Date.now()}`,
      author: authName,
      text: newDiscussionText.trim(),
      time: 'Just now',
      replies: []
    };

    setClubDiscussions((prev) => ({
      ...prev,
      [activeCountryClub]: [newDisc, ...(prev[activeCountryClub] || [])]
    }));
    setNewDiscussionText('');
  };

  const handleAddReply = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyInputs[postId]?.trim();
    if (!replyText) return;

    const newReply: DiscussionReply = {
      id: `reply-${Date.now()}`,
      author: authName,
      text: replyText,
      time: 'Just now'
    };

    setClubDiscussions((prev) => {
      const currentList = prev[activeCountryClub] || [];
      const updatedList = currentList.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            replies: [...(post.replies || []), newReply]
          };
        }
        return post;
      });
      return {
        ...prev,
        [activeCountryClub]: updatedList
      };
    });

    setReplyInputs((prev) => ({
      ...prev,
      [postId]: ''
    }));

    showToast('Reply added to thread!', 'success');
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
      await fetch(`/api/portal/creations/${id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch {}
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
      const res = await fetch('/api/portal/creations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newC.title, category: newC.category, description: newC.description, author: newC.author })
      });
      if (res.ok) {
        const created = await res.json();
        setCreations((prev) => [{ ...newC, id: String(created.id) }, ...prev]);
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

  const handlePortalSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestSincerity.trim() || !newRequestContactVal.trim()) return;

    try {
      const createdReq = await addRequest(
        newRequestType,
        newRequestDate || 'Not specified',
        newRequestLocation || 'Global / Virtual',
        newRequestAttendees,
        `${newRequestContact}: ${newRequestContactVal}`,
        newRequestSincerity,
        authName || 'John Smith'
      );

      const messageText = `Proposal ${createdReq.id} submitted successfully. Our management team will review and respond via the portal.`;

      setDispatchMessage(messageText);
      setDispatchUrl(window.location.href);
      setDispatchMethod('Portal');
      setIsCopiedDispatch(false);
      setShowDispatchModal(true);

      showToast('Your official proposal has been submitted successfully!', 'success');
      setShowPortalRequestWizard(false);
      setRequestWizardStep(1); // Reset Wizard
      setNewRequestDate('');
      setNewRequestLocation('');
      setNewRequestSincerity('');
      setNewRequestContactVal('');
      setSelectedRequestId(createdReq.id);
      setActiveTab('My Requests');
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to full-stack server.', 'error');
    }
  };

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
      await fetch(`/api/requests/${requestId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', text: textToPost })
      });
    } catch {}
  };

  const handlePortalMembershipRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mReason.trim() || !mContactVal.trim()) return;

    const newReq: RequestDetail = {
      id: `KR-MEM-${Date.now()}`,
      type: `Membership Upgrade: ${mType.toUpperCase()}`,
      preferredDate: 'Immediate Activation',
      location: authCountry,
      attendees: '1 Person',
      whatsappNumber: `${mContact}: ${mContactVal}`,
      status: 'Submitted',
      submittedOn: new Date().toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      lastUpdated: new Date().toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      sincerity: mReason,
      member: authName || 'John Smith',
      memberAvatar: (authName || 'JS').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      updated: 'Just now'
    };

    setUserRequests((prev) => [newReq, ...prev]);
    showToast('Your membership upgrade request has been submitted successfully!', 'success');
    setShowPortalMembershipModal(false);
    setMReason('');
    setMContactVal('');
    setSelectedRequestId(newReq.id);
    setActiveTab('My Requests');
  };

  const handleRegisterEvent = async (id: string) => {
    try {
      await fetch(`/api/portal/events/${id}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch {}
    setPortalEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return { ...e, registered: true, ticketRef: `KR-TKT-${Date.now()}` };
        }
        return e;
      })
    );
    addJourneyMilestone('Registered for Event', `Registered for event ID: ${id}`, 'bg-blue-500');
    pushNotification('Event registration confirmed! Check your ticket ref.');
    showToast('Event registered successfully!', 'success');
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
      await fetch('/api/portal/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newLog.title, description: newLog.description, color: newLog.color })
      });
    } catch {}
  };

  const redeemableItems: { id: string; title: string; cost: number; icon: string; desc: string }[] = [];

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
      await fetch('/api/portal/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBadge.title, description: newBadge.desc, icon: newBadge.icon })
      });
      await fetch('/api/portal/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: journeyMilestone.title, description: journeyMilestone.description, color: journeyMilestone.color })
      });
      await fetch('/api/portal/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Successfully redeemed loyalty reward: ${item.title}. Check your unlocked badges!` })
      });
    } catch {}
  };

  const handleAddToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, item: item.item, price: item.price, quantity: 1 }];
    });
    showToast(`Added ${item.item} to cart!`, 'success');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    showToast('Removed item from cart.', 'info');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const consolidatedItems = cart.map((i) => `${i.item} (x${i.quantity})`).join(', ');
    const totalCost = cart.reduce((acc, curr) => acc + parseFloat(curr.price) * curr.quantity, 0).toFixed(2);

    try {
      await addOrder(consolidatedItems, totalCost, authName || 'John Smith');

      setCart([]);
      
      // Clear form fields
      setCheckoutCardNumber('');
      setCheckoutCryptoWallet('');

      // Prepend dynamic journey milestone
      addJourneyMilestone(
        `Purchased: ${consolidatedItems.substring(0, 30)}...`,
        `Consolidated checkout of ${cart.length} item(s) totaling $${totalCost} approved via ${paymentMethod === 'crypto' ? 'Secure Crypto Wallet' : 'Sanctuary Card'}.`,
        'bg-green-500'
      );

      pushNotification('Order successfully placed. Awaiting confirmation.');
      showToast('Checkout approved! State synchronized.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to process merchandise order.', 'error');
    }
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
        setActiveTab('Dashboard');
      } else {
        const { error, user: newUser } = await signUp(authEmail, authPassword, authName);
        if (error) {
          setAuthError(error);
          return;
        }
        if (newUser) {
          setShowWelcome(true);
          setTimeout(() => {
            setShowWelcome(false);
            if (authCountry) {
              updateProfile({ country: authCountry });
            }
          }, 2000);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans selection:bg-gold-500 selection:text-neutral-950 flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. AUTHENTICATION GATE SCREEN */}
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,186,137,0.03),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-xl border border-neutral-900 bg-neutral-950 p-8 shadow-2xl text-center space-y-6"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/25">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest block font-bold">
                    REGISTRATION SENT
                  </span>
                  <h4 className="font-serif text-lg font-bold tracking-wider text-white">
                    CHECK YOUR EMAIL
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    A confirmation link has been sent to <span className="text-white font-bold">{authEmail}</span>. Please check your inbox and confirm your email to activate your sanctuary access.
                  </p>
                </div>
                <div className="rounded border border-neutral-900 bg-neutral-900/40 p-4">
                  <p className="text-xs italic text-gold-500 font-serif leading-relaxed">
                    "It's a wonderful thing when we can connect with transparency and sincerity. Welcome. Let's do some good."
                  </p>
                  <p className="text-[8px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form-panel"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0a0c] p-6.5 shadow-2xl relative overflow-hidden text-left space-y-6"
              >
                <div className="absolute top-0 right-0 h-20 w-20 bg-[radial-gradient(circle_at_top_right,rgba(223,186,137,0.07),transparent)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-20 w-20 bg-[radial-gradient(circle_at_bottom_left,rgba(223,186,137,0.02),transparent)] pointer-events-none" />

                <div className="text-center space-y-2">
                  <span className="font-serif text-2xl font-bold tracking-widest text-white block">GA</span>
                  <p className="font-serif text-xs font-bold tracking-widest text-neutral-300 uppercase">Gillian Anderson Sanctuary</p>
                  <p className="font-mono text-[8px] tracking-[0.25em] text-gold-500/70 uppercase">Official Communication Bridge</p>
                </div>

                <div className="grid grid-cols-2 gap-1 border-b border-neutral-900 pb-1.5">
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`pb-2 text-xs font-mono font-bold tracking-wider text-center transition-all ${
                      authMode === 'register' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    REGISTER ACCOUNT
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`pb-2 text-xs font-mono font-bold tracking-wider text-center transition-all ${
                      authMode === 'login' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    LOGIN PORTAL
                  </button>
                </div>

                {authError && (
                  <div className="border border-red-900/50 bg-red-950/20 rounded p-3 text-center">
                    <p className="text-[10px] font-mono text-red-400 font-semibold">{authError}</p>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">FULL NAME</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="john.smith@gmail.com"
                      className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">COUNTRY RESIDENCE</label>
                      <select
                        value={authCountry}
                        onChange={(e) => setAuthCountry(e.target.value)}
                        className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 outline-none focus:border-gold-500/50"
                      >
                        <option value="USA">USA 🇺🇸</option>
                        <option value="Canada">Canada 🇨🇦</option>
                        <option value="UK">United Kingdom 🇬🇧</option>
                        <option value="Australia">Australia 🇦🇺</option>
                        <option value="New Zealand">New Zealand 🇳🇿</option>
                        <option value="Japan">Japan 🇯🇵</option>
                        <option value="Germany">Germany 🇩🇪</option>
                        <option value="Brazil">Brazil 🇧🇷</option>
                        <option value="France">France 🇫🇷</option>
                        <option value="India">India 🇮🇳</option>
                        <option value="Mexico">Mexico 🇲🇽</option>
                        <option value="South Africa">South Africa 🇿🇦</option>
                        <option value="South Korea">South Korea 🇰🇷</option>
                        <option value="Italy">Italy 🇮🇹</option>
                        <option value="Spain">Spain 🇪🇸</option>
                        <option value="Argentina">Argentina 🇦🇷</option>
                        <option value="Philippines">Philippines 🇵🇭</option>
                        <option value="Singapore">Singapore 🇸🇬</option>
                        <option value="Ireland">Ireland 🇮🇪</option>
                        <option value="Netherlands">Netherlands 🇳🇱</option>
                        <option value="Global">Other Country (Global)</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold py-2.5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider shadow-md shadow-gold-500/10 mt-6"
                  >
                    {authLoading ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <><Lock className="h-3.5 w-3.5" />{authMode === 'register' ? 'Authorize Registration' : 'Establish Connection'}</>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={onBackToHome}
                    className="text-[10px] font-mono text-neutral-500 hover:text-gold-500 transition-colors"
                  >
                    ← Back to Landing Page
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
          <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-[#050505]/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between h-16 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-1.5 rounded-lg bg-neutral-950/60 border border-neutral-800/50 text-neutral-500 hover:text-neutral-100 hover:border-neutral-700 transition-all"
                aria-label="Back to landing"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-3">
                <span className="font-serif text-lg font-bold tracking-widest text-gold-500 leading-none">
                  GA
                </span>
                <div className="h-4 w-px bg-neutral-800/60" />
                <div className="flex flex-col">
                  <span className="font-serif text-[10px] font-semibold tracking-wider text-neutral-200 leading-tight">
                    Co-op
                  </span>
                  <span className="font-mono text-[7px] tracking-[0.2em] text-gold-500/60 font-semibold uppercase leading-none">
                    Member Workspace
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-500/5 border border-gold-500/15 text-[10px] font-mono text-gold-400/80 font-medium">
                <span className="text-gold-500/60">✦</span>
                <span>{loyaltyPoints.toLocaleString()} pts</span>
              </div>

              <NotificationBell />

              <div className="flex items-center gap-2 pl-2 border-l border-neutral-800/60">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/25 flex items-center justify-center text-[9px] font-bold text-gold-500 font-serif">
                  {authName.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col leading-none">
                  <span className="text-xs font-medium text-neutral-100">{authName}</span>
                  <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">{rank.name}</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg bg-neutral-950/60 border border-neutral-800/50 text-neutral-500 hover:text-neutral-100 transition-all"
                aria-label="Toggle navigation"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </header>

          <div className="flex flex-1 relative">
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* FIXED SIDEBAR */}
            <aside
              className={`
                bg-[#0a0a0c] border-r border-neutral-900/60 flex flex-col justify-between transition-all duration-300 z-30
                ${isMobileMenuOpen
                  ? 'fixed inset-y-0 left-0 w-64 shadow-2xl translate-x-0 pt-16'
                  : 'fixed inset-y-0 left-0 w-64 -translate-x-full md:translate-x-0 md:pt-16'
                }
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
                  { name: 'My Requests', icon: FileText },
                  { name: 'Events', icon: Calendar },
                  { name: 'Membership', icon: Award },
                  { name: 'Orders', icon: ShoppingBag },
                  { name: 'My Journey', icon: Compass },
                  { name: 'Rewards', icon: Gift },
                  { name: 'Notifications', icon: Bell },
                  { name: 'Settings', icon: Settings }
                ].map((item) => {
                  const Icon = item.icon;
                  const isUnread = item.name === 'Notifications' && notifications.some(n => n.unread);
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
                      <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">{rank.name}</span>
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
            <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#050505] p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8">
            
            {/* VIEW RENDERING 1: DASHBOARD */}
            {activeTab === 'Dashboard' && (
              <div className="max-w-4xl mx-auto relative">

                {/* Ambient glow */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/[0.01] rounded-full blur-[100px] pointer-events-none" />

                {/* ---- MEMBER LETTERHEAD ---- */}
                <div className="relative mb-16 md:mb-20">
                  <div className="flex items-center justify-end mb-8">
                    <div className="font-mono text-[8px] text-neutral-600 tracking-wider text-right leading-relaxed">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}<br />
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h1 className="font-serif text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-[1.1]">
                      Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {authName}
                    </h1>
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed max-w-xl">
                      Your sanctuary is quiet, your connections are growing, and there is always something meaningful waiting for you.
                    </p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-gold-500/40 via-gold-500/20 to-transparent mt-8" />
                </div>

                {/* ---- MEMBERSHIP BAR ---- */}
                <div className="relative mb-16 md:mb-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-900/60 rounded-2xl overflow-hidden">
                  <div className="bg-neutral-950/60 p-5 md:p-6">
                    <span className="font-mono text-[8px] text-neutral-600 uppercase tracking-widest">Membership</span>
                    <p className="font-serif text-sm font-bold text-neutral-100 mt-1.5 uppercase tracking-wide">{rank.name}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60" />
                      <span className="font-mono text-[9px] text-neutral-500">{loyaltyPoints.toLocaleString()} points</span>
                    </div>
                  </div>
                  <div className="bg-neutral-950/60 p-5 md:p-6">
                    <span className="font-mono text-[8px] text-neutral-600 uppercase tracking-widest">Progress</span>
                    <p className="font-serif text-sm font-bold text-neutral-100 mt-1.5">{Math.round(progressPercent)}%</p>
                    <div className="h-1 bg-neutral-900/60 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold-500/40 to-gold-500/70 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="font-mono text-[8px] text-neutral-600 mt-1.5">Next: {rank.next} · {loyaltyPoints.toLocaleString()} / {rank.max.toLocaleString()} pts</p>
                  </div>
                  <div className="bg-neutral-950/60 p-5 md:p-6">
                    <span className="font-mono text-[8px] text-neutral-600 uppercase tracking-widest">Rank</span>
                    <p className="font-serif text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-300 mt-1.5 uppercase tracking-wide">{rank.next}</p>
                    <p className="font-mono text-[8px] text-neutral-600 mt-2.5">{rank.max - loyaltyPoints} pts remaining to advance</p>
                  </div>
                </div>

                {/* ---- TWO-COLUMN CONTENT ---- */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-16 md:mb-20">

                  {/* LEFT: Journey Timeline (3 cols) */}
                  <div className="md:col-span-3 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <Compass className="h-3.5 w-3.5 text-gold-500/60" />
                      <span className="font-mono text-[9px] text-gold-500/60 uppercase tracking-widest font-bold">Your Journey</span>
                      <span className="h-px flex-1 bg-neutral-900/60" />
                    </div>

                    {journeyLog.length > 0 ? (
                      <div className="space-y-0">
                        {journeyLog.slice(0, 4).map((log, i) => (
                          <div key={log.id || i} className="flex gap-4 group">
                            <div className="flex flex-col items-center pt-1">
                              <div className="h-2 w-2 rounded-full bg-gold-500/40 ring-2 ring-[#050505]" />
                              {i < Math.min(journeyLog.length, 4) - 1 && <div className="w-px flex-1 bg-neutral-900/60" />}
                            </div>
                            <div className="flex-1 min-w-0 pb-5">
                              <p className="font-serif text-sm font-bold text-neutral-200 group-hover:text-neutral-100 transition-colors uppercase tracking-wide">{log.title}</p>
                              {log.description && (
                                <p className="text-xs text-neutral-500 font-sans mt-0.5 leading-relaxed">{log.description}</p>
                              )}
                              <p className="font-mono text-[7px] text-neutral-600 mt-1 tracking-wide">{log.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-neutral-900/60 rounded-xl p-8 text-center">
                        <p className="font-serif text-sm text-neutral-500">Your journey begins here</p>
                        <p className="text-xs text-neutral-600 mt-1 font-sans">Submit a request or register for an event to log your first milestone.</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Upcoming + Quick Actions (2 cols) */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-3.5 w-3.5 text-gold-500/60" />
                        <span className="font-mono text-[9px] text-gold-500/60 uppercase tracking-widest font-bold">Upcoming</span>
                        <span className="h-px flex-1 bg-neutral-900/60" />
                      </div>

                      {portalEvents.filter(e => !e.registered).length > 0 ? (
                        <button onClick={() => setActiveTab('Events')} className="w-full text-left group">
                          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 hover:border-gold-500/30 transition-all shadow-lg shadow-black/20">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg border border-neutral-900 bg-neutral-950/60 font-mono shrink-0">
                                <span className="text-base font-semibold text-neutral-100 leading-none">
                                  {(() => { try { const d = new Date(portalEvents.filter(e => !e.registered)[0].date); return isNaN(d.getTime()) ? '--' : d.getDate(); } catch { return '--'; } })()}
                                </span>
                                <span className="text-[7px] font-semibold text-gold-500/60 tracking-wider mt-0.5 leading-none uppercase">
                                  {(() => { try { const d = new Date(portalEvents.filter(e => !e.registered)[0].date); return isNaN(d.getTime()) ? 'TBD' : d.toLocaleString('en', { month: 'short' }); } catch { return 'TBD'; } })()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-serif text-sm font-bold text-neutral-100 group-hover:text-gold-500/80 transition-colors uppercase tracking-wide">{portalEvents.filter(e => !e.registered)[0].title}</p>
                                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">{portalEvents.filter(e => !e.registered)[0].location}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="border border-dashed border-neutral-900/60 rounded-xl p-5 text-center">
                          <p className="font-serif text-sm text-neutral-500">No upcoming events</p>
                          <p className="text-[10px] text-neutral-600 mt-1 font-sans">New gatherings will appear here.</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <LayoutGrid className="h-3.5 w-3.5 text-gold-500/60" />
                        <span className="font-mono text-[9px] text-gold-500/60 uppercase tracking-widest font-bold">Quick Access</span>
                        <span className="h-px flex-1 bg-neutral-900/60" />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: 'Membership', icon: Award, onClick: () => setActiveTab('Membership') },
                          { label: 'Events', icon: Calendar, onClick: () => setActiveTab('Events') },
                          { label: 'Messages', icon: MessageSquare, onClick: () => setActiveTab('Messages') },
                          { label: 'Community', icon: Users, onClick: () => setActiveTab('Community') },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button key={item.label} onClick={item.onClick}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-neutral-900 bg-neutral-950/20 hover:border-gold-500/30 hover:bg-gold-500/5 transition-all text-left group shadow-lg shadow-black/20"
                            >
                              <Icon className="h-3.5 w-3.5 text-neutral-500 group-hover:text-gold-500/60 transition-colors" />
                              <span className="font-serif text-xs font-bold text-neutral-200 group-hover:text-gold-500/80 transition-colors uppercase tracking-wide">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- NEW SECTION: Requests & Rewards glance ---- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  <button onClick={() => setShowPortalRequestWizard(true)}
                    className="group relative overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950/20 p-5 hover:border-gold-500/30 hover:bg-gold-500/[0.02] transition-all text-left shadow-lg shadow-black/20"
                  >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold-500/[0.03] rounded-full blur-[60px] pointer-events-none" />
                    <div className="relative">
                      <FileText className="h-4 w-4 text-gold-500/60 mb-2" />
                      <p className="font-serif text-sm font-bold text-neutral-200 group-hover:text-gold-500/80 transition-colors uppercase tracking-wide">Submit a Request</p>
                      <p className="text-[10px] text-neutral-500 mt-1 font-sans">Send a personal proposal to Gillian's coordination team.</p>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('Rewards')}
                    className="group relative overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950/20 p-5 hover:border-gold-500/30 hover:bg-gold-500/[0.02] transition-all text-left shadow-lg shadow-black/20"
                  >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold-500/[0.03] rounded-full blur-[60px] pointer-events-none" />
                    <div className="relative">
                      <Gift className="h-4 w-4 text-gold-500/60 mb-2" />
                      <p className="font-serif text-sm font-bold text-neutral-200 group-hover:text-gold-500/80 transition-colors uppercase tracking-wide">Loyalty Rewards</p>
                      <p className="text-[10px] text-neutral-500 mt-1 font-sans">{loyaltyPoints.toLocaleString()} points available to redeem.</p>
                    </div>
                  </button>
                </div>

              </div>
            )}

            {/* VIEW RENDERING 2: MY REQUESTS (Gateway tracking and submitting) */}
            {activeTab === 'My Requests' && (
              <div className="space-y-6 text-left">
                
                {/* Header detail or list conditional rendering */}
                {selectedRequestId === null ? (
                  showPortalRequestWizard ? (
                    /* INTEGRATED PROPOSAL WIZARD INLINE VIEW */
                    <div className="space-y-6 bg-[#0c0c0e] border border-neutral-900 rounded-xl p-6">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                        <div className="space-y-1">
                          <h2 className="font-serif text-lg font-bold tracking-wider text-white uppercase flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-gold-500 animate-pulse" />
                            Integrated Proposal Wizard
                          </h2>
                          <p className="text-xs text-neutral-500 font-mono">
                            Submit credentials directly to Gillian's administrative team.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowPortalRequestWizard(false);
                            setRequestWizardStep(1);
                          }}
                          className="text-xs text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900/50 px-3 py-1.5 rounded font-mono transition-all"
                        >
                          Cancel & Close
                        </button>
                      </div>

                      {/* Progress Tracker */}
                      <div className="grid grid-cols-3 gap-2 pb-4 border-b border-neutral-900/50">
                        {[
                          { step: 1, label: 'LOGISTICS', desc: 'Type & Contact' },
                          { step: 2, label: 'COORDINATES', desc: 'Date & Location' },
                          { step: 3, label: 'SINCERITY', desc: 'Verification' }
                        ].map((s) => (
                          <div
                            key={s.step}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              requestWizardStep === s.step
                                ? 'border-gold-500 bg-gold-500/[0.02] text-white shadow-lg shadow-gold-500/5'
                                : requestWizardStep > s.step
                                ? 'border-green-500/20 bg-green-500/[0.01] text-neutral-400'
                                : 'border-neutral-900 bg-transparent text-neutral-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-mono font-bold tracking-widest ${
                                requestWizardStep === s.step ? 'text-gold-500' : requestWizardStep > s.step ? 'text-green-500' : 'text-neutral-500'
                              }`}>
                                STEP 0{s.step}
                              </span>
                              {requestWizardStep > s.step && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                            </div>
                            <p className="text-xs font-bold font-serif tracking-wide mt-1 uppercase">{s.label}</p>
                            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">{s.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Step Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={requestWizardStep}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {requestWizardStep === 1 && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">PROPOSAL CATEGORY</label>
                                  <select
                                    value={newRequestType}
                                    onChange={(e) => setNewRequestType(e.target.value)}
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-colors text-xs"
                                  >
                                    <option value="Fan Letter">✉️ Fan Letter & Greeting</option>
                                    <option value="Ask Question">❓ Ask Philosophical Question</option>
                                    <option value="Meet & Greet">🤝 Meet & Greet Session</option>
                                    <option value="Virtual Meeting">💻 Private Virtual Video Meeting</option>
                                    <option value="Birthday Greeting">🎂 Personalized Birthday Greeting</option>
                                    <option value="Personalized Video">📹 Personalized Video Shoutout</option>
                                    <option value="Autograph Request">✒️ Signed Autograph Memorabilia</option>
                                    <option value="Interview Request">🎙️ Interview & Podcast Request</option>
                                    <option value="Business Inquiry">💼 Bespoke Business Inquiry</option>
                                    <option value="Collaboration">🌟 Charity Collaboration Proposal</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">ATTENDEE CAPACITY</label>
                                  <select
                                    value={newRequestAttendees}
                                    onChange={(e) => setNewRequestAttendees(e.target.value)}
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-colors text-xs"
                                  >
                                    <option value="1 Person">1 Person (Just Myself)</option>
                                    <option value="2 People">2 People (Me & Guest)</option>
                                    <option value="3-5 People">3-5 People (Family / Small Team)</option>
                                    <option value="Organization">Charity Delegation / Foundation Representatives</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">COMMUNICATION BRIDGE</label>
                                  <select
                                    value={newRequestContact}
                                    onChange={(e) => setNewRequestContact(e.target.value as any)}
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-colors text-xs"
                                  >
                                    <option value="Email">Secure Email Pipeline</option>
                                    <option value="WhatsApp">Direct WhatsApp Line</option>
                                    <option value="Telegram">Encrypted Telegram Channel</option>
                                    <option value="Website">Website Sanctuary ID</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">SECURE CONTACT ADDRESS/NUMBER</label>
                                  <input
                                    type="text"
                                    required
                                    value={newRequestContactVal}
                                    onChange={(e) => setNewRequestContactVal(e.target.value)}
                                    placeholder={newRequestContact === 'WhatsApp' ? '+1 (555) 123-4567' : 'fan@example.com'}
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-all text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newRequestContactVal.trim()) {
                                      showToast('Please provide your secure contact destination.', 'error');
                                      return;
                                    }
                                    setRequestWizardStep(2);
                                  }}
                                  className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-5 rounded text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                  Next Step: Coordinates
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {requestWizardStep === 2 && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">PROPOSED DATE RANGE</label>
                                  <input
                                    type="text"
                                    required
                                    value={newRequestDate}
                                    onChange={(e) => setNewRequestDate(e.target.value)}
                                    placeholder="e.g. July 15-20, 2026 or Immediate"
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-all text-xs"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">PHYSICAL OR VIRTUAL LOCATION</label>
                                  <input
                                    type="text"
                                    required
                                    value={newRequestLocation}
                                    onChange={(e) => setNewRequestLocation(e.target.value)}
                                    placeholder="e.g. Los Angeles, CA or Zoom / Virtual"
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 transition-all text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => setRequestWizardStep(1)}
                                  className="border border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-bold py-2 px-5 rounded text-xs tracking-wider uppercase transition-all"
                                >
                                  Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newRequestDate.trim()) {
                                      showToast('Please provide Preferred Date range.', 'error');
                                      return;
                                    }
                                    if (!newRequestLocation.trim()) {
                                      showToast('Please specify a Physical or Virtual Location.', 'error');
                                      return;
                                    }
                                    setRequestWizardStep(3);
                                  }}
                                  className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-5 rounded text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                  Next Step: Sincerity
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {requestWizardStep === 3 && (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">SINCERITY AND OBJECTIVE NARRATIVE</label>
                                <textarea
                                  required
                                  rows={4}
                                  value={newRequestSincerity}
                                  onChange={(e) => setNewRequestSincerity(e.target.value)}
                                  placeholder="Provide a detailed explanation of why this proposal is important to you or your charity foundation. This acts as our primary integrity benchmark."
                                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed text-xs"
                                />
                                <div className="flex justify-end mt-1.5">
                                  <button
                                    type="button"
                                    disabled={isPolishing || !newRequestSincerity.trim()}
                                    onClick={async () => {
                                      setIsPolishing(true);
                                      try {
                                        const res = await polishSincerity(newRequestSincerity);
                                        setNewRequestSincerity(res.text);
                                        showToast('Sincerity statement polished with Google Gemini AI!', 'success');
                                      } catch (err) {
                                        console.error(err);
                                        showToast('Failed to polish text with Gemini API.', 'error');
                                      } finally {
                                        setIsPolishing(false);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold text-gold-500 bg-gold-500/5 hover:bg-gold-500/10 border border-gold-500/20 rounded transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                  >
                                    {isPolishing ? (
                                      <>
                                        <span className="h-2 w-2 animate-spin rounded-full border-b border-gold-500" />
                                        Musing...
                                      </>
                                    ) : (
                                      <>
                                        <span>✨ Polish with Gillian's AI Muse (Gemini API)</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Attestation Checkbox */}
                              <div className="p-3.5 rounded-lg border border-neutral-900/80 bg-neutral-950/40 flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  required
                                  id="attest_wizard_inline"
                                  className="mt-0.5 accent-gold-500 h-3.5 w-3.5 rounded border-neutral-800 bg-neutral-900"
                                />
                                <label htmlFor="attest_wizard_inline" className="text-[10px] text-neutral-400 leading-snug cursor-pointer select-none text-left">
                                  I hereby certify that this proposal is submitted with complete sincerity, respect, and adherence to the guidelines of Gillian Anderson's quiet private administration. I understand any false credentials will trigger immediate bridge deactivation.
                                </label>
                              </div>

                              <div className="flex justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => setRequestWizardStep(2)}
                                  className="border border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-bold py-2 px-5 rounded text-xs tracking-wider uppercase transition-all"
                                >
                                  Back
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const attestBox = document.getElementById('attest_wizard_inline') as HTMLInputElement | null;
                                    if (!newRequestSincerity.trim()) {
                                      showToast('Please provide your Sincerity Narrative.', 'error');
                                      return;
                                    }
                                    if (attestBox && !attestBox.checked) {
                                      showToast('Please attest sincerity to proceed.', 'error');
                                      return;
                                    }
                                    handlePortalSubmitRequest(e);
                                  }}
                                  className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-6 rounded text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                  Submit Official Proposal
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  ) : (
                    /* PROPOSALS LIST VIEW */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                        <div className="space-y-1">
                          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                            Official Proposal Hub
                          </h2>
                          <p className="text-xs text-neutral-500 font-mono">
                            Track your submitted requests under the Universal Request Flow in real-time.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPortalRequestWizard(true)}
                          className="flex items-center gap-1 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-4 rounded text-xs tracking-wider transition-all uppercase active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          Submit New Proposal
                        </button>
                      </div>

                      {/* Table grid listing requests */}
                      <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[9px] uppercase">
                                <th className="px-5 py-3 font-semibold">Proposal ID</th>
                                <th className="px-4 py-3 font-semibold">Request Type</th>
                                <th className="px-4 py-3 font-semibold">Location</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Submitted Date</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-900/40 text-xs">
                              {userRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-neutral-950/30 transition-all">
                                  <td className="px-5 py-3.5 font-mono font-semibold text-neutral-300">
                                    {req.id}
                                  </td>
                                  <td className="px-4 py-3.5 font-bold text-white">
                                    {req.type}
                                  </td>
                                  <td className="px-4 py-3.5 text-neutral-400 font-mono">
                                    {req.location}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                      req.status === 'In Discussion' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                      req.status === 'Submitted' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                      req.status === 'Under Review' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                      req.status === 'Offer Made' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                      req.status === 'Payment Requested' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                                      'bg-green-500/10 text-green-500 border border-green-500/20'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-neutral-500 font-mono">
                                    {req.submittedOn}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      onClick={() => setSelectedRequestId(req.id)}
                                      className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 rounded hover:text-white transition-colors"
                                    >
                                      Track Workspace
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  
                  /* INDIVIDUAL EXPANDED REQUEST WORKSPACE */
                  (() => {
                    const req = userRequests.find(r => r.id === selectedRequestId);
                    if (!req) return null;
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                          <button
                            onClick={() => setSelectedRequestId(null)}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-gold-500 font-mono"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to proposals list
                          </button>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">
                            WORKSPACE: {req.id}
                          </span>
                        </div>

                        {/* Top Summary Card */}
                        <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl text-gold-500 font-serif">
                              KR
                            </div>
                            <div className="space-y-1">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[8px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                                {req.type.toUpperCase()}
                              </span>
                              <h3 className="text-base font-semibold text-white tracking-wide">{req.type} Tracking</h3>
                              <p className="text-[10px] font-mono text-neutral-500 leading-none">Submitted On: {req.submittedOn}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono text-neutral-400">Status:</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-500 uppercase leading-none">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {/* Subtabs selection */}
                        <div className="flex items-center border-b border-neutral-900 gap-1 pb-px overflow-x-auto">
                          {['TIMELINE', 'DETAILS', 'MESSAGES', 'DOCUMENTS'].map((subT) => (
                            <button
                              key={subT}
                              onClick={() => setActiveSubTab(subT as any)}
                              className={`px-4 py-2 text-xs font-bold font-mono tracking-wider transition-all border-b-2 uppercase ${
                                activeSubTab === subT ? 'border-gold-500 text-gold-500' : 'border-transparent text-neutral-500 hover:text-white'
                              }`}
                            >
                              {subT}
                            </button>
                          ))}
                        </div>

                        {/* Content render based on subtab */}
                        <div className="min-h-[200px]">
                          {activeSubTab === 'TIMELINE' && (
                            <div className="space-y-6">
                              {/* 1. STAGE PROGRESS TRACKER */}
                              <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4 text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-900/60 gap-2">
                                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-gold-500 animate-pulse" />
                                    Proposal Lifecycle Stage Controller
                                  </h4>
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                    Click any stage to update the status in real-time
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                  {['Submitted', 'Under Review', 'In Discussion', 'Offer Made', 'Payment Requested', 'Approved'].map((stg) => {
                                    const isActive = req.status === stg;
                                    return (
                                      <button
                                        key={stg}
                                        type="button"
                                        onClick={() => handleUpdateReqStatus(req.id, stg)}
                                        className={`px-2 py-3 rounded-lg border text-center transition-all ${
                                          isActive
                                            ? 'border-gold-500 bg-gold-500/[0.04] text-gold-500 shadow-sm shadow-gold-500/10 scale-[1.02] font-semibold'
                                            : 'border-neutral-900 bg-neutral-900/30 text-neutral-500 hover:border-neutral-800 hover:text-neutral-300'
                                        }`}
                                      >
                                        <p className="text-[8px] font-mono leading-none tracking-widest uppercase mb-1">STAGE</p>
                                        <p className="text-[10px] font-serif truncate uppercase tracking-wider">{stg}</p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2. CHRONOLOGICAL FEED */}
                              <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-6 text-left">
                                <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-neutral-500" />
                                    Ticket Comment & System Activity Timeline
                                  </h4>
                                  <span className="text-[9px] font-mono text-neutral-500 uppercase">Chronological Log</span>
                                </div>

                                <div className="relative pl-6 border-l border-neutral-900/80 space-y-6 mt-4">
                                  {/* Base Submission Event */}
                                  <div className="relative">
                                    <span className="absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full bg-green-500 border-4 border-[#070709]" />
                                    <div className="space-y-1">
                                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                        <span>Proposal Formally Submitted</span>
                                        <span className="text-[8px] font-mono font-bold uppercase text-green-500 bg-green-500/10 px-1 py-0.5 rounded border border-green-500/20">GATEWAY VERIFIED</span>
                                      </h5>
                                      <p className="text-[10px] text-neutral-500 font-mono">{req.submittedOn}</p>
                                      <p className="text-xs text-neutral-400 leading-relaxed">
                                        Successfully securely logged into the gateway database queue with default integrity parameters cleared.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Dynamic Chat & System Events */}
                                  {(proposalChats[req.id] || []).map((msg, index) => {
                                    if (msg.sender === 'system') {
                                      return (
                                        <div key={msg.id || index} className="relative py-1">
                                          <span className="absolute -left-[28.5px] top-2 h-3 w-3 rounded-full bg-amber-500/30 border-2 border-amber-500" />
                                          <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 bg-amber-500/5 px-3 py-1.5 border border-amber-500/10 rounded-md">
                                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                                            <span className="font-semibold">{msg.text}</span>
                                            <span className="text-neutral-600 ml-auto">{msg.timestamp}</span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    const isMgt = msg.sender === 'management';
                                    return (
                                      <div key={msg.id || index} className="relative">
                                        <span className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-4 border-[#070709] ${
                                          isMgt ? 'bg-gold-500' : 'bg-neutral-500'
                                        }`} />
                                        
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <h5 className={`text-xs font-bold ${isMgt ? 'text-gold-500 font-serif' : 'text-neutral-200'}`}>
                                              {isMgt ? 'Sarah (Liaison Coordinator)' : `${req.member || 'John Smith'} (Proposal Author)`}
                                            </h5>
                                            <span className="text-[9px] text-neutral-600 font-mono">{msg.timestamp}</span>
                                          </div>
                                          
                                          <div className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[90%] border ${
                                            isMgt 
                                              ? 'bg-neutral-900/60 border-gold-950/20 text-neutral-200' 
                                              : 'bg-[#0c0c0e] border-neutral-900/70 text-neutral-300'
                                          }`}>
                                            {msg.text}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 3. INTERACTIVE COMMENT & ACTION CONSOLE */}
                              <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4 text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-1">
                                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <MessageSquare className="h-4 w-4 text-gold-500" />
                                    Post Ticket Comment & Dispatch Action
                                  </h4>
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    Reactive Status Modification Engine
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  <textarea
                                    value={timelineCommentText}
                                    onChange={(e) => setTimelineCommentText(e.target.value)}
                                    placeholder="Type a support log, provide coordinates, ask Sarah a question, or leave feedback..."
                                    rows={3}
                                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-700 outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                                  />

                                  {/* Quick Actions & Send Bar */}
                                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
                                    {/* Quick Actions Deck */}
                                    <div className="flex flex-wrap gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text = "Hi Sarah, I am writing to provide additional charity credentials for immediate verification review.";
                                          setTimelineCommentText(text);
                                        }}
                                        className="px-2.5 py-1.5 border border-neutral-900 hover:border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-[10px] font-mono text-neutral-400 hover:text-white rounded transition-colors uppercase"
                                      >
                                        Verify credentials
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text = "Hi Sarah, our team is happy to accept the coordination offer parameters and confirm scheduled dates.";
                                          setTimelineCommentText(text);
                                        }}
                                        className="px-2.5 py-1.5 border border-neutral-900 hover:border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-[10px] font-mono text-neutral-400 hover:text-white rounded transition-colors uppercase"
                                      >
                                        Accept Offer
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text = "Thank you so much! This has been successfully resolved and perfectly organized.";
                                          setTimelineCommentText(text);
                                        }}
                                        className="px-2.5 py-1.5 border border-neutral-900 hover:border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-[10px] font-mono text-neutral-400 hover:text-white rounded transition-colors uppercase"
                                      >
                                        Resolve Ticket
                                      </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        type="button"
                                        disabled={!timelineCommentText.trim()}
                                        onClick={() => handleAddTimelineComment(req.id, timelineCommentText)}
                                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[11px] font-mono font-bold text-neutral-300 hover:text-white rounded transition-colors uppercase disabled:opacity-40"
                                      >
                                        Post Comment
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!timelineCommentText.trim()}
                                        onClick={() => handleAddTimelineComment(req.id, timelineCommentText, 'Approved')}
                                        className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 disabled:opacity-40"
                                      >
                                        <Send className="h-3.5 w-3.5" />
                                        Post & Resolve
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubTab === 'DETAILS' && (
                            <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4">
                              <h4 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-900">
                                Detailed Request Logistics Parameters
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Selected Request Type</span>
                                  <p className="text-white font-semibold text-sm mt-0.5">{req.type}</p>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Proposed Location</span>
                                  <p className="text-white font-semibold text-sm mt-0.5">{req.location}</p>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Preferred date / interval</span>
                                  <p className="text-white font-semibold text-sm mt-0.5">{req.preferredDate}</p>
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Attendees Count</span>
                                  <p className="text-white font-semibold text-sm mt-0.5">{req.attendees}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Communication Channel Details</span>
                                  <p className="text-gold-500 font-semibold font-mono text-sm mt-0.5">{req.whatsappNumber}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase block">Sincerity Statement / Why it matters</span>
                                  <p className="text-neutral-300 italic font-serif text-sm mt-0.5 leading-relaxed">"{req.sincerity}"</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubTab === 'MESSAGES' && (
                            <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex flex-col h-[350px]">
                              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 text-xs">
                                {(proposalChats[req.id] || []).map((msg) => (
                                  <div key={msg.id} className={`flex gap-3 text-left ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono font-medium text-[9px] ${
                                      msg.sender === 'user' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-950 border-gold-800/35 text-gold-500'
                                    }`}>
                                      {msg.sender === 'user' ? 'JS' : 'MGT'}
                                    </div>
                                    <div className="max-w-[75%] space-y-1">
                                      <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                        msg.sender === 'user' ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-200'
                                      }`}>
                                        {msg.text}
                                      </div>
                                      <p className="text-[9px] text-neutral-600 font-mono">{msg.timestamp}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!newProposalMsg.trim()) return;
                                  const userText = newProposalMsg.trim();
                                  const timestamp = new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                                  const userMsg = { id: `pmsg-${Date.now()}`, sender: 'user' as const, text: userText, timestamp };
                                  
                                  setProposalChats(prev => ({
                                    ...prev,
                                    [req.id]: [...(prev[req.id] || []), userMsg]
                                  }));
                                  setNewProposalMsg('');

                                  try {
                                    await fetch(`/api/requests/${req.id}/chat`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ sender: 'user', text: userText })
                                    });
                                  } catch {}
                                }}
                                className="flex gap-2 border-t border-neutral-900 pt-3"
                              >
                                <input
                                  type="text"
                                  value={newProposalMsg}
                                  onChange={(e) => setNewProposalMsg(e.target.value)}
                                  placeholder="Type a supportive message to Sarah (Management)..."
                                  className="flex-1 rounded border border-neutral-900 bg-neutral-950 px-4 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-gold-500/40"
                                />
                                <button type="submit" disabled={!newProposalMsg.trim()} className="h-9 w-9 flex items-center justify-center rounded bg-gold-500 text-neutral-950 hover:bg-gold-400 active:scale-95 disabled:opacity-50 transition-all">
                                  <Send className="h-4 w-4" />
                                </button>
                              </form>
                            </div>
                          )}

                          {activeSubTab === 'DOCUMENTS' && (
                            <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-3">
                              <h4 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-900">
                                Management Issued Coordination Guidelines
                              </h4>
                              <p className="text-[10px] text-neutral-500 font-mono">No documents available yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* VIEW RENDERING 3: EVENTS (Digital ticketing system) */}
            {activeTab === 'Events' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Official Community Events
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Participate in live group Q&As, virtual panels, or request charity dinner tickets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portalEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`rounded-xl border p-5 space-y-4 bg-neutral-950/40 relative overflow-hidden flex flex-col justify-between ${
                        ev.registered ? 'border-gold-500/30 bg-gradient-to-b from-gold-500/[0.01] to-transparent' : 'border-neutral-900'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20">
                            {ev.type}
                          </span>
                          {ev.registered && (
                            <span className="text-[10px] text-gold-500 font-mono font-bold flex items-center gap-1 uppercase">
                              <Ticket className="h-3.5 w-3.5" /> Registered
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-base font-bold text-white tracking-wide">{ev.title}</h3>
                        
                        <div className="space-y-1 text-xs text-neutral-400 font-mono pt-2">
                          <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.date}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.location}</p>
                        </div>
                      </div>

                      {ev.registered ? (
                        <div className="border-t border-neutral-900 pt-3.5 mt-3 space-y-3.5">
                          {/* Ticket pass block */}
                          <div className="rounded border border-neutral-900 bg-neutral-950 p-3 flex justify-between items-center gap-3">
                            <div className="text-left space-y-1 font-mono text-[10px]">
                              <p className="text-neutral-500">TICKET REFERENCE</p>
                              <p className="text-white font-bold">{ev.ticketRef}</p>
                              <p className="text-gold-500 font-semibold mt-1">✓ ACCESS GRANTED</p>
                            </div>
                            
                            {/* QR placeholder */}
                            <div className="h-12 w-12 bg-white border border-neutral-800 rounded p-1 shrink-0 flex items-center justify-center">
                              <div className="grid grid-cols-5 gap-0.5">
                                {[...Array(25)].map((_, i) => (
                                  <div key={i} className={`h-1.5 w-1.5 ${[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) ? 'bg-black' : 'bg-transparent'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button onClick={() => showToast('Reminder successfully scheduled for your Calendar!', 'success')} className="flex-1 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-[10px] font-mono text-neutral-300 hover:text-white rounded transition-colors text-center">
                              Add Reminder
                            </button>
                            <button onClick={() => showToast('Downloading digital entry pass PDF...', 'info')} className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegisterEvent(ev.id)}
                          className="w-full mt-4 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs transition-all uppercase tracking-wider active:scale-95 text-center block"
                        >
                          Request Event Registration Pass
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW RENDERING 4: MEMBERSHIP (Status-aware dashboard) */}
            {activeTab === 'Membership' && (
              <MyMembershipDashboard userId={user?.id} authName={authName} rank={rank} progressPercent={progressPercent} content={backendContent} />
            )}

            {/* VIEW RENDERING 5: ORDERS (Exclusive Merchandise requests tracker) */}
            {activeTab === 'Orders' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Your Shop Order Applications
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Track the fulfillment logs or request limited-run official collectibles.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left Column: Active Order Logs */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-900/40">
                      Active Requests & Fulfillment Log
                    </h3>
                    
                    {orders.length === 0 ? (
                      <div className="rounded-xl border border-neutral-900 p-8 text-center text-neutral-500 text-xs">
                        No merchandise order applications found. Use the catalog to apply for items.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                        {orders.map((ord) => (
                          <div key={ord.id} className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded bg-neutral-900 text-gold-500 flex items-center justify-center text-xl shrink-0">
                                📦
                              </div>
                              <div className="space-y-1 text-left">
                                <p className="font-bold text-white text-sm leading-tight">{ord.item}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">Reference ID: {ord.id} • Price: <span className="text-gold-500 font-medium">${ord.price}</span></p>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gold-500/10 border border-gold-500/20 text-xs font-mono font-bold text-gold-500 uppercase">
                                {ord.status}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono font-bold">Ordered: {ord.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Order Collectibles directly inside Portal */}
                  <div className="md:col-span-5 space-y-6">
                    {/* Dynamic Shopping Cart Component */}
                    <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4.5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-900/40">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-gold-500" />
                          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                            Active Shopping Cart
                          </h3>
                        </div>
                        <span className="text-[10px] bg-gold-500 text-neutral-950 px-2 py-0.5 rounded-full font-bold font-mono">
                          {cart.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                        </span>
                      </div>

                      {cart.length === 0 ? (
                        <p className="text-[11px] text-neutral-500 text-center py-4">Your sanctuary shopping cart is empty.</p>
                      ) : (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {cart.map((item) => (
                              <div key={item.id} className="flex justify-between items-center bg-neutral-900/30 p-2 rounded border border-neutral-900">
                                <div className="space-y-0.5 text-left">
                                  <p className="font-semibold text-white">{item.item}</p>
                                  <p className="text-[10px] text-neutral-500 font-mono">
                                    ${item.price} x {item.quantity}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromCart(item.id)}
                                  className="text-red-500 hover:text-red-400 font-bold px-1.5 py-1 text-[10px] font-mono uppercase"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-neutral-900 space-y-3">
                            <div className="flex justify-between items-center font-mono text-xs">
                              <span className="text-neutral-400">ESTIMATED TOTAL:</span>
                              <span className="text-gold-500 font-bold">
                                ${cart.reduce((acc, curr) => acc + parseFloat(curr.price) * curr.quantity, 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Payment Credentials Input */}
                            <form onSubmit={handleCheckout} className="space-y-2">
                              <div className="flex gap-2 pb-1 border-b border-neutral-900">
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('card')}
                                  className={`flex-1 py-1 rounded text-[9px] font-mono border uppercase font-bold transition-all ${
                                    paymentMethod === 'card'
                                      ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                                      : 'bg-neutral-950 border-neutral-900 text-neutral-500'
                                  }`}
                                >
                                  Sanctuary Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('crypto')}
                                  className={`flex-1 py-1 rounded text-[9px] font-mono border uppercase font-bold transition-all ${
                                    paymentMethod === 'crypto'
                                      ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                                      : 'bg-neutral-950 border-neutral-900 text-neutral-500'
                                  }`}
                                >
                                  Crypto Wallet
                                </button>
                              </div>

                              {paymentMethod === 'card' ? (
                                <div className="space-y-1 text-left">
                                  <label className="text-[8px] font-mono text-neutral-500 uppercase">SANCTUARY DEBIT KEY</label>
                                  <input
                                    type="text"
                                    required
                                    maxLength={19}
                                    value={checkoutCardNumber}
                                    onChange={(e) => setCheckoutCardNumber(e.target.value)}
                                    placeholder="4111 2222 3333 4444"
                                    className="w-full rounded border border-neutral-900 bg-[#0c0c0e] px-2.5 py-1.5 text-xs text-white placeholder-neutral-700 outline-none focus:border-gold-500/40"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1 text-left">
                                  <label className="text-[8px] font-mono text-neutral-500 uppercase">SOLANA/ETH VAULT COORDINATES</label>
                                  <input
                                    type="text"
                                    required
                                    value={checkoutCryptoWallet}
                                    onChange={(e) => setCheckoutCryptoWallet(e.target.value)}
                                    placeholder="0x71C...39ab"
                                    className="w-full rounded border border-neutral-900 bg-[#0c0c0e] px-2.5 py-1.5 text-xs text-white placeholder-neutral-700 outline-none focus:border-gold-500/40"
                                  />
                                </div>
                              )}

                              <button
                                type="submit"
                                className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-1.5 rounded text-[10px] tracking-wider transition-colors uppercase font-mono"
                              >
                                Authorize Purchase
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4.5 space-y-4">
                      <h3 className="text-xs font-mono font-bold text-gold-500 uppercase tracking-widest pb-1 border-b border-neutral-900/40">
                        Private Collector Catalogue
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Gold level verified access grants you clearance to apply for custom, highly limited physical replicas and official garments.
                      </p>

                      <div className="space-y-3.5 pt-2">
                        {storeItems.map((item) => (
                          <div key={item.id} className="p-3 border border-neutral-900/60 rounded bg-neutral-900/20 text-xs text-left space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white pr-2 leading-tight">{item.item}</h4>
                              <span className="text-gold-500 font-mono font-bold shrink-0">${item.price}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-normal">{item.desc}</p>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-gold-500 hover:text-white font-mono font-bold py-1.5 rounded text-[10px] transition-colors uppercase tracking-wider"
                            >
                              Add To Cart 🛒
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW RENDERING 6: COMMUNITY (Country Clubs and Fan Creativity) */}
            {activeTab === 'Community' && (
              <div className="space-y-6 text-left">
                
                {/* Switcher tabs for Forums / Country Clubs vs Fan Creativity */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                      Official Sanctuary Forums
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      Connect with localized Country Clubs and share fan-authored content.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-1.5 px-4 rounded text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    <Upload className="h-4 w-4" /> Share Fan Work
                  </button>
                </div>

                {/* Country clubs selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                    LOCALIZED COUNTRY CLUBS
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

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left: Club Discussion logs */}
                  <div className="md:col-span-7 rounded-xl border border-neutral-900 bg-neutral-950 p-4.5 space-y-4 flex flex-col justify-between min-h-[500px]">
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Active {activeCountryClub} Board Discussions
                      </h3>

                      {/* Discussions logs list */}
                      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                        {(clubDiscussions[activeCountryClub] || []).length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                            No active discussions on this board yet. Post the first message!
                          </div>
                        ) : (
                          (clubDiscussions[activeCountryClub] || []).map((disc) => (
                            <div key={disc.id || `disc-${Math.random()}`} className="p-3.5 rounded-xl border border-neutral-900/60 bg-neutral-900/10 text-xs text-left space-y-3">
                              {/* OP Header */}
                              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                <span className="text-gold-500 font-bold flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-neutral-600" /> {disc.author}
                                </span>
                                <span>{disc.time}</span>
                              </div>
                              {/* OP Text */}
                              <p className="text-neutral-200 leading-relaxed font-sans text-xs">{disc.text}</p>

                              {/* Nested Replies Thread */}
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

                              {/* Inline Thread Reply Input Form */}
                              <form
                                onSubmit={(e) => handleAddReply(disc.id, e)}
                                className="flex gap-2 pt-2 border-t border-neutral-900/30"
                              >
                                <input
                                  type="text"
                                  value={replyInputs[disc.id] || ''}
                                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [disc.id]: e.target.value }))}
                                  placeholder="Reply to this thread..."
                                  className="flex-1 rounded bg-[#0c0c0e] border border-neutral-900/80 px-3 py-1.5 text-[11px] text-white placeholder-neutral-600 outline-none focus:border-gold-500/30"
                                />
                                <button
                                  type="submit"
                                  disabled={!(replyInputs[disc.id] || '').trim()}
                                  className="px-3 bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-medium text-gold-500 hover:text-white rounded disabled:opacity-50 transition-colors uppercase"
                                >
                                  Reply
                                </button>
                              </form>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Create New Discussion Thread */}
                    <form onSubmit={handleAddDiscussion} className="flex gap-2 border-t border-neutral-900 pt-3 mt-4">
                      <input
                        type="text"
                        value={newDiscussionText}
                        onChange={(e) => setNewDiscussionText(e.target.value)}
                        placeholder={`Start a new discussion thread in the ${activeCountryClub} club board...`}
                        className="flex-1 rounded border border-neutral-900 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-gold-500/40"
                      />
                      <button type="submit" disabled={!newDiscussionText.trim()} className="px-4 bg-gold-500 text-neutral-950 hover:bg-gold-400 disabled:opacity-50 font-bold rounded text-xs transition-all uppercase font-mono">
                        Create Thread
                      </button>
                    </form>
                  </div>

                  {/* Right: Fan Creativity highlights */}
                  <div className="md:col-span-5 rounded-xl border border-neutral-900 bg-neutral-950 p-4.5 space-y-4 text-left">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Fan Creative Showcases
                    </h3>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {creations.map((item) => (
                        <div key={item.id} className="p-3 border border-neutral-900/50 rounded bg-neutral-900/10 space-y-2 text-xs">
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
                          <p className="text-[9px] font-mono text-neutral-500">Shared by: <span className="text-neutral-400">{item.author}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW RENDERING 7: MESSAGES */}
            {activeTab === 'Messages' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Direct Liaison Support Chat
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Direct secure line to Sarah from Gillian's coordination staff.
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 flex flex-col h-[450px]">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 text-xs">
                    {channelMessages.management.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 text-left ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono font-medium text-[9px] ${
                          msg.sender === 'user' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-950 border-gold-800/35 text-gold-500'
                        }`}>
                          {msg.sender === 'user' ? 'JS' : 'MGT'}
                        </div>
                        <div className="max-w-[75%] space-y-1">
                          <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.sender === 'user' ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-200'
                          }`}>
                            {msg.text}
                          </div>
                          <p className="text-[9px] text-neutral-600 font-mono">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-neutral-900 pt-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message to Sarah..."
                      className="flex-1 rounded border border-neutral-900 bg-neutral-950 px-4 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-gold-500/40"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="h-9 w-9 flex items-center justify-center rounded bg-gold-500 text-neutral-950 hover:bg-gold-400 active:scale-95 disabled:opacity-50 transition-all">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW RENDERING 8: PROFILE */}
            {activeTab === 'Profile' && (
              <ProfileSection
                authName={authName}
                authEmail={authEmail}
                authCountry={authCountry}
                onAuthNameChange={setAuthName}
                onAuthCountryChange={setAuthCountry}
                rank={rank}
                progressPercent={progressPercent}
                loyaltyPoints={loyaltyPoints}
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
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{log.date}</p>
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
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
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
                          notif.unread
                            ? 'border-gold-500/30 bg-gold-500/[0.01]'
                            : 'border-neutral-900 bg-neutral-950/40'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-white font-medium leading-normal">{notif.text}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[9px] font-mono text-neutral-500">{notif.time}</p>
                            {notif.unread && (
                              <button
                                onClick={() => {
                                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                                  showToast('Notification marked as read.', 'info');
                                }}
                                className="text-[9px] font-mono text-gold-500/70 hover:text-gold-500 cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {notif.unread && (
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

      {/* FOOTER BAR */}
      <footer className="border-t border-white/[0.03] bg-[#070709] py-5 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] font-mono text-white/20">
          <span>&copy; 2026 Gillian Anderson Co-op. All rights reserved.</span>
          <div className="flex gap-5">
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-gold-500/60 transition-colors bg-transparent border-none cursor-pointer">Terms</button>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-gold-500/60 transition-colors bg-transparent border-none cursor-pointer">Privacy</button>
          </div>
        </div>
      </footer>

      {/* DYNAMIC PORTAL REQUEST WIZARD */}
      <AnimatePresence>
        {showPortalRequestWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPortalRequestWizard(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950 p-6.5 shadow-2xl z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-serif text-base tracking-wider text-gold-500 uppercase">
                Submit Official Proposal
              </h3>

              <form onSubmit={handlePortalSubmitRequest} className="space-y-4 text-xs">
                {/* Wizard Steps Indicator */}
                <div className="flex items-center justify-between font-mono text-[9px] text-neutral-500 pb-3 border-b border-neutral-900 mb-4">
                  <span className={requestWizardStep === 1 ? 'text-gold-500 font-bold' : ''}>1. PROFILE</span>
                  <span className="h-px bg-neutral-900 flex-1 mx-3" />
                  <span className={requestWizardStep === 2 ? 'text-gold-500 font-bold' : ''}>2. COORDINATES</span>
                  <span className="h-px bg-neutral-900 flex-1 mx-3" />
                  <span className={requestWizardStep === 3 ? 'text-gold-500 font-bold' : ''}>3. SINCERITY</span>
                </div>

                {requestWizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">PROPOSAL TYPE</label>
                        <select
                          value={newRequestType}
                          onChange={(e) => setNewRequestType(e.target.value)}
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        >
                          <option value="Fan Letter">Fan Letter</option>
                          <option value="Ask Question">Ask Question</option>
                          <option value="Meet & Greet">Meet & Greet</option>
                          <option value="Virtual Meeting">Virtual Meeting</option>
                          <option value="Birthday Greeting">Birthday Greeting</option>
                          <option value="Personalized Video">Personalized Video</option>
                          <option value="Autograph Request">Autograph Request</option>
                          <option value="Interview Request">Interview Request</option>
                          <option value="Business Inquiry">Business Inquiry</option>
                          <option value="Collaboration">Collaboration</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">ATTENDEES COUNT</label>
                        <select
                          value={newRequestAttendees}
                          onChange={(e) => setNewRequestAttendees(e.target.value)}
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        >
                          <option value="1 Person">1 Person (Just Me)</option>
                          <option value="2 People">2 People</option>
                          <option value="3-5 People">3-5 People</option>
                          <option value="Organization">Charity Delegation</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">CONTACT METHOD</label>
                        <select
                          value={newRequestContact}
                          onChange={(e) => setNewRequestContact(e.target.value as any)}
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        >
                          <option value="Email">Email</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Telegram">Telegram</option>
                          <option value="Website">Website Sanctuary ID</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">CONTACT VALUE</label>
                        <input
                          type="text"
                          required
                          value={newRequestContactVal}
                          onChange={(e) => setNewRequestContactVal(e.target.value)}
                          placeholder={newRequestContact === 'WhatsApp' ? '+1 (555) 000-0000' : 'john@example.com'}
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRequestContactVal.trim()) {
                            showToast('Please provide your contact method value.', 'error');
                            return;
                          }
                          setRequestWizardStep(2);
                        }}
                        className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-6 rounded text-xs uppercase transition-all"
                      >
                        Next Step: Coordinates
                      </button>
                    </div>
                  </div>
                )}

                {requestWizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">PREFERRED DATE RANGE</label>
                        <input
                          type="text"
                          required
                          value={newRequestDate}
                          onChange={(e) => setNewRequestDate(e.target.value)}
                          placeholder="e.g. July 12th-15th, 2024"
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase">LOCATION (CITY, COUNTRY)</label>
                        <input
                          type="text"
                          required
                          value={newRequestLocation}
                          onChange={(e) => setNewRequestLocation(e.target.value)}
                          placeholder="e.g. Toronto, Canada"
                          className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setRequestWizardStep(1)}
                        className="border border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-bold py-2 px-5 rounded text-xs uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRequestDate.trim() || !newRequestLocation.trim()) {
                            showToast('Please provide Preferred Date and Location.', 'error');
                            return;
                          }
                          setRequestWizardStep(3);
                        }}
                        className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-6 rounded text-xs uppercase transition-all"
                      >
                        Next Step: Sincerity
                      </button>
                    </div>
                  </div>
                )}

                {requestWizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-400 uppercase">WHY DOES THIS MATTER TO YOU?</label>
                      <textarea
                        required
                        rows={3}
                        value={newRequestSincerity}
                        onChange={(e) => setNewRequestSincerity(e.target.value)}
                        placeholder="Share your sincere story. Integrity is our primary benchmark..."
                        className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setRequestWizardStep(2)}
                        className="border border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-bold py-2 px-5 rounded text-xs uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-6 rounded text-xs uppercase transition-all"
                      >
                        Authorize and Submit Proposal
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                Request Membership Upgrade
              </h3>

              <form onSubmit={handlePortalMembershipRequest} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase">DESIRED TIER</label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value)}
                    className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                  >
                    <option value="silver">Silver Guardian ($5/mo dues)</option>
                    <option value="gold">Gold Ambassador ($15/mo dues)</option>
                    <option value="platinum">Platinum Visionary ($50/mo dues)</option>
                    <option value="legend">Legend Patron ($100/mo dues)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase">PREFERRED CONTACT METHOD</label>
                    <select
                      value={mContact}
                      onChange={(e) => setMContact(e.target.value as any)}
                      className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                    >
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telegram">Telegram</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase">CONTACT INFO</label>
                    <input
                      type="text"
                      required
                      value={mContactVal}
                      onChange={(e) => setMContactVal(e.target.value)}
                      placeholder={mContact === 'WhatsApp' ? '+1 (555) 000-0000' : 'john@example.com'}
                      className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase">WHY DO YOU WISH TO UPGRADE?</label>
                  <textarea
                    required
                    rows={3}
                    value={mReason}
                    onChange={(e) => setMReason(e.target.value)}
                    placeholder="Provide your sincerity coordinates. Dues paid support youth transitions and mentorship programs."
                    className="w-full rounded border border-neutral-900 bg-neutral-900/50 px-3 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs tracking-wider transition-colors uppercase"
                >
                  Submit Upgrade Request Application
                </button>
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

      {/* COMMUNICATION BRIDGE DISPATCH MODAL */}
      <AnimatePresence>
        {showDispatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDispatchModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-[#070709] p-6 text-left shadow-2xl shadow-gold-500/5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-500 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 animate-pulse text-gold-500" />
                    Secure Communication Bridge
                  </span>
                  <h3 className="text-base font-serif font-bold text-white uppercase tracking-wide">
                    Dispatching {dispatchMethod} Notification
                  </h3>
                </div>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="rounded-full border border-neutral-900 bg-neutral-950 p-1.5 text-neutral-500 hover:text-white hover:border-neutral-800 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="py-5 space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  To complete your submission, please send the pre-filled authentication text directly to the sanctuary administrators. This guarantees direct coordination tracking and immediate security validation.
                </p>

                {/* Pre-filled message text area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase">
                    <span>Pre-filled Notification Text</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dispatchMessage);
                        setIsCopiedDispatch(true);
                        setTimeout(() => setIsCopiedDispatch(false), 2000);
                      }}
                      className="flex items-center gap-1 hover:text-gold-500 transition-colors"
                    >
                      {isCopiedDispatch ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-gold-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="w-full rounded border border-neutral-900 bg-[#0a0a0c] p-3 text-[11px] font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto border-l-2 border-l-gold-500">
                    {dispatchMessage}
                  </div>
                </div>

                {/* Bridge Info */}
                <div className="p-3 bg-gold-500/[0.02] border border-gold-500/10 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="h-4.5 w-4.5 text-gold-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gold-500">Security Liaison Dispatch</h4>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      The admin will receive your dispatch details. They will then assess date feasibility, log credentials, and continually update progress on the administrative side so that your entire coordination lifecycle is securely tracked.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-neutral-900 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 border border-neutral-900 hover:border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white rounded-lg transition-colors uppercase font-mono"
                >
                  Skip to Tracker
                </button>
                <a
                  href={dispatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-5 py-2 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-neutral-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide active:scale-95 shadow-lg shadow-gold-500/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open {dispatchMethod} Link
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM TOAST NOTIFICATIONS */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-gold-500 bg-[#0a0a0c] px-4 py-3 shadow-2xl shadow-gold-500/10 min-w-[300px]"
          >
            <div className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
            <div className="flex-1 text-xs text-left">
              <p className="font-mono text-gold-500 uppercase tracking-widest font-bold text-[9px]">SYSTEM MSG</p>
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
