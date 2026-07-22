import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import {
  Calendar, Clock, MapPin, Ticket, Download, CheckCircle, ChevronRight, ArrowLeft, X,
  MessageCircle, Mail, Send, Loader2, FileText, Users, Star, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { openWhatsApp, openEmail } from '../utils/contactSettings';

interface EventItem {
  id: string; title: string; type: string; day: string; month: string;
  location: string; time: string; description?: string;
  registered: boolean; ticketRef?: string;
  regId?: string; regStatus?: string; created_at?: string;
  attendees?: number; specialRequests?: string; commMethod?: string;
  confirmedDate?: string; confirmedTime?: string; confirmedLocation?: string;
  adminNotes?: string;
}

interface Props {
  onNavigate?: (tab: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  addJourneyMilestone?: (title: string, desc: string, color?: string) => void;
  pushNotification?: (text: string) => void;
  embedded?: boolean;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Registration Submitted' },
  { key: 'confirmed', label: 'Confirmed by Admin' },
  { key: 'active', label: 'Event Active' },
  { key: 'attended', label: 'Attended' },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'attended': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
    case 'cancelled': return 'text-red-400 border-red-500/20 bg-red-500/5';
    case 'active': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    case 'confirmed': return 'text-gold-500 border-gold-500/20 bg-gold-500/5';
    default: return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  }
}

export default function FanEvents({ onNavigate, showToast, addJourneyMilestone, pushNotification, embedded }: Props) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<EventItem | null>(null);
  const [step, setStep] = useState<'idle' | 'form' | 'review' | 'submitted'>('idle');
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '', attendees: 1, specialRequests: '', commMethod: 'email' as 'whatsapp' | 'email' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketRef, setTicketRef] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [evRes, regRes] = await Promise.all([
      supabase.from('admin_events').select('*').order('created_at', { ascending: false }),
      user?.id ? supabase.from('event_registrations').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    if (evRes.error) {
      setError(evRes.error.message);
      setLoading(false);
      return;
    }
    const regMap = new Map<string, EventItem>();
    if (regRes.data) regRes.data.forEach((r: any) => regMap.set(r.event_id, {
      regId: r.id, ticketRef: r.ticket_ref || '', regStatus: r.status || 'pending', created_at: r.created_at,
      attendees: r.ticket_qty, specialRequests: r.special_requests, commMethod: r.communication_method,
      confirmedDate: r.confirmed_date, confirmedTime: r.confirmed_time, confirmedLocation: r.confirmed_location,
      adminNotes: r.admin_notes,
    }));
    if (evRes.data) {
      setEvents(evRes.data.map((e: any) => {
        const reg = regMap.get(e.id);
        return {
          id: e.id, title: e.title, type: e.event_type || e.type || 'Event', day: e.day, month: e.month,
          location: e.location, time: e.event_time || e.time, description: e.description,
          registered: !!reg, ...reg,
        };
      }));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const startRegistration = (ev: EventItem) => {
    setRegisteringEvent(ev);
    setForm({
      name: profile?.full_name || user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: profile?.phone || user?.user_metadata?.phone || '',
      country: profile?.country || user?.user_metadata?.country || '',
      attendees: 1, specialRequests: '', commMethod: 'email',
    });
    setStep('form');
  };

  const resetFlow = () => {
    setStep('idle');
    setRegisteringEvent(null);
    setTicketRef('');
    setSubmitError('');
  };

  const handleSubmitForm = () => {
    if (!form.name || !form.email) return;
    setStep('review');
  };

  const handleSubmitRegistration = async () => {
    if (!registeringEvent) return;
    setSaving(true);
    const ref = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const regId = `reg-${Date.now()}`;
    const { error: insertErr } = await supabase.from('event_registrations').insert({
      id: regId, event_id: registeringEvent.id, event_title: registeringEvent.title,
      event_day: registeringEvent.day, event_month: registeringEvent.month,
      event_location: registeringEvent.location, event_time: registeringEvent.time,
      user_id: user?.id, member_name: form.name, member_email: form.email,
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
    setEvents(prev => prev.map(e => e.id === registeringEvent.id ? {
      ...e, registered: true, ticketRef: ref, regId, regStatus: 'pending',
      attendees: form.attendees, specialRequests: form.specialRequests, commMethod: form.commMethod,
    } : e));
    setTicketRef(ref);
    setSaving(false);
    setStep('submitted');
    addJourneyMilestone?.('Registered for Event', `Registered for ${registeringEvent.title}`, 'bg-blue-500');
    pushNotification?.('Event registration submitted! Check your ref.');
    showToast?.('Registration submitted!', 'success');

    const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${ref}\nEvent: ${registeringEvent.title}\nDate: ${registeringEvent.month} ${registeringEvent.day}, 2026\nAttendees: ${form.attendees}\n\n--- MESSAGE ---\n${form.specialRequests ? form.specialRequests + '\n\n' : ''}`;
    if (form.commMethod === 'whatsapp') {
      openWhatsApp(msg);
    } else {
      openEmail('Event Registration - ' + ref, msg);
    }
  };

  const openCommApp = () => {
    if (!registeringEvent || !ticketRef) return;
    const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${ticketRef}\nEvent: ${registeringEvent.title}\nDate: ${registeringEvent.month} ${registeringEvent.day}, 2026\nAttendees: ${form.attendees}\n\n--- MESSAGE ---\n${form.specialRequests ? form.specialRequests + '\n\n' : ''}`;
    if (form.commMethod === 'whatsapp') {
      openWhatsApp(msg);
    } else {
      openEmail('Event Registration - ' + ticketRef, msg);
    }
  };

  // Detail view for an existing registration
  if (selectedReg) {
    const ev = selectedReg;
    const currentIdx = STATUS_STEPS.findIndex(s => s.key === ev.regStatus);
    const isPast = ev.regStatus === 'attended' || ev.regStatus === 'cancelled';
    const isPending = ev.regStatus === 'pending' || ev.regStatus === 'confirmed';

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedReg(null)}
          className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors"
        ><ArrowLeft className="h-3.5 w-3.5" /> Back to Events</button>

        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-neutral-800/60 bg-neutral-950/60 font-mono shrink-0">
              <span className="text-lg font-bold text-white leading-none">{ev.day}</span>
              <span className="text-[6px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{ev.month}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base font-bold text-white">{ev.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${getStatusColor(ev.regStatus || 'pending')}`}>
                  {STATUS_STEPS.find(s => s.key === ev.regStatus)?.label || ev.regStatus || 'Pending'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-1">Ref: {ev.ticketRef}</p>
              <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 mt-1">
                <span><Calendar className="h-2.5 w-2.5 inline-block mr-1" />{ev.month} {ev.day}, 2026</span>
                <span><Clock className="h-2.5 w-2.5 inline-block mr-1" />{ev.time}</span>
                <span><MapPin className="h-2.5 w-2.5 inline-block mr-1" />{ev.location}</span>
              </div>
            </div>
          </div>
        </div>

        {isPending && currentIdx >= 0 && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Registration Progress
            </h4>
            <div className="relative">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                        isDone ? 'border-gold-500 bg-gold-500 text-neutral-950' : 'border-neutral-800 bg-neutral-900/40 text-neutral-600'
                      }`}>
                        {isDone && i < STATUS_STEPS.length - 1 ? <CheckCircle className="h-3 w-3" /> : i === 3 && isDone ? <CheckCircle className="h-3 w-3" /> : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && <div className={`w-px h-6 ${isDone ? 'bg-gold-500/30' : 'bg-neutral-900'}`} />}
                    </div>
                    <div className={`pt-0.5 ${isCurrent ? 'text-gold-500' : isDone ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      <p className="text-xs font-bold">{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmed details */}
        {(ev.regStatus === 'confirmed' || ev.regStatus === 'active' || ev.regStatus === 'attended') && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 space-y-3">
            <h4 className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> Confirmed Event Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {ev.confirmedDate && <div><span className="text-neutral-500 block text-[9px]">Date</span><span className="text-white">{ev.confirmedDate}</span></div>}
              {ev.confirmedTime && <div><span className="text-neutral-500 block text-[9px]">Time</span><span className="text-white">{ev.confirmedTime}</span></div>}
              {ev.confirmedLocation && <div className="sm:col-span-2"><span className="text-neutral-500 block text-[9px]">Location</span><span className="text-white">{ev.confirmedLocation}</span></div>}
            </div>
          </div>
        )}

        {/* Admin notes */}
        {ev.adminNotes && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Administrator Notes</h4>
            <p className="text-[11px] text-neutral-300 whitespace-pre-line">{ev.adminNotes}</p>
          </div>
        )}

        {/* Registration details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Registration Details</h4>
            <div className="text-[11px] space-y-1">
              <p><span className="text-neutral-500">Attendees:</span> <span className="text-white">{ev.attendees || 1}</span></p>
              {ev.specialRequests && <p><span className="text-neutral-500">Special Reqs:</span> <span className="text-white">{ev.specialRequests}</span></p>}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Communication</h4>
            <div className="text-[11px] flex items-center gap-2">
              {ev.commMethod === 'whatsapp' ? <MessageCircle className="h-4 w-4 text-emerald-400" /> : <Mail className="h-4 w-4 text-blue-400" />}
              <span className="text-white capitalize">{ev.commMethod}</span>
            </div>
          </div>
        </div>

        {/* Ticket */}
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5">
          <div className="rounded border border-neutral-900 bg-neutral-950 p-3 flex justify-between items-center gap-3">
            <div className="text-left space-y-1 font-mono text-[10px]">
              <p className="text-neutral-500">TICKET REFERENCE</p>
              <p className="text-white font-bold">{ev.ticketRef}</p>
              <p className="text-gold-500 font-semibold mt-1">
                {ev.regStatus === 'cancelled' ? '✕ CANCELLED' : ev.regStatus === 'attended' ? '✓ ATTENDED' : '✓ ACCESS GRANTED'}
              </p>
            </div>
            <div className="h-12 w-12 bg-white border border-neutral-800 rounded p-1 shrink-0 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 ${[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) ? 'bg-black' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-900/60">
          {(ev.regStatus === 'pending' || ev.regStatus === 'confirmed') && (
            <>
              <button onClick={() => {
                if (!ev.ticketRef) return;
                const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${ev.ticketRef}\nEvent: ${ev.title}\nDate: ${ev.month} ${ev.day}, 2026\nAttendees: ${ev.attendees || 1}\n\n--- MESSAGE ---\n${ev.specialRequests ? ev.specialRequests + '\n\n' : ''}`;
                if (ev.commMethod === 'whatsapp') {
                  openWhatsApp(msg);
                } else {
                  openEmail('Event Registration - ' + ev.ticketRef, msg);
                }
              }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all"
              >{ev.commMethod === 'whatsapp' ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />} Continue Conversation</button>
              <button onClick={() => showToast?.('Reminder scheduled!', 'success')}
                className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all"
              >Add Reminder</button>
            </>
          )}
          <button onClick={() => showToast?.('Downloading pass...', 'info')}
            className="px-3 py-2 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded transition-colors"
          ><Download className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  }

  // Embedded sidebar card
  if (embedded) {
    const upcoming = events.filter(e => !e.registered);
    return (
      <div className="rounded-2xl border border-neutral-900/70 bg-neutral-950/20 overflow-hidden shadow-xl shadow-black/20 hover:border-gold-500/20 transition-colors duration-500">
        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-neutral-900/30">
          <div className="h-5 w-5 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Calendar className="h-3 w-3 text-gold-500/70" />
          </div>
          <span className="font-mono text-[9px] text-gold-500/70 uppercase tracking-[0.15em] font-bold">Upcoming</span>
        </div>
        {upcoming.length > 0 ? (
          <button onClick={() => onNavigate?.('Events')} className="w-full text-left p-5 group hover:bg-gold-500/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-neutral-800/60 bg-neutral-950/60 font-mono shrink-0 shadow-inner shadow-black/30">
                <span className="text-lg font-bold text-white leading-none">{upcoming[0].day}</span>
                <span className="text-[6px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{upcoming[0].month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-elegant text-sm font-bold text-neutral-100 group-hover:text-gold-500/60 transition-colors tracking-wide truncate">{upcoming[0].title}</p>
                <p className="text-[10px] text-neutral-500 font-sans mt-1">{upcoming[0].location}</p>
                <span className="inline-block mt-2 text-[7px] font-mono text-gold-500/50 uppercase tracking-wider group-hover:text-gold-500/70 transition-colors">Register now →</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="p-6 text-center">
            <Calendar className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
            <p className="font-elegant text-sm text-neutral-500">All clear on the horizon</p>
            <p className="text-[10px] text-neutral-600 mt-0.5 font-sans">New events will appear here when announced.</p>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <div className="h-6 w-56 rounded bg-neutral-800 animate-pulse" />
          <div className="h-3 w-72 rounded bg-neutral-800 animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <div key={i} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4 animate-pulse">
              <div className="h-4 w-16 rounded bg-neutral-800" />
              <div className="h-5 w-48 rounded bg-neutral-800" />
              <div className="h-3 w-full rounded bg-neutral-800" />
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-neutral-800" />
                <div className="h-3 w-36 rounded bg-neutral-800" />
                <div className="h-3 w-44 rounded bg-neutral-800" />
              </div>
              <div className="h-10 w-full rounded-lg bg-neutral-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Official Community Events</h2>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-16 border border-dashed border-red-900/40 rounded-2xl bg-red-950/10 space-y-4"
        >
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <div>
            <p className="text-sm text-red-400 font-semibold">Failed to load events</p>
            <p className="text-[10px] text-red-500/60 mt-1 font-mono">{error}</p>
          </div>
          <button onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-800/30 bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-mono transition-colors"
          ><RefreshCw className="h-3 w-3" /> Try Again</button>
        </motion.div>
      </div>
    );
  }

  const registeredEvents = events.filter(e => e.registered);
  const upcomingEvents = events.filter(e => !e.registered);

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-neutral-900 pb-4">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Official Community Events</h2>
        <p className="text-xs text-neutral-500 font-mono">Participate in live group Q&As, virtual panels, or request charity dinner tickets.</p>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {step !== 'idle' && registeringEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-20 bg-black/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl text-left"
            >
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
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">{registeringEvent.title}</p>
                  </div>
                </div>
                {step !== 'submitted' && (
                  <button onClick={resetFlow} className="p-1 rounded text-neutral-500 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                )}
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg border border-neutral-800 bg-neutral-950 font-mono shrink-0">
                    <span className="text-sm font-bold text-white leading-none">{registeringEvent.day}</span>
                    <span className="text-[7px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{registeringEvent.month}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-white">{registeringEvent.title}</p>
                    <p className="text-neutral-400 font-mono text-[10px]">{registeringEvent.month} {registeringEvent.day}, 2026 — {registeringEvent.time}</p>
                    <p className="text-neutral-500 font-mono text-[9px]">{registeringEvent.location}</p>
                  </div>
                </div>

                {step === 'form' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Full Name *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Email Address *</label>
                        <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Phone Number</label>
                        <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-gold-500/40 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Country</label>
                        <input type="text" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
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
                    <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Preferred Communication Method *</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, desc: 'Quick messaging' },
                          { id: 'email' as const, label: 'Email', icon: Mail, desc: 'Formal communication' },
                        ].map(opt => (
                          <button key={opt.id} onClick={() => setForm(p => ({ ...p, commMethod: opt.id }))}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                              form.commMethod === opt.id ? 'border-gold-500/40 bg-gold-500/[0.04] ring-1 ring-gold-500/20' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
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
                        Please send the pre-filled message via your chosen method to complete your registration.
                        Once the administrator confirms, your status will update here.
                      </p>
                    </div>
                    <button onClick={openCommApp}
                      className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >{form.commMethod === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      Open {form.commMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}
                    </button>
                    <button onClick={resetFlow}
                      className="w-full py-2 text-[10px] font-mono text-neutral-500 hover:text-white transition-colors"
                    >Back to Events</button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Registrations */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">My Registrations</h3>
        {registeredEvents.length > 0 ? (
          registeredEvents.map(ev => (
            <div key={ev.id} onClick={() => setSelectedReg(ev)}
              className="p-4 rounded-xl border border-gold-500/20 bg-gradient-to-b from-gold-500/[0.02] to-transparent hover:border-gold-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg border border-neutral-800/60 bg-neutral-950/60 font-mono shrink-0">
                  <span className="text-sm font-bold text-white leading-none">{ev.day}</span>
                  <span className="text-[7px] font-bold text-gold-500/60 tracking-widest mt-0.5 uppercase leading-none">{ev.month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white group-hover:text-gold-500/80 transition-colors">{ev.title}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border ${getStatusColor(ev.regStatus || 'pending')}`}>
                      {STATUS_STEPS.find(s => s.key === ev.regStatus)?.label || ev.regStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500 mt-1">
                    <span>{ev.month} {ev.day}, 2026</span>
                    <span className="text-neutral-700">•</span>
                    <span>{ev.time}</span>
                  </div>
                  <p className="text-[9px] font-mono text-neutral-600 mt-0.5">Ref: {ev.ticketRef}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-gold-500/60 mt-1 shrink-0 transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-2">
            <Ticket className="h-5 w-5 text-neutral-700 mx-auto" />
            <p className="text-[11px] text-neutral-500">No registrations yet.</p>
            <p className="text-[9px] text-neutral-600 font-mono">Register for an event below to see it here.</p>
          </div>
        )}
      </div>

      {/* Available Events */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
          {registeredEvents.length > 0 ? 'More Events' : 'All Events'}
        </h3>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-2">
            <Calendar className="h-7 w-7 text-neutral-700 mx-auto" />
            <div>
              <p className="text-[11px] text-neutral-400 font-bold">All caught up!</p>
              <p className="text-[9px] text-neutral-600 mt-0.5 font-mono">No more events available right now. Check back soon.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map(ev => (
              <div key={ev.id} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20">{ev.type}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-white tracking-wide">{ev.title}</h3>
                  {ev.description && <p className="text-[10px] text-neutral-500 leading-relaxed">{ev.description}</p>}
                  <div className="space-y-1 text-xs text-neutral-400 font-mono pt-2">
                    <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.month} {ev.day}, 2026</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.time}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.location}</p>
                  </div>
                </div>
                <button onClick={() => startRegistration(ev)}
                  className="w-full mt-3 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider active:scale-[0.98]"
                >Register Now</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
