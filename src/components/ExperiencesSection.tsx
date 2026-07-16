import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import BookingModal from './BookingModal';
import {
  Sparkles,
  Award,
  CheckCircle,
  Clock,
  ShieldCheck,
  Users,
  MapPin,
  Timer,
  Star,
  X,
  ChevronRight,
  Heart,
  Palette,
  Compass,
  BookOpen,
  Camera,
  Eye,
  Ticket,
  UserCheck
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'ALL', icon: Sparkles },
  { id: 'Meet & Greet', label: 'MEET & GREET', icon: Users },
  { id: 'Creative', label: 'CREATIVE', icon: Palette },
  { id: 'Philanthropy', label: 'PHILANTHROPY', icon: Heart },
  { id: 'Adventure', label: 'ADVENTURE', icon: Compass },
  { id: 'Literary', label: 'LITERARY', icon: BookOpen },
  { id: 'Behind-the-Scenes', label: 'BEHIND-THE-SCENES', icon: Camera },
];

const TIER_COLORS: Record<string, string> = {
  Gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Platinum: 'bg-slate-300/10 text-slate-300 border-slate-400/20',
  Diamond: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Meet & Greet': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Creative: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Philanthropy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Adventure: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Literary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Behind-the-Scenes': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export default function ExperiencesSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch experiences from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [contentRes, bookingsRes] = await Promise.all([
          fetch('/api/content'),
          fetch('/api/experience-requests'),
        ]);
        if (contentRes.ok) {
          const data = await contentRes.json();
          setExperiences(data.experiences || []);
        }
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data || []);
        }
      } catch (err) {
        console.error('Failed to load experiences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredExperiences = useMemo(() => {
    if (activeCategory === 'ALL') return experiences;
    return experiences.filter(e => e.category === activeCategory);
  }, [experiences, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: experiences.length };
    experiences.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [experiences]);

  const stats = useMemo(() => ({
    total: experiences.length,
    popular: experiences.filter(e => e.popular).length,
    available: experiences.reduce((sum, e) => sum + (e.spots - e.spotsTaken), 0),
    categories: new Set(experiences.map(e => e.category)).size,
  }), [experiences]);

  const openDetail = (exp: Experience) => {
    setSelectedExp(exp);
    setShowDetail(true);
  };

  const openBooking = (exp: Experience) => {
    setSelectedExp(exp);
    setShowDetail(false);
    setShowBooking(true);
  };

  const handleBookingSuccess = (booking: ExperienceBooking) => {
    setBookings(prev => [booking, ...prev]);
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

  return (
    <section id="experiences-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Award className="h-3.5 w-3.5" />
            ONCE-IN-A-LIFETIME REVERIES
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Exalted <span className="text-gold-500">Experiences</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Choose from 40+ curated experiences across meet-and-greets, creative workshops, philanthropy, adventure, literary events, and behind-the-scenes access.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { icon: Ticket, value: stats.total, label: 'Experiences', color: 'text-gold-500' },
            { icon: Star, value: stats.popular, label: 'Popular', color: 'text-amber-400' },
            { icon: Users, value: stats.available, label: 'Spots Open', color: 'text-emerald-400' },
            { icon: Compass, value: stats.categories, label: 'Categories', color: 'text-cyan-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 text-center space-y-1.5 hover:border-neutral-800 transition-colors">
              <stat.icon className={`h-4 w-4 ${stat.color} mx-auto`} />
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

        {activeTab === 'browse' ? (
          <>
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                      activeCategory === cat.id
                        ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                    }`}
                  >
                    <IconComp className="h-3 w-3" />
                    {cat.label}
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] ${
                      activeCategory === cat.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-900 text-neutral-500'
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
                  const spotsLeft = exp.spots - exp.spotsTaken;
                  const isFull = spotsLeft <= 0;
                  return (
                    <motion.div
                      key={exp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-neutral-950/40 border border-neutral-900 rounded-xl overflow-hidden hover:border-gold-500/20 transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.08)] flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="p-5 space-y-3 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${TIER_COLORS[exp.tier] || TIER_COLORS.Gold}`}>
                              {exp.tier}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${CATEGORY_COLORS[exp.category] || ''}`}>
                              {exp.category}
                            </span>
                          </div>
                          {exp.popular && (
                            <span className="flex items-center gap-1 text-[8px] font-mono text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20 shrink-0">
                              <Star className="h-2.5 w-2.5 fill-gold-500" />
                              POPULAR
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-sm font-bold text-white tracking-wide leading-snug">
                          {exp.title}
                        </h3>

                        <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-3">
                          {exp.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-neutral-500 pt-2 border-t border-neutral-900/60">
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
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 pb-5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-500">
                          {exp.price === 'Complimentary' ? (
                            <span className="text-emerald-400">Complimentary</span>
                          ) : (
                            exp.price
                          )}
                        </span>
                        <button
                          onClick={() => openDetail(exp)}
                          disabled={isFull}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase transition-all ${
                            isFull
                              ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                              : 'bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold'
                          }`}
                        >
                          {isFull ? 'Full' : 'View & Book'}
                          {!isFull && <ChevronRight className="h-3 w-3" />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
                <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500">No experiences in this category yet.</p>
                <p className="text-[10px] text-neutral-600 font-mono">Check back soon or browse all categories.</p>
              </div>
            )}
          </>
        ) : (
          /* ─── My Bookings Tab ──────────────────────────── */
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
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                      <span>{booking.fullName}</span>
                      <span className="text-neutral-700">|</span>
                      <span>{booking.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
                    </div>
                    {booking.specialRequests && (
                      <p className="text-[11px] text-neutral-500 italic line-clamp-1 max-w-xl">
                        "{booking.specialRequests}"
                      </p>
                    )}
                    {booking.confirmedDate && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono">
                        <CheckCircle className="h-3 w-3" />
                        Confirmed: {booking.confirmedDate} at {booking.confirmedTime} — {booking.confirmedLocation}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusDot(booking.status)}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusDot(booking.status)}`} />
                    </span>
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                      {booking.status}
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
        )}
      </div>

      {/* ─── Detail Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showDetail && selectedExp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-900 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${TIER_COLORS[selectedExp.tier] || TIER_COLORS.Gold}`}>
                        {selectedExp.tier}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${CATEGORY_COLORS[selectedExp.category] || ''}`}>
                        {selectedExp.category}
                      </span>
                      {selectedExp.popular && (
                        <span className="flex items-center gap-1 text-[8px] font-mono text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">
                          <Star className="h-2.5 w-2.5 fill-gold-500" />
                          POPULAR
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-extrabold text-white tracking-wide uppercase">
                      {selectedExp.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gold-500" />
                    {selectedExp.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-gold-500" />
                    {selectedExp.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-gold-500" />
                    {selectedExp.spots - selectedExp.spotsTaken} of {selectedExp.spots} spots open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3 w-3 text-gold-500" />
                    {selectedExp.price === 'Complimentary' ? (
                      <span className="text-emerald-400">Complimentary</span>
                    ) : selectedExp.price}
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {selectedExp.description}
                </p>

                {/* Spots Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                    <span>SPOTS FILLED</span>
                    <span>{selectedExp.spotsTaken}/{selectedExp.spots}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all"
                      style={{ width: `${(selectedExp.spotsTaken / selectedExp.spots) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold">
                    INCLUDED IN THIS EXPERIENCE:
                  </h4>
                  <ul className="space-y-2">
                    {selectedExp.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                        <CheckCircle className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Book Experience Button */}
                {selectedExp.spots - selectedExp.spotsTaken > 0 && (
                  <div className="pt-6 border-t border-neutral-900/60">
                    <button
                      onClick={() => openBooking(selectedExp)}
                      className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-3 rounded-lg tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                    >
                      <Ticket className="h-4 w-4" />
                      BOOK THIS EXPERIENCE
                    </button>
                    <p className="text-[9px] text-neutral-600 font-mono text-center mt-2">
                      Applications reviewed within 24-48 hours
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Booking Modal ──────────────────────────────── */}
      {showBooking && selectedExp && (
        <BookingModal
          experience={selectedExp}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </section>
  );
}
