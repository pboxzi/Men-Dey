import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';
import { UpcomingEvent } from '../types';
import {
  Calendar, Clock, MapPin, CheckCircle, Users, Info, Send,
  Sparkles, ChevronRight, Ticket, Star, ArrowLeft, ArrowRight, Gift
} from 'lucide-react';

function calcTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const ROWS = ['A', 'B', 'C', 'D'];
const COLS = [1, 2, 3, 4, 5, 6];
const OCCUPIED = ['A3', 'A4', 'B1', 'C5', 'D2', 'D3'];
const TICKET_TIERS = [
  { id: 'general', label: 'General Pass', price: 'Free', desc: 'Standard entry' },
  { id: 'donor', label: 'Supporter Pass', price: '$25', desc: 'Includes donation receipt' },
  { id: 'vip', label: 'VIP Circle', price: '$100', desc: 'Premium seating + meet & greet' },
];

export default function EventsSection() {
  const { content } = useGlobalState();
  const events: UpcomingEvent[] = (content.upcomingEvents || []).map((e: any) => ({
    id: e.id, day: e.day, month: e.month, title: e.title, location: e.location, time: e.time, description: e.description,
  }));
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(events[0] || null);
  const [ticketQty, setTicketQty] = useState(1);
  const [ticketType, setTicketType] = useState('general');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [step, setStep] = useState<'seat' | 'details' | 'confirm'>('seat');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-07-28T16:00:00');
    setTimeLeft(calcTimeLeft(target));
    const timer = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStep('seat');
    setSelectedSeat(null);
    setAttendeeName('');
    setAttendeeEmail('');
    setTicketType('general');
    setTicketQty(1);
    setIsBooked(false);
  }, [selectedEvent]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName || !attendeeEmail) return;
    setIsBooked(true);
    setTimeout(() => setIsBooked(false), 6000);
  };

  const selectedTier = TICKET_TIERS.find(t => t.id === ticketType);

  return (
    <section id="events-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px] overflow-hidden">
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gold-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/3 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12 relative z-10">
        {/* ── Hero Header ── */}
        <div className="text-center space-y-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/[0.03] text-gold-500 text-[10px] font-mono tracking-[0.2em] uppercase backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3" />
            Live Gatherings & Experiences
          </motion.div>
          <div className="space-y-3">
            <h2 className="font-serif text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-[1.1]">
              Co-op<br className="md:hidden" />
              <span className="text-gold-500 bg-gold-500/5 px-3 py-1 inline-block">Conclaves</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
              Join exclusive gatherings including classical stage plays, intimate Q&A discussions, retrospective panel screenings, and global community fundraising galas.
            </p>
          </div>
        </div>

        {/* ── Countdown Ticker ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-gold-500/5 rounded-xl blur-sm" />
          <div className="relative bg-neutral-950/80 backdrop-blur-md border border-neutral-900 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="text-center md:text-left space-y-1">
              <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-semibold block">Next Gathering</span>
              <h3 className="font-serif text-sm md:text-base font-bold text-white uppercase tracking-wide">
                {events[0]?.title || 'No upcoming events'}
              </h3>
              <p className="text-[10px] text-neutral-500 font-sans flex items-center justify-center md:justify-start gap-1">
                <MapPin className="h-3 w-3 text-neutral-600" />
                {events[0]?.location || ''} <span className="text-neutral-700">•</span> {events[0]?.time || ''}
              </p>
            </div>
            <div className="flex gap-2.5 font-mono">
              {[
                { v: timeLeft.days, l: 'Days' },
                { v: timeLeft.hours, l: 'Hrs' },
                { v: timeLeft.minutes, l: 'Min' },
                { v: timeLeft.seconds, l: 'Sec' },
              ].map((unit, i) => (
                <div key={unit.l} className="flex flex-col items-center justify-center p-2.5 md:p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 min-w-[52px] md:min-w-[60px]">
                  <span className={`text-lg md:text-xl font-bold leading-none ${i === 3 ? 'text-gold-500' : 'text-white'}`}>
                    {String(unit.v).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] md:text-[8px] text-neutral-500 mt-1 uppercase font-semibold">{unit.l}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Bento Layout ── */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left: Event Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h3 className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold">Select Gathering</h3>
              <span className="text-[8px] font-mono text-neutral-600">{events.length} event{events.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid gap-2.5">
              {events.map((evt, i) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <motion.button
                    key={evt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    onClick={() => setSelectedEvent(evt)}
                    className={`group relative p-4 rounded-xl border text-left transition-all duration-300 flex gap-3 items-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-gold-500/[0.06] to-transparent border-gold-500/30 shadow-[0_0_20px_-8px_rgba(212,175,55,0.15)]'
                        : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-700 hover:bg-neutral-950/60'
                    }`}
                  >
                    {isSelected && (
                      <motion.div layoutId="eventGlow" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gold-500" />
                    )}
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg border border-neutral-800 bg-neutral-950/80 font-mono text-center shrink-0">
                      <span className="text-sm font-bold text-white leading-none">{evt.day}</span>
                      <span className="text-[8px] font-bold text-gold-500 tracking-wider mt-0.5 leading-none uppercase">{evt.month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[11px] font-bold truncate tracking-wide transition-colors ${isSelected ? 'text-gold-500' : 'text-white group-hover:text-gold-400'}`}>
                        {evt.title}
                      </h4>
                      <p className="text-[9px] text-neutral-500 truncate mt-0.5">{evt.location}</p>
                    </div>
                    <ChevronRight className={`h-3 w-3 transition-all duration-300 ${isSelected ? 'text-gold-500 translate-x-0.5' : 'text-neutral-700 group-hover:text-neutral-500'}`} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Registration Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              {!selectedEvent ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-12 text-center"
                >
                  <Calendar className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 font-mono">No events available at this time.</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedEvent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="bg-neutral-950/40 backdrop-blur-sm border border-neutral-900 rounded-xl p-5 md:p-7 shadow-xl space-y-6"
                >
                  {/* Event header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900/60">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gold-500" /> {selectedEvent.month} {selectedEvent.day}, 2026</span>
                        <span className="text-neutral-800">|</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gold-500" /> {selectedEvent.location}</span>
                        <span className="text-neutral-800">|</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-gold-500" /> {selectedEvent.time}</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl font-extrabold text-white tracking-wide uppercase">{selectedEvent.title}</h3>
                    </div>
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 font-mono">
                      {(['seat', 'details', 'confirm'] as const).map((s, i) => (
                        <React.Fragment key={s}>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] uppercase tracking-wider transition-all ${
                            step === s ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20' :
                            ['seat', 'details', 'confirm'].indexOf(step) > i ? 'text-emerald-500' : 'text-neutral-600'
                          }`}>
                            {['seat', 'details', 'confirm'].indexOf(step) > i ? <CheckCircle className="h-2.5 w-2.5" /> : null}
                            {s}
                          </div>
                          {i < 2 && <span className="text-neutral-800 text-[8px]">—</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Success message */}
                  <AnimatePresence>
                    {isBooked && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-transparent p-4 flex items-start gap-3"
                      >
                        <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 rounded-full blur-2xl" />
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-emerald-400">Registration Complete!</p>
                          <p className="text-[10px] text-neutral-400 leading-relaxed">
                            Your {selectedTier?.label} ticket{selectedSeat ? ` (Row ${selectedSeat[0]}, Seat ${selectedSeat.slice(1)})` : ''} has been reserved. A confirmation with your barcode pass has been sent to <span className="text-white">{attendeeEmail}</span>.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 1: Seat Selection */}
                  {step === 'seat' && !isBooked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold">Select Your Seat</h4>
<button onClick={() => setStep('details')} disabled={!selectedSeat}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all ${
    selectedSeat ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
  }`}
>Next <ArrowRight className="h-3 w-3" /></button>
                      </div>
                      <div className="flex flex-col items-center bg-neutral-950/60 border border-neutral-900 rounded-xl p-5 md:p-6">
                        <div className="w-full text-center mb-6 relative">
                          <div className="h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
                          <span className="relative -top-2.5 inline-block px-4 bg-neutral-950/60 font-mono text-[8px] text-gold-500/80 tracking-[0.3em] uppercase">Stage</span>
                        </div>
                        <div className="grid gap-2.5">
                          {ROWS.map(row => (
                            <div key={row} className="flex items-center gap-2">
                              <span className="w-4 text-[9px] font-mono text-neutral-600 text-right">{row}</span>
                              <div className="flex gap-2">
                                {COLS.map(col => {
                                  const seatId = `${row}${col}`;
                                  const occupied = OCCUPIED.includes(seatId);
                                  const chosen = selectedSeat === seatId;
                                  return (
                                    <button key={seatId} type="button" disabled={occupied}
                                      onClick={() => setSelectedSeat(seatId)}
                                      className={`relative h-7 w-7 rounded text-[8px] font-mono font-bold border transition-all duration-150 ${
                                        occupied
                                          ? 'bg-neutral-900 border-neutral-900 text-neutral-800 cursor-not-allowed'
                                          : chosen
                                          ? 'bg-gold-500 border-gold-400 text-neutral-950 scale-110 shadow-[0_0_10px_-2px_rgba(212,175,55,0.4)]'
                                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-gold-500/40 hover:text-gold-500 hover:scale-105'
                                      }`}
                                      title={occupied ? `Seat ${seatId} — Taken` : `Seat ${seatId} — Available`}
                                    >{col}</button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-4 font-mono text-[7px] text-neutral-500 mt-5">
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-950 border border-neutral-800" /> Available</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-900 border border-neutral-900" /> Taken</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-500" /> Selected</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Details */}
                  {step === 'details' && !isBooked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                          <Ticket className="h-3.5 w-3.5 text-gold-500" /> Registration Details
                        </h4>
                        <div className="flex gap-1.5">
                          <button onClick={() => setStep('seat')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-neutral-500 hover:text-white border border-neutral-800 transition-all"
                          ><ArrowLeft className="h-3 w-3" /> Back</button>
                        </div>
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); setStep('confirm'); }} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Full Name *</label>
                            <input type="text" required value={attendeeName} onChange={e => setAttendeeName(e.target.value)}
                              placeholder="e.g. Ted Logan"
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 transition-colors" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Email *</label>
                            <input type="email" required value={attendeeEmail} onChange={e => setAttendeeEmail(e.target.value)}
                              placeholder="e.g. ted@example.com"
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 transition-colors" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Ticket Tier</label>
                            <div className="grid gap-1.5">
                              {TICKET_TIERS.map(t => (
                                <button key={t.id} type="button" onClick={() => setTicketType(t.id)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-[11px] transition-all ${
                                    ticketType === t.id
                                      ? 'border-gold-500/30 bg-gold-500/[0.04] text-white'
                                      : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold">{t.label}</span>
                                    <span className="block text-[9px] text-neutral-500">{t.desc}</span>
                                  </div>
                                  <span className={ticketType === t.id ? 'text-gold-500 font-bold' : 'text-neutral-500'}>{t.price}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">Quantity</label>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setTicketQty(q => Math.max(1, q - 1))}
                                className="h-9 w-9 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center text-sm"
                              >−</button>
                              <span className="flex-1 text-center text-sm font-bold text-white font-mono">{ticketQty}</span>
                              <button type="button" onClick={() => setTicketQty(q => Math.min(6, q + 1))}
                                className="h-9 w-9 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center text-sm"
                              >+</button>
                            </div>
                            {selectedSeat && (
                              <div className="pt-1 text-[9px] font-mono text-neutral-500">
                                Seat: <span className="text-gold-500">Row {selectedSeat[0]}, Seat {selectedSeat.slice(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2 text-[9px] text-neutral-500 leading-relaxed font-mono">
                          <Info className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                          <span>Admittance requires photo ID matching the registered name. Seats are secured upon registration verification.</span>
                        </div>
                        <button type="submit"
                          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-neutral-950 font-bold py-3 rounded-xl tracking-widest uppercase text-[11px] font-mono shadow-[0_0_20px_-6px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_-6px_rgba(212,175,55,0.5)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99]"
                        >Review <ChevronRight className="h-3.5 w-3.5" /></button>
                      </form>
                    </motion.div>
                  )}

                  {/* Step 3: Confirm */}
                  {step === 'confirm' && !isBooked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold flex items-center gap-2">
                          <Gift className="h-3.5 w-3.5 text-gold-500" /> Confirm Registration
                        </h4>
                        <button onClick={() => setStep('details')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-neutral-500 hover:text-white border border-neutral-800 transition-all"
                        ><ArrowLeft className="h-3 w-3" /> Edit</button>
                      </div>
                      <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-4 space-y-3">
                        <h5 className="text-xs font-bold text-white">{selectedEvent.title}</h5>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {[
                            ['Date', `${selectedEvent.month} ${selectedEvent.day}, 2026`],
                            ['Time', selectedEvent.time],
                            ['Location', selectedEvent.location],
                            ['Ticket', selectedTier?.label || ''],
                            ['Quantity', `×${ticketQty}`],
                            ['Seat', selectedSeat ? `Row ${selectedSeat[0]}, Seat ${selectedSeat.slice(1)}` : 'General'],
                          ].map(([l, v]) => (
                            <div key={String(l)} className="flex justify-between border-b border-neutral-900/40 pb-1">
                              <span className="text-neutral-500">{String(l)}</span>
                              <span className="text-white font-medium">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[9px] font-mono text-neutral-500">Total</span>
                          <span className="text-sm font-bold text-gold-500">{selectedTier?.price === 'Free' ? 'Free' : `${selectedTier?.price} × ${ticketQty}`}</span>
                        </div>
                        <div className="p-2 bg-neutral-900/60 rounded-lg flex items-center gap-2 text-[9px] font-mono text-neutral-500">
                          <Info className="h-3 w-3 text-gold-500 shrink-0" />
                          {attendeeName} · {attendeeEmail}
                        </div>
                      </div>
                      <button onClick={handleBookingSubmit}
                        className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-neutral-950 font-bold py-3 rounded-xl tracking-widest uppercase text-[11px] font-mono shadow-[0_0_20px_-6px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_-6px_rgba(212,175,55,0.5)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99]"
                      ><Send className="h-3.5 w-3.5" /> Confirm & Register</button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
