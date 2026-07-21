import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import { Calendar, Clock, MapPin, Ticket, Download, CheckCircle, ChevronRight } from 'lucide-react';

interface EventItem {
  id: string; title: string; type: string; day: string; month: string;
  location: string; time: string; registered: boolean; ticketRef?: string;
}

interface Props {
  onNavigate?: (tab: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  addJourneyMilestone?: (title: string, desc: string, color?: string) => void;
  pushNotification?: (text: string) => void;
  embedded?: boolean;
}

export default function FanEvents({ onNavigate, showToast, addMilestone, pushNotification, embedded }: Props) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [evRes, regRes] = await Promise.all([
        supabase.from('admin_events').select('*').order('created_at', { ascending: false }),
        user?.id ? supabase.from('event_registrations').select('event_id, ticket_ref').eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ]);
      const regMap = new Map<string, string>();
      if (regRes.data) regRes.data.forEach((r: any) => regMap.set(r.event_id, r.ticket_ref || ''));
      if (!evRes.error && evRes.data) {
        setEvents(evRes.data.map((e: any) => ({
          id: e.id, title: e.title, type: e.type || 'Event', day: e.day, month: e.month,
          location: e.location, time: e.time, registered: regMap.has(e.id), ticketRef: regMap.get(e.id),
        })));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const handleRegister = async (id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const ticketRef = `GA-TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    try {
      await supabase.from('event_registrations').insert({
        id: `reg-${Date.now()}`, event_id: id, event_title: ev.title,
        event_day: ev.day, event_month: ev.month, event_location: ev.location, event_time: ev.time,
        user_id: user?.id || null, member_name: profile?.full_name || 'Fan', member_email: user?.email || '',
        ticket_type: 'general', ticket_qty: 1, ticket_ref: ticketRef, status: 'confirmed',
      });
    } catch {}
    setEvents(prev => prev.map(e => e.id === id ? { ...e, registered: true, ticketRef } : e));
    addJourneyMilestone?.('Registered for Event', `Registered for ${ev.title}`, 'bg-blue-500');
    pushNotification?.('Event registration confirmed! Check your ticket ref.');
    showToast?.('Event registered successfully!', 'success');
  };

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

  if (loading) return null;

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1 border-b border-neutral-900 pb-4">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Official Community Events</h2>
        <p className="text-xs text-neutral-500 font-mono">Participate in live group Q&As, virtual panels, or request charity dinner tickets.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(ev => (
          <div key={ev.id}
            className={`rounded-xl border p-5 space-y-4 bg-neutral-950/40 relative overflow-hidden flex flex-col justify-between ${
              ev.registered ? 'border-gold-500/30 bg-gradient-to-b from-gold-500/[0.01] to-transparent' : 'border-neutral-900'
            }`}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20">{ev.type}</span>
                {ev.registered && (
                  <span className="text-[10px] text-gold-500 font-mono font-bold flex items-center gap-1 uppercase"><Ticket className="h-3.5 w-3.5" /> Registered</span>
                )}
              </div>
              <h3 className="font-serif text-base font-bold text-white tracking-wide">{ev.title}</h3>
              <div className="space-y-1 text-xs text-neutral-400 font-mono pt-2">
                <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.month} {ev.day}, 2026</p>
                <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.time}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.location}</p>
              </div>
            </div>
            {ev.registered ? (
              <div className="border-t border-neutral-900 pt-3.5 mt-3 space-y-3.5">
                <div className="rounded border border-neutral-900 bg-neutral-950 p-3 flex justify-between items-center gap-3">
                  <div className="text-left space-y-1 font-mono text-[10px]">
                    <p className="text-neutral-500">TICKET REFERENCE</p>
                    <p className="text-white font-bold">{ev.ticketRef}</p>
                    <p className="text-gold-500 font-semibold mt-1">✓ ACCESS GRANTED</p>
                  </div>
                  <div className="h-12 w-12 bg-white border border-neutral-800 rounded p-1 shrink-0 flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-0.5">
                      {[...Array(25)].map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 ${[0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i) ? 'bg-black' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast?.('Reminder scheduled!', 'success')}
                    className="flex-1 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-[10px] font-mono text-neutral-300 hover:text-white rounded transition-colors text-center"
                  >Add Reminder</button>
                  <button onClick={() => showToast?.('Downloading pass...', 'info')}
                    className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded transition-colors"
                  ><Download className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ) : (
              <button onClick={() => handleRegister(ev.id)}
                className="w-full mt-4 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs transition-all uppercase tracking-wider active:scale-95 text-center block"
              >Request Event Registration Pass</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
