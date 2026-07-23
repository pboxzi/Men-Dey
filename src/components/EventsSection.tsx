import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import { createNotification, notifyAdmins } from '../utils/notifications';
import { Calendar, Clock, MapPin, CheckCircle, Send, Sparkles, Loader2, X, ArrowLeft, MessageCircle, Mail, Users, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

const MONTH_LOOKUP: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
import { openWhatsApp, openEmail } from '../utils/contactSettings';

function countdown(target: Date) {
  const d = target.getTime() - Date.now();
  if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d % 86400000) / 3600000),
    minutes: Math.floor((d % 3600000) / 60000),
    seconds: Math.floor((d % 60000) / 1000),
  };
}

function parseDate(month: string, day: string, time: string): Date {
  const hh = parseInt(time?.split(':')[0]) || 12;
  const mm = parseInt(time?.split(':')[1]?.split(' ')[0]) || 0;
  const pm = time?.toLowerCase().includes('pm');
  return new Date(2026, MONTH_LOOKUP[month?.toUpperCase()] ?? 6, parseInt(day) || 1, pm && hh < 12 ? hh + 12 : (!pm && hh === 12 ? 0 : hh), mm);
}

interface RegistrationForm {
  name: string; email: string; phone: string; country: string;
  attendees: number; specialRequests: string; commMethod: 'whatsapp' | 'email';
}

export default function EventsSection() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [step, setStep] = useState<'idle' | 'form' | 'review' | 'submitted'>('idle');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [form, setForm] = useState<RegistrationForm>({
    name: '', email: '', phone: '', country: '', attendees: 1, specialRequests: '', commMethod: 'email',
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketRef, setTicketRef] = useState('');

  const events = dbEvents;
  const nextEvent = events[0] || null;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('admin_events').select('*').order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else if (data?.length) {
      setDbEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!nextEvent) return;
    const t = parseDate(nextEvent.month, nextEvent.day, nextEvent.event_time || nextEvent.time);
    setTimeLeft(countdown(t));
    const id = setInterval(() => setTimeLeft(countdown(t)), 1000);
    return () => clearInterval(id);
  }, [nextEvent]);

  const resetFlow = () => {
    setStep('idle');
    setSelectedEvent(null);
    setForm({ name: '', email: '', phone: '', country: '', attendees: 1, specialRequests: '', commMethod: 'email' });
    setTicketRef('');
    setSubmitError('');
  };

  const startRegistration = (evt: any) => {
    if (!user) {
      navigate('/portal?mode=login');
      return;
    }
    setSelectedEvent(evt);
    setForm({
      name: profile?.full_name || user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: profile?.phone || user?.user_metadata?.phone || '',
      country: profile?.country || user?.user_metadata?.country || '',
      attendees: 1, specialRequests: '', commMethod: 'email',
    });
    setStep('form');
  };

  const handleSubmitForm = () => {
    if (!form.name || !form.email) return;
    setStep('review');
  };

  const handleSubmitRegistration = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    const ref = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error: insertErr } = await supabase.from('event_registrations').insert({
      id: `reg-${Date.now()}`,
      event_id: selectedEvent.id, event_title: selectedEvent.title,
      event_day: selectedEvent.day, event_month: selectedEvent.month,
      event_location: selectedEvent.location, event_time: selectedEvent.event_time || selectedEvent.time,
      user_id: user?.id || null,
      member_name: form.name, member_email: form.email,
      phone: form.phone, country: form.country,
      ticket_qty: form.attendees, special_requests: form.specialRequests,
      communication_method: form.commMethod,
      ticket_ref: ref, status: 'pending',
    });
    if (insertErr) {
      setSubmitError(insertErr.message);
      setSaving(false);
      return;
    }
    setTicketRef(ref);
    setSaving(false);
    setStep('submitted');

    // Notify fan + admin
    if (user?.id) {
      createNotification({
        userId: user.id,
        type: 'event',
        title: 'Event Registration Submitted',
        message: `You're registered for "${selectedEvent.title}". Reference: ${ref}`,
        sendEmail: true,
        emailSubject: `Registration Confirmed: ${selectedEvent.title}`,
        emailBody: `<p>You're registered for <strong>${selectedEvent.title}</strong>.</p><p>Reference: <code>${ref}</code></p><p>Date: ${selectedEvent.month} ${selectedEvent.day}, 2026</p><p>Attendees: ${form.attendees}</p>`,
        emailOverride: form.email,
      });
    }
    notifyAdmins('event', 'New Event Registration', `New registration for "${selectedEvent.title}" by ${form.name}. Reference: ${ref}`);

    const msg = `Hi, I'd like to register for an event.\n\n` +
      `Event: ${selectedEvent.title}\n` +
      `Date: ${selectedEvent.month} ${selectedEvent.day}, 2026\n` +
      `Reference: ${ref}\n` +
      `Attendees: ${form.attendees}\n\n` +
      (form.specialRequests ? `Notes: ${form.specialRequests}\n\n` : '') +
      `Thank you.`;
    if (form.commMethod === 'whatsapp') {
      openWhatsApp(msg);
    } else {
      openEmail('Event Registration - ' + ref, msg);
    }
  };
  

  const openCommApp = () => {
    if (!selectedEvent || !ticketRef) return;
    const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${ticketRef}\nEvent: ${selectedEvent.title}\nDate: ${selectedEvent.month} ${selectedEvent.day}, 2026\nAttendees: ${form.attendees}\n\n--- MESSAGE ---\n${form.specialRequests ? form.specialRequests + '\n\n' : ''}`;
    if (form.commMethod === 'whatsapp') {
      openWhatsApp(msg);
    } else {
      openEmail('Event Registration - ' + ticketRef, msg);
    }
  };

  return (
    <section className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px] overflow-hidden">
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gold-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/3 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12 relative z-10">
        <div className="text-center space-y-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/[0.03] text-gold-500 text-[10px] font-mono tracking-[0.2em] uppercase backdrop-blur-sm"
          ><Sparkles className="h-3 w-3" /> Live Gatherings</motion.div>
          <h2 className="font-serif text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-[1.1]">
            Co-op<br className="md:hidden" /><span className="text-gold-500 bg-gold-500/5 px-3 py-1 inline-block">Conclaves</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Join exclusive gatherings — stage plays, intimate Q&As, panel screenings, and global fundraising galas.
          </p>
        </div>

        {/* Registration Modal */}
        <AnimatePresence>
          {step !== 'idle' && selectedEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-20 bg-black/80 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl text-left"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {step !== 'submitted' && (
                      <button onClick={step === 'review' ? () => setStep('form') : resetFlow}
                        className="p-1 rounded text-neutral-500 hover:text-white transition-colors"
                      ><ArrowLeft className="h-4 w-4" /></button>
                    )}
                    <div>
                      <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">
                        {step === 'form' ? 'Step 2 of 6 — Your Details' : step === 'review' ? 'Step 4 of 6 — Review' : 'Registration Complete'}
                      </span>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">{selectedEvent.title}</p>
                    </div>
                  </div>
                  {step !== 'submitted' && (
                    <button onClick={resetFlow} className="p-1 rounded text-neutral-500 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Event summary bar */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg border border-neutral-800 bg-neutral-950 font-mono shrink-0">
                      <span className="text-sm font-bold text-white leading-none">{selectedEvent.day}</span>
                      <span className="text-[7px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{selectedEvent.month}</span>
                    </div>
                    <div className="text-[11px] space-y-0.5">
                      <p className="font-bold text-white">{selectedEvent.title}</p>
                      <p className="text-neutral-400 font-mono text-[10px]">{selectedEvent.month} {selectedEvent.day}, 2026 — {selectedEvent.event_time || selectedEvent.time}</p>
                      <p className="text-neutral-500 font-mono text-[9px]">{selectedEvent.location}</p>
                    </div>
                  </div>

                  {/* STEP 2: Registration Form */}
                  {step === 'form' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Full Name *</label>
                          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Email Address *</label>
                          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Phone Number</label>
                          <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Country</label>
                          <input type="text" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. United States"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Number of Attendees</label>
                          <input type="number" min={1} value={form.attendees} onChange={e => setForm(p => ({ ...p, attendees: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Special Requirements</label>
                          <input type="text" value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} placeholder="Dietary, accessibility, etc."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                      </div>

                      {/* Step 3: Communication Method */}
                      <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Preferred Communication Method *</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, desc: 'Quick messaging via WhatsApp' },
                            { id: 'email' as const, label: 'Email', icon: Mail, desc: 'Formal communication via email' },
                          ].map(opt => (
                            <button key={opt.id} onClick={() => setForm(p => ({ ...p, commMethod: opt.id }))}
                              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                                form.commMethod === opt.id
                                  ? 'border-gold-500/40 bg-gold-500/[0.04] ring-1 ring-gold-500/20'
                                  : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${form.commMethod === opt.id ? 'bg-gold-500/10 text-gold-500' : 'bg-neutral-900 text-neutral-400'}`}>
                                <opt.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${form.commMethod === opt.id ? 'text-gold-500' : 'text-white'}`}>{opt.label}</p>
                                <p className="text-[9px] text-neutral-500 mt-0.5">{opt.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleSubmitForm} disabled={!form.name || !form.email}
                        className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      ><FileText className="h-4 w-4" /> Review Registration</button>
                    </div>
                  )}

                  {/* STEP 4: Review */}
                  {step === 'review' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/60">
                          <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Fan Information</h4>
                          <div className="text-[11px] space-y-1">
                            <p><span className="text-neutral-500">Name:</span> <span className="text-white">{form.name}</span></p>
                            <p><span className="text-neutral-500">Email:</span> <span className="text-white">{form.email}</span></p>
                            <p><span className="text-neutral-500">Phone:</span> <span className="text-white">{form.phone || '—'}</span></p>
                            <p><span className="text-neutral-500">Country:</span> <span className="text-white">{form.country || '—'}</span></p>
                          </div>
                        </div>
                        <div className="space-y-3 p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/60">
                          <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Registration Details</h4>
                          <div className="text-[11px] space-y-1">
                            <p><span className="text-neutral-500">Attendees:</span> <span className="text-white">{form.attendees}</span></p>
                            <p><span className="text-neutral-500">Special Reqs:</span> <span className="text-white">{form.specialRequests || 'None'}</span></p>
                            <p><span className="text-neutral-500">Method:</span> <span className="text-white capitalize flex items-center gap-1">{form.commMethod === 'whatsapp' ? <MessageCircle className="h-3 w-3 text-emerald-400" /> : <Mail className="h-3 w-3 text-blue-400" />}{form.commMethod}</span></p>
                          </div>
                        </div>
                      </div>
                      {submitError && (
                        <p className="text-[10px] text-red-400 font-mono text-center">{submitError}</p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setStep('form')}
                          className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
                        >Back & Edit</button>
                        <button onClick={handleSubmitRegistration} disabled={saving}
                          className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {saving ? 'Submitting...' : 'Submit Registration'}</button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5-6: Submitted */}
                  {step === 'submitted' && (
                    <div className="space-y-5 text-center">
                      <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-bold text-white">Registration Submitted!</h3>
                        <p className="text-xs text-neutral-400">Your registration reference is:</p>
                        <p className="font-mono text-sm text-gold-500 font-bold bg-gold-500/5 border border-gold-500/20 rounded-lg inline-block px-4 py-2">{ticketRef}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/60 text-left space-y-2">
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                          To complete your registration, please send the pre-filled message via your chosen method below. 
                          The administrator will confirm your spot once they receive your message.
                        </p>
                      </div>
                      <button onClick={openCommApp}
                        className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >{form.commMethod === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                        Open {form.commMethod === 'whatsapp' ? 'WhatsApp' : 'Email'} to Send Message
                      </button>
                      <button onClick={resetFlow}
                        className="w-full py-2 text-[10px] font-mono text-neutral-500 hover:text-white transition-colors"
                      >Browse More Events</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/30 p-6 md:p-8 animate-pulse">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="h-3 w-32 rounded bg-neutral-800" />
                  <div className="h-8 w-72 rounded bg-neutral-800" />
                  <div className="h-4 w-56 rounded bg-neutral-800" />
                </div>
                <div className="flex gap-2.5 shrink-0">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 w-14 rounded-lg bg-neutral-800" />)}
                </div>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-xl border border-neutral-900 bg-neutral-950/30 overflow-hidden animate-pulse">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-neutral-800" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-16 rounded bg-neutral-800" />
                        <div className="h-4 w-32 rounded bg-neutral-800" />
                      </div>
                    </div>
                    <div className="h-3 w-full rounded bg-neutral-800" />
                    <div className="space-y-2">
                      <div className="h-3 w-40 rounded bg-neutral-800" />
                      <div className="h-3 w-36 rounded bg-neutral-800" />
                      <div className="h-3 w-44 rounded bg-neutral-800" />
                    </div>
                    <div className="h-10 w-full rounded-lg bg-neutral-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center py-16 border border-dashed border-red-900/40 rounded-2xl bg-red-950/10 space-y-4"
          >
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <div>
              <p className="text-sm text-red-400 font-semibold">Failed to load events</p>
              <p className="text-[10px] text-red-500/60 mt-1 font-mono">{error}</p>
            </div>
            <button onClick={fetchEvents}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-800/30 bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-mono transition-colors"
            ><RefreshCw className="h-3 w-3" /> Try Again</button>
          </motion.div>
        ) : events.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center py-16 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20 space-y-4"
          >
            <Calendar className="h-10 w-10 text-neutral-700 mx-auto" />
            <div>
              <p className="text-sm text-neutral-400 font-bold">No gatherings scheduled yet</p>
              <p className="text-[10px] text-neutral-600 mt-1">New events will appear here when announced. Check back soon.</p>
            </div>
          </motion.div>
        ) : (
          <>
            {nextEvent && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-gradient-to-b from-neutral-950 to-[#0a0a0c] p-6 md:p-8"
              >
                <div className="absolute top-0 right-0 w-72 h-72 bg-gold-500/[0.04] rounded-full blur-[100px]" />
                <div className="relative flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500">
                      <span className="px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 uppercase tracking-wider font-semibold">
                        {nextEvent.event_type || nextEvent.type || 'Event'}
                      </span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {nextEvent.month} {nextEvent.day}, 2026</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {nextEvent.location}</span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide leading-tight">{nextEvent.title}</h3>
                    {nextEvent.description && (
                      <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-xl">{nextEvent.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2.5 font-mono shrink-0">
                    {[
                      { v: timeLeft.days, l: 'Days' }, { v: timeLeft.hours, l: 'Hrs' },
                      { v: timeLeft.minutes, l: 'Min' }, { v: timeLeft.seconds, l: 'Sec' },
                    ].map((u, i) => (
                      <div key={u.l} className="flex flex-col items-center p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 min-w-[56px]">
                        <span className={`text-lg md:text-xl font-bold leading-none ${i === 3 ? 'text-gold-500' : 'text-white'}`}>{String(u.v).padStart(2, '0')}</span>
                        <span className="text-[7px] text-neutral-500 mt-1 uppercase font-semibold">{u.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                  All Gatherings <span className="text-neutral-600 ml-1">({events.length})</span>
                </h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((evt: any, i: number) => (
                  <motion.div key={evt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.03 }}
                    className="rounded-xl border border-neutral-900 bg-neutral-950/30 overflow-hidden flex flex-col"
                  >
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-neutral-800/60 bg-neutral-950/80 font-mono shrink-0 shadow-inner shadow-black/30">
                            <span className="text-lg font-bold text-white leading-none">{evt.day}</span>
                            <span className="text-[6px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{evt.month}</span>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[7px] font-mono uppercase font-bold border border-gold-800/20">
                              {evt.event_type || evt.type || 'Event'}
                            </span>
                            <h4 className="text-sm font-bold text-white leading-tight truncate">{evt.title}</h4>
                          </div>
                        </div>
                        {evt.description && (
                          <p className="text-[10px] text-neutral-500 leading-relaxed line-clamp-2">{evt.description}</p>
                        )}
                        <div className="space-y-1 text-[10px] font-mono text-neutral-400">
                          <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-neutral-500 shrink-0" /> {evt.month} {evt.day}, 2026</p>
                          <p className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-neutral-500 shrink-0" /> {evt.event_time || evt.time}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-neutral-500 shrink-0" /> {evt.location}</p>
                        </div>
                      </div>
                      <button onClick={() => startRegistration(evt)}
                        className="w-full mt-3 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider active:scale-[0.98]"
                      >Register Now</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
