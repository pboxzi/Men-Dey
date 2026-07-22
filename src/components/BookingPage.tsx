import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import { createNotification, notifyAdmins } from '../utils/notifications';
import {
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  MessageCircle, Mail, Send, ShieldCheck, Calendar,
  Info, Users, MapPin, Clock, Star, Heart, Sparkles,
  ArrowLeft, Sun, Camera, Gift,
} from 'lucide-react';
import { openWhatsApp, openEmail } from '../utils/contactSettings';

interface Props {
  experienceId?: string;
  experience?: Experience;
  onBack: () => void;
  onSuccess?: (booking: ExperienceBooking) => void;
}

interface FormData {
  preferredDate: string;
  preferredTime: string;
  participants: number;
  specialRequests: string;
  communicationMethod: 'whatsapp' | 'email';
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, label: 'Your Details', icon: Calendar },
  { id: 2, label: 'How to Reach You', icon: MessageCircle },
  { id: 3, label: 'Final Review', icon: CheckCircle },
];

const JOYFUL_MESSAGES = [
  'This is where extraordinary begins.',
  'Your story with Gillian awaits.',
  'One moment can change everything.',
  'The experience of a lifetime is just a few clicks away.',
  'Say yes to the unforgettable.',
];

export default function BookingPage({ experienceId, experience: passedExp, onBack, onSuccess }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [exp, setExp] = useState<Experience | null>(passedExp || null);
  const [loadingExp, setLoadingExp] = useState(!passedExp && !!experienceId);
  const [joyfulMessage] = useState(() => JOYFUL_MESSAGES[Math.floor(Math.random() * JOYFUL_MESSAGES.length)]);

  useEffect(() => {
    if (!exp && experienceId) {
      supabase.from('experiences').select('*').eq('id', experienceId).single().then(({ data, error }) => {
        if (!error && data) {
          let extras: any = {};
          try { if (data.details?.length > 0) extras = JSON.parse(data.details[0]); } catch {}
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
        }
        setLoadingExp(false);
      });
    }
  }, [experienceId, exp]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [bookingRef, setBookingRef] = useState('');
  const [submitError, setSubmitError] = useState('');

  const formDefaults: FormData = {
    preferredDate: '',
    preferredTime: '',
    participants: 1,
    specialRequests: '',
    communicationMethod: 'email',
  };

  const [form, setForm] = useState<FormData>(formDefaults);

  const personalInfo = {
    fullName: profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    email: profile?.email || user?.email || '',
    phone: profile?.contact || '',
    country: profile?.country || 'USA',
  };

  const updateForm = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!form.preferredDate) e.preferredDate = 'Please pick the date your heart desires';
    else {
      const d = new Date(form.preferredDate);
      if (d < new Date(new Date().toDateString())) e.preferredDate = 'This date has passed — choose a future moment';
    }
    if (!form.preferredTime) e.preferredTime = 'What time feels right?';
    if (form.participants < 1 || form.participants > (exp?.max_guests || 10)) {
      e.participants = `Between 1 and ${exp?.max_guests || 10} guests, please`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!form.communicationMethod) e.communicationMethod = 'How should we reach you?';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const buildMessage = (): string => {
    return `EXPERIENCE BOOKING REQUEST\n\nExperience: ${exp?.title}\nCategory: ${exp?.category}\n\n--- YOUR DETAILS ---\nName: ${personalInfo.fullName}\nEmail: ${personalInfo.email}\nPhone: ${personalInfo.phone || 'Not provided'}\nCountry: ${personalInfo.country}\n\n--- BOOKING ---\nPreferred Date: ${form.preferredDate}\nPreferred Time: ${form.preferredTime}\nGuests: ${form.participants}\n\n--- NOTES ---\n${form.specialRequests || 'None'}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const ref = 'REF-' + Date.now().toString(36).toUpperCase();
      const body: any = {
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        booking_reference: ref,
        experience_id: exp!.id,
        experience_title: exp!.title,
        status: 'pending',
        full_name: personalInfo.fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        country: personalInfo.country,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        participants: form.participants,
        special_requests: form.specialRequests,
        communication_method: form.communicationMethod,
      };
      if (user?.id) body.user_id = user.id;
      body.member_name = profile?.name || personalInfo.fullName;
      body.member_avatar = (profile?.name || personalInfo.fullName).slice(0, 2).toUpperCase();
      body.submitted_date = new Date().toISOString();

      const { data, error } = await supabase.from('experience_requests').insert(body).select().single();
      if (error) {
        console.error('Supabase insert error:', JSON.stringify(error));
        throw new Error('Failed to submit booking');
      }

      setBookingRef(data?.booking_reference || ref);

      // Notify fan + admin
      if (user?.id) {
        createNotification({
          userId: user.id,
          type: 'experience',
          title: 'Experience Booking Submitted',
          message: `Your request for "${exp!.title}" has been submitted. Reference: ${ref}`,
          sendEmail: true,
          emailSubject: `Booking Request Submitted: ${exp!.title}`,
          emailBody: `<p>Your experience request for <strong>${exp!.title}</strong> has been submitted successfully.</p><p>Reference: <code>${ref}</code></p><p>We'll review your request and get back to you soon.</p>`,
        });
      }
      notifyAdmins('experience', 'New Experience Booking', `New booking request for "${exp!.title}" from ${profile?.name || personalInfo.fullName}. Reference: ${ref}`);

      const message = buildMessage();
      if (form.communicationMethod === 'whatsapp') {
        openWhatsApp(message);
      } else {
        openEmail('Experience Booking Request - ' + (exp?.title || ''), message);
      }

      setSuccess(true);
      if (onSuccess && data) onSuccess(data as any);
    } catch (err) {
      console.error('Booking failed:', err);
      setSubmitError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, field, type = 'text', required = true, placeholder = '' }: {
    label: string; field: keyof FormData; type?: string; required?: boolean; placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={form[field] as string}
        onChange={(e) => updateForm(field, e.target.value)}
        className={`w-full bg-neutral-900 border rounded-lg px-3.5 py-2.5 text-white text-xs outline-none transition-colors ${
          errors[field] ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-800 focus:border-gold-500/40'
        }`}
      />
      {errors[field] && (
        <p className="text-[9px] text-red-400 flex items-center gap-1">
          <AlertCircle className="h-2.5 w-2.5" /> {errors[field]}
        </p>
      )}
    </div>
  );

  if (loadingExp) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-mono">Preparing your booking experience...</p>
        </div>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-500">Experience not found</p>
          <button onClick={onBack} className="text-xs text-gold-500 hover:text-gold-400 font-mono">Go back</button>
        </div>
      </div>
    );
  }

  const spotsLeft = (exp.spots || 0) - (exp.spotsTaken || 0);
  const isFull = spotsLeft <= 0;

  if (isFull) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">All Booked for Now</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            This beautiful experience has no available spots at the moment. But don't lose heart — more moments with Gillian are always being crafted. Check back soon.
          </p>
          <button onClick={onBack} className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs tracking-widest uppercase transition-all">
            Browse Other Experiences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors group">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Experiences
      </button>

      {success ? (
        /* ─── SUCCESS STATE — CELEBRATION ─── */
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] via-neutral-950 to-neutral-950 p-8 md:p-12 text-center space-y-6 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/5 blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gold-500/5 blur-[60px]" />

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </motion.div>

            <div className="space-y-2 relative">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">Your Journey Begins! ✨</h2>
              <p className="text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
                You've taken the first step toward an unforgettable moment with Gillian. Your request for <span className="text-gold-500 font-semibold">{exp.title}</span> has been received with joy.
              </p>
            </div>

            {bookingRef && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/5 border border-gold-500/10 text-[10px] font-mono text-gold-500">
                <Gift className="h-3 w-3" /> Reference: {bookingRef}
              </div>
            )}

            <div className="bg-neutral-900/50 border border-neutral-900 rounded-xl p-5 text-left space-y-3 max-w-lg mx-auto">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">What happens next</p>
              <ul className="space-y-3">
                {[
                  { icon: Send, text: 'Send the pre-filled message in your WhatsApp or email to confirm' },
                  { icon: Clock, text: 'The team reviews your request within 24–48 hours' },
                  { icon: MessageCircle, text: 'You\'ll be contacted via your chosen method' },
                  { icon: Star, text: 'Track everything in "My Bookings" from your portal' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[11px] text-neutral-400">
                    <item.icon className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={onBack} className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs tracking-widest uppercase transition-all">
                Browse More Experiences
              </button>
              <button
                onClick={() => navigate('/portal')}
                className="px-6 py-2.5 border border-gold-500/30 hover:border-gold-500/60 text-gold-500 font-bold rounded-lg text-xs tracking-widest uppercase transition-all"
              >
                Track in My Bookings
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ─── HERO — EXPERIENCE PREVIEW ─── */}
          <div className="relative rounded-2xl overflow-hidden border border-neutral-900 h-48 md:h-56">
            <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center">
              <Star className="h-12 w-12 text-neutral-700" />
            </div>
            {exp.image && (
              <img src={exp.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
            <div className="absolute inset-0 p-5 md:p-7 flex flex-col justify-center">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-gold-500" />
                  {exp.category}
                </div>
                <h1 className="font-serif text-xl md:text-3xl font-bold text-white">{exp.title}</h1>
                <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xl line-clamp-2">{exp.short_description || exp.description}</p>
                <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{exp.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{exp.duration}</span>
                  <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{spotsLeft} spots left</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── JOYFUL INVITATION ─── */}
          <div className="text-center space-y-2 pb-2">
            <p className="text-xs text-gold-500 font-mono italic tracking-wide">{joyfulMessage}</p>
            <p className="text-[10px] text-neutral-500 font-mono">
              You're booking: <span className="text-white font-bold">{exp.price}</span>
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* ─── STEP INDICATOR ─── */}
            <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-3">
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isDone = step > s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all ${
                        isActive ? 'bg-gold-500 text-neutral-950 font-bold' :
                        isDone ? 'text-gold-500' : 'text-neutral-600'
                      }`}>
                        {isDone ? <CheckCircle className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                        <span className="hidden sm:inline">{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`h-[1px] flex-1 ${isDone ? 'bg-gold-500/30' : 'bg-neutral-900'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ─── FORM BODY ─── */}
            <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-5 md:p-7">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-900/60">
                      <Calendar className="h-4 w-4 text-gold-500" />
                      <h4 className="text-[10px] font-mono text-neutral-300 tracking-wider uppercase font-semibold">When & Who</h4>
                    </div>

                    {/* Personal Info */}
                    <div className="p-4 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-mono text-gold-500 uppercase tracking-wider">
                        <Heart className="h-3 w-3" /> Your Details
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <span className="text-neutral-500">Name</span><span className="text-white font-medium">{personalInfo.fullName || '—'}</span>
                        <span className="text-neutral-500">Email</span><span className="text-white font-medium">{personalInfo.email || '—'}</span>
                        <span className="text-neutral-500">Phone</span><span className="text-white font-medium">{personalInfo.phone || 'Not provided'}</span>
                        <span className="text-neutral-500">Country</span><span className="text-white font-medium">{personalInfo.country}</span>
                      </div>
                    </div>

                    {/* Experience Summary */}
                    <div className="p-4 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-mono text-gold-500 uppercase tracking-wider">
                        <Star className="h-3 w-3" /> Your Selection
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-neutral-500">Experience</span><span className="text-white font-bold">{exp.title}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Category</span><span className="text-neutral-300">{exp.category}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Investment</span><span className="text-gold-500 font-bold">{exp.price}</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Preferred Date" field="preferredDate" type="date" />
                      <InputField label="Preferred Time" field="preferredTime" type="time" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Number of Guests *</label>
                      <input type="number" min={1} max={exp.max_guests} value={form.participants}
                        onChange={(e) => updateForm('participants', parseInt(e.target.value) || 1)}
                        className={`w-full bg-neutral-900 border rounded-lg px-3.5 py-2.5 text-white text-xs outline-none transition-colors ${errors.participants ? 'border-red-500/50' : 'border-neutral-800 focus:border-gold-500/40'}`}
                      />
                      <p className="text-[9px] text-neutral-600 font-mono">{spotsLeft} spots available (max {exp.max_guests})</p>
                      {errors.participants && <p className="text-[9px] text-red-400 flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> {errors.participants}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Special Wishes (optional)</label>
                      <textarea rows={3} placeholder="Dietary needs, accessibility, a song request... anything that would make this moment perfect."
                        value={form.specialRequests} onChange={(e) => updateForm('specialRequests', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white text-xs outline-none focus:border-gold-500/40 resize-none leading-relaxed" />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-900/60">
                      <MessageCircle className="h-4 w-4 text-gold-500" />
                      <h4 className="text-[10px] font-mono text-neutral-300 tracking-wider uppercase font-semibold">How should we reach you?</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle,
                          color: 'text-emerald-400',
                          border: form.communicationMethod === 'whatsapp' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700',
                          desc: 'Fast & friendly — chat directly with the team.',
                          detail: 'Quick and warm, just like a conversation with an old friend.',
                        },
                        {
                          id: 'email' as const, label: 'Email', icon: Mail,
                          color: 'text-blue-400',
                          border: form.communicationMethod === 'email' ? 'border-blue-500/40 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-700',
                          desc: 'Elegant and thorough — everything in writing.',
                          detail: 'Perfect for keeping a beautiful paper trail of your journey.',
                        },
                      ].map((method) => (
                        <button key={method.id} onClick={() => updateForm('communicationMethod', method.id)}
                          className={`p-5 rounded-xl border text-left transition-all space-y-3 ${method.border}`}>
                          <method.icon className={`h-7 w-7 ${method.color}`} />
                          <div>
                            <h5 className="text-sm font-bold text-white">{method.label}</h5>
                            <p className="text-[10px] text-neutral-400 mt-1">{method.detail}</p>
                          </div>
                          {form.communicationMethod === method.id && (
                            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Perfect choice!
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {errors.communicationMethod && (
                      <p className="text-[9px] text-red-400 flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> {errors.communicationMethod}</p>
                    )}

                    <div className="p-4 bg-gold-500/[0.02] border border-gold-500/10 rounded-xl flex items-start gap-3 text-[10px] text-neutral-400 leading-relaxed">
                      <Sun className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                      <span>After you submit, your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} will open with a lovely pre-written message. Just hit send — we'll take it from there. No chasing, no fuss.</span>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-900/60">
                      <CheckCircle className="h-4 w-4 text-gold-500" />
                      <h4 className="text-[10px] font-mono text-neutral-300 tracking-wider uppercase font-semibold">One last look — then off you go!</h4>
                    </div>

                    <div className="p-4 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                          {exp.image ? <img src={exp.image} alt="" className="h-full w-full object-cover" /> : <Star className="h-5 w-5 text-gold-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{exp.title}</p>
                          <p className="text-[10px] text-neutral-500">{exp.category} — {exp.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-2">
                        <h5 className="text-[8px] font-mono text-gold-500 uppercase tracking-wider font-bold">You</h5>
                        <div className="space-y-1 text-[11px]">
                          <p><span className="text-neutral-500">Name</span> <span className="text-white ml-2">{personalInfo.fullName}</span></p>
                          <p><span className="text-neutral-500">Email</span> <span className="text-white ml-2">{personalInfo.email}</span></p>
                          <p><span className="text-neutral-500">Phone</span> <span className="text-white ml-2">{personalInfo.phone || '—'}</span></p>
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-2">
                        <h5 className="text-[8px] font-mono text-gold-500 uppercase tracking-wider font-bold">When</h5>
                        <div className="space-y-1 text-[11px]">
                          <p><span className="text-neutral-500">Date</span> <span className="text-white ml-2">{form.preferredDate}</span></p>
                          <p><span className="text-neutral-500">Time</span> <span className="text-white ml-2">{form.preferredTime}</span></p>
                          <p><span className="text-neutral-500">Guests</span> <span className="text-white ml-2">{form.participants}</span></p>
                        </div>
                      </div>
                    </div>

                    {form.specialRequests && (
                      <div className="p-3 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-1">
                        <h5 className="text-[8px] font-mono text-gold-500 uppercase tracking-wider">Special Wishes</h5>
                        <p className="text-[11px] text-neutral-300">{form.specialRequests}</p>
                      </div>
                    )}

                    <div className="p-3 bg-neutral-900/30 border border-neutral-900/60 rounded-xl space-y-1">
                      <h5 className="text-[8px] font-mono text-gold-500 uppercase tracking-wider">Contact Via</h5>
                      <div className="flex items-center gap-2 text-[11px]">
                        {form.communicationMethod === 'whatsapp' ? <MessageCircle className="h-4 w-4 text-emerald-400" /> : <Mail className="h-4 w-4 text-blue-400" />}
                        <span className="text-white capitalize">{form.communicationMethod}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gold-500/[0.02] border border-gold-500/10 rounded-xl flex items-start gap-3 text-[10px] text-neutral-400 leading-relaxed">
                      <ShieldCheck className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                      <span>You're almost there! When you tap "Send Request", your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} will open with a beautiful pre-filled message. Just press send and your journey begins.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error display */}
            {submitError && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-[10px] text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Failed to submit: {submitError}. Check console for details.</span>
              </div>
            )}

            {/* ─── NAVIGATION ─── */}
            <div className="flex items-center justify-between">
              <button onClick={step === 1 ? onBack : handleBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-mono tracking-wider uppercase text-neutral-400 hover:text-white transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
                {step === 1 ? 'Cancel' : step === 3 ? 'Back & Edit' : 'Back'}
              </button>

              {step < 3 ? (
                <button onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-[10px] tracking-widest uppercase transition-all">
                  Continue <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-[10px] tracking-widest uppercase transition-all disabled:opacity-40">
                  {loading ? (
                    <div className="h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Send Request ✨</>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
