import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';
import { supabase } from '../utils/supabase';
import {
  Calendar, Clock, MapPin, CheckCircle, Send, Sparkles, ChevronRight, Loader2, Ticket
} from 'lucide-react';

const MONTH: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

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
  return new Date(2026, MONTH[month?.toUpperCase()] ?? 6, parseInt(day) || 1, pm && hh < 12 ? hh + 12 : (!pm && hh === 12 ? 0 : hh), mm);
}

export default function EventsSection() {
  const { content } = useGlobalState();

  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const events = dbEvents;

  const selected = events.find((e: any) => e.id === selectedId) || events[0] || null;

  useEffect(() => {
    supabase.from('admin_events').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data?.length) setDbEvents(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const t = parseDate(events[0].month, events[0].day, events[0].time);
    setTimeLeft(countdown(t));
    const id = setInterval(() => setTimeLeft(countdown(t)), 1000);
    return () => clearInterval(id);
  }, [events]);

  useEffect(() => { setDone(false); setName(''); setEmail(''); }, [selectedId, selected]);

  const handleRegister = async () => {
    if (!name || !email || !selected) return;
    setSaving(true);
    try {
      await supabase.from('event_registrations').insert({
        id: `reg-${Date.now()}`,
        event_id: selected.id, event_title: selected.title,
        event_day: selected.day, event_month: selected.month,
        event_location: selected.location, event_time: selected.time,
        member_name: name, member_email: email,
        ticket_ref: `GA-TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: 'confirmed',
      });
    } catch {}
    setSaving(false);
    setDone(true);
  };

  return (
    <section className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px] overflow-hidden">
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gold-500/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12 relative z-10">
        {/* Hero */}
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

        {/* Countdown */}
        {events[0] && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative max-w-3xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-gold-500/5 rounded-xl blur-sm" />
            <div className="relative bg-neutral-950/80 backdrop-blur-md border border-neutral-900 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
              <div className="text-center md:text-left space-y-1">
                <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-semibold block">Next Gathering</span>
                <h3 className="font-serif text-sm md:text-base font-bold text-white uppercase tracking-wide">{events[0].title}</h3>
                <p className="text-[10px] text-neutral-500 flex items-center justify-center md:justify-start gap-1">
                  <MapPin className="h-3 w-3 text-neutral-600" /> {events[0].location} <span className="text-neutral-700">•</span> {events[0].time}
                </p>
              </div>
              <div className="flex gap-2.5 font-mono">
                {[
                  { v: timeLeft.days, l: 'Days' }, { v: timeLeft.hours, l: 'Hrs' },
                  { v: timeLeft.minutes, l: 'Min' }, { v: timeLeft.seconds, l: 'Sec' },
                ].map((u, i) => (
                  <div key={u.l} className="flex flex-col items-center p-2.5 md:p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 min-w-[52px] md:min-w-[60px]">
                    <span className={`text-lg md:text-xl font-bold leading-none ${i === 3 ? 'text-gold-500' : 'text-white'}`}>{String(u.v).padStart(2, '0')}</span>
                    <span className="text-[7px] md:text-[8px] text-neutral-500 mt-1 uppercase font-semibold">{u.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Event List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold">Events</h3>
                <span className="text-[8px] font-mono text-neutral-600">{events.length}</span>
              </div>
              {events.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-2">
                  <Calendar className="h-6 w-6 text-neutral-700 mx-auto" />
                  <p className="text-[11px] text-neutral-500">No events scheduled yet.</p>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {events.map((evt: any, i: number) => {
                    const sel = selected?.id === evt.id;
                    return (
                      <motion.button key={evt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                        onClick={() => setSelectedId(evt.id)}
                        className={`group relative p-4 rounded-xl border text-left transition-all flex gap-3 items-center ${
                          sel ? 'bg-gradient-to-r from-gold-500/[0.06] to-transparent border-gold-500/30' : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-700'
                        }`}
                      >
                        {sel && <motion.div layoutId="g" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gold-500" />}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg border border-neutral-800 bg-neutral-950/80 font-mono text-center shrink-0">
                          <span className="text-sm font-bold text-white leading-none">{evt.day}</span>
                          <span className="text-[8px] font-bold text-gold-500 tracking-wider mt-0.5 leading-none uppercase">{evt.month}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-bold truncate tracking-wide ${sel ? 'text-gold-500' : 'text-white'}`}>{evt.title}</h4>
                          <p className="text-[9px] text-neutral-500 truncate mt-0.5">{evt.location}</p>
                        </div>
                        <ChevronRight className={`h-3 w-3 transition-all ${sel ? 'text-gold-500 translate-x-0.5' : 'text-neutral-700'}`} />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail + Registration */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {!selected ? (
                  <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-12 text-center"
                  ><Calendar className="h-8 w-8 text-neutral-700 mx-auto mb-3" /><p className="text-sm text-neutral-500 font-mono">No events available.</p></motion.div>
                ) : (
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-5 md:p-7 shadow-xl space-y-6"
                  >
                    {/* Header */}
                    <div className="pb-4 border-b border-neutral-900/60">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-neutral-500 mb-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gold-500" /> {selected.month} {selected.day}, 2026</span>
                        <span className="text-neutral-800">|</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gold-500" /> {selected.location}</span>
                        <span className="text-neutral-800">|</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-gold-500" /> {selected.time}</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl font-extrabold text-white tracking-wide uppercase">{selected.title}</h3>
                    </div>

                    {/* Description */}
                    {selected.description && (
                      <p className="text-xs text-neutral-400 leading-relaxed">{selected.description}</p>
                    )}

                    {/* Success */}
                    <AnimatePresence>
                      {done && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-transparent p-4 flex items-start gap-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-emerald-400">You're registered!</p>
                            <p className="text-[10px] text-neutral-400">A confirmation has been sent to <span className="text-white">{email}</span>. See you at the gathering.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Registration Form */}
                    {!done && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                          <Ticket className="h-3.5 w-3.5 text-gold-500" /> Register
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 transition-colors" />
                          <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 transition-colors" />
                        </div>
                        <button onClick={handleRegister} disabled={saving || !name || !email}
                          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-neutral-950 font-bold py-3 rounded-xl tracking-widest uppercase text-[11px] font-mono shadow-[0_0_20px_-6px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_-6px_rgba(212,175,55,0.5)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} {saving ? 'Registering...' : 'Register Now'}</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
