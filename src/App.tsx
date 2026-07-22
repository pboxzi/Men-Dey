/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
  Star,
  Crown,
  Calendar,
  HelpCircle,
  Heart,
  Play,
  ArrowRight,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  Check,
  Instagram,
  Youtube,
  Music,
  Menu,
  X,
  Award,
  Compass,
  Pause,
  Sparkles,
  Home,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from './utils/theme';
import { useAuth } from './utils/AuthContext';

// Import Types
import { JournalEntry, MediaItem } from './types';

// Import Static Data
import {
  HERO_SLIDES,
  MEDIA_ITEMS
} from './data';

// Import Custom Modals & Pages

import VideoPlayerModal from './components/VideoPlayerModal';

import ExperienceModal from './components/ExperienceModal';
import MembershipModal from './components/MembershipModal';
import Modal from './components/Modal';
import { TermsOfServiceModal, PrivacyPolicyModal } from './components/LegalModals';

// Import Core Inline Sections
import AboutSection from './components/AboutSection';
import JournalSection from './components/JournalSection';
import MediaSection from './components/MediaSection';
import CommunitySection from './components/CommunitySection';
import EventsSection from './components/EventsSection';
import ExperiencesSection from './components/ExperiencesSection';
import MembershipSection from './components/MembershipSection';


import FAQSection from './components/FAQSection';
import FanPortal from './components/FanPortal';
import AdminPortal from './components/AdminPortal';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
      transition={{
        type: 'spring',
        stiffness: 55,
        damping: 18,
        duration: 0.7,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
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

  const navigate = useNavigate();
  const location = useLocation();

  const pathToNav: Record<string, string> = {
    '/': 'HOME',
    '/about': 'ABOUT',
    '/journal': 'JOURNAL',
    '/media': 'MEDIA',
    '/community': 'COMMUNITY',
    '/experiences': 'EXPERIENCES',
    '/membership': 'MEMBERSHIP',
    '/events': 'EVENTS',
    '/faq': 'FAQ',
  };

  const getViewFromPath = (pathname: string) => {
    if (pathname === '/portal') return { vm: 'portal' as const, nav: 'HOME' };
    if (pathname === '/admin') return { vm: 'admin' as const, nav: 'HOME' };
    if (pathname.startsWith('/experiences/book/')) return { vm: 'landing' as const, nav: 'EXPERIENCES' };
    const nav = pathToNav[pathname] || 'HOME';
    return { vm: 'landing' as const, nav };
  };

  const resolved = getViewFromPath(location.pathname);

  const viewMode = resolved.vm;
  const activeNav = resolved.nav;

  // User Authentication & Profile States (Landing Page level)
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const isLoggedIn = !!user;
  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // Mobile navigation collapsible menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);

  // Scroll progress indicator state for long-form content navigation
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Global Scroll Reset when navigation changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Hero Slider State
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlayingSlide, setIsPlayingSlide] = useState(true);

  // Auto-rotate Hero Slides with elegant interval
  useEffect(() => {
    if (!isPlayingSlide) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlayingSlide, currentSlideIdx]);

  // State to track loaded status of images for progressive blur-up / shimmer
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => ({ ...prev, [src]: true }));
  };

  // Preload all hero images and critical app assets on mount (non-blocking)
  useEffect(() => {
    // 1. Preload the current first hero slide with high priority
    const firstHero = new Image();
    firstHero.src = HERO_SLIDES[0].image;

    // 2. Preload all other hero images
    HERO_SLIDES.slice(1).forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });

    // 3. Preload core section images after a short delay (non-blocking)
    const timer = setTimeout(() => {
      const otherImages = [
        '/assets/images/pillar_ask_gillian_1784103625430.jpg',
        '/assets/images/pillar_events_1784103610855.jpg',
        '/assets/images/pillar_experiences_1784103582190.jpg',
        '/assets/images/pillar_membership_1784103595657.jpg',
      ];
      otherImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Modal Triggers

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  
  // Legal Modals Triggers
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Newsletter Subscription
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  // Search Toggle (Simulated)
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNextSlide = () => {
    setCurrentSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleEmailChange = (val: string) => {
    setSubscribeEmail(val);
    if (!val) {
      setSubscribeError(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setSubscribeError('Please enter a valid email address.');
      } else {
        setSubscribeError(null);
      }
    }
  };

  // Newsletter Subscription submit
  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      setSubscribeError('Please enter a valid email address.');
      return;
    }

    setSubscribed(true);
    setSubscribeEmail('');
    setSubscribeError(null);
  };

  const handleNavClick = (link: string) => {
    setMobileMenuOpen(false);
    navigate(link === 'HOME' ? '/' : `/${link.toLowerCase()}`);
  };

  const navigateTo = (mode: 'landing' | 'portal' | 'admin', nav?: string) => {
    if (mode === 'landing') {
      const section = nav || 'HOME';
      navigate(section === 'HOME' ? '/' : `/${section.toLowerCase()}`);
    }
    else if (mode === 'portal') navigate('/portal');
    else if (mode === 'admin') navigate('/admin');
  };

  // New structured navigation for the Portal and Admin sections
  const handleSectionNavigation = (section: 'portal' | 'admin', category?: string, item?: string) => {
    if (section === 'portal') {
      navigate('/portal');
    } else if (section === 'admin') {
      navigate('/admin');
      window.dispatchEvent(new CustomEvent('adminNavigation', {
        detail: { category, item }
      }));
    }
  };

  const activeSlide = HERO_SLIDES[currentSlideIdx];

  // Hero entry animation variants with elegant spring stiffness and stagger
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
      },
    },
  };

  const heroScaleVariants = {
    hidden: { opacity: 0, scale: 0.94, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 16,
      },
    },
  };

  // Loading gate: show welcome skeleton while profile loads after sign-in
  if (authLoading && user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Star className="h-7 w-7 text-gold-500" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-xl font-bold text-white tracking-widest">WELCOME BACK</h1>
            <p className="text-xs font-mono text-neutral-500 tracking-wider">Preparing your portal...</p>
          </div>
          <div className="w-48 h-1 mx-auto bg-neutral-900 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full" style={{ animation: 'shimmer 1.5s ease-in-out infinite', width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Auto-redirect admin to admin portal
  if (user && profile?.role === 'admin' && viewMode !== 'admin') {
    navigate('/admin', { replace: true });
    return null;
  }

  if (viewMode === 'portal') {
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
      return null;
    }
    return <FanPortal onBackToHome={() => navigateTo('landing')} />;
  }

  if (viewMode === 'admin') {
    return <AdminPortal onBackToHome={() => navigateTo('landing')} />;
  }

  return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans selection:bg-gold-500 selection:text-neutral-950 pb-24 lg:pb-0 w-full max-w-full">
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900/60 bg-[#050505]/95 backdrop-blur-md">
        <div className="mx-auto flex items-center px-3 py-2.5 sm:px-4 md:px-6 gap-2 sm:gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0" onClick={(e) => { e.preventDefault(); handleNavClick('HOME'); }}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center group-hover:border-gold-500/40 transition-colors">
              <span className="font-serif text-sm font-bold text-gold-500">GA</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[11px] font-bold tracking-[0.12em] text-white leading-tight">
                GILLIAN ANDERSON
              </span>
              <span className="text-[8px] font-mono tracking-[0.2em] text-gold-500/70 leading-tight">
                OFFICIAL
              </span>
            </div>
          </a>

          {/* Desktop Navigation — centered */}
          <nav className="hidden lg:flex items-center justify-center gap-0.5 flex-1 min-w-0">
            {[
              'HOME',
              'ABOUT',
              'JOURNAL',
              'MEDIA',
              'COMMUNITY',
              'EXPERIENCES',
              'MEMBERSHIP',
              'EVENTS',
              'FAQ',
            ].map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className={`relative px-3 py-2 text-[10px] font-semibold tracking-[0.15em] transition-all rounded-md whitespace-nowrap ${
                  activeNav === link
                    ? 'text-gold-500'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {link}
                {activeNav === link && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gold-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auth Buttons (logged out) or Profile Menu (logged in) */}
            {!user ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => navigate('/portal?mode=login')}
                  className="px-3 py-1.5 text-[9px] font-bold tracking-widest text-neutral-300 hover:text-white border border-neutral-800 hover:border-gold-500/30 rounded-lg transition-all">
                  SIGN IN
                </button>
                <button onClick={() => navigate('/portal?mode=register')}
                  className="px-3 py-1.5 text-[9px] font-bold tracking-widest text-neutral-950 bg-gold-500 hover:bg-gold-400 rounded-lg transition-all">
                  JOIN
                </button>
              </div>
            ) : (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-full border border-neutral-800 hover:border-gold-500/40 bg-neutral-900/50 transition-all active:scale-95 relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-gold-500" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gold-500 rounded-full border-2 border-[#050505]" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-2xl shadow-black/60 z-50 overflow-hidden">
                        {profile?.role !== 'admin' && (
                          <div className="p-2">
                            <button onClick={() => { navigate('/portal'); setProfileOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-left border border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                                <Star className="h-4 w-4 text-gold-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gold-500 tracking-wide">MY PORTAL</p>
                                <p className="text-[9px] text-neutral-400 tracking-wide">Your personal sanctuary</p>
                              </div>
                            </button>
                          </div>
                        )}
                        <div className="border-t border-neutral-800 p-2">
                          <button onClick={() => { signOut(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-neutral-900 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-neutral-400" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-neutral-200 tracking-wide">Sign Out</p>
                              <p className="text-[9px] text-neutral-500 tracking-wide">See you soon</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Subtle global scroll progress indicator */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900/40 pointer-events-none z-50 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-gold-500 to-amber-500 transition-all duration-75"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* 2. Hero Section */}
      {activeNav === 'HOME' && (
        <section className="relative overflow-hidden bg-[#050505] py-10 md:py-24 border-b border-neutral-900/60">
          {/* Elegant Architectural Tech-Arts Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
          
          {/* Glowing Ambient Spotlights */}
          <div className="absolute top-12 left-10 h-72 w-72 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-12 right-20 h-96 w-96 rounded-full bg-amber-500/3 blur-[140px] pointer-events-none" />

          {/* Simulated Slow Moving Spotlight Beam */}
          <div className="absolute -top-40 left-1/3 w-[300px] sm:w-[500px] h-[600px] bg-gradient-to-b from-gold-500/3 via-transparent to-transparent -rotate-12 blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
            <motion.div 
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center"
            >
              
              {/* Left: Interactive Slide Visualizer */}
              <motion.div variants={heroScaleVariants} className="lg:col-span-4 relative group flex flex-col items-center order-2 lg:order-none">
                <div className="relative aspect-[3/4] w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[300px] overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950 shadow-[0_0_50px_-12px_rgba(212,163,89,0.15)] transition-all duration-500 group-hover:border-gold-500/30">
                  {/* Visual filter transitions on slide change */}
                  <motion.div
                    key={currentSlideIdx}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="h-full w-full relative"
                  >
                    {/* Premium Shimmer Skeleton Loader (Only visible while image is loading) */}
                    {!loadedImages[activeSlide.image] && (
                      <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/40 to-neutral-950 animate-pulse" />
                        <div className="w-8 h-8 rounded-full border border-gold-500/10 flex items-center justify-center animate-spin">
                          <div className="w-5 h-5 rounded-full border-t border-gold-500/40" />
                        </div>
                      </div>
                    )}
                    <img
                      src={activeSlide.image}
                      alt="Gillian Anderson Portrait"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      // @ts-ignore
                      fetchpriority="high"
                      onLoad={() => handleImageLoad(activeSlide.image)}
                      className={`h-full w-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700 ${
                        loadedImages[activeSlide.image] ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
                      }`}
                    />
                    {/* Subtle Warm Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10" />
                  </motion.div>

                  {/* Vertical Navigation Slide Counts */}
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 font-mono text-[9px] text-neutral-500 z-10">
                    <span className="text-gold-500 font-bold text-xs">{activeSlide.number}</span>
                    <div className="h-10 w-[1px] bg-neutral-800" />
                    <span className="font-semibold">05</span>
                  </div>

                  {/* Left/Right Slider Controls */}
                  <div className="absolute bottom-5 right-5 flex gap-1.5 z-10">
                    <button
                      onClick={() => {
                        handlePrevSlide();
                        setIsPlayingSlide(false); // Pause on manual action
                      }}
                      className="p-2 rounded-full border border-neutral-800/80 bg-black/80 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleNextSlide();
                        setIsPlayingSlide(false); // Pause on manual action
                      }}
                      className="p-2 rounded-full border border-neutral-800/80 bg-black/80 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Smooth progress bar under slide image */}
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-900/60 z-20">
                    <motion.div
                      key={currentSlideIdx}
                      initial={{ width: '0%' }}
                      animate={isPlayingSlide ? { width: '100%' } : { width: '0%' }}
                      transition={{ duration: 6, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-gold-500 to-amber-400 shadow-[0_0_8px_#d4a359]"
                    />
                  </div>
                </div>

                {/* Dots Indicator & Play/Pause below image card */}
                <div className="flex items-center gap-2 mt-4">
                  {HERO_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => {
                        setCurrentSlideIdx(idx);
                        setIsPlayingSlide(false);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlideIdx === idx
                          ? 'w-6 bg-gold-500'
                          : 'w-2 bg-neutral-850 hover:bg-neutral-700'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                  <div className="w-[1px] h-3 bg-neutral-800 mx-1" />
                  <button
                    onClick={() => setIsPlayingSlide(!isPlayingSlide)}
                    className="p-1 rounded text-neutral-500 hover:text-gold-500 transition-colors"
                    title={isPlayingSlide ? "Pause Autoplay" : "Resume Autoplay"}
                  >
                    {isPlayingSlide ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3 fill-current" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Name — mobile only as separate grid item */}
              <div className="lg:hidden text-center space-y-5 sm:space-y-7 order-1">
                <motion.div variants={heroItemVariants} className="space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="h-[1px] w-5 bg-gold-500/40" />
                    <span className="text-[10px] font-mono tracking-[0.3em] text-gold-500 uppercase font-bold">
                      THE ARCHIVE SANCTUARY
                    </span>
                    <span className="h-[1px] w-5 bg-gold-500/40" />
                  </div>
                  {userName ? (
                    <h1 className="font-serif text-[28px] sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-neutral-400 leading-[1.1] uppercase">
                      Welcome back,
                      <span className="text-white hover:text-gold-500 transition-colors duration-500">{userName}</span>
                    </h1>
                  ) : (
                    <h1 className="font-serif text-[28px] sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400 leading-[1.05] uppercase">
                      GILLIAN
                      <span className="text-white hover:text-gold-500 transition-colors duration-500">ANDERSON</span>
                    </h1>
                  )}
                </motion.div>
              </div>

              {/* Quote, Buttons, Achievements — mobile order-3, desktop has name+rest */}
              <div className="lg:col-span-5 text-center lg:text-left space-y-5 sm:space-y-7 order-3 lg:order-none">
                {/* Name — desktop only inside this container */}
                <motion.div variants={heroItemVariants} className="hidden lg:block space-y-2">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <span className="h-[1px] w-5 bg-gold-500/40" />
                    <span className="text-[10px] font-mono tracking-[0.3em] text-gold-500 uppercase font-bold">
                      THE ARCHIVE SANCTUARY
                    </span>
                    <span className="h-[1px] w-5 bg-gold-500/40" />
                  </div>
                  {userName ? (
                    <h1 className="font-serif text-5xl xl:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-neutral-400 leading-[1.1] uppercase">
                      Welcome back, <br />
                      <span className="text-white hover:text-gold-500 transition-colors duration-500">{userName}</span>
                    </h1>
                  ) : (
                    <h1 className="font-serif text-5xl xl:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400 leading-[1.05] uppercase">
                      GILLIAN <br />
                      <span className="text-white hover:text-gold-500 transition-colors duration-500">ANDERSON</span>
                    </h1>
                  )}
                </motion.div>

                {/* Slider Quote Container */}
                <motion.div variants={heroItemVariants} className="min-h-[110px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlideIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <p className="font-serif italic text-base md:text-lg text-neutral-300 leading-relaxed max-w-md">
                        "{activeSlide.quote}"
                      </p>
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <div className="h-[1px] w-5 bg-gold-500/50" />
                        <span className="font-serif text-xs font-semibold tracking-wider text-gold-500 italic">
                          {activeSlide.author}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Primary Buttons */}
                <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-2 sm:gap-3.5 justify-center lg:justify-start pt-1">
                  <button
                    onClick={() => navigate('/portal?mode=register')}
                    className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold px-6 py-3 rounded-lg text-xs tracking-widest transition-all hover:shadow-[0_0_20px_rgba(212,163,89,0.3)] active:scale-95 shadow-lg shadow-gold-500/10"
                  >
                    JOIN THE COMMUNITY
                  </button>
                  <button
                    onClick={() => {
                      const videoItem = MEDIA_ITEMS.find((m) => m.id === 'media-bts') || MEDIA_ITEMS[0];
                      setSelectedMedia(videoItem);
                    }}
                    className="border border-neutral-800 hover:border-gold-500/60 bg-neutral-950 hover:bg-gold-500/5 text-gold-500 hover:text-white font-semibold px-5 py-3 rounded-lg text-xs tracking-widest transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Play className="h-3.5 w-3.5 fill-gold-500 hover:fill-white" />
                    WATCH MESSAGE
                  </button>
                </motion.div>

                {/* Achievements Bento Badge */}
                <motion.div variants={heroItemVariants} className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md pt-2">
                  <div className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 hover:bg-neutral-950/60 transition-all flex flex-col text-left group">
                    <span className="font-serif text-base sm:text-lg font-bold text-gold-500 tracking-tight flex items-center gap-1">
                      30+
                      <Compass className="h-3 w-3 text-gold-500/60 group-hover:rotate-45 transition-transform" />
                    </span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider leading-tight mt-1">Years on Stage & Screen</span>
                  </div>
                  <div className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 hover:bg-neutral-950/60 transition-all flex flex-col text-left group">
                    <span className="font-serif text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1">
                      2x
                      <Award className="h-3 w-3 text-amber-500/60 group-hover:scale-110 transition-transform animate-pulse" />
                    </span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider leading-tight mt-1">Emmys & Golden Globes</span>
                  </div>
                  <div className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 hover:bg-neutral-950/60 transition-all flex flex-col text-left group">
                    <span className="font-serif text-base sm:text-lg font-bold text-gold-500 tracking-tight flex items-center gap-1">
                      100%
                      <Sparkles className="h-3 w-3 text-gold-500/60 group-hover:scale-110 transition-transform" />
                    </span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider leading-tight mt-1">Empowering Advocacy</span>
                  </div>
                </motion.div>

                {/* Social Proof fans banner */}
                <motion.div variants={heroItemVariants} className="flex items-center gap-3 pt-4 justify-center lg:justify-start border-t border-neutral-900 max-w-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((num) => (
                      <div
                        key={num}
                        className="h-7 w-7 rounded-full border border-neutral-950 bg-neutral-900 flex items-center justify-center text-[9px] font-mono font-bold text-neutral-300 overflow-hidden shadow-inner"
                      >
                        {['AM', 'JW', 'ND', 'KR'][num - 1]}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                      24.2M+ Subscribers & Followers
                    </span>
                    <span className="text-[9px] font-mono text-gold-500/80 font-bold">
                      Worldwide Community
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right: Monthly Video Box — hidden on mobile */}
              <motion.div variants={heroScaleVariants} className="hidden lg:block lg:col-span-3">
                <div className="rounded-2xl border border-neutral-900/80 bg-neutral-950/80 p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-neutral-800 transition-all">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest pb-2 border-b border-neutral-900">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                    </span>
                    <span>MONTHLY ARCHIVE VIDEO</span>
                  </div>

                  {/* Video Image Container */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-900 bg-neutral-900 group">
                    <img
                      src="/assets/images/gillian_theatre_rehearsal_1783349680324.jpg"
                      alt="Monthly Video Message Thumbnail"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Backdrop Overlay */}
                    <div className="absolute inset-0 bg-black/20" />
                    
                    {/* Floating Play Button */}
                    <button
                      onClick={() => {
                        const videoItem = MEDIA_ITEMS.find((m) => m.id === 'media-bts') || MEDIA_ITEMS[0];
                        setSelectedMedia(videoItem);
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                      aria-label="Play video"
                    >
                      <div className="p-3.5 rounded-full bg-gold-500 text-neutral-950 transition-transform group-hover:scale-110 shadow-lg shadow-gold-500/20 active:scale-90">
                        <Play className="h-5 w-5 fill-neutral-950" />
                      </div>
                    </button>
                  </div>

                  <div className="space-y-1 text-left">
                    <h3 className="text-xs font-semibold text-white tracking-wider uppercase">
                      A message to you all
                    </h3>
                    <p className="text-[9px] font-mono text-neutral-500 tracking-widest">
                      ARCHIVE PREVIEW
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const videoItem = MEDIA_ITEMS.find((m) => m.id === 'media-bts') || MEDIA_ITEMS[0];
                      setSelectedMedia(videoItem);
                    }}
                    className="w-full text-center border border-neutral-800 hover:border-gold-500/50 hover:bg-gold-500/5 text-[10px] font-mono text-neutral-400 hover:text-gold-500 font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    WATCH NOW
                  </button>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>
      )}

      {/* Main Single-Scroll / Subpage Router Container */}
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {activeNav === 'HOME' && (
              <div className="space-y-0">
                {/* About Section */}
                <ScrollReveal>
                  <AboutSection />
                </ScrollReveal>

                {/* Six Community Pillars Navigation Cards */}
                <ScrollReveal>
                  <section className="py-12 sm:py-20 bg-[#050505] border-t border-neutral-900/60 relative overflow-hidden">
                    {/* Subtle aesthetic lines */}
                    <div className="absolute top-0 left-10 w-[1px] h-full bg-neutral-900/30 pointer-events-none" />
                    <div className="absolute top-0 right-10 w-[1px] h-full bg-neutral-900/30 pointer-events-none" />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-10 sm:space-y-16 relative z-10">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[9px] font-mono tracking-widest uppercase font-bold">
                          <Star className="h-3 w-3 animate-pulse" />
                          THE CO-OPERATIVE SANCTUARY
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                          Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-amber-300">Pillars</span>
                        </h2>
                        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto" />
                        <p className="text-xs text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
                          Enter our designated portals. Click any interactive architectural pillar below to explore, collaborate, and access official logs.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
                        {/* Experiences Card */}
                        <button
                          onClick={() => handleNavClick('EXPERIENCES')}
                          className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-neutral-900 bg-[#070707] hover:border-gold-500/40 hover:bg-neutral-950/90 transition-all duration-500 group text-left relative overflow-hidden min-h-[180px] sm:min-h-[230px] shadow-lg shadow-black/40"
                        >
                          {/* Rich Background Visual */}
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_experiences_1784103582190.jpg"
                              alt="Experiences Background"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover opacity-[0.05] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700 grayscale"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                          </div>

                          <div className="absolute top-4 right-4 font-mono text-[9px] text-neutral-700 group-hover:text-gold-500/40 transition-colors z-10">
                            01
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-2.5 inline-block rounded-xl bg-neutral-900 border border-neutral-850 text-gold-500 group-hover:bg-gold-500/10 group-hover:border-gold-500/20 transition-all duration-300">
                              <Star className="h-4 w-4" />
                            </span>
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold tracking-wider text-white uppercase group-hover:text-gold-500 transition-colors">
                                EXPERIENCES
                              </h3>
                              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                                Apply for exclusive once-in-a-lifetime events & custom sessions.
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-semibold tracking-wider text-gold-500/80 group-hover:text-gold-500 transition-colors flex items-center gap-1 mt-6 relative z-10">
                            LAUNCH DIRECTORY <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                        {/* Membership Card */}
                        <button
                          onClick={() => handleNavClick('MEMBERSHIP')}
                          className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-neutral-900 bg-[#070707] hover:border-gold-500/40 hover:bg-neutral-950/90 transition-all duration-500 group text-left relative overflow-hidden min-h-[180px] sm:min-h-[230px] shadow-lg shadow-black/40"
                        >
                          {/* Rich Background Visual */}
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_membership_1784103595657.jpg"
                              alt="Membership Background"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover opacity-[0.05] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700 grayscale"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                          </div>

                          <div className="absolute top-4 right-4 font-mono text-[9px] text-neutral-700 group-hover:text-gold-500/40 transition-colors z-10">
                            02
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-2.5 inline-block rounded-xl bg-neutral-900 border border-neutral-850 text-gold-500 group-hover:bg-gold-500/10 group-hover:border-gold-500/20 transition-all duration-300">
                              <Crown className="h-4 w-4" />
                            </span>
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold tracking-wider text-white uppercase group-hover:text-gold-500 transition-colors">
                                MEMBERSHIP
                              </h3>
                              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                                Become an official co-op member & view customized cards.
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-semibold tracking-wider text-gold-500/80 group-hover:text-gold-500 transition-colors flex items-center gap-1 mt-6 relative z-10">
                            TIERS & CARD <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                        {/* Events Card */}
                        <button
                          onClick={() => handleNavClick('EVENTS')}
                          className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-neutral-900 bg-[#070707] hover:border-gold-500/40 hover:bg-neutral-950/90 transition-all duration-500 group text-left relative overflow-hidden min-h-[180px] sm:min-h-[230px] shadow-lg shadow-black/40"
                        >
                          {/* Rich Background Visual */}
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_events_1784103610855.jpg"
                              alt="Events Background"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover opacity-[0.05] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700 grayscale"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                          </div>

                          <div className="absolute top-4 right-4 font-mono text-[9px] text-neutral-700 group-hover:text-gold-500/40 transition-colors z-10">
                            03
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-2.5 inline-block rounded-xl bg-neutral-900 border border-neutral-850 text-gold-500 group-hover:bg-gold-500/10 group-hover:border-gold-500/20 transition-all duration-300">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold tracking-wider text-white uppercase group-hover:text-gold-500 transition-colors">
                                EVENTS
                              </h3>
                              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                                Attend private live Q&As & commemorative anniversaries.
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-semibold tracking-wider text-gold-500/80 group-hover:text-gold-500 transition-colors flex items-center gap-1 mt-6 relative z-10">
                            CONCLAVES <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                {/* Journal Section */}
                <ScrollReveal>
                  <JournalSection />
                </ScrollReveal>

                {/* Media Section */}
                <ScrollReveal>
                  <MediaSection />
                </ScrollReveal>

                {/* Community Section */}
                <ScrollReveal>
                  <CommunitySection />
                </ScrollReveal>

                {/* FAQ Section */}
                <ScrollReveal>
                  <FAQSection />
                </ScrollReveal>

                {/* Fast interactive portal prompt to finish landing */}
                <ScrollReveal>
                  <section className="py-12 sm:py-20 bg-neutral-950/20 border-t border-neutral-900/60">
                    <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
                      <h3 className="font-serif text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
                        Be Excellent To <span className="text-gold-500">Each Other</span>
                      </h3>
                      <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
                        Access our interactive custom portals to chat, write custom blogs, share high-definition photographs, and review opportunities.
                      </p>
                      <button
                        onClick={() => user ? navigate('/portal') : navigate('/portal?mode=register')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs tracking-widest uppercase transition-all"
                      >
                        {user ? 'ENTER YOUR PORTAL' : 'JOIN THE COMMUNITY'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                </ScrollReveal>
              </div>
            )}

            {activeNav === 'ABOUT' && <AboutSection />}
            {activeNav === 'JOURNAL' && <JournalSection />}
            {activeNav === 'MEDIA' && <MediaSection />}
            {activeNav === 'COMMUNITY' && <CommunitySection />}
            {activeNav === 'EXPERIENCES' && <ExperiencesSection />}
            {activeNav === 'MEMBERSHIP' && <MembershipSection />}
            {activeNav === 'EVENTS' && (
              <div className="py-8">
                <EventsSection />
              </div>
            )}
            {activeNav === 'FAQ' && <FAQSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 6. Footer — only on HOME */}
      {activeNav === 'HOME' && (
      <footer className="border-t border-neutral-900 bg-[#030303] py-8 sm:py-12 pb-24 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-12 items-center">
            
            {/* Left Column: Footer Info (4 Cols) */}
            <div className="md:col-span-4 text-center md:text-left space-y-2">
              <h4 className="text-xs font-bold tracking-widest text-white uppercase">
                STAY CONNECTED
              </h4>
              <p className="text-[11px] leading-relaxed text-neutral-400 max-w-xs mx-auto md:mx-0">
                Get the latest updates, news, and exclusive content. No spam, only genuine messages.
              </p>
            </div>

            {/* Center Column: Subscription Form (5 Cols) */}
            <div className="md:col-span-5">
              {!subscribed ? (
                <div className="max-w-md mx-auto md:mx-0 space-y-1.5">
                  <form noValidate onSubmit={handleSubscribeSubmit} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={subscribeEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`flex-1 bg-neutral-950 border text-xs text-white px-4 py-2 rounded outline-none transition-colors ${
                        subscribeError 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-neutral-900 focus:border-gold-500/40'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!!subscribeError}
                      className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold px-5 py-2 rounded text-[10px] tracking-wider transition-all active:scale-95 shrink-0"
                    >
                      SUBSCRIBE
                    </button>
                  </form>
                  <AnimatePresence>
                    {subscribeError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-[10px] text-red-500 font-mono text-left pl-1"
                      >
                        {subscribeError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-neutral-950 border border-neutral-900/60 px-4 py-2.5 rounded flex items-center gap-2.5 max-w-md mx-auto md:mx-0 text-gold-500 text-xs font-serif italic"
                >
                  <Check className="h-4 w-4 text-gold-500 shrink-0" />
                  <span>"Wonderful! You are now part of the journey. Stay curious and seek the truth."</span>
                </motion.div>
              )}
            </div>

            {/* Right Column: Social Links (3 Cols) */}
            <div className="md:col-span-3 text-center md:text-right space-y-3">
              <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase block">
                FOLLOW GILLIAN
              </span>
              <div className="flex justify-center md:justify-end items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-neutral-950 border border-neutral-900/80 text-neutral-400 hover:text-gold-500 hover:border-gold-500/40 transition-colors"
                  aria-label="Instagram link"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://spotify.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-neutral-950 border border-neutral-900/80 text-neutral-400 hover:text-gold-500 hover:border-gold-500/40 transition-colors"
                  aria-label="Spotify / Music link"
                >
                  <Music className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-neutral-950 border border-neutral-900/80 text-neutral-400 hover:text-gold-500 hover:border-gold-500/40 transition-colors"
                  aria-label="Youtube link"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Copyright lines */}
          <div className="border-t border-neutral-900/60 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-neutral-500 gap-2">
            <span>© 2026 GILLIAN ANDERSON OFFICIAL. ALL RIGHTS RESERVED.</span>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-gold-500 transition-colors uppercase">
                Privacy Policy
              </button>
              <span>•</span>
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-gold-500 transition-colors uppercase">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* --- ALL INTERACTIVE MODALS INJECTED HERE --- */}


      <ExperienceModal isOpen={isExperienceOpen} onClose={() => setIsExperienceOpen(false)} />

      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />

      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {isEventsOpen && (
        <Modal
          isOpen={isEventsOpen}
          onClose={() => setIsEventsOpen(false)}
          title="Exclusive Events & Conclaves"
          maxWidth="max-w-4xl"
        >
          <div className="p-1">
            <EventsSection />
          </div>
        </Modal>
      )}

      {/* Dynamic media simulation video player */}
      {selectedMedia && (
        <VideoPlayerModal
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          mediaItem={selectedMedia}
        />
      )}

      {/* Mobile Bottom Navigation — 5 tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-neutral-900 bg-[#050505]/98 backdrop-blur-md flex items-stretch justify-around shadow-2xl shadow-black/80" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Home */}
        <button onClick={() => { navigateTo('landing', 'HOME'); setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${activeNav === 'HOME' && viewMode === 'landing' ? 'text-gold-500' : 'text-neutral-500'}`}>
          <Home className="h-5 w-5" strokeWidth={activeNav === 'HOME' && viewMode === 'landing' ? 2.5 : 1.5} />
          <span className="text-[8px] font-bold tracking-widest uppercase">Home</span>
        </button>

        {/* Explore */}
        <button onClick={() => setMobileExploreOpen(!mobileExploreOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${mobileExploreOpen ? 'text-gold-500' : 'text-neutral-500'}`}>
          <Compass className="h-5 w-5" strokeWidth={mobileExploreOpen ? 2.5 : 1.5} />
          <span className="text-[8px] font-bold tracking-widest uppercase">Explore</span>
        </button>

        {/* Portal */}
        <button onClick={() => { if (!user) { navigate('/portal?mode=login'); } else { navigate('/portal'); } setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${location.pathname === '/portal' ? 'text-gold-500' : 'text-neutral-500'}`}>
          <Sparkles className="h-5 w-5" strokeWidth={location.pathname === '/portal' ? 2.5 : 1.5} />
          <span className="text-[8px] font-bold tracking-widest uppercase">Portal</span>
        </button>

        {/* Events */}
        <button onClick={() => { handleNavClick('EVENTS'); setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${activeNav === 'EVENTS' ? 'text-gold-500' : 'text-neutral-500'}`}>
          <Calendar className="h-5 w-5" strokeWidth={activeNav === 'EVENTS' ? 2.5 : 1.5} />
          <span className="text-[8px] font-bold tracking-widest uppercase">Events</span>
        </button>

        {/* Profile */}
        <button onClick={() => { if (!user) { navigate('/portal?mode=login'); } else { navigate('/portal'); } setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${location.pathname === '/portal' ? 'text-gold-500' : 'text-neutral-500'}`}>
          <User className="h-5 w-5" strokeWidth={location.pathname === '/portal' ? 2.5 : 1.5} />
          <span className="text-[8px] font-bold tracking-widest uppercase">Profile</span>
        </button>
      </div>

      {/* Mobile Explore Sheet */}
      <AnimatePresence>
        {mobileExploreOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileExploreOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a0a] border-t border-neutral-800 rounded-t-2xl max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-neutral-700" />
              </div>
              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">Explore</h3>
                <button onClick={() => setMobileExploreOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors">
                  <X className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
              {/* Navigation Grid */}
              <div className="px-5 pb-6 grid grid-cols-3 gap-3">
                {[
                  { icon: <Star className="h-5 w-5" />, label: 'About', nav: 'ABOUT' },
                  { icon: <BookOpen className="h-5 w-5" />, label: 'Journal', nav: 'JOURNAL' },
                  { icon: <Play className="h-5 w-5" />, label: 'Media', nav: 'MEDIA' },
                  { icon: <MessageSquare className="h-5 w-5" />, label: 'Community', nav: 'COMMUNITY' },
                  { icon: <Compass className="h-5 w-5" />, label: 'Experiences', nav: 'EXPERIENCES' },
                  { icon: <Crown className="h-5 w-5" />, label: 'Membership', nav: 'MEMBERSHIP' },
                  { icon: <HelpCircle className="h-5 w-5" />, label: 'FAQ', nav: 'FAQ' },
                  { icon: <Heart className="h-5 w-5" />, label: 'Advocacy', nav: 'ABOUT' },
                ].map((item) => (
                  <button key={item.label} onClick={() => { handleNavClick(item.nav); setMobileExploreOpen(false); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-h-[80px] ${activeNav === item.nav ? 'border-gold-500/30 bg-gold-500/5 text-gold-500' : 'border-neutral-800/60 bg-neutral-900/30 text-neutral-400 hover:text-white hover:border-neutral-700'}`}>
                    {item.icon}
                    <span className="text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
              {/* Auth CTA at bottom */}
              {!user && (
                <div className="px-5 pb-6 pt-2 border-t border-neutral-800/60 space-y-2.5">
                  <button onClick={() => { navigate('/portal?mode=register'); setMobileExploreOpen(false); }}
                    className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 text-[11px] font-bold tracking-widest uppercase transition-colors">
                    JOIN THE COMMUNITY
                  </button>
                  <button onClick={() => { navigate('/portal?mode=login'); setMobileExploreOpen(false); }}
                    className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 text-neutral-300 text-[11px] font-bold tracking-widest uppercase transition-colors">
                    SIGN IN
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
