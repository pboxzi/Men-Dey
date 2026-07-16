import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Info
} from 'lucide-react';

const WHATSAPP_NUMBER = '+447700000000';
const ADMIN_EMAIL = 'bookings@gilliananderson.com';

interface BookingPageProps {
  experience: Experience;
  onClose: () => void;
  onSuccess: (booking: ExperienceBooking) => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  preferredDate: string;
  preferredTime: string;
  participants: number;
  specialRequests: string;
  story: string;
  communicationMethod: 'whatsapp' | 'email';
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Booking Details', icon: Calendar },
  { id: 3, label: 'Communication', icon: MessageSquare },
  { id: 4, label: 'Review & Submit', icon: CheckCircle },
];

export default function BookingModal({ experience, onClose, onSuccess }: BookingPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    preferredDate: '',
    preferredTime: '',
    participants: 1,
    specialRequests: '',
    story: '',
    communicationMethod: 'email',
  });

  const updateForm = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.country.trim()) e.country = 'Country is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!form.preferredDate) e.preferredDate = 'Preferred date is required';
    else {
      const d = new Date(form.preferredDate);
      if (d < new Date()) e.preferredDate = 'Date must be in the future';
    }
    if (!form.preferredTime) e.preferredTime = 'Preferred time is required';
    if (form.participants < 1 || form.participants > experience.spots) {
      e.participants = `Participants must be 1-${experience.spots}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: FormErrors = {};
    if (!form.communicationMethod) e.communicationMethod = 'Select a communication method';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const buildMessage = (): string => {
    return `EXPERIENCE BOOKING REQUEST\n\nExperience: ${experience.title}\nCategory: ${experience.category}\nTier: ${experience.tier}\n\n--- PERSONAL INFO ---\nName: ${form.fullName}\nEmail: ${form.email}\nPhone: ${form.phone}\nCountry: ${form.country}\nCity: ${form.city}\n\n--- BOOKING DETAILS ---\nPreferred Date: ${form.preferredDate}\nPreferred Time: ${form.preferredTime}\nParticipants: ${form.participants}\n\n--- SPECIAL REQUESTS ---\n${form.specialRequests || 'None'}\n\n--- WHY THIS EXPERIENCE ---\n${form.story || 'Not provided'}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/experience-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: experience.id,
          experienceTitle: experience.title,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          participants: form.participants,
          specialRequests: form.specialRequests,
          communicationMethod: form.communicationMethod,
          story: form.story,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit booking');
      const data = await res.json();

      const message = encodeURIComponent(buildMessage());
      if (form.communicationMethod === 'whatsapp') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
      } else {
        window.open(`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('Experience Booking Request - ' + experience.title)}&body=${message}`, '_blank');
      }

      setSuccess(true);
      onSuccess(data.booking);
    } catch (err) {
      console.error('Booking failed:', err);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors mb-2"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Experiences
          </button>
          <h2 className="font-serif text-xl font-bold text-white tracking-wide uppercase">
            Book Experience
          </h2>
          <p className="text-[11px] text-neutral-400">
            {experience.title} — {experience.tier} Tier
          </p>
        </div>
      </div>

      {success ? (
        /* ─── Success State ──────────────────────────── */
        <div className="text-center space-y-6 py-16">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-bold text-white">Booking Request Submitted!</h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
              Your booking for <span className="text-gold-500 font-semibold">{experience.title}</span> has been received. Your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} app has been opened with the booking details pre-filled.
            </p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-900 rounded-xl p-4 text-left space-y-2 max-w-lg mx-auto">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">What happens next:</p>
            <ul className="space-y-2">
              {[
                'Send the pre-filled message to complete your booking request',
                'The admin will review your request within 24-48 hours',
                'You\'ll be contacted via your chosen communication method',
                'Track your booking status in "My Bookings"',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-neutral-400">
                  <span className="text-gold-500 mt-0.5 shrink-0">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs tracking-widest uppercase transition-all"
          >
            Back to Experiences
          </button>
        </div>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4">
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

          {/* Form Body */}
          <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gold-500" /> PERSONAL INFORMATION
                  </h4>
                  <InputField label="Full Name" field="fullName" placeholder="e.g. Dana Scully Enthusiast" />
                  <InputField label="Email Address" field="email" type="email" placeholder="e.g. fan@example.com" />
                  <InputField label="Phone Number" field="phone" type="tel" placeholder="e.g. +44 7700 123456" />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Country" field="country" placeholder="e.g. United Kingdom" />
                    <InputField label="City" field="city" placeholder="e.g. London" />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gold-500" /> BOOKING DETAILS
                  </h4>

                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Selected Experience</span>
                      <span className="text-xs font-bold text-gold-500">{experience.title}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-400">Category</span>
                      <span className="text-[10px] text-neutral-500">{experience.category} — {experience.tier}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Preferred Date" field="preferredDate" type="date" />
                    <InputField label="Preferred Time" field="preferredTime" type="time" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      NUMBER OF PARTICIPANTS *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={experience.spots}
                      value={form.participants}
                      onChange={(e) => updateForm('participants', parseInt(e.target.value) || 1)}
                      className={`w-full bg-neutral-900 border rounded-lg px-3.5 py-2.5 text-white text-xs outline-none transition-colors ${
                        errors.participants ? 'border-red-500/50' : 'border-neutral-800 focus:border-gold-500/40'
                      }`}
                    />
                    <p className="text-[9px] text-neutral-600 font-mono">{experience.spots - experience.spotsTaken} spots available</p>
                    {errors.participants && <p className="text-[9px] text-red-400 flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> {errors.participants}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      WHY IS THIS EXPERIENCE MEANINGFUL?
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Share your connection to Gillian's work and why this experience matters to you..."
                      value={form.story}
                      onChange={(e) => updateForm('story', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white text-xs outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      SPECIAL REQUESTS (OPTIONAL)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Dietary requirements, accessibility needs, etc..."
                      value={form.specialRequests}
                      onChange={(e) => updateForm('specialRequests', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white text-xs outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-gold-500" /> CHOOSE COMMUNICATION METHOD
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Select how you'd like the administrator to contact you about this booking.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        id: 'whatsapp' as const,
                        label: 'WhatsApp',
                        icon: MessageCircle,
                        color: 'text-emerald-400',
                        border: form.communicationMethod === 'whatsapp' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700',
                        desc: 'Quick messaging with the admin team',
                      },
                      {
                        id: 'email' as const,
                        label: 'Email',
                        icon: Mail,
                        color: 'text-blue-400',
                        border: form.communicationMethod === 'email' ? 'border-blue-500/40 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-700',
                        desc: 'Formal communication via email',
                      },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => updateForm('communicationMethod', method.id)}
                        className={`p-5 rounded-xl border text-left transition-all space-y-3 ${method.border}`}
                      >
                        <method.icon className={`h-6 w-6 ${method.color}`} />
                        <h5 className="text-sm font-bold text-white">{method.label}</h5>
                        <p className="text-[10px] text-neutral-400">{method.desc}</p>
                        {form.communicationMethod === method.id && (
                          <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {errors.communicationMethod && (
                    <p className="text-[9px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-2.5 w-2.5" /> {errors.communicationMethod}
                    </p>
                  )}

                  <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2.5 text-[10px] text-neutral-400 leading-relaxed font-mono">
                    <Info className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>After submission, your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} app will open with pre-filled booking details. Send the message to complete your request.</span>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-gold-500" /> REVIEW & SUBMIT
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-2">
                      <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Personal Info</h5>
                      <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                        <span className="text-neutral-500">Name:</span><span className="text-white">{form.fullName}</span>
                        <span className="text-neutral-500">Email:</span><span className="text-white">{form.email}</span>
                        <span className="text-neutral-500">Phone:</span><span className="text-white">{form.phone}</span>
                        <span className="text-neutral-500">Location:</span><span className="text-white">{form.city}, {form.country}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-2">
                      <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Booking Details</h5>
                      <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                        <span className="text-neutral-500">Experience:</span><span className="text-white font-semibold">{experience.title}</span>
                        <span className="text-neutral-500">Date:</span><span className="text-white">{form.preferredDate}</span>
                        <span className="text-neutral-500">Time:</span><span className="text-white">{form.preferredTime}</span>
                        <span className="text-neutral-500">Participants:</span><span className="text-white">{form.participants}</span>
                        <span className="text-neutral-500">Method:</span><span className="text-white capitalize">{form.communicationMethod}</span>
                      </div>
                      {form.story && (
                        <div className="pt-2 border-t border-neutral-900/60">
                          <span className="text-[9px] text-neutral-500 font-mono">WHY THIS EXPERIENCE:</span>
                          <p className="text-[11px] text-neutral-300 mt-1 italic">"{form.story}"</p>
                        </div>
                      )}
                      {form.specialRequests && (
                        <div className="pt-2 border-t border-neutral-900/60">
                          <span className="text-[9px] text-neutral-500 font-mono">SPECIAL REQUESTS:</span>
                          <p className="text-[11px] text-neutral-300 mt-1">{form.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2.5 text-[10px] text-neutral-400 leading-relaxed font-mono">
                    <ShieldCheck className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>By submitting, you agree to be contacted via {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} regarding this booking. Every experience is 100% fan-funded — your contribution makes these unforgettable moments possible.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={step === 1 ? onClose : handleBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-mono tracking-wider uppercase text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-[10px] tracking-widest uppercase transition-all"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    SUBMIT BOOKING
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
