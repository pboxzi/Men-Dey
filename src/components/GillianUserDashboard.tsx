import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  FileText,
  Bell,
  CreditCard,
  User,
  Settings,
  ExternalLink,
  Search,
  Calendar,
  Star,
  Image as ImageIcon,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  X,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

export default function GillianUserDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  // Navigation tab state: 'my-gillian' | 'messages' | 'requests' | 'membership' | 'notifications' | 'profile' | 'settings'
  const [activeTab, setActiveTab] = useState<'my-gillian' | 'messages' | 'requests' | 'membership' | 'notifications' | 'profile' | 'settings'>('my-gillian');

  // Carousel slide for "Latest Update"
  const [currentUpdateSlide, setCurrentUpdateSlide] = useState(0);

  // Active modals
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isReadUpdateOpen, setIsReadUpdateOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Form states for modals
  const [messageText, setMessageText] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  const [requestType, setRequestType] = useState('Personal Video Message');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);

  // Display Name logic: Sarah Johnson as default mockup user or authenticated user
  const fullName = profile?.name || user?.user_metadata?.name || 'Sarah Johnson';
  const firstName = fullName.split(' ')[0] || 'Sarah';
  const userAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';

  // Updates data for carousel
  const updatesData = [
    {
      date: 'April 25, 2025',
      title: "A Message from Gillian's Management",
      description: "We're excited to share some new opportunities and updates with our community. Thank you for your continued support.",
      image: '/assets/images/gillian_mentoring_warmth_1783349719383.jpg',
      fullContent: `Dear Members,\n\nWe are delighted to share that the upcoming autumn season brings several intimate opportunities for community dialogue and private engagements. Gillian has concluded the latest stage of production and is preparing to review several selected member correspondence batches this coming month.\n\nManagement continues to prioritize genuine, thoughtful requests submitted through this platform. Please ensure your account preferences and contact details are fully up-to-date in your settings.\n\nWarm regards,\nGillian Anderson Management`
    },
    {
      date: 'April 22, 2025',
      title: 'New Private Membership Options',
      description: 'Expanded archival access and priority review for personal and charitable engagement requests.',
      image: '/assets/images/gillian_speaking_event_1783349739126.jpg',
      fullContent: `New membership tiers have been introduced to accommodate supporters who wish to support Gillian's endorsed charitable foundations while receiving curated archival correspondence and priority inquiry review.`
    },
    {
      date: 'April 18, 2025',
      title: 'Upcoming Virtual Experiences',
      description: 'Registration opens shortly for the next curated group discussion and script reading session.',
      image: '/assets/images/gillian_investigator_look_1783349694204.jpg',
      fullContent: `A strictly limited virtual roundtable is being scheduled for approved members. Details will appear in your upcoming experiences panel once confirmed.`
    }
  ];

  const handleNextUpdate = () => {
    setCurrentUpdateSlide((prev) => (prev + 1) % updatesData.length);
  };

  const handlePrevUpdate = () => {
    setCurrentUpdateSlide((prev) => (prev - 1 + updatesData.length) % updatesData.length);
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject.trim() || !messageText.trim()) return;
    setMessageSentSuccess(true);
    setTimeout(() => {
      setMessageSentSuccess(false);
      setMessageSubject('');
      setMessageText('');
      setIsSendMessageOpen(false);
    }, 1800);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;
    setRequestSentSuccess(true);
    setTimeout(() => {
      setRequestSentSuccess(false);
      setRequestDetails('');
      setIsNewRequestOpen(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-stone-900 flex font-sans antialiased selection:bg-[#9E7A4A]/20 selection:text-stone-900">
      {/* =========================================================================
          1. LEFT OBSIDIAN SIDEBAR (#131619) - BORDERLESS
      ========================================================================= */}
      <aside className="w-60 sm:w-64 bg-[#131619] text-stone-300 flex-shrink-0 flex flex-col min-h-screen select-none">
        {/* Brand Monogram & Title */}
        <div className="pt-8 pb-7 px-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-stone-900/60">
            <span className="font-serif text-2xl font-light tracking-wide text-white">GA</span>
          </div>
          <h1 className="text-[11px] font-semibold tracking-[0.25em] text-white uppercase leading-tight">
            Gillian Anderson
          </h1>
          <span className="text-[9px] font-medium tracking-[0.3em] text-[#9E7A4A] uppercase mt-1">
            Management
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3.5 space-y-1.5 flex-1">
          {/* My Gillian (Active Hub) */}
          <button
            onClick={() => setActiveTab('my-gillian')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'my-gillian'
                ? 'bg-[#8F6E45] text-white shadow-none'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 opacity-90" />
            <span>My Gillian</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 opacity-90" />
              <span>Messages</span>
            </div>
            <span className="bg-[#8F6E45] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              2
            </span>
          </button>

          {/* Requests */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 opacity-90" />
            <span>Requests</span>
          </button>

          {/* Membership */}
          <button
            onClick={() => setActiveTab('membership')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'membership'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4 opacity-90" />
            <span>Membership</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 opacity-90" />
              <span>Notifications</span>
            </div>
            <span className="bg-[#8F6E45] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              3
            </span>
          </button>

          {/* Subtle spacing instead of harsh line */}
          <div className="py-2" />

          {/* Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4 opacity-90" />
            <span>Profile</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#8F6E45] text-white'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4 opacity-90" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Bottom Link: Back to Website */}
        <div className="p-5 mt-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-stone-400 hover:text-white text-xs font-medium transition-colors group"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300" />
            <span>Back to Website</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA - BORDERLESS
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar - Borderless */}
        <header className="h-16 bg-white px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Search Account */}
          <div className="relative w-64 sm:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your account..."
              className="w-full bg-stone-100/70 border-0 rounded-md pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-stone-200/60 transition-all"
            />
          </div>

          {/* User & Notifications */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#8F6E45] absolute top-1 right-1" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 text-left focus:outline-none group"
              >
                <img
                  src={userAvatar}
                  alt={fullName}
                  className="w-8 h-8 rounded-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-stone-800 leading-tight">
                    {fullName}
                  </div>
                  <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                    Fan Member
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 animate-fade-in border-0">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-stone-800">{fullName}</p>
                    <p className="text-[10px] text-stone-500 truncate">{user?.email || 'sarah.johnson@example.com'}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('profile'); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      if (signOut) signOut();
                      navigate('/');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =========================================================================
            HERO WELCOME BANNER (EDGE-TO-EDGE, BORDERLESS, NO CARDS, NO TEXT ON IMAGE)
        ========================================================================= */}
        {activeTab === 'my-gillian' && (
          <section className="w-full bg-[#FAF9F6] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[300px] sm:min-h-[350px]">
              {/* Left Text Block */}
              <div className="px-8 sm:px-12 lg:px-16 py-10 sm:py-12 lg:col-span-7 flex flex-col justify-center bg-[#FAF9F6]">
                <div className="text-[10px] font-bold tracking-[0.25em] text-stone-500 uppercase mb-2">
                  My Gillian
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight mb-2">
                  Welcome back, {firstName}.
                </h2>
                <p className="text-sm font-normal text-stone-600 mb-4">
                  Gillian Anderson — Private Fan Area
                </p>
                
                {/* Gold accent line */}
                <div className="w-12 h-[2px] bg-[#9E7A4A] mb-4" />

                <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed max-w-lg">
                  Thank you for being part of this special community. Here you can connect with Gillian's management, submit requests, and stay up to date with the latest news and opportunities.
                </p>
              </div>

              {/* Right Portrait Block - Clean Studio Portrait of Gillian (NO TEXT ON IMAGE) */}
              <div className="lg:col-span-5 relative bg-stone-200 min-h-[280px] sm:min-h-[340px] overflow-hidden">
                <img
                  src="/assets/images/gillian_studio_portrait_1783349751129.jpg"
                  alt="Gillian Anderson"
                  className="w-full h-full object-cover object-[center_18%]"
                />
              </div>
            </div>
          </section>
        )}

        {/* Dashboard Body Content - Seamless & Borderless */}
        <main className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
          {/* =========================================================================
              VIEW: MY GILLIAN (SEAMLESS BORDERLESS SECTIONS)
          ========================================================================= */}
          {activeTab === 'my-gillian' && (
            <>
              {/* Two-Column Grid: Left 8 cols, Right 4 cols */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* -------------------------------------------------------------
                    LEFT COLUMN (8 cols) - NO HARSH BORDERS
                ------------------------------------------------------------- */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-medium text-stone-900 mb-3.5">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {/* 1. Send a Message */}
                      <button
                        onClick={() => setIsSendMessageOpen(true)}
                        className="bg-white rounded-xl p-4.5 hover:bg-stone-50 transition-all text-left flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#8F6E45]/10 group-hover:text-[#8F6E45] transition-colors mb-3">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-stone-900 group-hover:text-[#8F6E45] transition-colors">
                            Send a Message
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            Connect with management
                          </div>
                        </div>
                        <div className="text-stone-400 group-hover:text-stone-900 transition-colors text-xs font-mono ml-auto mt-3 block">
                          →
                        </div>
                      </button>

                      {/* 2. Make a Request */}
                      <button
                        onClick={() => setIsNewRequestOpen(true)}
                        className="bg-white rounded-xl p-4.5 hover:bg-stone-50 transition-all text-left flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#8F6E45]/10 group-hover:text-[#8F6E45] transition-colors mb-3">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-stone-900 group-hover:text-[#8F6E45] transition-colors">
                            Make a Request
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            Tell us what you'd like to discuss
                          </div>
                        </div>
                        <div className="text-stone-400 group-hover:text-stone-900 transition-colors text-xs font-mono ml-auto mt-3 block">
                          →
                        </div>
                      </button>

                      {/* 3. View Updates */}
                      <button
                        onClick={() => setIsReadUpdateOpen(true)}
                        className="bg-white rounded-xl p-4.5 hover:bg-stone-50 transition-all text-left flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#8F6E45]/10 group-hover:text-[#8F6E45] transition-colors mb-3">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-stone-900 group-hover:text-[#8F6E45] transition-colors">
                            View Updates
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            Latest news and announcements
                          </div>
                        </div>
                        <div className="text-stone-400 group-hover:text-stone-900 transition-colors text-xs font-mono ml-auto mt-3 block">
                          →
                        </div>
                      </button>

                      {/* 4. View Membership */}
                      <button
                        onClick={() => setActiveTab('membership')}
                        className="bg-white rounded-xl p-4.5 hover:bg-stone-50 transition-all text-left flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#8F6E45]/10 group-hover:text-[#8F6E45] transition-colors mb-3">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-stone-900 group-hover:text-[#8F6E45] transition-colors">
                            View Membership
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            Learn about membership options
                          </div>
                        </div>
                        <div className="text-stone-400 group-hover:text-stone-900 transition-colors text-xs font-mono ml-auto mt-3 block">
                          →
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Latest Update - Seamless & Borderless */}
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-medium text-stone-900 mb-3.5">
                      Latest Update
                    </h3>
                    <div className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row">
                      {/* Left Photo of Gillian */}
                      <div className="sm:w-5/12 bg-stone-100 h-52 sm:h-auto relative overflow-hidden">
                        <img
                          src={updatesData[currentUpdateSlide].image}
                          alt={updatesData[currentUpdateSlide].title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      {/* Right Details */}
                      <div className="sm:w-7/12 p-6 sm:p-8 flex flex-col justify-center">
                        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                          {updatesData[currentUpdateSlide].date}
                        </div>
                        <h4 className="font-serif text-lg sm:text-xl font-medium text-stone-900 mb-2 leading-snug">
                          {updatesData[currentUpdateSlide].title}
                        </h4>
                        <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed mb-4">
                          {updatesData[currentUpdateSlide].description}
                        </p>
                        <div>
                          <button
                            onClick={() => setIsReadUpdateOpen(true)}
                            className="text-xs font-semibold text-stone-800 hover:text-[#8F6E45] transition-colors inline-flex items-center gap-1 group"
                          >
                            <span>Read More</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Carousel Navigation Controls */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-stone-400 text-xs">
                      <button
                        onClick={handlePrevUpdate}
                        className="p-1 hover:text-stone-800 transition-colors"
                        aria-label="Previous update"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        {updatesData.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentUpdateSlide(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              currentUpdateSlide === idx ? 'bg-stone-800 w-2.5' : 'bg-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleNextUpdate}
                        className="p-1 hover:text-stone-800 transition-colors"
                        aria-label="Next update"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Two Panels - Borderless */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Your Connection at a Glance */}
                    <div className="bg-white rounded-xl p-6">
                      <h4 className="font-serif text-sm font-semibold text-stone-900 mb-4">
                        Your Connection at a Glance
                      </h4>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        {/* Messages */}
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-stone-500 group-hover:text-stone-900" />
                            <div>
                              <div className="text-xs font-medium text-stone-800">Messages</div>
                              <div className="text-[11px] text-stone-500">2 unread</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                        </button>

                        {/* Requests */}
                        <button
                          onClick={() => setActiveTab('requests')}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-stone-500 group-hover:text-stone-900" />
                            <div>
                              <div className="text-xs font-medium text-stone-800">Requests</div>
                              <div className="text-[11px] text-stone-500">1 active</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                        </button>

                        {/* Notifications */}
                        <button
                          onClick={() => setActiveTab('notifications')}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-stone-500 group-hover:text-stone-900" />
                            <div>
                              <div className="text-xs font-medium text-stone-800">Notifications</div>
                              <div className="text-[11px] text-stone-500">3 new</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                        </button>

                        {/* Membership */}
                        <button
                          onClick={() => setActiveTab('membership')}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <CreditCard className="w-4 h-4 text-stone-500 group-hover:text-stone-900" />
                            <div>
                              <div className="text-xs font-medium text-stone-800">Membership</div>
                              <div className="text-[11px] text-stone-500">Not yet a member</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                        </button>
                      </div>
                    </div>

                    {/* Upcoming / Relevant Information */}
                    <div className="bg-white rounded-xl p-6 flex flex-col justify-between text-center items-center">
                      <h4 className="font-serif text-sm font-semibold text-stone-900 self-start mb-2">
                        Upcoming / Relevant Information
                      </h4>

                      <div className="my-auto py-3 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 mb-2.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-semibold text-stone-800 mb-1">
                          No upcoming experiences
                        </div>
                        <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
                          Once you've been approved for an experience, you'll see the details here.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsExperienceModalOpen(true)}
                        className="bg-[#ECE5DD] hover:bg-[#E2D9CD] text-stone-800 text-xs font-medium px-4 py-2 rounded-md transition-colors inline-flex items-center gap-1 group mt-2"
                      >
                        <span>Explore Experiences</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    RIGHT COLUMN (4 cols) - BORDERLESS
                ------------------------------------------------------------- */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Card 1: Your Connection */}
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-serif text-base font-semibold text-stone-900 mb-4">
                      Your Connection
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Messages */}
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="w-full flex items-center justify-between text-left text-xs py-1 hover:text-stone-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 text-stone-700 group-hover:text-stone-900">
                          <Mail className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                          <span>Messages</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                          <span>2</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </div>
                      </button>

                      {/* Requests */}
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="w-full flex items-center justify-between text-left text-xs py-1 hover:text-stone-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 text-stone-700 group-hover:text-stone-900">
                          <FileText className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                          <span>Requests</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                          <span>1</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </div>
                      </button>

                      {/* Notifications */}
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="w-full flex items-center justify-between text-left text-xs py-1 hover:text-stone-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 text-stone-700 group-hover:text-stone-900">
                          <Bell className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                          <span>Notifications</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                          <span>3</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </div>
                      </button>

                      {/* Membership */}
                      <button
                        onClick={() => setActiveTab('membership')}
                        className="w-full flex items-center justify-between text-left text-xs py-1 hover:text-stone-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 text-stone-700 group-hover:text-stone-900">
                          <CreditCard className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                          <span>Membership</span>
                        </div>
                        <div className="text-stone-400 text-[11px]">
                          Not yet a member
                        </div>
                      </button>
                    </div>

                    {/* Gillian Quote */}
                    <div className="mt-5 pt-3">
                      <p className="font-serif italic text-xs leading-relaxed text-stone-600">
                        "The most important thing is to be genuine."
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">
                        — Gillian Anderson
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Important Updates */}
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-serif text-base font-semibold text-stone-900 mb-4">
                      Important Updates
                    </h4>

                    <div className="space-y-3.5">
                      {/* Update 1 */}
                      <div className="flex items-start gap-3">
                        <Star className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-stone-800 leading-tight">
                            New Membership Options
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            April 22, 2025
                          </div>
                        </div>
                      </div>

                      {/* Update 2 */}
                      <div className="flex items-start gap-3">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-stone-800 leading-tight">
                            Upcoming Virtual Experiences
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            April 18, 2025
                          </div>
                        </div>
                      </div>

                      {/* Update 3 */}
                      <div className="flex items-start gap-3">
                        <FileText className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-stone-800 leading-tight">
                            Request Guidelines Updated
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            April 15, 2025
                          </div>
                        </div>
                      </div>

                      {/* Update 4 */}
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-stone-800 leading-tight">
                            New Photos Available
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            April 12, 2025
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4">
                      <button
                        onClick={() => setIsReadUpdateOpen(true)}
                        className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors inline-flex items-center gap-1 group"
                      >
                        <span>View All Updates</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Be Part of Something Special */}
                  <div className="bg-white rounded-xl overflow-hidden p-5">
                    {/* Landscape thumbnail */}
                    <div className="h-32 rounded-lg overflow-hidden bg-stone-100 mb-3.5">
                      <img
                        src="/assets/images/iceland_landscape_1782919139830.jpg"
                        alt="Special Experiences"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h5 className="font-serif text-sm font-semibold text-stone-900 mb-1.5">
                      Be Part of Something Special
                    </h5>
                    <p className="text-[11px] text-stone-500 leading-relaxed mb-3.5">
                      Through Gillian Anderson Management, you can request unique experiences, join our member community, and be part of this extraordinary journey.
                    </p>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="text-xs font-semibold text-stone-800 hover:text-[#8F6E45] transition-colors inline-flex items-center gap-1 group"
                    >
                      <span>Learn More</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              VIEW: MESSAGES TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-6 mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-stone-900">Direct Messages</h2>
                  <p className="text-xs text-stone-500 mt-1">Official correspondence with Gillian Anderson Management</p>
                </div>
                <button
                  onClick={() => setIsSendMessageOpen(true)}
                  className="bg-[#8F6E45] hover:bg-[#7D5F3A] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose Message</span>
                </button>
              </div>

              {/* Message Threads */}
              <div className="space-y-4">
                {/* Message 1 (Unread) */}
                <div className="rounded-lg p-5 bg-stone-50 hover:bg-stone-100/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8F6E45]" />
                      <span className="text-xs font-semibold text-stone-900">Gillian Anderson Management</span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">Official</span>
                    </div>
                    <span className="text-[11px] text-stone-400">Yesterday, 3:45 PM</span>
                  </div>
                  <h4 className="text-sm font-medium text-stone-800 mb-1">Confirmation of Inquiry Reception</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Thank you for submitting your profile information to Gillian Anderson Management. We have received your preliminary preferences and our office team is currently cataloging inquiries for the autumn schedule.
                  </p>
                </div>

                {/* Message 2 (Unread) */}
                <div className="rounded-lg p-5 bg-stone-50 hover:bg-stone-100/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8F6E45]" />
                      <span className="text-xs font-semibold text-stone-900">Member Relations Desk</span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">Official</span>
                    </div>
                    <span className="text-[11px] text-stone-400">April 20, 2025</span>
                  </div>
                  <h4 className="text-sm font-medium text-stone-800 mb-1">Welcome to the Private Platform</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Welcome to the private fan portal, Sarah. If you have any specific inquiries regarding personal video messages, charitable causes, or archival access, please use the Requests tab.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: REQUESTS TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-6 mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-stone-900">Your Experience & Engagement Requests</h2>
                  <p className="text-xs text-stone-500 mt-1">Submit, monitor, and manage your private requests</p>
                </div>
                <button
                  onClick={() => setIsNewRequestOpen(true)}
                  className="bg-[#8F6E45] hover:bg-[#7D5F3A] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Submit New Request</span>
                </button>
              </div>

              {/* 1 Active Request */}
              <div className="p-5 mb-4 bg-stone-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900">Personal Video Message Request</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Under Management Review
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">Ref: #REQ-2025-084</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                  Request for a congratulatory milestone video message for an upcoming anniversary. Management has received the brief and is verifying availability with Gillian's autumn schedule.
                </p>
                <div className="text-[11px] text-stone-400 flex items-center gap-4 pt-2.5">
                  <span>Submitted: April 16, 2025</span>
                  <span>Estimated Response: 5-7 business days</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: MEMBERSHIP TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'membership' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-8">
                <div className="w-10 h-10 rounded-full bg-[#8F6E45]/10 text-[#8F6E45] flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-2xl font-medium text-stone-900">Private Membership</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Private membership connects approved supporters with exclusive archival releases, priority review for engagements, and direct management correspondence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tier 1: Supporter */}
                <div className="rounded-xl p-6 bg-stone-50 hover:bg-stone-100/70 transition-all flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-stone-900 mb-1">Fan Member</h3>
                    <p className="text-xs text-stone-500 mb-4">Standard approved digital access</p>
                    <ul className="text-xs text-stone-600 space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
                        <span>Access to private portal & official updates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
                        <span>Direct messaging to Gillian's management desk</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
                        <span>Ability to submit experience requests</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Current Status: Active
                    </span>
                  </div>
                </div>

                {/* Tier 2: Curated Patron Tier */}
                <div className="rounded-xl p-6 bg-[#FAF6F0] flex flex-col justify-between relative">
                  <div className="absolute top-3 right-3 bg-[#8F6E45] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                    Featured
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-stone-900 mb-1">Patron & Archival Circle</h3>
                    <p className="text-xs text-stone-500 mb-4">Curated patron membership supporting Gillian's causes</p>
                    <ul className="text-xs text-stone-600 space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8F6E45]" />
                        <span>Priority request review by management office</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8F6E45]" />
                        <span>Invitation to private virtual member roundtables</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8F6E45]" />
                        <span>Signed archival print & official membership card</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(true);
                        setRequestType('Membership Inquiry');
                      }}
                      className="w-full bg-[#8F6E45] hover:bg-[#7D5F3A] text-white text-xs font-medium py-2 rounded-md transition-colors"
                    >
                      Inquire About Patron Membership
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: NOTIFICATIONS TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
              <div className="pb-6 mb-6">
                <h2 className="font-serif text-2xl font-medium text-stone-900">System & Activity Notifications</h2>
                <p className="text-xs text-stone-500 mt-1">Track key alerts regarding your account and submissions</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg flex items-start gap-3 bg-stone-50">
                  <Star className="w-4 h-4 text-[#8F6E45] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-stone-900">New Membership Options Announced</div>
                    <div className="text-xs text-stone-500 mt-0.5">Management has updated the available patron membership tiers.</div>
                    <div className="text-[10px] text-stone-400 mt-1">April 22, 2025</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg flex items-start gap-3 bg-stone-50">
                  <Clock className="w-4 h-4 text-[#8F6E45] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-stone-900">Request #REQ-2025-084 In Progress</div>
                    <div className="text-xs text-stone-500 mt-0.5">Your request for a personal video message has moved into internal review.</div>
                    <div className="text-[10px] text-stone-400 mt-1">April 17, 2025</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg flex items-start gap-3 bg-stone-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-stone-900">Account Verified</div>
                    <div className="text-xs text-stone-500 mt-0.5">Your fan profile credentials have been approved for management platform access.</div>
                    <div className="text-[10px] text-stone-400 mt-1">April 15, 2025</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: PROFILE TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 pb-6 mb-6">
                <img
                  src={userAvatar}
                  alt={fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-serif text-2xl font-medium text-stone-900">{fullName}</h2>
                  <p className="text-xs text-stone-500 mt-0.5">Member ID: #GA-892410 • Verified Account</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={fullName}
                    className="w-full border-0 rounded-md p-2 bg-stone-100 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'sarah.johnson@example.com'}
                    className="w-full border-0 rounded-md p-2 bg-stone-100 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Preferred Communication</label>
                  <input
                    type="text"
                    disabled
                    value="Platform Direct Messaging & Email"
                    className="w-full border-0 rounded-md p-2 bg-stone-100 text-stone-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: SETTINGS TAB - BORDERLESS
          ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
              <div className="pb-6 mb-6">
                <h2 className="font-serif text-2xl font-medium text-stone-900">Account Settings</h2>
                <p className="text-xs text-stone-500 mt-1">Configure your privacy, notifications, and security preferences</p>
              </div>

              <div className="space-y-5 text-xs text-stone-700">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-stone-900">Email Notifications</div>
                    <div className="text-[11px] text-stone-500">Receive an email whenever management updates your request</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-[#8F6E45] focus:ring-[#8F6E45]" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-stone-900">Announcements & Event Invites</div>
                    <div className="text-[11px] text-stone-500">Stay informed about virtual events and booking windows</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-[#8F6E45] focus:ring-[#8F6E45]" />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (signOut) signOut();
                      navigate('/');
                    }}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Sign Out of Account
                  </button>
                  <button
                    onClick={() => alert('Settings saved successfully.')}
                    className="bg-[#8F6E45] hover:bg-[#7D5F3A] text-white px-4 py-2 rounded-md font-medium"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODAL: SEND A MESSAGE - BORDERLESS
      ========================================================================= */}
      {isSendMessageOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsSendMessageOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-[#8F6E45]" />
              <h3 className="font-serif text-lg font-medium text-stone-900">Message Gillian Anderson Management</h3>
            </div>

            {messageSentSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-base font-semibold text-stone-900 mb-1">Message Sent to Management</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Your message has been delivered to Gillian's desk team. You will be notified when a reply is posted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessageSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Question regarding upcoming film screening or archival request"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full text-xs bg-stone-100/80 border-0 rounded-md p-2.5 focus:outline-none focus:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your note to Gillian's management team..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full text-xs bg-stone-100/80 border-0 rounded-md p-2.5 focus:outline-none focus:bg-stone-100"
                  />
                </div>
                <div className="text-[11px] text-stone-400 leading-normal">
                  All correspondence is handled discreetly and reviewed directly by Gillian Anderson Management.
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSendMessageOpen(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 text-xs rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8F6E45] hover:bg-[#7D5F3A] text-white text-xs rounded-md font-medium shadow-none"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MAKE A REQUEST - BORDERLESS
      ========================================================================= */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsNewRequestOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#8F6E45]" />
              <h3 className="font-serif text-lg font-medium text-stone-900">Submit a Personal or Experience Request</h3>
            </div>

            {requestSentSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-base font-semibold text-stone-900 mb-1">Request Received</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Your request has been logged and assigned to Gillian's coordination office.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full text-xs bg-stone-100/80 border-0 rounded-md p-2.5 focus:outline-none"
                  >
                    <option value="Personal Video Message">Personal Video Message (Milestone / Occasion)</option>
                    <option value="Virtual Meet & Greet">Private Virtual Conversation</option>
                    <option value="Archival / Memorabilia Inquiry">Signed Memorabilia / Script Inquiry</option>
                    <option value="Membership Inquiry">Patron Membership Inquiry</option>
                    <option value="Charity & Advocacy">Charitable Cause / Endorsement Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Details & Timing Requirements</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about recipient, relevant date, and background..."
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    className="w-full text-xs bg-stone-100/80 border-0 rounded-md p-2.5 focus:outline-none"
                  />
                </div>
                <div className="text-[11px] text-stone-400 leading-normal">
                  Requests are reviewed against Gillian's production schedule. Submission does not guarantee availability.
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRequestOpen(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 text-xs rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8F6E45] hover:bg-[#7D5F3A] text-white text-xs rounded-md font-medium shadow-none"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: READ UPDATE DETAILS - BORDERLESS
      ========================================================================= */}
      {isReadUpdateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsReadUpdateOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
              {updatesData[currentUpdateSlide].date}
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-900 mb-4 leading-snug">
              {updatesData[currentUpdateSlide].title}
            </h3>

            <div className="h-44 rounded-lg overflow-hidden mb-4 bg-stone-100">
              <img
                src={updatesData[currentUpdateSlide].image}
                alt={updatesData[currentUpdateSlide].title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed mb-6">
              {updatesData[currentUpdateSlide].fullContent}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setIsReadUpdateOpen(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs rounded-md font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EXPLORE EXPERIENCES - BORDERLESS
      ========================================================================= */}
      {isExperienceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsExperienceModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-2xl font-medium text-stone-900 mb-1">Available Experience Formats</h3>
            <p className="text-xs text-stone-500 mb-6">Curated opportunities coordinated directly by Gillian Anderson Management</p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-stone-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-stone-900 mb-1">Personal Video Dedication</h4>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    A personalized recorded message from Gillian for significant life occasions, anniversaries, or encouragement.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsExperienceModalOpen(false);
                    setIsNewRequestOpen(true);
                    setRequestType('Personal Video Message');
                  }}
                  className="self-start text-xs font-semibold text-[#8F6E45] hover:text-[#7D5F3A]"
                >
                  Submit Request →
                </button>
              </div>

              <div className="p-4 rounded-lg bg-stone-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-stone-900 mb-1">Private Virtual Dialogue</h4>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    One-on-one structured video conversation facilitated with Gillian's team for career mentorship, arts inquiry, or philanthropy.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsExperienceModalOpen(false);
                    setIsNewRequestOpen(true);
                    setRequestType('Virtual Meet & Greet');
                  }}
                  className="self-start text-xs font-semibold text-[#8F6E45] hover:text-[#7D5F3A]"
                >
                  Submit Request →
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsExperienceModalOpen(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 text-xs rounded-md font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
