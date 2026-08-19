/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  Crown,
  Calendar,
  HelpCircle,
  Play,
  ArrowRight,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Instagram,
  Youtube,
  Music,
  Menu,
  X,
  Award,
  Compass,
  Pause,
  BookOpen,
  Sparkles,
  Home,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteType, applyTheme } from './utils/theme';
import { useAuth } from './utils/AuthContext';
import { supabase } from './utils/supabase';

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
import FAQSection from './components/FAQSection';

const EventsSection = React.lazy(() => import('./components/EventsSection'));
const ExperiencesSection = React.lazy(() => import('./components/ExperiencesSection'));
const MembershipSection = React.lazy(() => import('./components/MembershipSection'));

const FanPortal = React.lazy(() => import('./components/FanPortal'));
const AdminPortal = React.lazy(() => import('./components/AdminPortal'));
const ConfirmEmail = React.lazy(() => import('./components/ConfirmEmail'));

import ErrorBoundary from './components/ErrorBoundary';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  return (
    <div className={`scroll-reveal ${className}`}>
      {children}
    </div>
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
    if (pathname === '/confirm-email') return { vm: 'confirm-email' as const, nav: 'HOME' };
    if (pathname.startsWith('/experiences/book/')) return { vm: 'landing' as const, nav: 'EXPERIENCES' };
    if (pathname.startsWith('/journal/')) return { vm: 'landing' as const, nav: 'JOURNAL' };
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
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScroll > 0) {
          const progress = (window.scrollY / totalScroll) * 100;
          setScrollProgress(progress);
        } else {
          setScrollProgress(0);
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
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
  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      setSubscribeError('Please enter a valid email address.');
      return;
    }

    try {
      const { error } = await supabase.from('newsletter_subscriptions').insert({
        email: subscribeEmail,
        is_active: true,
        source: 'homepage',
      });
      if (error && error.code !== '23505') { // 23505 = unique constraint (already subscribed)
        setSubscribeError('Something went wrong. Please try again.');
        return;
      }
    } catch {}

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
        type: 'spring' as const,
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
        type: 'spring' as const,
        stiffness: 70,
        damping: 16,
      },
    },
  };

  // Loading gate: show welcome skeleton while profile loads after sign-in
  if (authLoading && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Star className="h-7 w-7 text-gold-500" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-xl font-bold text-[#111] tracking-widest">WELCOME BACK</h1>
            <p className="text-xs font-mono text-neutral-700 tracking-wider">Preparing your portal...</p>
          </div>
          <div className="w-48 h-1 mx-auto bg-white rounded-full overflow-hidden">
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

  if (viewMode === 'confirm-email') {
    return <ErrorBoundary><React.Suspense fallback={null}><ConfirmEmail /></React.Suspense></ErrorBoundary>;
  }

  if (viewMode === 'portal') {
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
      return null;
    }
    return <ErrorBoundary><React.Suspense fallback={null}><FanPortal onBackToHome={() => navigateTo('landing')} /></React.Suspense></ErrorBoundary>;
  }

  if (viewMode === 'admin') {
    return <ErrorBoundary><React.Suspense fallback={null}><AdminPortal onBackToHome={() => navigateTo('landing')} /></React.Suspense></ErrorBoundary>;
  }

  return (
      <div className="min-h-screen bg-[#FCFAF7] text-[#1E1E1E] font-sans selection:bg-[#C89B3C]/20 selection:text-[#1E1E1E] pb-24 lg:pb-0 w-full max-w-full">
      {/* 1. Header (Floating Glass Navbar) */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center px-3 py-2.5 sm:px-5 gap-3 w-full min-w-0">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0 min-w-0" onClick={(e) => { e.preventDefault(); handleNavClick('HOME'); }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#A97828] flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-serif text-xs font-bold text-[#111]">GA</span>
            </div>
            <div className="flex flex-col min-w-0 shrink">
              <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.14em] text-[#1E1E1E] leading-tight truncate">
                GILLIAN ANDERSON
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-[#C89B3C] leading-tight">
                OFFICIAL
              </span>
            </div>
          </a>

          {/* Desktop Navigation — centered */}
          <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0">
            {[
              'HOME',
              'ABOUT',
              'JOURNAL',
              'MEDIA',
              'MEMBERSHIP',
              'FAQ',
            ].map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className={`relative px-3.5 py-2 text-[10px] font-semibold tracking-[0.14em] transition-all duration-300 rounded-full whitespace-nowrap ${
                  activeNav === link
                    ? 'text-[#C89B3C] bg-[#C89B3C]/[0.06]'
                    : 'text-[#444] hover:text-[#1E1E1E]'
                }`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Auth Buttons (logged out) or Profile Menu (logged in) */}
            {!user ? (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/portal?mode=login')}
                  className="px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-[#444] hover:text-[#1E1E1E] transition-all shrink-0">
                  SIGN IN
                </button>
                <button onClick={() => navigate('/portal?mode=register')}
                  className="px-4 py-2 text-[10px] font-bold tracking-[0.12em] text-white bg-[#C89B3C] hover:bg-[#A97828] rounded-full transition-all shrink-0 shadow-sm hover:shadow-md">
                  REGISTER
                </button>
              </div>
            ) : (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-full border border-neutral-200 hover:border-gold-500/40 bg-neutral-50 transition-all active:scale-95 relative">
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
                        className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-200 rounded-lg shadow-2xl shadow-black/60 z-50 overflow-hidden">
                        {profile?.role !== 'admin' && (
                          <div className="p-2">
                            <button onClick={() => { navigate('/portal'); setProfileOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-left border border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                                <Star className="h-4 w-4 text-gold-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gold-500 tracking-wide">MY PORTAL</p>
                                <p className="text-[11px] text-neutral-600 tracking-wide">Your personal sanctuary</p>
                              </div>
                            </button>
                          </div>
                        )}
                        <div className="border-t border-neutral-200 p-2">
                          <button onClick={() => { signOut(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-white transition-colors">
                            <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-700 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-neutral-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-neutral-700 tracking-wide">Sign Out</p>
                              <p className="text-[11px] text-neutral-700 tracking-wide">See you soon</p>
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

      </header>

      {/* 2. Hero Section */}
      {activeNav === 'HOME' && (
        <section className="relative overflow-hidden bg-[#FCFAF7] pt-28 pb-16 md:pt-36 md:pb-24">
          {/* Warm ambient glow */}
          <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-[#C89B3C]/[0.04] blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#EFE7DA]/60 blur-[100px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
            <motion.div 
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center"
            >
              
              {/* Left: Interactive Slide Visualizer */}
              <motion.div variants={heroScaleVariants} className="lg:col-span-4 relative group flex flex-col items-center order-2 lg:order-none">
                <div className="relative aspect-[3/4] w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[300px] overflow-hidden rounded-[20px] bg-white shadow-[0_8px_40px_-8px_rgba(0,0,0,0.08)] transition-all duration-500">
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
                      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-100/40 to-neutral-950 animate-pulse" />
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
                      fetchPriority="high"
                      onLoad={() => handleImageLoad(activeSlide.image)}
                      className={`h-full w-full object-cover brightness-95 group-hover:scale-[1.02] transition-all duration-700 ${
                        loadedImages[activeSlide.image] ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
                      }`}
                    />
                    {/* Subtle Warm Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10" />
                  </motion.div>

                  {/* Vertical Navigation Slide Counts */}
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 font-mono text-[11px] text-neutral-700 z-10">
                    <span className="text-gold-500 font-bold text-xs">{activeSlide.number}</span>
                    <div className="h-10 w-[1px] bg-neutral-50" />
                    <span className="font-semibold">05</span>
                  </div>

                  {/* Left/Right Slider Controls */}
                  <div className="absolute bottom-5 right-5 flex gap-1.5 z-10">
                    <button
                      onClick={() => {
                        handlePrevSlide();
                        setIsPlayingSlide(false); // Pause on manual action
                      }}
                      className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#444] hover:text-[#C89B3C] transition-colors shadow-sm"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleNextSlide();
                        setIsPlayingSlide(false); // Pause on manual action
                      }}
                      className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#444] hover:text-[#C89B3C] transition-colors shadow-sm"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Smooth progress bar under slide image */}
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-50 z-20">
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
                  <div className="w-[1px] h-3 bg-neutral-50 mx-1" />
                  <button
                    onClick={() => setIsPlayingSlide(!isPlayingSlide)}
                    className="p-1 rounded text-neutral-700 hover:text-gold-500 transition-colors"
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
                      OFFICIAL COMMUNITY
                    </span>
                    <span className="h-[1px] w-5 bg-gold-500/40" />
                  </div>
                  <p className="text-[11px] text-neutral-700 max-w-xs mx-auto leading-relaxed">
                    Your hub for events, experiences, and connection with Gillian Anderson.
                  </p>
                  {userName ? (
                    <h1 className="font-serif text-[32px] sm:text-5xl font-bold text-[#1E1E1E] leading-[1.1] tracking-tight">
                      Welcome back,
                      <span className="text-[#C89B3C]">{userName}</span>
                    </h1>
                  ) : (
                    <h1 className="font-serif text-[32px] sm:text-5xl font-bold text-[#1E1E1E] leading-[1.05] tracking-tight">
                      Gillian<br />Anderson
                    </h1>
                  )}
                </motion.div>
              </div>

              {/* Quote, Buttons, Achievements — mobile order-3, desktop has name+rest */}
              <div className="lg:col-span-5 text-center lg:text-left space-y-5 sm:space-y-7 order-3 lg:order-none">
                {/* Name — desktop only inside this container */}
                <motion.div variants={heroItemVariants} className="hidden lg:block space-y-2">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <span className="h-[1px] w-8 bg-[#C89B3C]/30" />
                    <span className="text-[10px] font-mono tracking-[0.3em] text-[#C89B3C] uppercase font-semibold">
                      OFFICIAL COMMUNITY
                    </span>
                    <span className="h-[1px] w-8 bg-[#C89B3C]/30" />
                  </div>
                  {userName ? (
                    <h1 className="font-serif text-5xl xl:text-6xl font-bold text-[#1E1E1E] leading-[1.1] tracking-tight">
                      Welcome back, <br />
                      <span className="text-[#C89B3C]">{userName}</span>
                    </h1>
                  ) : (
                    <h1 className="font-serif text-5xl xl:text-6xl font-bold text-[#1E1E1E] leading-[1.05] tracking-tight">
                      Gillian <br />
                      <span className="text-[#C89B3C]">Anderson</span>
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
                      <p className="font-serif italic text-base md:text-lg text-neutral-700 leading-relaxed max-w-md">
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
                <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                  <button
                    onClick={() => user ? navigate('/portal') : navigate('/portal?mode=register')}
                    className="bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold px-7 py-3.5 rounded-full text-xs tracking-[0.12em] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(200,155,60,0.35)] active:scale-[0.97] shadow-sm"
                  >
                    {user ? 'ENTER YOUR PORTAL' : 'REGISTER'}
                  </button>
                  <button
                    onClick={() => {
                      const videoItem = MEDIA_ITEMS.find((m) => m.id === 'media-bts') || MEDIA_ITEMS[0];
                      setSelectedMedia(videoItem);
                    }}
                    className="border border-[rgba(0,0,0,0.08)] hover:border-[#C89B3C]/30 bg-white hover:bg-[#FCFAF7] text-[#1E1E1E] font-semibold px-6 py-3.5 rounded-full text-xs tracking-[0.12em] transition-all duration-300 active:scale-[0.97] flex items-center gap-2.5 shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-[#C89B3C] text-[#C89B3C]" />
                    WATCH WELCOME VIDEO
                  </button>
                </motion.div>

                {/* Achievements Bento Badge */}
                <motion.div variants={heroItemVariants} className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md pt-3">
                  <div className="p-4 rounded-2xl bg-[#F8F6F2] hover:bg-[#EFE7DA] transition-all duration-400 flex flex-col text-left group">
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#C89B3C] tracking-tight flex items-center gap-1">
                      30+
                      <Compass className="h-3 w-3 text-[#C89B3C]/60 group-hover:rotate-45 transition-transform duration-500" />
                    </span>
                    <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.12em] leading-tight mt-1.5">Years on Stage & Screen</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F6F2] hover:bg-[#EFE7DA] transition-all duration-400 flex flex-col text-left group">
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#1E1E1E] tracking-tight flex items-center gap-1">
                      2x
                      <Award className="h-3 w-3 text-[#C89B3C]/60 group-hover:scale-110 transition-transform duration-300" />
                    </span>
                    <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.12em] leading-tight mt-1.5">Emmys & Golden Globes</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F6F2] hover:bg-[#EFE7DA] transition-all duration-400 flex flex-col text-left group">
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#C89B3C] tracking-tight flex items-center gap-1">
                      100%
                      <Sparkles className="h-3 w-3 text-[#C89B3C]/60 group-hover:scale-110 transition-transform duration-300" />
                    </span>
                    <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.12em] leading-tight mt-1.5">Empowering Advocacy</span>
                  </div>
                </motion.div>

                {/* Social Proof fans banner */}
                <motion.div variants={heroItemVariants} className="flex items-center gap-3.5 pt-6 justify-center lg:justify-start">
                  <div className="flex -space-x-2.5">
                    {[
                      { initials: 'AM', bg: 'bg-[#C89B3C]/15', text: 'text-[#8B6914]', border: 'border-[#C89B3C]/30' },
                      { initials: 'JW', bg: 'bg-[#2E8B57]/15', text: 'text-[#1B6B3A]', border: 'border-[#2E8B57]/30' },
                      { initials: 'ND', bg: 'bg-[#1E1E1E]/10', text: 'text-[#333]', border: 'border-[#1E1E1E]/20' },
                      { initials: 'KR', bg: 'bg-[#C89B3C]/15', text: 'text-[#8B6914]', border: 'border-[#C89B3C]/30' },
                    ].map((item) => (
                      <div
                        key={item.initials}
                        className={`h-9 w-9 rounded-full ${item.bg} ${item.border} border-2 flex items-center justify-center text-[9px] font-mono font-bold ${item.text}`}
                      >
                        {item.initials}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-mono text-[#111] uppercase tracking-[0.1em] font-bold">
                      24.2M+ Subscribers & Followers
                    </span>
                    <span className="text-[11px] font-mono text-[#C89B3C] font-semibold tracking-wide">
                      Worldwide Community
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right: Monthly Video Box — hidden on mobile */}
              <motion.div variants={heroScaleVariants} className="hidden lg:block lg:col-span-3">
                <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-neutral-200 transition-all">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-700 uppercase tracking-widest pb-2 border-b border-neutral-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                    </span>
                    <span>MONTHLY ARCHIVE VIDEO</span>
                  </div>

                  {/* Video Image Container */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-white group">
                    <img
                      src="/assets/images/gillian_theatre_rehearsal_1783349680324.jpg"
                      alt="Monthly Video Message Thumbnail"
                      referrerPolicy="no-referrer"
                      loading="lazy"
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
                    <h3 className="text-xs font-semibold text-[#111] tracking-wider uppercase">
                      A message to you all
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-700 tracking-widest">
                      ARCHIVE PREVIEW
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const videoItem = MEDIA_ITEMS.find((m) => m.id === 'media-bts') || MEDIA_ITEMS[0];
                      setSelectedMedia(videoItem);
                    }}
                    className="w-full text-center border border-neutral-200 hover:border-gold-500/50 hover:bg-gold-500/5 text-[10px] font-mono text-neutral-600 hover:text-gold-500 font-semibold py-2.5 rounded-lg transition-colors"
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
                {/* How It Works — Simple Guide for New Visitors */}
                <ScrollReveal>
                  <section className="section-luxury bg-[#FCFAF7]">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6">
                      <div className="text-center space-y-4 mb-14">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">
                          How It <span className="text-[#C89B3C]">Works</span>
                        </h2>
                        <div className="divider-luxury w-16 mx-auto" />
                        <p className="text-sm text-[#444] max-w-lg mx-auto leading-relaxed">
                          Getting started is easy. Here's how to join the community and make the most of it.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                          { step: '1', title: 'Create Your Free Account', desc: 'Click "Join" at the top and sign up with your email. It takes less than a minute.' },
                          { step: '2', title: 'Explore & Connect', desc: 'Browse experiences, events, and community posts. Share your thoughts and connect with other fans.' },
                          { step: '3', title: 'Join as a Member', desc: 'Choose a membership tier to unlock exclusive perks, events, and your personalized membership card.' },
                        ].map((item) => (
                          <div key={item.step} className="text-center space-y-4 p-6">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EFE7DA] flex items-center justify-center">
                              <span className="font-serif text-lg font-bold text-[#C89B3C]">{item.step}</span>
                            </div>
                            <h3 className="text-sm font-bold tracking-[0.08em] text-[#1E1E1E]">{item.title}</h3>
                            <p className="text-xs text-[#444] leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                {/* About Section */}
                <ScrollReveal>
                  <AboutSection />
                </ScrollReveal>

                {/* Six Community Pillars Navigation Cards */}
                <ScrollReveal>
                  <section className="section-luxury bg-[#F8F6F2] relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12 sm:space-y-16 relative z-10">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE7DA] text-[#C89B3C] text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
                          <Star className="h-3 w-3" />
                          GET INVOLVED
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1E1E1E] tracking-tight">
                          Explore <span className="text-[#C89B3C]">What We Offer</span>
                        </h2>
                        <div className="divider-luxury w-20 mx-auto" />
                        <p className="text-sm text-[#444] max-w-2xl mx-auto font-sans leading-relaxed">
                          Choose an area below to learn more, join in, and connect with the community.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 text-left">
                        {/* Experiences Card */}
                        <button
                          onClick={() => handleNavClick('EXPERIENCES')}
                          className="card-lift flex flex-col justify-between p-6 sm:p-8 rounded-[20px] text-left relative overflow-hidden min-h-[160px] sm:min-h-[180px] aspect-[1.6/1] shadow-[0_2px_12px_rgba(0,0,0,0.08)] group"
                        >
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_experiences_1784103582190.jpg"
                              alt="Experiences Background"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-[1]" />

                          <div className="absolute top-5 right-5 font-mono text-[11px] text-white/50 z-10">
                            01
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-3 inline-block rounded-2xl bg-white/15 backdrop-blur-sm text-white">
                              <Star className="h-5 w-5" />
                            </span>
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold tracking-[0.08em] text-white group-hover:text-[#C89B3C] transition-colors">
                                EXPERIENCES
                              </h3>
                              <p className="text-xs text-white/80 leading-relaxed font-sans">
                                Book one-on-one experiences, meetings, and special sessions with Gillian.
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#C89B3C] flex items-center gap-1.5 mt-6 relative z-10">
                            LEARN MORE <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                        {/* Membership Card */}
                        <button
                          onClick={() => handleNavClick('MEMBERSHIP')}
                          className="card-lift flex flex-col justify-between p-6 sm:p-8 rounded-[20px] text-left relative overflow-hidden min-h-[160px] sm:min-h-[180px] aspect-[1.6/1] shadow-[0_2px_12px_rgba(0,0,0,0.08)] group"
                        >
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_membership_1784103595657.jpg"
                              alt="Membership Background"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-[1]" />

                          <div className="absolute top-5 right-5 font-mono text-[11px] text-white/50 z-10">
                            02
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-3 inline-block rounded-2xl bg-white/15 backdrop-blur-sm text-white">
                              <Crown className="h-5 w-5" />
                            </span>
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold tracking-[0.08em] text-white group-hover:text-[#C89B3C] transition-colors">
                                MEMBERSHIP
                              </h3>
                              <p className="text-xs text-white/80 leading-relaxed font-sans">
                                Join as an official member and get your personalized membership card.
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#C89B3C] flex items-center gap-1.5 mt-6 relative z-10">
                            SEE TIERS <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                        {/* Events Card */}
                        <button
                          onClick={() => handleNavClick('EVENTS')}
                          className="card-lift flex flex-col justify-between p-6 sm:p-8 rounded-[20px] text-left relative overflow-hidden min-h-[160px] sm:min-h-[180px] aspect-[1.6/1] shadow-[0_2px_12px_rgba(0,0,0,0.08)] group"
                        >
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                              src="/assets/images/pillar_events_1784103610855.jpg"
                              alt="Events Background"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-[1]" />

                          <div className="absolute top-5 right-5 font-mono text-[11px] text-white/50 z-10">
                            03
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="p-3 inline-block rounded-2xl bg-white/15 backdrop-blur-sm text-white">
                              <Calendar className="h-5 w-5" />
                            </span>
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold tracking-[0.08em] text-white group-hover:text-[#C89B3C] transition-colors">
                                EVENTS
                              </h3>
                              <p className="text-xs text-white/80 leading-relaxed font-sans">
                                Attend live Q&A sessions, watch parties, and special celebrations.
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#C89B3C] flex items-center gap-1.5 mt-6 relative z-10">
                            VIEW EVENTS <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>

                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                {/* Journal Section */}
                  <JournalSection />

                {/* Media Section */}
                  <MediaSection />

                {/* Community Section */}
                  <CommunitySection />

                {/* FAQ Section */}
                  <FAQSection />

                {/* Fast interactive portal prompt to finish landing */}
                <ScrollReveal>
                  <section className="section-luxury bg-[#FCFAF7]">
                    <div className="mx-auto max-w-4xl px-4 text-center space-y-8">
                      <h3 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">
                        Be Excellent To <span className="text-[#C89B3C]">Each Other</span>
                      </h3>
                      <p className="text-sm text-[#444] max-w-lg mx-auto leading-relaxed">
                        Access our interactive custom portals to chat, write custom blogs, share high-definition photographs, and review opportunities.
                      </p>
                      <button
                        onClick={() => user ? navigate('/portal') : navigate('/portal?mode=register')}
                        className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold rounded-full text-xs tracking-[0.12em] uppercase transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(200,155,60,0.35)] active:scale-[0.97]"
                      >
                        {user ? 'ENTER YOUR PORTAL' : 'REGISTER'}
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
            {activeNav === 'EXPERIENCES' && <ErrorBoundary><React.Suspense fallback={null}><ExperiencesSection /></React.Suspense></ErrorBoundary>}
            {activeNav === 'MEMBERSHIP' && <ErrorBoundary><React.Suspense fallback={null}><MembershipSection /></React.Suspense></ErrorBoundary>}
            {activeNav === 'EVENTS' && (
              <div className="py-8">
                <ErrorBoundary><React.Suspense fallback={null}><EventsSection /></React.Suspense></ErrorBoundary>
              </div>
            )}
            {activeNav === 'FAQ' && <FAQSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 6. Footer — only on HOME */}
      {activeNav === 'HOME' && (
      <footer className="bg-[#F8F6F2] py-12 sm:py-16 pb-24 lg:pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-12 items-center">
            
            {/* Left Column: Footer Info (4 Cols) */}
            <div className="md:col-span-4 text-center md:text-left space-y-3">
              <h4 className="text-xs font-bold tracking-[0.14em] text-[#1E1E1E] uppercase">
                STAY CONNECTED
              </h4>
              <p className="text-xs leading-relaxed text-[#444] max-w-xs mx-auto md:mx-0">
                Get the latest updates, news, and exclusive content. No spam, only genuine messages.
              </p>
            </div>

            {/* Center Column: Subscription Form (5 Cols) */}
            <div className="md:col-span-5">
              {!subscribed ? (
                <div className="max-w-md mx-auto md:mx-0 space-y-2">
                  <form noValidate onSubmit={handleSubscribeSubmit} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={subscribeEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`flex-1 bg-white text-xs text-[#1E1E1E] px-4 py-3 rounded-full outline-none transition-all duration-300 ${
                        subscribeError 
                          ? 'border border-[#D9534F]/40 focus:border-[#D9534F]' 
                          : 'border border-[rgba(0,0,0,0.06)] focus:border-[#C89B3C]/40'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!!subscribeError}
                      className="bg-[#C89B3C] hover:bg-[#A97828] disabled:opacity-50 disabled:cursor-not-allowed text-[#333] font-semibold px-6 py-3 rounded-full text-[10px] tracking-[0.12em] transition-all duration-300 active:scale-[0.97] shrink-0"
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
                        className="text-[10px] text-[#D9534F] font-mono text-left pl-4"
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
                  className="bg-white px-5 py-3 rounded-full flex items-center gap-3 max-w-md mx-auto md:mx-0 text-[#C89B3C] text-xs font-serif italic"
                >
                  <Check className="h-4 w-4 text-[#2E8B57] shrink-0" />
                  <span>"Wonderful! You are now part of the journey."</span>
                </motion.div>
              )}
            </div>

            {/* Right Column: Social Links (3 Cols) */}
            <div className="md:col-span-3 text-center md:text-right space-y-3">
              <span className="text-[10px] font-mono text-[#333] tracking-[0.14em] uppercase block">
                FOLLOW GILLIAN
              </span>
              <div className="flex justify-center md:justify-end items-center gap-3">
                <a
                  href="https://www.instagram.com/gilliananderson"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-white text-[#444] hover:text-[#C89B3C] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  aria-label="Instagram link"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://open.spotify.com/artist/5K4W6rqBFWDnAN6FQUkS6x"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-white text-[#444] hover:text-[#C89B3C] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  aria-label="Spotify / Music link"
                >
                  <Music className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com/@GillianAnderson"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-white text-[#444] hover:text-[#C89B3C] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  aria-label="Youtube link"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Copyright lines */}
          <div className="divider-luxury mt-10 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#333] gap-2">
            <span>&copy; 2026 GILLIAN ANDERSON OFFICIAL. ALL RIGHTS RESERVED.</span>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#C89B3C] transition-colors uppercase tracking-wider font-bold">
                Privacy Policy
              </button>
              <span className="text-[rgba(0,0,0,0.12)]">&bull;</span>
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-[#C89B3C] transition-colors uppercase tracking-wider font-bold">
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
            <ErrorBoundary><React.Suspense fallback={null}><EventsSection /></React.Suspense></ErrorBoundary>
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

      {/* Mobile Bottom Navigation — 4 tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-t border-[rgba(0,0,0,0.04)] flex items-stretch justify-around shadow-[0_-2px_16px_rgba(0,0,0,0.04)] overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Home */}
        <button onClick={() => { navigateTo('landing', 'HOME'); setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${activeNav === 'HOME' && viewMode === 'landing' ? 'text-[#C89B3C]' : 'text-[#444]'}`}>
          <Home className="h-5 w-5" strokeWidth={activeNav === 'HOME' && viewMode === 'landing' ? 2.5 : 1.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Home</span>
        </button>

        {/* Explore */}
        <button onClick={() => setMobileExploreOpen(!mobileExploreOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${mobileExploreOpen ? 'text-[#C89B3C]' : 'text-[#444]'}`}>
          <Compass className="h-5 w-5" strokeWidth={mobileExploreOpen ? 2.5 : 1.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Explore</span>
        </button>

        {/* Portal */}
        <button onClick={() => { if (!user) { navigate('/portal?mode=login'); } else { navigate('/portal'); } setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${location.pathname === '/portal' ? 'text-[#C89B3C]' : 'text-[#444]'}`}>
          <Sparkles className="h-5 w-5" strokeWidth={location.pathname === '/portal' ? 2.5 : 1.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Portal</span>
        </button>

        {/* Events */}
        <button onClick={() => { handleNavClick('EVENTS'); setMobileExploreOpen(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-all ${activeNav === 'EVENTS' ? 'text-[#C89B3C]' : 'text-[#444]'}`}>
          <Calendar className="h-5 w-5" strokeWidth={activeNav === 'EVENTS' ? 2.5 : 1.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Events</span>
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
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-neutral-200 rounded-t-2xl max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-neutral-700" />
              </div>
              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111] tracking-wide">Explore</h3>
                <button onClick={() => setMobileExploreOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-50 transition-colors">
                  <X className="h-4 w-4 text-neutral-600" />
                </button>
              </div>
              {/* Navigation Grid */}
              <div className="px-5 pb-6 grid grid-cols-3 gap-3">
                {[
                  { icon: <Star className="h-5 w-5" />, label: 'About', nav: 'ABOUT' },
                  { icon: <BookOpen className="h-5 w-5" />, label: 'Journal', nav: 'JOURNAL' },
                  { icon: <Play className="h-5 w-5" />, label: 'Media', nav: 'MEDIA' },
                  { icon: <Crown className="h-5 w-5" />, label: 'Membership', nav: 'MEMBERSHIP' },
                  { icon: <HelpCircle className="h-5 w-5" />, label: 'FAQ', nav: 'FAQ' },
                ].map((item) => (
                  <button key={item.label} onClick={() => { handleNavClick(item.nav); setMobileExploreOpen(false); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-h-[80px] ${activeNav === item.nav ? 'border-gold-500/30 bg-gold-500/5 text-gold-500' : 'border-neutral-200/60 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400'}`}>
                    {item.icon}
                    <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
              {/* Auth CTA at bottom */}
              {!user && (
                <div className="px-5 pb-6 pt-2 border-t border-neutral-200/60 space-y-2.5">
                  <button onClick={() => { navigate('/portal?mode=register'); setMobileExploreOpen(false); }}
                    className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 text-[11px] font-bold tracking-widest uppercase transition-colors">
                    REGISTER
                  </button>
                  <button onClick={() => { navigate('/portal?mode=login'); setMobileExploreOpen(false); }}
                    className="w-full py-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white text-neutral-700 text-[11px] font-bold tracking-widest uppercase transition-colors">
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
