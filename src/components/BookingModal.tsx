import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience, ExperienceBooking } from '../types';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import {
  X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  MessageCircle, Mail, Send, ShieldCheck, User, Calendar,
  Info, Users, MapPin, Clock, Star, FileText,
} from 'lucide-react';

const WHATSAPP_NUMBER = '+447700000000';
const ADMIN_EMAIL = 'bookings@gilliananderson.com';

interface BookingPageProps {
  experience: Experience;
  onClose: () => void;
  onSuccess: (booking: ExperienceBooking) => void;
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
  { id: 1, label: 'Booking Details', icon: Calendar },
  { id: 2, label: 'Communication', icon: MessageCircle },
  { id: 3, label: 'Review & Submit', icon: CheckCircle },
];

export default function BookingModal({ experience, onClose, onSuccess }: BookingPageProps) {
  const { user, profile } = useAuth();
  const isLoggedIn = !!user;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [bookingRef, setBookingRef] = useState('');

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
    if (!form.preferredDate) e.preferredDate = 'Preferred date is required';
    else {
      const d = new Date(form.preferredDate);
      if (d < new Date(new Date().toDateString())) e.preferredDate = 'Date must be today or in the future';
    }
    if (!form.preferredTime) e.preferredTime = 'Preferred time is required';
    if (form.participants < 1 || form.participants > experience.max_guests) {
      e.participants = `Participants must be 1-${experience.max_guests}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!form.communicationMethod) e.communicationMethod = 'Select a communication method';
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
    return `EXPERIENCE BOOKING REQUEST\n\nExperience: ${experience.title}\nCategory: ${experience.category}\n\n--- PERSONAL INFO ---\nName: ${personalInfo.fullName}\nEmail: ${personalInfo.email}\nPhone: ${personalInfo.phone || 'Not provided'}\nCountry: ${personalInfo.country}\n\n--- BOOKING DETAILS ---\nPreferred Date: ${form.preferredDate}\nPreferred Time: ${form.preferredTime}\nParticipants: ${form.participants}\n\n--- SPECIAL REQUESTS ---\n${form.specialRequests || 'None'}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: any = {
        experienceId: experience.id,
        experienceTitle: experience.title,
        fullName: personalInfo.fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        country: personalInfo.country,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        participants: form.participants,
        specialRequests: form.specialRequests,
        communicationMethod: form.communicationMethod,
      };
      if (user?.id) body.userId = user.id;

      const { data, error } = await supabase.from('experience_requests').insert(body).select().single();
      if (error) throw new Error('Failed to submit booking');

      setBookingRef(data?.bookingReference || '');

      const message = encodeURIComponent(buildMessage());
      if (form.communicationMethod === 'whatsapp') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
      } else {
        window.open(`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('Experience Booking Request - ' + experience.title)}&body=${message}`, '_blank');
      }

      setSuccess(true);
      if (data.booking) onSuccess(data.booking);
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
            {experience.title}
          </p>
        </div>
      </div>

      {success ? (
        <div className="text-center space-y-6 py-16">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-bold text-white">Booking Request Submitted!</h3>
            {bookingRef && (
              <p className="text-xs font-mono text-gold-500">Reference: {bookingRef}</p>
            )}
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
                    <Calendar className="h-3.5 w-3.5 text-gold-500" /> BOOKING DETAILS
                  </h4>

                  {/* Auto-filled Personal Info Summary */}
                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-1.5">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Your Information</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-neutral-500">Name:</span><span className="text-white">{personalInfo.fullName}</span>
                      <span className="text-neutral-500">Email:</span><span className="text-white">{personalInfo.email}</span>
                      <span className="text-neutral-500">Phone:</span><span className="text-white">{personalInfo.phone || 'Not provided'}</span>
                      <span className="text-neutral-500">Country:</span><span className="text-white">{personalInfo.country}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-1.5">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Selected Experience</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Experience</span>
                      <span className="text-xs font-bold text-gold-500">{experience.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Category</span>
                      <span className="text-[10px] text-neutral-500">{experience.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Price</span>
                      <span className="text-xs font-bold text-white">{experience.price}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Preferred Date" field="preferredDate" type="date" />
                    <InputField label="Preferred Time" field="preferredTime" type="time" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      NUMBER OF GUESTS *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={experience.max_guests}
                      value={form.participants}
                      onChange={(e) => updateForm('participants', parseInt(e.target.value) || 1)}
                      className={`w-full bg-neutral-900 border rounded-lg px-3.5 py-2.5 text-white text-xs outline-none transition-colors ${
                        errors.participants ? 'border-red-500/50' : 'border-neutral-800 focus:border-gold-500/40'
                      }`}
                    />
                    <p className="text-[9px] text-neutral-600 font-mono">
                      {experience.spots - experience.spotsTaken} spots available (max {experience.max_guests})
                    </p>
                    {errors.participants && <p className="text-[9px] text-red-400 flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> {errors.participants}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      SPECIAL REQUESTS (OPTIONAL)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Dietary requirements, accessibility needs, scheduling preferences, or any other details..."
                      value={form.specialRequests}
                      onChange={(e) => updateForm('specialRequests', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white text-xs outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-gold-500" /> CHOOSE YOUR PREFERRED COMMUNICATION METHOD
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        id: 'whatsapp' as const,
                        label: 'WhatsApp',
                        icon: MessageCircle,
                        color: 'text-emerald-400',
                        border: form.communicationMethod === 'whatsapp' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700',
                        desc: 'Quick messaging with the admin team. You will send the first message.',
                      },
                      {
                        id: 'email' as const,
                        label: 'Email',
                        icon: Mail,
                        color: 'text-blue-400',
                        border: form.communicationMethod === 'email' ? 'border-blue-500/40 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-700',
                        desc: 'Formal communication via email. You will send the first email.',
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
                    <span>After submission, your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} app will open with a pre-filled message. You review and manually press Send. The admin will never message you first.</span>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-gold-500" /> REVIEW BOOKING
                  </h4>

                  <div className="p-4 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl">
                        {experience.image ? (
                          <img src={experience.image} alt="" className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <Star className="h-5 w-5 text-gold-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{experience.title}</p>
                        <p className="text-[10px] text-neutral-500">{experience.category} — {experience.tier}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-2">
                    <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Personal Information</h5>
                    <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                      <span className="text-neutral-500">Name:</span><span className="text-white">{personalInfo.fullName}</span>
                      <span className="text-neutral-500">Email:</span><span className="text-white">{personalInfo.email}</span>
                      <span className="text-neutral-500">Phone:</span><span className="text-white">{personalInfo.phone || 'Not provided'}</span>
                      <span className="text-neutral-500">Country:</span><span className="text-white">{personalInfo.country}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-2">
                    <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Booking Details</h5>
                    <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                      <span className="text-neutral-500">Preferred Date:</span><span className="text-white">{form.preferredDate}</span>
                      <span className="text-neutral-500">Preferred Time:</span><span className="text-white">{form.preferredTime}</span>
                      <span className="text-neutral-500">Number of Guests:</span><span className="text-white">{form.participants}</span>
                    </div>
                    {form.specialRequests && (
                      <div className="pt-2 border-t border-neutral-900/60">
                        <span className="text-[9px] text-neutral-500 font-mono">SPECIAL REQUESTS:</span>
                        <p className="text-[11px] text-neutral-300 mt-1">{form.specialRequests}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-neutral-900/50 border border-neutral-900 rounded-lg space-y-2">
                    <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Communication Method</h5>
                    <div className="flex items-center gap-2 text-[11px]">
                      {form.communicationMethod === 'whatsapp' ? (
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="text-white capitalize">{form.communicationMethod}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2.5 text-[10px] text-neutral-400 leading-relaxed font-mono">
                    <ShieldCheck className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>This booking will be submitted for administrator review. Your {form.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'email'} app will open with a pre-filled message. You must manually send it to complete your request.</span>
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
              {step === 1 ? 'Cancel' : step === 3 ? 'Back & Edit' : 'Back'}
            </button>

            {step < 3 ? (
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
                    Submit Booking
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
