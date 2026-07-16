/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../utils/StateContext';
import NotificationBell from './NotificationBell';
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
  CheckCircle2,
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
import { TermsOfServiceModal, PrivacyPolicyModal, CharityDisclosuresModal } from './LegalModals';

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
  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('kr_is_logged_in') === 'true';
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authStep, setAuthStep] = useState<'form' | 'verification' | 'welcome'>('form');

  // Auth Inputs
  const [authName, setAuthName] = useState(() => {
    return localStorage.getItem('kr_auth_name') || 'John Smith';
  });
  const [authEmail, setAuthEmail] = useState(() => {
    return localStorage.getItem('kr_auth_email') || 'john.smith@gmail.com';
  });
  const [authPassword, setAuthPassword] = useState('');
  const [authCountry, setAuthCountry] = useState(() => {
    return localStorage.getItem('kr_auth_country') || 'USA';
  });

  // Keep localStorage in sync with Auth state changes
  useEffect(() => {
    localStorage.setItem('kr_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('kr_auth_name', authName);
  }, [authName]);

  useEffect(() => {
    localStorage.setItem('kr_auth_email', authEmail);
  }, [authEmail]);

  useEffect(() => {
    localStorage.setItem('kr_auth_country', authCountry);
  }, [authCountry]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

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
  const [isDisclosuresOpen, setIsDisclosuresOpen] = useState(false);

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

  // Local state copy of profile fields
  const [profileBio, setProfileBio] = useState('Dedicated humanitarian and lifelong theater and film advocate. Inspired by acts of humble kindness.');
  const [profileMovie, setProfileMovie] = useState('The X-Files & Sex Education');
  const [profileContact, setProfileContact] = useState('+1 (555) 123-4567');

  // Dynamic Event registrations
  const [portalEvents, setPortalEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch('/api/portal/events').then(r => r.ok ? r.json() : []).then(setPortalEvents).catch(() => {});
  }, []);

  // Community State
  const [activeCountryClub, setActiveCountryClub] = useState<string>('Global');
  const [clubDiscussions, setClubDiscussions] = useState<{ [club: string]: DiscussionPost[] }>({
    Global: [
      {
        id: 'g1',
        author: 'Scully_Seeker',
        text: 'Does anyone know if Gillian is doing any West End stage talks or London signings soon?',
        time: '2 hours ago',
        replies: [
          { id: 'g1-r1', author: 'XFilesFan_99', text: 'Yes! She announced several speaking dates in London. Check her official updates page!', time: '1 hour ago' }
        ]
      },
      {
        id: 'g2',
        author: 'BeExcellent',
        text: 'Be kind to everyone you meet today. Simple reminders make the world shine.',
        time: '4 hours ago',
        replies: []
      }
    ],
    USA: [
      {
        id: 'us1',
        author: 'SAYes_Volunteer',
        text: 'Cape Town mentoring sessions are truly transformative. Love supporting SAYes.',
        time: '5 hours ago',
        replies: [
          { id: 'us1-r1', author: 'MentorshipFan', text: "Gillian's mentoring models are absolute masterclasses in compassion. So inspiring!", time: '3 hours ago' }
        ]
      }
    ],
    Canada: [
      {
        id: 'ca1',
        author: 'London_Scully',
        text: "Greetings from Gillian's childhood stomping grounds in London!",
        time: '1 day ago',
        replies: []
      }
    ],
    UK: [
      {
        id: 'uk1',
        author: 'Chester_S',
        text: 'London Charity Dinner tickets requested! Praying to get allocated a supporter slot.',
        time: '12 hours ago',
        replies: []
      }
    ],
    Australia: [
      {
        id: 'au1',
        author: 'AussieSAYes',
        text: 'Met a SAYes mentoring supervisor in Sydney today. Absolute gem!',
        time: '6 hours ago',
        replies: []
      }
    ],
    'New Zealand': [
      {
        id: 'nz1',
        author: 'KiwiSeeker',
        text: 'Rewatching the entire X-Files series tonight in Auckland. Absolute classics.',
        time: '10 hours ago',
        replies: []
      }
    ],
    Japan: [
      {
        id: 'jp1',
        author: 'TokyoSaito',
        text: 'Gillian has such a deep appreciation for classical theater and independent cinema.',
        time: '1 day ago',
        replies: [
          { id: 'jp1-r1', author: 'Thespian_47', text: 'Yes, her devotion to the craft of acting is highly admired here!', time: '18 hours ago' }
        ]
      }
    ],
    Germany: [
      {
        id: 'de1',
        author: 'Berlin_Bridges',
        text: 'Organizing a local youth mentoring seminar in Munich next month to support transition advocacy.',
        time: '2 days ago',
        replies: []
      }
    ],
    Brazil: [
      {
        id: 'br1',
        author: 'Rio_Scully',
        text: 'Gillian Anderson has the warmest heart. Infinite love from Rio de Janeiro!',
        time: '3 days ago',
        replies: []
      }
    ],
    France: [
      {
        id: 'fr1',
        author: 'ParisianSkeptic',
        text: 'Her elegance and wit during theater panel conferences here in Paris is legendary.',
        time: '1 day ago',
        replies: []
      }
    ],
    India: [
      {
        id: 'in1',
        author: 'Rajesh_Kumar',
        text: 'The kindness philosophy is universal. Namaste from Delhi community!',
        time: '2 days ago',
        replies: []
      }
    ],
    Mexico: [
      {
        id: 'mx1',
        author: 'Gomez_Scully',
        text: 'Be compassionate to each other! Greeting from Mexico City fans!',
        time: '4 days ago',
        replies: []
      }
    ],
    'South Africa': [
      {
        id: 'za1',
        author: 'CapeTown_Rebel',
        text: 'Love to see the youth mentoring transition focus. Absolute queen.',
        time: '5 days ago',
        replies: []
      }
    ],
    'South Korea': [
      {
        id: 'kr1',
        author: 'Seoul_Scully',
        text: 'Amazing to see Korean fans uniting for youth mentorship charity drives!',
        time: '2 days ago',
        replies: []
      }
    ],
    Italy: [
      {
        id: 'it1',
        author: 'Rome_Thespian',
        text: "Gillian's presence at the theater stages here is always a joy.",
        time: '3 days ago',
        replies: []
      }
    ],
    Spain: [
      {
        id: 'es1',
        author: 'Madrid_Scully',
        text: 'West End play adaptations touring Spain would be a dream come true!',
        time: '4 days ago',
        replies: []
      }
    ],
    Argentina: [
      {
        id: 'ar1',
        author: 'Diego_P',
        text: 'She represents the ultimate elegant standard. Big support from Buenos Aires!',
        time: '2 days ago',
        replies: []
      }
    ],
    Philippines: [
      {
        id: 'ph1',
        author: 'Pinoy_Empowered',
        text: "You are empowered! Everyday reminder to keep being compassionate.",
        time: '3 days ago',
        replies: []
      }
    ],
    Singapore: [
      {
        id: 'sg1',
        author: 'Merlion_Scully',
        text: 'The official communication bridge works so fast. Thank you Sarah/management!',
        time: '12 hours ago',
        replies: []
      }
    ],
    Ireland: [
      {
        id: 'ie1',
        author: 'Dublin_Scully',
        text: 'A wet London afternoon today but keeping the warm heart. Be compassionate lads!',
        time: '2 days ago',
        replies: []
      }
    ],
    Netherlands: [
      {
        id: 'nl1',
        author: 'Amsterdam_Scully',
        text: 'Supporting mentoring initiatives in Europe is so important. Kudos to Gillian.',
        time: '3 days ago',
        replies: []
      }
    ]
  });
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

  // Messages State for 3 active channels

  // Loyalty & Rewards State
  const [loyaltyPoints, setLoyaltyPoints] = useState(4500);
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
  const [selectedAvatar, setSelectedAvatar] = useState<{ id: string; name: string; emoji: string }>({
    id: 'scully',
    name: 'Dana Scully',
    emoji: '🔬'
  });

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
  }>({
    management: [
      { id: 'm1', sender: 'management', text: "Hello, this is Sarah from Gillian's official representation team. We have received your Meet & Greet proposal. Gillian is very touched by your youth mentoring support story.", timestamp: 'May 18, 11:05 AM' },
      { id: 'm2', sender: 'user', text: "Hi Sarah! Thank you so much for reaching out. It is an absolute dream of mine. I have been supporting youth mentorship for five years, inspired directly by Gillian's quiet benevolence.", timestamp: 'May 18, 01:14 PM' },
      { id: 'm3', sender: 'management', text: "That is wonderful to hear. We are currently mapping out some private slots around her charity summit schedule in July. Could you confirm if you will be in London during the entire second week of July?", timestamp: 'May 20, 04:10 PM' },
      { id: 'm4', sender: 'user', text: "Yes, absolutely! I can arrange my travel to match any day or time that works best for Gillian. I will also be attending the charity screening.", timestamp: 'May 20, 04:18 PM' }
    ],
    events: [
      { id: 'e1', sender: 'management', text: "Welcome to the Event Coordination Desk. Registered members can request access codes and schedule digital/physical entry passes here.", timestamp: 'May 21, 09:12 AM' }
    ],
    vault: [
      { id: 'v1', sender: 'management', text: "Vault Logistics Desk active. We verify physical product certificates, shipping couriers, and state synchronization.", timestamp: 'May 22, 10:45 AM' }
    ]
  });

  // Shop Cart State
  const [cart, setCart] = useState<{ id: string; item: string; price: string; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCryptoWallet, setCheckoutCryptoWallet] = useState('');

  // Live Virtual Event Stage State
  const [activeEventStageId, setActiveEventStageId] = useState<string | null>(null);
  const [eventClaps, setEventClaps] = useState(145);
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
      `Dispatched Message: ${currentChannel === 'management' ? 'Sarah (Liaison)' : currentChannel === 'events' ? 'Event Coordinator' : 'Vault Support'}`,
      `Secure communication logged regarding portal inquiry: "${userText.substring(0, 30)}..."`,
      'bg-blue-500'
    );

    // Simulate management reply
    setTimeout(() => {
      let replyText = "Perfect. I have logged that in our coordination sheet. Let me check with our team and get back to you with an official update shortly.";
      const textLower = userText.toLowerCase();

      if (textLower.includes('meet') || textLower.includes('greet') || textLower.includes('gillian') || textLower.includes('proposal')) {
        replyText = "Gillian is always deeply humbled to meet supporters who fund youth mentoring through SAYes. We are coordinating private slots around her charity summit in July.";
      } else if (textLower.includes('ticket') || textLower.includes('event') || textLower.includes('canyon') || textLower.includes('ride') || textLower.includes('gala')) {
        replyText = "Our Event Coordination team has marked your clearance. Please ensure your digital QR code access pass is downloaded and ready for screening.";
      } else if (textLower.includes('order') || textLower.includes('shipping') || textLower.includes('transit') || textLower.includes('item') || textLower.includes('shop') || textLower.includes('cart')) {
        replyText = "Our white-glove sanctuary courier handles shipping securely. You can monitor and manually advance your live transit steps under the Shop/Orders page.";
      } else if (textLower.includes('point') || textLower.includes('reward') || textLower.includes('badge')) {
        replyText = "Every loyalty point and badge denotes genuine contributions to youth mentoring and SAYes. Your kindness has direct real-world impact.";
      }

      const replyMsg = {
        id: `reply-${Date.now()}`,
        sender: 'management' as const,
        text: replyText,
        timestamp: new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      setChannelMessages((prev) => ({
        ...prev,
        [currentChannel]: [...(prev[currentChannel] || []), replyMsg]
      }));

      pushNotification(`Liaison reply: "${replyText.substring(0, 45)}..."`);
      showToast('New secure message incoming...', 'info');
    }, 1200);
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

      // Calculate auto-fill communication details
      const adminEmail = 'liaison@gillian-sanctuary.org';
      const adminWhatsApp = '15550199999';
      const adminTelegram = 'GillianLiaisonBot';

      const messageText = `[OFFICIAL GILLIAN SANCTUARY PROPOSAL]\n` +
        `Hello Administrative Team,\n\n` +
        `I have successfully submitted an official proposal on the Fan Sanctuary Platform.\n\n` +
        `• Proposal ID: ${createdReq.id}\n` +
        `• Proposer: ${createdReq.member}\n` +
        `• Category: ${createdReq.type}\n` +
        `• Preferred Date: ${createdReq.preferredDate}\n` +
        `• Location: ${createdReq.location}\n` +
        `• Guests: ${createdReq.attendees}\n` +
        `• Contact Bridge: ${createdReq.whatsappNumber}\n\n` +
        `Sincerity Pledge:\n` +
        `"${createdReq.sincerity}"\n\n` +
        `Please review my credentials and initiate active private discussion tracking. Thank you!`;

      let linkUrl = '';
      if (newRequestContact === 'Email') {
        linkUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(`Official Fan Proposal ${createdReq.id}`)}&body=${encodeURIComponent(messageText)}`;
      } else if (newRequestContact === 'WhatsApp') {
        linkUrl = `https://api.whatsapp.com/send?phone=${adminWhatsApp}&text=${encodeURIComponent(messageText)}`;
      } else if (newRequestContact === 'Telegram') {
        linkUrl = `https://t.me/${adminTelegram}?text=${encodeURIComponent(messageText)}`;
      } else {
        linkUrl = `https://gillian-sanctuary.org/dispatch?id=${createdReq.id}&msg=${encodeURIComponent(messageText)}`;
      }

      setDispatchMessage(messageText);
      setDispatchUrl(linkUrl);
      setDispatchMethod(newRequestContact);
      setIsCopiedDispatch(false);
      setShowDispatchModal(true);

      // Attempt direct popup trigger
      try {
        window.open(linkUrl, '_blank');
      } catch (e) {
        // browser blocked popup, fallback handled beautifully via showDispatchModal
      }

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

  const handleAddTimelineComment = (requestId: string, textToPost: string, targetStatus?: string) => {
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

    // 2. Trigger automatic coordinator reply after delay
    setTimeout(() => {
      const currentReq = userRequests.find(r => r.id === requestId);
      let replyText = "Understood. Sarah has noted this. We are validating your scheduling proposals and will update this timeline shortly. Be excellent.";
      let newReplyStatus = nextStatus;

      const textLower = textToPost.toLowerCase();
      if (textLower.includes('date') || textLower.includes('time') || textLower.includes('saturday') || textLower.includes('july') || textLower.includes('meet')) {
        replyText = "The proposed slot has been sent to our calendar coordination module. We will lock in security and issue a clearance voucher. Proposal status is now escalated to Under Review.";
        newReplyStatus = 'Under Review';
      } else if (textLower.includes('charity') || textLower.includes('cancer') || textLower.includes('organization') || textLower.includes('sincere')) {
        replyText = "We appreciate the verified credentials and charity background you shared. Sincerity parameters have been confirmed. Status moved to In Discussion.";
        newReplyStatus = 'In Discussion';
      } else if (textLower.includes('offer') || textLower.includes('accept') || textLower.includes('agree')) {
        replyText = "Amazing. Since you've accepted our initial logistics, I am generating a physical coordination clearance contract. Proposal status updated to Offer Made.";
        newReplyStatus = 'Offer Made';
      } else if (textLower.includes('pay') || textLower.includes('fee') || textLower.includes('donation')) {
        replyText = "Charity support verification processed. Status updated to Payment Requested for secure voluntary logging.";
        newReplyStatus = 'Payment Requested';
      } else if (textLower.includes('resolve') || textLower.includes('done') || textLower.includes('thanks') || textLower.includes('thank you')) {
        replyText = "You're very welcome! We're glad to support. Status is now fully Approved/Resolved in our gateway. Be excellent.";
        newReplyStatus = 'Approved';
      }

      const replyMsg = {
        id: `pmsg-reply-${Date.now()}`,
        sender: 'management' as const,
        text: replyText,
        timestamp: new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      setProposalChats(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), replyMsg]
      }));

      // Update status to Sarah's proposed status
      setUserRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: newReplyStatus,
            lastUpdated: replyMsg.timestamp
          };
        }
        return r;
      }));

      if (currentReq && currentReq.status !== newReplyStatus) {
        const replySystemLog = {
          id: `pmsg-sys-reply-${Date.now()}`,
          sender: 'system' as const,
          text: `SYSTEM STATE CHANGE: Coordinator Sarah adjusted status to [${newReplyStatus}]`,
          timestamp: replyMsg.timestamp
        };
        setProposalChats(prev => ({
          ...prev,
          [requestId]: [...(prev[requestId] || []), replySystemLog]
        }));
      }

      pushNotification(`Liaison reply on ${requestId}: "${replyText.substring(0, 45)}..."`);
      showToast('Sarah (Liaison Coordinator) posted a reply.', 'info');
    }, 1500);
  };

  const handlePortalMembershipRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mReason.trim() || !mContactVal.trim()) return;

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newReq: RequestDetail = {
      id: `KR-MEM-${randomNum}`,
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
          return { ...e, registered: true, ticketRef: `KR-TKT-${Math.floor(100000 + Math.random() * 900000)}` };
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

  const redeemableItems = [
    { id: 'r1', title: 'SAYes Mentoring Digital Wallpaper Pack', cost: 500, icon: '📚', desc: 'Exclusive high-res desktop & phone background bundle.' },
    { id: 'r2', title: 'Personalized Sanctuary Access Certificate', cost: 1000, icon: '📜', desc: 'Downloadable custom-signed high-fidelity entry token.' },
    { id: 'r3', title: 'Exclusive Video Message Clip', cost: 2000, icon: '🎬', desc: 'A downloadable personal audio/video file of Gillian.' }
  ];

  const handleRedeemReward = async (item: typeof redeemableItems[0]) => {
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

  const storeItems = [
    { id: 's1', item: "Signed 'The X-Files' Pilot Script Copy", price: "0.00", desc: "Gold Member perk. Shipping proceeds support youth mentoring." },
    { id: 's2', item: "Scully Forensic Stylus Pen", price: "15.00", desc: "Sleek metallic stylus pen with laser etching." },
    { id: 's3', item: "Official 'We Manifesto' Cap", price: "35.00", desc: "Vintage dad-hat fit with supportive empowerment embroidery." }
  ];

  const handleAddToCart = (item: typeof storeItems[0]) => {
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
    const randomNum = Math.floor(100000 + Math.random() * 900000);

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

      // Dynamic points award based on price
      const earnedPoints = Math.max(100, Math.floor(parseFloat(totalCost) * 10));
      setLoyaltyPoints((prev) => prev + earnedPoints);

      // Trigger unlockable collector badge if they ordered a physical item
      const hasCollectorBadge = badges.some(b => b.title === "Scully's Investigator");
      if (!hasCollectorBadge) {
        const colBadge = {
          id: `b-col-${Date.now()}`,
          title: "Scully's Investigator",
          desc: "Ordered official limited merchandise from private catalog",
          date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
          icon: '🔬'
        };
        setBadges(prev => [...prev, colBadge]);
        pushNotification(`Achievement unlocked: Scully's Investigator! Check your profile.`);
      }

      pushNotification(`Order successfully placed! Reference ID: GA-SHP-${randomNum}. Earned +${earnedPoints} loyalty points.`);
      showToast('Checkout approved! State synchronized.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to process merchandise order.', 'error');
    }
  };

  const handleSimulateTransitStep = (orderId: string) => {
    const statusSequence = [
      'Preparing 📦',
      'Dispatched from Sanctuary Hub 🛫',
      'Arrived at Customs Gateway 🛃',
      'Out for White-glove Delivery 🚚',
      'Delivered & Verified ✅'
    ];

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const currentIndex = statusSequence.indexOf(ord.status);
          if (currentIndex !== -1 && currentIndex < statusSequence.length - 1) {
            const nextStatus = statusSequence[currentIndex + 1];
            
            // Push alert
            pushNotification(`Shipping status updated: Order ${orderId} is now "${nextStatus}"`);
            showToast(`Order status updated to: ${nextStatus}`, 'success');

            // Log milestone if delivered
            if (nextStatus === 'Delivered & Verified ✅') {
              addJourneyMilestone(
                `Order Delivered: ${ord.id}`,
                `Your shipment containing "${ord.item.substring(0, 30)}..." has been verified and safely received.`,
                'bg-emerald-500'
              );
              setLoyaltyPoints(prev => prev + 100); // 100 bonus pts for verified delivery
            }

            return { ...ord, status: nextStatus };
          }
        }
        return ord;
      })
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification cleared.', 'info');
  };

  // Auth Submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      setIsLoggedIn(true);
      setActiveTab('Dashboard');
    } else {
      setAuthStep('verification');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim() === '543821' || verificationCode.trim().length >= 4) {
      setAuthStep('welcome');
      setTimeout(() => {
        setIsLoggedIn(true);
        setAuthStep('form');
        setActiveTab('Dashboard');
      }, 2000);
    } else {
      setVerificationError('Invalid verification key. Try "543821" or any 6-digit key.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans selection:bg-gold-500 selection:text-neutral-950 flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. AUTHENTICATION GATE SCREEN */}
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,186,137,0.03),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {authStep === 'form' && (
              <motion.div
                key="form-panel"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0a0c] p-6.5 shadow-2xl relative overflow-hidden text-left space-y-6"
              >
                {/* Visual accents */}
                <div className="absolute top-0 right-0 h-20 w-20 bg-[radial-gradient(circle_at_top_right,rgba(223,186,137,0.07),transparent)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-20 w-20 bg-[radial-gradient(circle_at_bottom_left,rgba(223,186,137,0.02),transparent)] pointer-events-none" />

                {/* Header branding */}
                <div className="text-center space-y-2">
                  <span className="font-serif text-2xl font-bold tracking-widest text-white block">
                    GA
                  </span>
                  <p className="font-serif text-xs font-bold tracking-widest text-neutral-300 uppercase">
                    Gillian Anderson Sanctuary
                  </p>
                  <p className="font-mono text-[8px] tracking-[0.25em] text-gold-500/70 uppercase">
                    Official Communication Bridge
                  </p>
                </div>

                {/* Switcher tabs */}
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

                {/* Core form */}
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
                    className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider shadow-md shadow-gold-500/10 mt-6"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {authMode === 'register' ? 'Authorize Registration' : 'Establish Connection'}
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

            {authStep === 'verification' && (
              <motion.div
                key="verification-panel"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0a0c] p-6.5 shadow-2xl relative text-left space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/20">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h4 className="font-serif text-base tracking-wider text-white uppercase">
                    VERIFY YOUR SANCTUARY KEY
                  </h4>
                  <p className="text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Under our safety protocols, a verification key has been simulated for your connection. Please enter the simulated access key below.
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block text-center">
                      ENTER SIMULATED CODE (USE: "543821")
                    </label>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setVerificationError('');
                      }}
                      placeholder="e.g. 543821"
                      className="w-full text-center rounded border border-neutral-900 bg-neutral-950 px-3 py-3 text-sm text-white outline-none font-mono tracking-widest focus:border-gold-500/50"
                    />
                    {verificationError && (
                      <p className="text-[10px] text-red-500 text-center font-semibold mt-1">
                        {verificationError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify Connection Key
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setAuthStep('form')}
                    className="text-[10px] font-mono text-neutral-500 hover:text-white"
                  >
                    ← Back to parameters
                  </button>
                </div>
              </motion.div>
            )}

            {authStep === 'welcome' && (
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
                    SECURITY LEVEL UNLOCKED
                  </span>
                  <h4 className="font-serif text-lg font-bold tracking-wider text-white">
                    WELCOME BACK TO THE SANCTUARY
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Welcome, <span className="text-white font-bold">{authName}</span>. Your registered fan bridge has been verified. Redirecting to official workspace...
                  </p>
                </div>

                <div className="rounded border border-neutral-900 bg-neutral-900/40 p-4">
                  <p className="text-xs italic text-gold-500 font-serif leading-relaxed">
                    "It's a wonderful thing when we can connect with transparency and sincerity. Welcome. Let's do some good."
                  </p>
                  <p className="text-[8px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        
        /* 2. DYNAMIC PORTAL DASHBOARD onceLoggedIn */
        <div className="flex-1 flex flex-col relative w-full bg-[#070709]">
          
          {/* TOP PORTAL HEADER BAR - Symmetrical to Admin/Management Dashboard */}
          <header className="sticky top-0 z-40 w-full border-b border-neutral-900/80 bg-[#070709]/95 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between h-14 shrink-0">
            {/* Left Brand Identity */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onBackToHome}
                className="p-1.5 rounded bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                aria-label="Back to landing"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm md:text-base font-bold tracking-widest text-gold-500">
                  KR
                </span>
                <div className="h-3 w-[1px] bg-neutral-800" />
                <div className="flex flex-col text-left">
                  <span className="font-serif text-[8px] md:text-[9px] font-bold tracking-widest text-neutral-300 leading-tight">
                    SANCTUARY
                  </span>
                  <span className="font-mono text-[5px] md:text-[6px] tracking-[0.15em] text-gold-500/70 font-bold uppercase leading-none">
                    OFFICIAL MEMBER PORTAL
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Points pill & Profile & Menu Trigger */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Point pill wallet indicator */}
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-gold-500/10 border border-gold-500/20 text-[9px] font-mono text-gold-400 font-bold shrink-0">
                <span>🏆</span>
                <span>{loyaltyPoints.toLocaleString()} PTS</span>
              </div>

              {/* Rank visual badge */}
              <div className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider shrink-0 ${rank.badgeColor}`}>
                <span>{rank.icon}</span>
                <span>{rank.name}</span>
              </div>

              <NotificationBell />

              <div className="h-3 w-[1px] bg-neutral-800 hidden sm:block" />

              {/* User Avatar dropdown preview */}
              <div className="flex items-center gap-2">
                <div className="h-6.5 w-6.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-gold-500 uppercase font-serif shrink-0">
                  {authName.slice(0, 2)}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-xs font-semibold text-white">{authName}</span>
                  <span className="text-[7px] font-mono text-neutral-500 uppercase">VERIFIED FAN</span>
                </div>
              </div>

              {/* Mobile Menu trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded bg-neutral-900/50 border border-neutral-900 text-neutral-400 hover:text-white transition-all ml-1 shrink-0"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* MAIN BODY CONTAINER WITH OVERFLOW CONTROL */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Soft backdrop blur overlay for mobile sidebar */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* SIDEBAR NAVIGATION */}
            <aside 
              className={`
                shrink-0 border-r border-neutral-900/60 bg-[#0a0a0c] p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out z-50
                ${isMobileMenuOpen 
                  ? 'fixed top-14 left-0 bottom-0 w-64 shadow-2xl translate-x-0 flex' 
                  : 'fixed top-14 left-0 bottom-0 w-64 -translate-x-full md:translate-x-0 md:static md:h-[calc(100vh-56px)] md:w-64 md:flex md:overflow-y-auto'
                }
              `}
            >
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-neutral-600 uppercase block pl-2 mb-2">
                    WORKSPACE NAVIGATION
                  </span>
                  
                  {/* Navigation Menu */}
                  <nav className="space-y-1">
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
                            setSelectedRequestId(null); // Reset detail expansion
                            setIsMobileMenuOpen(false); // Close mobile menu
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                            isSelected
                              ? 'bg-gold-500/10 text-gold-500 font-bold border border-gold-500/20 shadow-sm'
                              : 'text-neutral-400 hover:bg-neutral-900/40 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-gold-500' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                            <span>{item.name}</span>
                          </div>
                          {item.name === 'Messages' ? (
                            <span className="bg-gold-500 text-neutral-950 font-bold text-[9px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-mono">
                              2
                            </span>
                          ) : isUnread ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
                          ) : null}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Bottom Member badge card */}
              <div className="mt-8 border border-gold-500/15 rounded-xl bg-gradient-to-b from-gold-500/[0.02] to-transparent p-4 relative overflow-hidden text-left space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-gold-500 tracking-wider flex items-center gap-1.5 uppercase">
                    <span className="text-xs">{rank.icon}</span>
                    <span>{rank.name}</span>
                  </span>
                  <span className="text-[8px] font-mono text-neutral-500">★</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-gold-500 uppercase font-serif shrink-0">
                    {authName.slice(0, 2)}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-white truncate max-w-[135px]">{authName}</span>
                    <span className="text-[8px] text-neutral-500 font-mono uppercase tracking-wide">Verified Fan sanctuary</span>
                  </div>
                </div>

                {/* Mini Rank Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                    <span>RANK PROGRESS</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/40">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-gold-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 pt-2 border-t border-neutral-900">
                  <span>ID: KR-MEM-000321</span>
                  <span>{authCountry.toUpperCase()}</span>
                </div>
              </div>
            </aside>

            {/* MAIN WORKSPACE SCREEN CONTENT */}
            <main className="flex-1 overflow-y-auto bg-[#070709] p-4 md:p-6 lg:p-8 space-y-6">
            
            {/* VIEW RENDERING 1: DASHBOARD */}
            {activeTab === 'Dashboard' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1">
                  <h1 className="font-serif text-2xl font-bold tracking-wider text-white uppercase">
                    Welcome back, {authName}
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono">
                    "Be excellent to yourself, John. Welcome back to the official sanctuary."
                  </p>
                </div>

                {/* Grid 4 Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-1 relative">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">LOYALTY REWARDS POINTS</span>
                    <h3 className={`text-xl font-bold text-white font-mono`}>{loyaltyPoints.toLocaleString()} PTS</h3>
                    <p className="text-[9px] text-green-500 font-mono">↑ Dynamic point wallet</p>
                  </div>
                  <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">ACTIVE PROPOSALS</span>
                    <h3 className="text-xl font-bold text-white font-mono">{userRequests.length} Active</h3>
                    <p className="text-[9px] text-amber-500 font-mono">{userRequests.filter(r => r.status === 'In Discussion').length} under discussion</p>
                  </div>
                  <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">MEMBER LEVEL</span>
                    <h3 className="text-base font-bold text-gold-500 font-mono truncate uppercase flex items-center gap-1.5">
                      <span>{rank.icon}</span>
                      <span>{rank.name}</span>
                    </h3>
                    <p className="text-[9px] text-neutral-500 font-mono">Dues support Youth Mentoring</p>
                  </div>
                  <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">UNREAD ALERTS</span>
                    <h3 className="text-xl font-bold text-white font-mono">
                      {notifications.filter(n => n.unread).length} New
                    </h3>
                    <p className="text-[9px] text-neutral-500 font-mono">Check Notification Inbox</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left Col (8 cols) */}
                  <div className="md:col-span-8 space-y-6">
                    {/* Official Reminders & Announcements */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Official Sanctuary Reminders
                        </h3>
                        <span className="text-[9px] bg-gold-500/10 text-gold-500 font-mono px-2 py-0.5 rounded uppercase font-bold">
                          Live News feed
                        </span>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="flex gap-3 items-start border-b border-neutral-900/50 pb-3">
                          <span className="p-1.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 mt-0.5">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">Cape Town Mentoring Summit Scheduled</h4>
                            <p className="text-neutral-400 leading-relaxed">
                              Registration is now open for registered Gold members. Gillian and the SAYes mentoring crew are mapping the summit itinerary for Saturday, July 12th. Tickets are strictly limited.
                            </p>
                            <button
                              onClick={() => setActiveTab('Events')}
                              className="text-[10px] text-gold-500 font-mono font-bold hover:underline"
                            >
                              Register Event Ticket →
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start pb-1">
                          <span className="p-1.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 mt-0.5">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">Monthly Video Greeting from Gillian Anderson</h4>
                            <p className="text-neutral-400 leading-relaxed">
                              "Greetings to our wonderful global community. Let's keep sharing kind moments, listening with our hearts, and looking out for one another." Click the Media tab to stream.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chronological Recent Activity Feed */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Chronological Activity Feed
                        </h3>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          Real-time Logs
                        </span>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {journeyLog.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex gap-3 items-start text-xs border-b border-neutral-900/50 pb-3 last:border-0 last:pb-0">
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${log.color || 'bg-gold-500'}`} />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{log.title}</h4>
                                <span className="text-[8px] font-mono text-neutral-500">{log.date}</span>
                              </div>
                              <p className="text-neutral-400 text-[11px] leading-snug">{log.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sincerity Quote Card */}
                    <div className="rounded-xl border border-neutral-900 bg-gradient-to-r from-neutral-950 to-[#0e0e11] p-6 relative overflow-hidden">
                      <div className="absolute right-4 bottom-4 h-24 w-24 bg-[radial-gradient(circle_at_center,rgba(223,186,137,0.03),transparent)] pointer-events-none" />
                      <p className="text-sm italic font-serif text-gold-500 leading-relaxed">
                        "Be excellent to each other. Connection is a superpower. Every child deserves mentorship and a steady guide through life's complex forest."
                      </p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-900/60 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        <span>Official Community Reminder</span>
                        <span className="text-white font-bold">— GILLIAN ANDERSON</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Col (4 cols) */}
                  <div className="md:col-span-4 space-y-6">
                    {/* Fast Navigation Shortcuts */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-4.5 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider pb-2 border-b border-neutral-900">
                        Sanctuary Shortcuts
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowPortalRequestWizard(true)}
                          className="w-full text-left bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 p-2.5 rounded flex items-center justify-between text-xs transition-colors group"
                        >
                          <span className="text-neutral-300 font-semibold group-hover:text-gold-500">Submit New Request</span>
                          <Plus className="h-3.5 w-3.5 text-neutral-600 group-hover:text-gold-500" />
                        </button>
                        <button
                          onClick={() => setActiveTab('Events')}
                          className="w-full text-left bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 p-2.5 rounded flex items-center justify-between text-xs transition-colors group"
                        >
                          <span className="text-neutral-300 font-semibold group-hover:text-gold-500">View Events Ticket</span>
                          <Calendar className="h-3.5 w-3.5 text-neutral-600 group-hover:text-gold-500" />
                        </button>
                        <button
                          onClick={() => setShowPortalMembershipModal(true)}
                          className="w-full text-left bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 p-2.5 rounded flex items-center justify-between text-xs transition-colors group"
                        >
                          <span className="text-neutral-300 font-semibold group-hover:text-gold-500">Request Membership Upgrade</span>
                          <Award className="h-3.5 w-3.5 text-neutral-600 group-hover:text-gold-500" />
                        </button>
                      </div>
                    </div>

                    {/* Daily Fan Interaction Check-In */}
                    <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] p-4.5 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Daily Trivia Check-In
                        </h3>
                        <span className="text-[9px] bg-gold-500/10 text-gold-500 font-mono px-2 py-0.5 rounded font-bold">
                          +50 PTS
                        </span>
                      </div>

                      {!dailyQuizAnswered ? (
                        <div className="space-y-3 text-xs">
                          <p className="text-neutral-400 font-semibold leading-snug">
                            Which iconic character did Gillian Anderson play in the legendary science fiction series 'The X-Files'?
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Agent Dana Scully', isCorrect: true },
                              { label: 'Detective Stella Gibson', isCorrect: false },
                              { label: 'Dr. Jean Milburn', isCorrect: false },
                              { label: 'Lady Dedlock', isCorrect: false }
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => {
                                  setDailyQuizAnswered(true);
                                  setDailyQuizChoice(opt.label);
                                  if (opt.isCorrect) {
                                    setDailyQuizResult('correct');
                                    setLoyaltyPoints((prev) => prev + 50);
                                    pushNotification('Daily Check-In trivia answered correctly! Earned +50 Loyalty Points.');
                                    addJourneyMilestone('Daily Trivia Check-In', 'Answered X-Files series trivia correctly and received 50 loyalty points.');
                                    showToast('Correct! +50 Points added.', 'success');
                                  } else {
                                    setDailyQuizResult('incorrect');
                                    pushNotification('Daily Check-In trivia answered incorrectly. Try again tomorrow!');
                                    showToast('Incorrect answer. Better luck tomorrow!', 'error');
                                  }
                                }}
                                className="w-full text-left bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 px-3 py-2 rounded text-xs text-neutral-300 hover:text-white transition-colors"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-2">
                          <div className={`text-xs font-bold font-mono uppercase ${dailyQuizResult === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                            {dailyQuizResult === 'correct' ? '🎉 Correct Answer!' : '❌ Incorrect choice'}
                          </div>
                          <p className="text-xs text-neutral-400">
                            You answered: <span className="text-white font-semibold font-mono">{dailyQuizChoice}</span>
                          </p>
                          <p className="text-[10px] text-neutral-500 italic leading-snug">
                            Gillian Anderson famously portrayed Agent Dana Scully, earning an Emmy, a Golden Globe, and a SAG Award. Check back tomorrow for the next sanctuary trivia check-in!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
                                {(proposalChats[req.id] || [
                                  { id: 'p_m_def', sender: 'management', text: "Welcome to your Proposal bridge. You can communicate directly with Sarah regarding credentials and details for this specific request.", timestamp: req.submittedOn }
                                ]).map((msg) => (
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
                                onSubmit={(e) => {
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

                                  addJourneyMilestone(
                                    `Dispatched Proposal Msg: ${req.id}`,
                                    `Sent secure details message regarding proposal: "${userText.substring(0, 30)}..."`,
                                    'bg-blue-500'
                                  );

                                  setTimeout(() => {
                                    let replyText = "Understood. Sarah has noted this. We are validating your scheduling proposals and will update this timeline shortly. Be excellent.";
                                    const textLower = userText.toLowerCase();
                                    if (textLower.includes('date') || textLower.includes('time') || textLower.includes('saturday') || textLower.includes('july')) {
                                      replyText = "The proposed slot has been sent to our calendar coordination module. We will lock in security and issue a clearance voucher.";
                                    } else if (textLower.includes('charity') || textLower.includes('cancer') || textLower.includes('organization')) {
                                      replyText = "We appreciate the verified credentials you uploaded. It makes our authorization flow significantly faster.";
                                    }

                                    const replyMsg = { id: `pmsg-reply-${Date.now()}`, sender: 'management' as const, text: replyText, timestamp: new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) };
                                    setProposalChats(prev => ({
                                      ...prev,
                                      [req.id]: [...(prev[req.id] || []), replyMsg]
                                    }));
                                    pushNotification(`Liaison reply on ${req.id}: "${replyText.substring(0, 45)}..."`);
                                    showToast('Proposal liaison message received.', 'info');
                                  }, 1200);
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
                              <div className="space-y-2">
                                {[
                                  { title: 'Standard Meet & Greet Agreement.pdf', size: '245 KB' },
                                  { title: 'Charity Verification Confirmation.pdf', size: '180 KB' }
                                ].map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-neutral-900 bg-neutral-900/10 hover:border-neutral-800 transition-colors">
                                    <div className="flex items-center gap-3 text-xs">
                                      <FileText className="h-5 w-5 text-gold-500 shrink-0" />
                                      <div>
                                        <p className="font-semibold text-white leading-tight">{doc.title}</p>
                                        <p className="text-[9px] text-neutral-500 font-mono">Size: {doc.size}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => showToast(`Downloading ${doc.title}...`, 'info')} className="p-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded text-xs transition-colors">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
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
                            
                            {/* Simple inline mock QR code */}
                            <div className="h-12 w-12 bg-white border border-neutral-800 rounded p-1 shrink-0 flex flex-wrap gap-0.5 overflow-hidden">
                              {Array.from({ length: 49 }).map((_, i) => (
                                <div key={i} className={`h-1.5 w-1.5 ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`} />
                              ))}
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

            {/* VIEW RENDERING 4: MEMBERSHIP (Holographic Card and upgrade forms) */}
            {activeTab === 'Membership' && (
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4 flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                      Official Sanctuary Membership
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      Your holographic Digital Access Card. Upgrade to unlock direct channel tokens.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPortalMembershipModal(true)}
                    className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-gold-500 font-bold py-1.5 px-3.5 rounded text-xs transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Upgrade Level
                  </button>
                </div>

                {/* Current Membership Card */}
                <div className="max-w-md mx-auto">
                  <div className="rounded-2xl border-2 border-gold-500 bg-gradient-to-b from-neutral-900 via-[#121216] to-[#08080a] p-6 shadow-2xl relative overflow-hidden space-y-6 aspect-[1.6/1]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.03] via-transparent to-amber-500/[0.05] pointer-events-none" />
                    <div className="absolute -inset-y-12 -inset-x-32 bg-gradient-to-r from-transparent via-gold-500/[0.02] to-transparent rotate-12 pointer-events-none animate-pulse" />

                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-mono text-neutral-500 tracking-[0.25em] uppercase block leading-none">Gillian Anderson Official</span>
                        <span className="text-sm font-bold text-white tracking-widest font-serif leading-none">SANCTUARY CARD</span>
                      </div>
                      <Crown className="h-6 w-6 text-gold-500" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-neutral-500 block uppercase leading-none">CARDHOLDER</span>
                      <p className="text-base font-bold text-white tracking-wide uppercase">{authName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left border-t border-neutral-900/60 pt-3">
                      <div>
                        <span className="text-[7px] font-mono text-neutral-500 uppercase block">MEMBER ID</span>
                        <span className="text-[10px] font-mono font-bold text-neutral-300">KR-MEM-000321</span>
                      </div>
                      <div>
                        <span className="text-[7px] font-mono text-neutral-500 uppercase block">LEVEL ACCESS</span>
                        <span className="text-[10px] font-mono font-bold text-gold-500">{rank.name.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-end items-center">
                        <div className="h-8 w-8 bg-white p-0.5 rounded shrink-0 flex flex-wrap gap-px overflow-hidden">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={`h-1 w-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience Tier Membership Levels */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900/40">
                    Experience Access Tiers
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mb-4">
                    Each membership tier unlocks exclusive experiences. Your current loyalty rank: <span className="text-gold-500 font-bold">{rank.name}</span>.
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* GOLD TIER */}
                    <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-neutral-950 p-5 space-y-3 hover:border-amber-500/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[7px] font-mono text-amber-500 uppercase tracking-widest block">TIER</span>
                          <span className="text-lg font-bold text-amber-400 font-serif tracking-wider">GOLD</span>
                        </div>
                        <span className="text-2xl font-bold text-amber-500/30">★</span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-neutral-400">Access to Gold-tier experiences</span>
                        <span className="text-[10px] text-green-500 font-mono">8+ Meet & Greets + Creative + Literary</span>
                        <span className="text-[10px] text-neutral-500">Morning Coffee, Garden Party, Script Reading, Fan Convention</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-900/40">
                        <span className="text-xs font-bold text-amber-500">COMPLIMENTARY</span>
                        <span className="text-[9px] font-mono text-neutral-500">Fan-funded spots available</span>
                      </div>
                      {(rank.min >= 0 && rank.min < 1500) && (
                        <span className="text-[9px] font-mono text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> YOUR CURRENT TIER
                        </span>
                      )}
                    </div>

                    {/* PLATINUM TIER */}
                    <div className="relative rounded-xl border border-slate-400/30 bg-gradient-to-b from-slate-900/20 to-neutral-950 p-5 space-y-3 hover:border-slate-400/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[7px] font-mono text-slate-400 uppercase tracking-widest block">TIER</span>
                          <span className="text-lg font-bold text-slate-300 font-serif tracking-wider">PLATINUM</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-400/30">★★</span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-neutral-400">All Gold + Platinum-tier experiences</span>
                        <span className="text-[10px] text-blue-500 font-mono">6+ Acting Masterclasses + Philanthropy + Behind-the-Scenes</span>
                        <span className="text-[10px] text-neutral-500">Backstage Pass, Acting Masterclass, SAYes Cape Town Retreat</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-900/40">
                        <span className="text-xs font-bold text-slate-400">COMPLIMENTARY</span>
                        <span className="text-[9px] font-mono text-neutral-500">Limited exclusive spots</span>
                      </div>
                      {(rank.min >= 1500 && rank.min < 3500) && (
                        <span className="text-[9px] font-mono text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> YOUR CURRENT TIER
                        </span>
                      )}
                      {(rank.min < 1500) && (
                        <button
                          onClick={() => { setMType('platinum'); setShowPortalMembershipModal(true); }}
                          className="w-full mt-2 bg-slate-900 hover:bg-slate-800 border border-slate-400/30 text-slate-300 font-bold py-1.5 px-3 rounded text-[9px] font-mono uppercase transition-all"
                        >
                          Upgrade to Platinum
                        </button>
                      )}
                    </div>

                    {/* DIAMOND TIER */}
                    <div className="relative rounded-xl border border-purple-400/30 bg-gradient-to-b from-purple-950/20 to-neutral-950 p-5 space-y-3 hover:border-purple-400/50 transition-all ring-1 ring-purple-500/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[7px] font-mono text-purple-400 uppercase tracking-widest block">TIER</span>
                          <span className="text-lg font-bold text-purple-300 font-serif tracking-wider">DIAMOND</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-400/30">★★★</span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-neutral-400">All Platinum + Diamond-tier experiences</span>
                        <span className="text-[10px] text-purple-500 font-mono">4+ Private Audiences + VIP Gala + Birthday Celebration</span>
                        <span className="text-[10px] text-neutral-500">Private Audience, VIP Gala, Birthday, Holiday Gathering</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-900/40">
                        <span className="text-xs font-bold text-purple-400">COMPLIMENTARY</span>
                        <span className="text-[9px] font-mono text-neutral-500">Ultra-exclusive, 1-2 spots each</span>
                      </div>
                      {(rank.min >= 10000) && (
                        <span className="text-[9px] font-mono text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> YOUR CURRENT TIER
                        </span>
                      )}
                      {(rank.min < 10000) && (
                        <button
                          onClick={() => { setMType('diamond'); setShowPortalMembershipModal(true); }}
                          className="w-full mt-2 bg-purple-950/20 hover:bg-purple-950/30 border border-purple-400/30 text-purple-300 font-bold py-1.5 px-3 rounded text-[9px] font-mono uppercase transition-all"
                        >
                          Upgrade to Diamond
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loyalty Points Progress to Next Tier */}
                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">LOYALTY PROGRESS TO NEXT EXPERIENCE TIER</span>
                    <span className="text-[9px] font-mono text-neutral-500">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/40">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-slate-400 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                    <span>Gold (0 PTS)</span>
                    <span>Platinum (1,500 PTS)</span>
                    <span>Diamond (10,000 PTS)</span>
                  </div>
                </div>
              </div>
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
                              {ord.status !== 'Delivered & Verified ✅' && (
                                <button
                                  onClick={() => handleSimulateTransitStep(ord.id)}
                                  className="text-[9px] font-mono bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded transition-all mt-1 uppercase"
                                >
                                  Simulate Transit Step 📦
                                </button>
                              )}
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
              <div className="space-y-6 text-left">
                <div className="space-y-1 border-b border-neutral-900 pb-4">
                  <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                    Your official profile
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Maintain your active sanctuary biography, country clubs memberships, and achievements.
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-6.5 max-w-2xl mx-auto space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-900 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl font-bold text-gold-500 uppercase font-serif shrink-0">
                        {authName.slice(0, 2)}
                      </div>
                      <div className="leading-tight text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white">{authName}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wider uppercase ${rank.badgeColor}`}>
                            <span>{rank.icon}</span>
                            <span>{rank.name}</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">MEMBER SINCE MAY 10, 2024 • COUNTRY: {authCountry}</p>
                      </div>
                    </div>

                    {/* Progress Bar & Loyalty Stats */}
                    <div className="w-full md:w-64 space-y-2 bg-neutral-900/30 border border-neutral-900/50 p-3 rounded-xl text-left">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-neutral-500 uppercase tracking-widest font-semibold">CO-OP LOYALTY RANK</span>
                        <span className="text-gold-500 font-bold">{loyaltyPoints.toLocaleString()} PTS</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden border border-neutral-800/40">
                        <motion.div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-gold-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500 leading-tight">
                        <span>{rank.min} PTS</span>
                        <span className="text-neutral-400 font-medium truncate max-w-[150px]">Next: {rank.next} ({rank.max} PTS)</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); showToast('Profile details updated successfully!', 'success'); }} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">FULL NAME</label>
                        <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-white outline-none focus:border-gold-500/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">EMAIL ADDRESS</label>
                        <input type="email" value={authEmail} disabled className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-neutral-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">PRIMARY PHONE DETAIL</label>
                        <input type="text" value={profileContact} onChange={(e) => setProfileContact(e.target.value)} className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-white outline-none focus:border-gold-500/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">FAVORITE GILLIAN MOVIE/PROJECT</label>
                        <input type="text" value={profileMovie} onChange={(e) => setProfileMovie(e.target.value)} className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-white outline-none focus:border-gold-500/50" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">BIOGRAPHY / STORY</label>
                      <textarea rows={3} value={profileBio} onChange={(e) => setProfileBio(e.target.value)} className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed" />
                    </div>

                    <button type="submit" className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded text-xs uppercase tracking-wider transition-colors">
                      Save Profile credentials
                    </button>
                  </form>
                </div>
              </div>
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
                      Share a quiet act of kindness you performed today. We record it in your spiritual Sanctuary Journey Log and award you 250 loyalty points.
                    </p>

                    <form onSubmit={(e) => {
                      handleAddKindnessAct(e);
                      // Award points
                      setLoyaltyPoints(prev => prev + 250);
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
                      {redeemableItems.map((item) => {
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
                            <p className="text-[10px] text-neutral-400 leading-normal">{item.desc}</p>
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
                      onClick={() => {
                        setIsLoggedIn(false);
                        setAuthStep('form');
                      }}
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
      <footer className="border-t border-neutral-950 bg-[#050506] py-4 text-center text-[10px] font-mono text-neutral-500 px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 Gillian Anderson Official Fan Platform. Under quiet private administration.</span>
        <div className="flex gap-4">
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-gold-500 transition-colors cursor-pointer uppercase bg-transparent border-none">Terms of Service</button>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-gold-500 transition-colors cursor-pointer uppercase bg-transparent border-none">Privacy Policy</button>
          <button onClick={() => setIsDisclosuresOpen(true)} className="hover:text-gold-500 transition-colors cursor-pointer uppercase bg-transparent border-none">Charity Disclosures</button>
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
      <CharityDisclosuresModal isOpen={isDisclosuresOpen} onClose={() => setIsDisclosuresOpen(false)} />

    </div>
  );
}
