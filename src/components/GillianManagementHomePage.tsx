import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Users,
  Star,
  Crown,
  FileText,
  Mail,
  Megaphone,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

export default function GillianManagementHomePage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userName = profile?.name || user?.user_metadata?.name || 'Supporter';

  const navItems = [
    { label: 'Home', path: '/', active: true },
    { label: 'Dashboard', path: '/portal', active: false },
    { label: 'Experiences', path: '#experiences', active: false },
    { label: 'Messages', path: '/portal?tab=messages', active: false },
    { label: 'Membership', path: '#membership', active: false },
    { label: 'My Account', path: '/portal?tab=profile', active: false },
  ];

  const handleNavClick = (path: string) => {
    if (path.startsWith('#')) {
      const el = document.getElementById(path.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  const optionCards = [
    {
      title: 'Membership',
      description: 'Learn about membership options and exclusive benefits.',
      icon: Crown,
      image: '/assets/images/card_membership.jpg',
      path: '/portal?tab=membership',
    },
    {
      title: 'Experiences',
      description: 'Discover available experiences and submit a request.',
      icon: Star,
      image: '/assets/images/iceland_landscape_1782919139830.jpg',
      path: '#experiences',
    },
    {
      title: 'Requests',
      description: "Tell management what you're interested in and need.",
      icon: FileText,
      image: '/assets/images/pillar_ask_gillian_1784103625430.jpg',
      path: '/portal?tab=requests',
    },
    {
      title: 'Messages',
      description: 'Stay in touch with management and receive important updates.',
      icon: Mail,
      image: '/assets/images/pillar_membership_1784103595657.jpg',
      path: '/portal?tab=messages',
    },
    {
      title: 'My Account',
      description: 'Manage your profile, preferences and account settings.',
      icon: User,
      image: '/assets/images/pillar_events_1784103610855.jpg',
      path: '/portal?tab=profile',
    },
  ];

  return (
    <div className="w-full bg-[#FAF6F0] text-[#1C252A] font-sans selection:bg-[#C89B3C]/20 selection:text-[#1C252A] min-h-screen flex flex-col">
      {/* ========================================================
          1. OBSIDIAN TOP NAVBAR (#14181B)
      ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#14181B] text-white border-b border-black/20 shadow-sm h-[68px] flex items-center w-full">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full flex items-center justify-between">
          {/* Left Brand: GA Circle + Text */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full border border-white/70 flex items-center justify-center text-white">
                <span className="font-serif text-[12px] font-bold tracking-tight">GA</span>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-white">
                  Gillian Anderson
                </span>
                <span className="text-[8px] font-sans tracking-[0.25em] text-[#C89B3C] uppercase mt-0.5 font-medium">
                  Management
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Exact from Mockup) */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8 h-[68px]">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`text-[13px] font-sans transition-colors relative py-1 flex items-center ${
                  item.active
                    ? 'text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.active && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-[2.5px] bg-[#C89B3C] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right User Avatar Button with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full text-white/80 hover:text-white focus:outline-hidden"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/90 transition-colors">
                <User className="h-4 w-4 stroke-[1.8]" />
              </div>
              <ChevronDown className="h-3 w-3 text-white/50" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-[#1C252A] shadow-xl border border-[#EBE7DF] py-2 z-50 text-xs"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-4 py-3 border-b border-[#F0ECE1]">
                  <p className="font-semibold text-sm text-[#1C252A] truncate">
                    {user ? userName : 'Guest Visitor'}
                  </p>
                  <p className="text-[10px] font-mono text-[#7D818A] uppercase mt-0.5">
                    {user ? 'Verified Access' : 'Private Management Portal'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/portal');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2 text-[#4A4E55] hover:text-[#1C252A]"
                  >
                    <User className="h-3.5 w-3.5 text-[#8C6D23]" />
                    <span>My Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/portal?tab=messages');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2 text-[#4A4E55] hover:text-[#1C252A]"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#8C6D23]" />
                    <span>Messages</span>
                  </button>
                </div>

                {user ? (
                  <div className="pt-1 border-t border-[#F0ECE1]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-[#F0ECE1]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/portal?mode=login');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2 text-[#8C6D23] font-medium"
                    >
                      <span>Sign In / Register</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[68px] left-0 right-0 bg-[#14181B] border-b border-white/10 p-4 space-y-2 z-50">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavClick(item.path);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-sans uppercase tracking-wider transition-colors ${
                  item.active
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================
          2. FULL-WIDTH HERO BANNER WITH WORDS ON THE BANNER
      ======================================================== */}
      <section className="w-full relative overflow-hidden bg-[#FAF6F0] border-b border-[#E8E1D5]">
        {/* Full-width responsive banner container */}
        <div
          className="w-full min-h-[520px] sm:min-h-[560px] lg:min-h-[620px] bg-no-repeat bg-cover bg-[center_right] lg:bg-right relative flex items-center"
          style={{
            backgroundImage: "url('/assets/images/gillian_banner_hero.jpg')",
          }}
        >
          {/* Subtle soft-edge gradient to ensure flawless typography legibility across all viewport widths */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0] via-[#FAF6F0]/90 via-35% md:via-45% to-transparent pointer-events-none" />

          {/* Left Text Overlay Content */}
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full relative z-10 py-12 sm:py-16">
            <div className="max-w-[480px] space-y-4 text-left">
              <span className="text-[11px] font-sans font-bold tracking-[0.26em] text-[#5A606A] uppercase block">
                WELCOME
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[45px] leading-[1.14] text-[#1C252A] font-normal tracking-[-0.01em]">
                Welcome to your<br />
                Gillian Anderson<br />
                Management experience.
              </h1>

              {/* Gold horizontal accent bar */}
              <div className="w-10 h-[2.5px] bg-[#C89B3C] rounded-full my-4" />

              <p className="text-[13px] sm:text-sm text-[#4E545F] leading-[1.75]">
                This is your private platform for personal, business and premium experiences, managed by Gillian Anderson's team. Here you can communicate with management, submit requests, explore membership options and access eligible experiences.
              </p>

              {/* Elegant Authentic Gillian Signature Script */}
              <div className="pt-2 flex items-center gap-2">
                <span className="font-['Alex_Brush','Dancing_Script',cursive] text-3xl sm:text-4xl text-[#2B313A] select-none tracking-wide">
                  Gillian Anderson
                </span>
                <span className="font-serif italic text-xl text-[#C89B3C] select-none">
                  x
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. YOUR JOURNEY — HOW MANAGEMENT WORKS
      ======================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-20 text-center w-full">
        <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#6E7582] uppercase block mb-1.5">
          YOUR JOURNEY
        </span>

        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] text-[#1C252A] font-normal tracking-tight mb-12 sm:mb-14">
          How Management Works
        </h2>

        {/* 3 Steps in Flow: YOU → MANAGEMENT → APPROVED EXPERIENCE */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
          {/* Step 1: You */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#EFE8DF] border border-[#E2D9CC] flex items-center justify-center text-[#5E5548] shadow-xs">
              <User className="h-6 w-6 stroke-[1.6]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1C252A] mt-3.5 mb-1">
              You
            </h3>
            <p className="text-xs text-[#5E646E] leading-relaxed max-w-[190px]">
              Share your interests and what you're looking for.
            </p>
          </div>

          {/* Connecting Arrow 1 */}
          <div className="hidden md:flex items-center justify-center text-[#9CA3AF] text-2xl font-light px-2 select-none">
            →
          </div>

          {/* Step 2: Management */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#EFE8DF] border border-[#E2D9CC] flex items-center justify-center text-[#5E5548] shadow-xs">
              <Users className="h-6 w-6 stroke-[1.6]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1C252A] mt-3.5 mb-1">
              Management
            </h3>
            <p className="text-xs text-[#5E646E] leading-relaxed max-w-[190px]">
              Reviews your requests and determines the best options.
            </p>
          </div>

          {/* Connecting Arrow 2 */}
          <div className="hidden md:flex items-center justify-center text-[#9CA3AF] text-2xl font-light px-2 select-none">
            →
          </div>

          {/* Step 3: Approved Experience */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#EFE8DF] border border-[#E2D9CC] flex items-center justify-center text-[#5E5548] shadow-xs">
              <Star className="h-6 w-6 stroke-[1.6]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1C252A] mt-3.5 mb-1">
              Approved Experience
            </h3>
            <p className="text-xs text-[#5E646E] leading-relaxed max-w-[190px]">
              You receive tailored options and next steps.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. EXPLORE YOUR OPTIONS (5 CARDS WITH THUMBNAILS & BADGES)
      ======================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16 sm:pb-20 w-full">
        <div className="mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1C252A] font-normal tracking-tight">
            Explore Your Options
          </h2>
          <div className="w-12 h-[2.5px] bg-[#C89B3C] rounded-full my-3" />
        </div>

        {/* 5 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {optionCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => handleNavClick(card.path)}
                className="bg-white rounded-2xl border border-[#ECE5DB] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-[#C89B3C]/60 transition-all duration-300 group cursor-pointer"
              >
                {/* Top Image Thumbnail */}
                <div className="h-28 w-full relative overflow-hidden bg-neutral-100">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Floating Circular Badge Overlapping Center */}
                  <div className="w-10 h-10 rounded-full bg-white shadow-md border border-[#ECE5DB] flex items-center justify-center text-[#8C6D23] absolute left-1/2 -bottom-5 -translate-x-1/2 z-10 group-hover:scale-110 transition-transform">
                    <Icon className="h-4 w-4 stroke-[1.8]" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-7 pb-5 px-4 text-center flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm font-bold text-[#1C252A] group-hover:text-[#8C6D23] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-[#636974] leading-relaxed line-clamp-3">
                      {card.description}
                    </p>
                  </div>

                  {/* Arrow Link */}
                  <div className="text-neutral-400 group-hover:text-[#C89B3C] transition-colors flex justify-center text-sm font-medium pt-1">
                    →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          5. MANAGEMENT NOTICE BANNER
      ======================================================== */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16 w-full">
        <div className="bg-white/95 backdrop-blur-sm border border-[#ECE5DB] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Icon & Text */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-center text-[#8C6D23] shrink-0">
              <Megaphone className="h-5 w-5 stroke-[1.6]" />
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#717782] font-bold block">
                MANAGEMENT NOTICE
              </span>
              <h4 className="font-serif text-sm sm:text-base font-bold text-[#1C252A]">
                Welcome to the Platform
              </h4>
              <p className="text-xs text-[#636974]">
                Thank you for being here. We're excited to support your journey and look forward to connecting with you soon.
              </p>
            </div>
          </div>

          {/* Right Date & Action */}
          <div className="flex items-center gap-4 shrink-0 pl-14 sm:pl-0">
            <span className="text-xs font-mono text-[#8C919C]">
              April 28, 2025
            </span>
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="px-4 py-2 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DA] text-xs font-medium text-[#1C252A] transition-colors flex items-center gap-1.5"
            >
              <span>View All Updates</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. CLEAN SUBTLE FOOTER
      ======================================================== */}
      <footer className="mt-auto py-8 px-6 text-center border-t border-[#EBE7DF] bg-[#F4EFEA] text-[11px] font-sans text-[#7D818A] space-y-1 w-full">
        <div className="flex items-center justify-center gap-2 text-[#1C252A] font-semibold text-xs mb-1">
          <span>GILLIAN ANDERSON MANAGEMENT</span>
        </div>
        <p>Private representation and verified supporter connection platform.</p>
        <p className="text-[10px] text-neutral-400">All communication is handled with discretion and personal care.</p>
      </footer>
    </div>
  );
}
