import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Experience } from '../types';
import BookingPage from './BookingPage';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, Star, Sparkles,
  Shield, Info, ChevronRight, Image as ImageIcon, CheckCircle,
  X, Heart, Award, Ticket, Globe, Palette, Compass, BookOpen,
  Camera, Zap, Lock,
} from 'lucide-react';

interface Props {
  experienceId: string;
  onBack: () => void;
  onBook: (exp: Experience) => void;
}

const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZmlsbD0iI2ZmZjYwMCI+4piFPC90ZXh0Pjwvc3ZnPg==';

const CATEGORY_ICONS: Record<string, any> = {
  'Meet & Greet': Heart,
  'Creative': Palette,
  'Philanthropy': Award,
  'Adventure': Compass,
  'Literary': BookOpen,
  'Behind-the-Scenes': Camera,
};

export default function ExperienceDetailPage({ experienceId, onBack, onBook }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exp, setExp] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllFaq, setShowAllFaq] = useState(false);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase.from('experiences').select('*').eq('id', experienceId).single();
      if (!error && data) {
        let extras: any = {};
        try { if (data.details && data.details.length > 0) extras = JSON.parse(data.details[0]); } catch {}
        setExp({
          id: data.id, title: data.title, category: data.category || 'Meet & Greet',
          tier: data.tier || 'Gold', duration: data.duration, location: data.location,
          price: data.price || 'Complimentary', spots: data.spots || 10,
          spotsTaken: data.spots_taken || 0, description: data.description,
          short_description: extras.short_description || data.description?.substring(0, 120) || '',
          full_description: extras.full_description || data.description || '',
          details: data.details || [], image: data.image || '',
          gallery_images: extras.gallery_images || data.image || '',
          is_virtual: extras.is_virtual === true || data.capacity?.toLowerCase() === 'virtual',
          max_guests: extras.max_guests || data.spots || 10,
          availability: extras.availability || 'Available',
          booking_requirements: extras.booking_requirements || data.intensity || '',
          featured: extras.featured === true || data.popular === true,
          published: extras.published !== false, archived: extras.archived === true,
          popular: data.popular || false, sort_order: data.sort_order || 0,
          capacity: data.capacity || '', intensity: data.intensity || '',
        } as Experience);
      } else {
        setExp(null);
      }
      setLoading(false);
    })();
  }, [experienceId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-mono">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
            <X className="h-5 w-5 text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-500">Experience not found</p>
          <button onClick={onBack} className="text-xs text-gold-500 hover:text-gold-400 font-mono">
            ← Back to Experiences
          </button>
        </div>
      </div>
    );
  }

  const images = [];
  if (exp.image) images.push(exp.image);
  if (exp.gallery_images) {
    const gallery = typeof exp.gallery_images === 'string'
      ? exp.gallery_images.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(exp.gallery_images) ? exp.gallery_images : [];
    gallery.forEach((img: string) => { if (!images.includes(img)) images.push(img); });
  }
  if (images.length === 0) images.push(FALLBACK_IMAGE);

  const spotsLeft = (exp.spots || 0) - (exp.spotsTaken || 0);
  const isFull = spotsLeft <= 0;

  const relatedFaq = [
    { q: 'How do I book this experience?', a: 'Click "Book Experience" and complete the booking form. After submission, you will be prompted to send a message via WhatsApp or Email to confirm your request.' },
    { q: 'Is this experience physically accessible?', a: 'Accessibility depends on the specific venue. Please mention any accessibility requirements in your special requests when booking, and our team will confirm arrangements.' },
    { q: 'What is the cancellation policy?', a: 'Cancellations made more than 14 days before the experience date receive a full refund. Cancellations within 7-14 days receive a 50% refund. Cancellations within 7 days are non-refundable.' },
    { q: 'Can I bring a guest?', a: 'The number of guests is specified during booking. Additional guests may be accommodated depending on availability and the nature of the experience.' },
    { q: 'How will I receive confirmation?', a: 'After submitting your booking request, the administrator will review and contact you via your chosen communication method (WhatsApp or Email) with confirmation details.' },
  ];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors group">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Experiences
      </button>

      {showBooking ? (
        <BookingPage
          experience={exp}
          onBack={() => setShowBooking(false)}
        />
      ) : (
        <>
          {/* Hero Banner — Cinematic */}
          <div className="relative rounded-2xl overflow-hidden border border-neutral-900 h-[320px] md:h-[480px] group">
            <div className="absolute inset-0 bg-neutral-900/80 z-0 flex items-center justify-center">
              <Star className="h-16 w-16 text-neutral-700" />
            </div>
            <img
              src={images[activeImageIndex]}
              alt={exp.title}
              className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-30">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {exp.featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[8px] font-mono text-gold-500 uppercase tracking-wider backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 fill-gold-500" /> Featured
                  </span>
                )}
                {exp.is_virtual && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-mono text-blue-400 uppercase tracking-wider backdrop-blur-sm">
                    <Globe className="h-2.5 w-2.5" /> Virtual
                  </span>
                )}
                {CATEGORY_ICONS[exp.category] && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 text-[8px] font-mono text-neutral-300 uppercase tracking-wider">
                    {React.createElement(CATEGORY_ICONS[exp.category], { className: 'h-2.5 w-2.5' })}
                    {exp.category}
                  </span>
                )}
                {!CATEGORY_ICONS[exp.category] && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 text-[8px] font-mono text-neutral-300 uppercase tracking-wider">
                    {exp.category}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-white uppercase tracking-tight leading-tight">{exp.title}</h1>
              <p className="text-xs md:text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">{exp.short_description}</p>
            </div>

            {/* Image Gallery Thumbs */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === activeImageIndex ? 'border-gold-500 opacity-100 ring-1 ring-gold-500/30' : 'border-white/10 opacity-50 hover:opacity-80'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-gold-500/3 blur-[100px] pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview — Quick Stats */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-sm p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gold-500" />
                  Experience Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: MapPin, label: 'Location', value: exp.location },
                    { icon: Clock, label: 'Duration', value: exp.duration },
                    { icon: Users, label: 'Max Guests', value: `${exp.max_guests}` },
                    { icon: Calendar, label: 'Availability', value: exp.availability },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-neutral-900/30 border border-neutral-900/50 rounded-lg p-3 text-center space-y-1 hover:border-neutral-800 transition-colors">
                      <stat.icon className="h-4 w-4 text-gold-500 mx-auto" />
                      <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{stat.label}</span>
                      <span className="block text-xs font-bold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Description */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide">About This Experience</h2>
                <div className="text-xs text-neutral-300 leading-relaxed space-y-3 whitespace-pre-line">
                  {exp.full_description || exp.description}
                </div>
              </div>

              {/* What's Included */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Personalized experience with Gillian Anderson',
                    'Professional photographs and memorabilia',
                    'Signed commemorative items',
                    'Sanctuary gift package',
                    'Dedicated coordinator support',
                    'Priority booking for future experiences',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[11px] text-neutral-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Requirements */}
              {exp.booking_requirements && (
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-3">
                  <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide">Booking Requirements</h2>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                    <Shield className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>{exp.booking_requirements}</span>
                  </div>
                </div>
              )}

              {/* FAQ */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {(showAllFaq ? relatedFaq : relatedFaq.slice(0, 3)).map((faq, i) => (
                    <details key={i} className="group border border-neutral-900 rounded-lg overflow-hidden">
                      <summary className="text-xs font-bold text-neutral-200 px-4 py-3 cursor-pointer hover:bg-neutral-900/30 transition-colors flex items-center justify-between list-none">
                        {faq.q}
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-500 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="px-4 pb-3 text-[11px] text-neutral-400 leading-relaxed border-t border-neutral-900 pt-2 mt-0">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
                {relatedFaq.length > 3 && (
                  <button onClick={() => setShowAllFaq(!showAllFaq)} className="text-[10px] font-mono text-gold-500 hover:text-gold-400 transition-colors">
                    {showAllFaq ? 'Show Less' : `Show All (${relatedFaq.length} FAQs)`}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Card — Luxurious */}
              <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/[0.04] via-neutral-950/90 to-neutral-950 p-6 space-y-4 sticky top-24 shadow-[0_0_30px_-10px_rgba(212,175,55,0.08)]">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Starting From</span>
                  <p className="font-serif text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-300 bg-clip-text text-transparent">
                    {exp.price}
                  </p>
                </div>

                <div className="space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-900/40">
                    <span className="text-neutral-500">Spots Available</span>
                    <span className={`font-bold ${isFull ? 'text-red-400' : spotsLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isFull ? 'Fully Booked' : `${spotsLeft} left`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-900/40">
                    <span className="text-neutral-500">Duration</span>
                    <span className="text-white">{exp.duration}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-900/40">
                    <span className="text-neutral-500">Location</span>
                    <span className="text-white">{exp.location}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-neutral-500">Category</span>
                    <span className="flex items-center gap-1.5 text-white">
                      {CATEGORY_ICONS[exp.category] && React.createElement(CATEGORY_ICONS[exp.category], { className: 'h-3 w-3 text-gold-500' })}
                      {exp.category}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/portal?mode=login');
                      return;
                    }
                    setShowBooking(true);
                  }}
                  disabled={isFull}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                    isFull
                      ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                      : user
                        ? 'bg-gold-500 hover:bg-gold-400 text-neutral-950 shadow-[0_0_15px_-3px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_-3px_rgba(212,175,55,0.4)]'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {isFull ? 'Fully Booked' : user ? 'Book Experience' : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Sign in to Book
                    </>
                  )}
                  {!isFull && <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500 justify-center">
                  <Info className="h-3 w-3" />
                  <span>{user ? 'Requires admin confirmation' : 'Sign in required to book this experience'}</span>
                </div>
              </div>

              {/* Experience Details Card */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
                <h3 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Details</h3>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-neutral-500">Tier</span><span className="text-white font-medium">{exp.tier}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Max Guests</span><span className="text-white font-medium">{exp.max_guests}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Type</span>
                    <span className={`font-medium ${exp.is_virtual ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {exp.is_virtual ? 'Virtual' : 'Physical'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tier Level</span>
                    <span className="text-gold-500 font-medium capitalize">{exp.tier}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
