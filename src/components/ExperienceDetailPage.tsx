import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import BookingModal from './BookingModal';
import { supabase } from '../utils/supabase';
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, Star, Sparkles,
  Shield, Info, ChevronRight, Image as ImageIcon, CheckCircle,
  X, Heart, Award, Ticket, Globe,
} from 'lucide-react';

interface Props {
  experienceId: string;
  onBack: () => void;
  onBook: (exp: Experience) => void;
}

const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZmlsbD0iI2ZmZjYwMCI+4piFPC90ZXh0Pjwvc3ZnPg==';

const CATEGORY_ICONS: Record<string, any> = {
  'Meet & Greet': Users,
  'VIP Meet & Greet': Star,
  'Private Dinner Experiences': Heart,
  'Professional Photo Sessions': Camera,
  'Acting Workshops': Sparkles,
  'Theatre Masterclasses': Award,
  'Script Reading Sessions': BookOpen,
  'Virtual Coffee Chats': Globe,
  'Exclusive Q&A Sessions': HelpCircle,
  "Women's Leadership Conversations": Users,
  'Wellness Experiences': Heart,
  'Book Discussions': BookOpen,
  'Creative Writing Sessions': Edit,
  'Film Screenings': Film,
  'Mentorship Experiences': Star,
  'Fundraising Experiences': Heart,
  'Studio Tours': Camera,
  'Fan Appreciation Experiences': Users,
  'Charity Experiences': Heart,
};

function Camera() { return <ImageIcon className="h-4 w-4" />; }
function BookOpen() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function HelpCircle() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function Edit() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function Film() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>; }

export default function ExperienceDetailPage({ experienceId, onBack, onBook }: Props) {
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

  const spotsLeft = exp.spots - exp.spotsTaken;
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
      <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Experiences
      </button>

      {showBooking ? (
        <BookingModal
          experience={exp}
          onClose={() => setShowBooking(false)}
          onSuccess={(booking: ExperienceBooking) => { setShowBooking(false); onBack(); }}
        />
      ) : (
        <>
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-neutral-900 h-[300px] md:h-[450px]">
            <img
              src={images[activeImageIndex]}
              alt={exp.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {exp.featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[8px] font-mono text-gold-500 uppercase tracking-wider">
                    <Star className="h-2.5 w-2.5 fill-gold-500" /> Featured
                  </span>
                )}
                {exp.is_virtual && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-mono text-blue-400 uppercase tracking-wider">
                    <Globe className="h-2.5 w-2.5" /> Virtual
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                  {exp.category}
                </span>
              </div>
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-white uppercase tracking-tight">{exp.title}</h1>
              <p className="text-xs md:text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">{exp.short_description}</p>
            </div>

            {/* Image Gallery Thumbs */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${i === activeImageIndex ? 'border-gold-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wide">Experience Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: MapPin, label: 'Location', value: exp.location },
                    { icon: Clock, label: 'Duration', value: exp.duration },
                    { icon: Users, label: 'Max Guests', value: `${exp.max_guests}` },
                    { icon: Calendar, label: 'Availability', value: exp.availability },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-neutral-900/30 border border-neutral-900/50 rounded-lg p-3 text-center space-y-1">
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
              {/* Price Card */}
              <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/[0.03] via-neutral-950 to-neutral-950 p-6 space-y-4 sticky top-24">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Starting From</span>
                  <p className="font-serif text-2xl font-bold text-white">{exp.price}</p>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Spots Available</span>
                    <span className={`font-bold ${isFull ? 'text-red-400' : spotsLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isFull ? 'Fully Booked' : `${spotsLeft} left`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Duration</span>
                    <span className="text-white">{exp.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Location</span>
                    <span className="text-white">{exp.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Category</span>
                    <span className="text-white">{exp.category}</span>
                  </div>
                </div>

                <div className="h-px bg-neutral-900/60" />

                <button
                  onClick={() => setShowBooking(true)}
                  disabled={isFull}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
                    isFull
                      ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                      : 'bg-gold-500 hover:bg-gold-400 text-neutral-950'
                  }`}
                >
                  {isFull ? 'Fully Booked' : 'Book Experience'}
                  {!isFull && <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500 justify-center">
                  <Info className="h-3 w-3" />
                  <span>Booking requires admin confirmation</span>
                </div>
              </div>

              {/* Related Experiences placeholder - would need API */}
              <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
                <h3 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Experience Details</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-neutral-500">Tier</span><span className="text-white">{exp.tier}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Max Guests</span><span className="text-white">{exp.max_guests}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Type</span><span className="text-white">{exp.is_virtual ? 'Virtual' : 'Physical'}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-emerald-400">{exp.published ? 'Published' : 'Unpublished'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
