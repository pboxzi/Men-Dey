import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import BookingPage from './BookingPage';
import ExperienceDetailPage from './ExperienceDetailPage';
import { supabase } from '../utils/supabase';
import {
  Sparkles, Award, CheckCircle, Users, MapPin, Timer, Star, X,
  ChevronRight, Heart, Palette, Compass, BookOpen, Camera, Ticket,
  Search, Globe, SlidersHorizontal, Eye, Shield, Clock, Zap,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATEGORIES = [
  'ALL', 'Meet & Greet', 'Creative', 'Philanthropy', 'Adventure', 'Literary', 'Behind-the-Scenes',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Meet & Greet': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Creative': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Philanthropy': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Adventure': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Literary': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Behind-the-Scenes': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const CATEGORY_ICONS: Record<string, any> = {
  'Meet & Greet': Heart,
  'Creative': Palette,
  'Philanthropy': Award,
  'Adventure': Compass,
  'Literary': BookOpen,
  'Behind-the-Scenes': Camera,
};

export default function ExperiencesSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [detailViewId, setDetailViewId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterVirtual, setFilterVirtual] = useState<'all' | 'physical' | 'virtual'>('all');
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [expRes, bookingsRes] = await Promise.all([
          supabase.from('experiences').select('*').order('sort_order').order('title'),
          supabase.from('experience_requests').select('*').order('created_at', { ascending: false }),
        ]);
        if (!expRes.error && expRes.data) setExperiences(expRes.data || []);
        if (!bookingsRes.error && bookingsRes.data) setBookings(bookingsRes.data || []);
      } catch (err) {
        console.error('Failed to load experiences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const rawHash = window.location.hash.replace('#', '');
    const upperHash = rawHash.toUpperCase();
    if (upperHash.startsWith('EXPERIENCES/BOOK/')) {
      const expId = rawHash.split('/')[2];
      if (expId) setBookingId(expId);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const upperHash = rawHash.toUpperCase();
      if (upperHash.startsWith('EXPERIENCES/BOOK/')) {
        const expId = rawHash.split('/')[2];
        if (expId) setBookingId(expId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const filteredExperiences = useMemo(() => {
    let result = experiences;
    if (activeCategory !== 'ALL') result = result.filter(e => e.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    if (filterFeatured) result = result.filter(e => e.featured);
    if (filterVirtual === 'physical') result = result.filter(e => !e.is_virtual);
    else if (filterVirtual === 'virtual') result = result.filter(e => e.is_virtual);
    if (filterAvailable) result = result.filter(e => (e.spots - e.spotsTaken) > 0);
    return result;
  }, [experiences, activeCategory, searchQuery, filterFeatured, filterVirtual, filterAvailable]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: experiences.length };
    experiences.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [experiences]);

  const stats = useMemo(() => ({
    total: experiences.length,
    popular: experiences.filter(e => e.popular || e.featured).length,
    available: experiences.reduce((sum, e) => sum + ((e.spots || 0) - (e.spotsTaken || 0)), 0),
    categories: new Set(experiences.map(e => e.category)).size,
    featured: experiences.filter(e => e.featured).length,
  }), [experiences]);

  const openDetail = (exp: Experience) => setDetailViewId(exp.id);

  const openBooking = (exp: Experience) => {
    window.location.hash = `EXPERIENCES/BOOK/${exp.id}`;
  };

  const closeBooking = () => {
    window.location.hash = '';
    setBookingId(null);
  };

  const handleBookingSuccess = (booking: ExperienceBooking) => {
    setBookings(prev => [booking, ...prev]);
    setBookingId(null);
    setActiveTab('bookings');
    window.location.hash = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-500';
      case 'completed': return 'text-blue-500';
      case 'cancelled': return 'text-red-400';
      default: return 'text-amber-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-amber-500';
    }
  };

  const formatStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Show booking page (navigated via hash)
  if (bookingId) {
    return (
      <section id="experiences-page" className="bg-[#050505] py-12 px-4 md:px-6 relative min-h-[900px]">
        <div className="mx-auto max-w-3xl">
          <BookingPage
            experienceId={bookingId}
            onBack={closeBooking}
            onSuccess={handleBookingSuccess}
          />
        </div>
      </section>
    );
  }

  // Show detail page
  if (detailViewId) {
    return (
      <section id="experiences-page" className="bg-[#050505] py-12 px-4 md:px-6 relative min-h-[900px]">
        <div className="mx-auto max-w-5xl">
          <ExperienceDetailPage
            experienceId={detailViewId}
            onBack={() => setDetailViewId(null)}
            onBook={(exp) => { setDetailViewId(null); openBooking(exp); }}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="experiences-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute left-10 bottom-1/3 h-64 w-64 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Hero Header — Cinematic */}
        <div className="relative text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/[0.03] text-gold-500 text-[10px] font-mono tracking-[0.2em] uppercase backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Once-in-a-Lifetime Reveries
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-[1.1]">
              Exalted<br className="md:hidden" />
              <span className="text-gold-500 bg-gold-500/5 px-3 py-1 inline-block">Experiences</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
              Choose from {stats.total} handcrafted journeys across six extraordinary realms — each designed to bring you closer to the world of Gillian Anderson.
            </p>
          </div>
        </div>

        {/* Stats Bar — Glass */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
          {[
            { icon: Ticket, value: stats.total, label: 'Experiences', color: 'text-gold-500' },
            { icon: Star, value: stats.popular, label: 'Featured', color: 'text-amber-400' },
            { icon: Users, value: stats.available, label: 'Spots Open', color: 'text-emerald-400' },
            { icon: Globe, value: experiences.filter(e => e.is_virtual).length, label: 'Virtual', color: 'text-cyan-400' },
            { icon: MapPin, value: experiences.filter(e => !e.is_virtual).length, label: 'In-Person', color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-neutral-950/60 backdrop-blur-sm border border-neutral-900 rounded-xl p-4 text-center space-y-1.5 hover:border-neutral-800 transition-all duration-300 group">
              <stat.icon className={`h-4 w-4 ${stat.color} mx-auto group-hover:scale-110 transition-transform duration-300`} />
              <span className={`block text-xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tab Switch: Browse / My Bookings */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-xl p-1">
            {[
              { id: 'browse' as const, label: 'Browse Experiences', icon: Sparkles },
              { id: 'bookings' as const, label: `My Bookings (${bookings.length})`, icon: Ticket },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all ${
                  activeTab === tab.id
                    ? 'bg-gold-500 text-neutral-950 font-bold'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'bookings' ? (
          <div className="space-y-4">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-800 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-wide">{booking.experienceTitle}</span>
                      <span className="text-[8px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                      <span>{booking.fullName}</span>
                      <span className="text-neutral-700">|</span>
                      <span className="capitalize">{booking.communicationMethod}</span>
                      {booking.bookingReference && (
                        <>
                          <span className="text-neutral-700">|</span>
                          <span className="font-mono text-neutral-500">{booking.bookingReference}</span>
                        </>
                      )}
                    </div>
                    {booking.specialRequests && (
                      <p className="text-[11px] text-neutral-500 italic line-clamp-1 max-w-xl">
                        "{booking.specialRequests}"
                      </p>
                    )}
                    {booking.confirmedDate && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono">
                        <CheckCircle className="h-3 w-3" />
                        Confirmed: {booking.confirmedDate} at {booking.confirmedTime}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusDot(booking.status)}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusDot(booking.status)}`} />
                    </span>
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                      {formatStatus(booking.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
                <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                  <Ticket className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500">No bookings yet.</p>
                <p className="text-[10px] text-neutral-600 font-mono">Browse experiences and submit your first booking request.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search + Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search experiences by name, description, or location..."
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-gold-500/40 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                    showFilters ? 'bg-gold-500 text-neutral-950 border-gold-500 font-bold' : 'bg-neutral-950 text-neutral-500 border-neutral-900 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Filters
                  {(filterFeatured || filterVirtual !== 'all' || filterAvailable) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 flex flex-wrap items-center gap-3">
                      <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">Filter by:</span>

                      <button
                        onClick={() => setFilterFeatured(!filterFeatured)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase border transition-all ${
                          filterFeatured ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-neutral-900/40 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        Featured
                      </button>

                      <div className="flex rounded-lg border border-neutral-800 overflow-hidden text-[9px] font-mono">
                        {(['all', 'physical', 'virtual'] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setFilterVirtual(v)}
                            className={`px-3 py-1.5 uppercase tracking-wider transition-all ${
                              filterVirtual === v ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900/40 text-neutral-500 hover:text-neutral-300'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setFilterAvailable(!filterAvailable)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase border transition-all ${
                          filterAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-900/40 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Available Only
                      </button>

                      {(filterFeatured || filterVirtual !== 'all' || filterAvailable) && (
                        <button
                          onClick={() => { setFilterFeatured(false); setFilterVirtual('all'); setFilterAvailable(false); }}
                          className="text-[9px] font-mono text-neutral-500 hover:text-white ml-auto"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category Filters — Pill-shaped with icons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (count === 0 && cat !== 'ALL') return null;
                const CatIcon = cat === 'ALL' ? Sparkles : (CATEGORY_ICONS[cat] || Sparkles);
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                      isActive
                        ? 'bg-gold-500 text-neutral-950 border-gold-500 font-bold shadow-[0_0_12px_-2px_rgba(212,175,55,0.3)]'
                        : 'bg-neutral-950/40 text-neutral-500 border-neutral-900 hover:text-white hover:border-neutral-700 hover:bg-neutral-900/40'
                    }`}
                  >
                    {cat !== 'ALL' && <CatIcon className="h-3 w-3" />}
                    {cat === 'ALL' ? 'All' : cat}
                    <span className={`ml-0.5 px-1 py-0.5 rounded-full text-[7px] ${
                      isActive ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-900 text-neutral-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Experience Cards Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-neutral-500 mt-4 font-mono">Loading experiences...</p>
              </div>
            ) : filteredExperiences.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExperiences.map((exp) => {
                  const spotsLeft = (exp.spots || 0) - (exp.spotsTaken || 0);
                  const isFull = spotsLeft <= 0;
                  return (
                    <motion.div
                      key={exp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-neutral-950/40 border border-neutral-900 rounded-xl overflow-hidden hover:border-gold-500/20 transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.08)] flex flex-col"
                    >
                      {/* Image Header */}
                      <div className="relative h-36 bg-neutral-900/60 overflow-hidden">
                        {exp.image ? (
                          <img src={exp.image} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Star className="h-8 w-8 text-neutral-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                          {exp.featured && (
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider bg-gold-500/10 border border-gold-500/20 text-gold-500">
                              Featured
                            </span>
                          )}
                          {exp.is_virtual && (
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              Virtual
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          {CATEGORY_ICONS[exp.category] && (
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider border ${CATEGORY_COLORS[exp.category] || 'bg-neutral-900 text-neutral-400 border-neutral-800'}`}>
                              {React.createElement(CATEGORY_ICONS[exp.category], { className: 'h-2.5 w-2.5' })}
                              {exp.category}
                            </span>
                          )}
                          {!CATEGORY_ICONS[exp.category] && (
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider border ${CATEGORY_COLORS[exp.category] || 'bg-neutral-900 text-neutral-400 border-neutral-800'}`}>
                              {exp.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-2.5 flex-1">
                        <h3 className="font-serif text-sm font-bold text-white tracking-wide leading-snug line-clamp-1">
                          {exp.title}
                        </h3>
                        <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                          {exp.short_description || exp.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono text-neutral-500 pt-1.5 border-t border-neutral-900/60">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {exp.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="h-2.5 w-2.5" />
                            {exp.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" />
                            {isFull ? 'Full' : `${spotsLeft} left`}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 pb-4 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-neutral-500">
                          {exp.price === 'Complimentary' ? (
                            <span className="text-emerald-400 font-bold">Complimentary</span>
                          ) : (
                            <span className="text-white font-bold">{exp.price}</span>
                          )}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openDetail(exp)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-mono tracking-wider uppercase border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                          <button
                            onClick={() => openBooking(exp)}
                            disabled={isFull}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-mono tracking-wider uppercase transition-all ${
                              isFull
                                ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                : 'bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold'
                            }`}
                          >
                            {isFull ? 'Full' : 'Book'}
                            {!isFull && <ChevronRight className="h-2.5 w-2.5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
                <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                  <Search className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500">No experiences match your criteria.</p>
                <p className="text-[10px] text-neutral-600 font-mono">Try adjusting your filters or search terms.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); setFilterFeatured(false); setFilterVirtual('all'); setFilterAvailable(false); }}
                  className="text-xs text-gold-500 hover:text-gold-400 font-mono"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
