import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UPCOMING_EVENTS } from '../data';
import { UpcomingEvent } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Users,
  Info,
  Send,
  Sparkles,
  ChevronRight,
  Ticket
} from 'lucide-react';

export default function EventsSection() {
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent>(UPCOMING_EVENTS[0]);
  const [ticketQty, setTicketQty] = useState<number>(1);
  const [ticketType, setTicketType] = useState<string>('general');
  const [attendeeName, setAttendeeName] = useState<string>('');
  const [attendeeEmail, setAttendeeEmail] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  
  // Simulated seat grid (6x6 matrix)
  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4, 5, 6];
  // Hardcoded booked seats for realism
  const occupiedSeats = ['A3', 'A4', 'B1', 'C5', 'D2', 'D3'];

  // Countdown Timer to the next event
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 8,
    minutes: 45,
    seconds: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName || !attendeeEmail) return;

    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      // Reset form
      setAttendeeName('');
      setAttendeeEmail('');
      setSelectedSeat(null);
    }, 5000);
  };

  return (
    <section id="events-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute right-10 bottom-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Calendar className="h-3.5 w-3.5" />
            LIVE GATHERINGS & EXPERIENCES
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Co-op <span className="text-gold-500">Conclaves</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Join exclusive gatherings including classical stage plays, intimate Q&A discussions, retrospective panel screenings, and global community fundraising galas.
          </p>
        </div>

        {/* Live Event Countdown Ticker */}
        <div className="bg-neutral-950/80 border border-neutral-900 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto">
          <div className="text-center md:text-left space-y-1">
            <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-semibold block">NEXT BIG GATHERING</span>
            <h3 className="font-serif text-base font-bold text-white uppercase tracking-wide">
              {UPCOMING_EVENTS[0].title}
            </h3>
            <p className="text-xs text-neutral-500 font-sans flex items-center justify-center md:justify-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-neutral-600" />
              {UPCOMING_EVENTS[0].location}
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex gap-3 font-mono">
            <div className="flex flex-col items-center justify-center p-3 rounded bg-neutral-900 border border-neutral-800 min-w-[56px]">
              <span className="text-lg font-bold text-white leading-none">{timeLeft.days}</span>
              <span className="text-[8px] text-neutral-500 mt-1 uppercase font-semibold">DAYS</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded bg-neutral-900 border border-neutral-800 min-w-[56px]">
              <span className="text-lg font-bold text-white leading-none">{timeLeft.hours}</span>
              <span className="text-[8px] text-neutral-500 mt-1 uppercase font-semibold">HOURS</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded bg-neutral-900 border border-neutral-800 min-w-[56px]">
              <span className="text-lg font-bold text-white leading-none">{timeLeft.minutes}</span>
              <span className="text-[8px] text-neutral-500 mt-1 uppercase font-semibold">MINS</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded bg-neutral-900 border border-neutral-800 min-w-[56px]">
              <span className="text-lg font-bold text-gold-500 leading-none">{timeLeft.seconds}</span>
              <span className="text-[8px] text-neutral-500 mt-1 uppercase font-semibold">SECS</span>
            </div>
          </div>
        </div>

        {/* Bento Events grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left: Events Timeline Selection Sidebar - 5 Cols */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <h3 className="font-serif text-sm tracking-widest text-neutral-400 uppercase font-bold border-b border-neutral-900 pb-3">
              SELECT GATHERING
            </h3>

            <div className="grid gap-3">
              {UPCOMING_EVENTS.map((evt) => {
                const isSelected = evt.id === selectedEvent.id;
                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-4 rounded-xl border text-left transition-all flex gap-4 items-center cursor-pointer group ${
                      isSelected
                        ? 'bg-gold-500/5 border-gold-500/40 shadow-lg'
                        : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-950/80'
                    }`}
                  >
                    {/* Date icon */}
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded border border-neutral-800 bg-neutral-950/80 font-mono text-center shrink-0">
                      <span className="text-sm font-bold text-white leading-none">{evt.day}</span>
                      <span className="text-[8px] font-bold text-gold-500 tracking-wider mt-0.5 leading-none uppercase">
                        {evt.month}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate tracking-wide ${isSelected ? 'text-gold-500' : 'text-white group-hover:text-gold-500'}`}>
                        {evt.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 truncate mt-1">
                        {evt.location}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Ticketing & Seating Panel - 7 Cols */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-6 shadow-xl space-y-6"
              >
                {/* Visual Title */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono text-gold-500 uppercase">
                    <span>DATE: {selectedEvent.month} {selectedEvent.day}, 2026</span>
                    <span>•</span>
                    <span>LOCATION: {selectedEvent.location}</span>
                  </div>
                  <h3 className="font-serif text-xl font-extrabold text-white tracking-wide uppercase">
                    {selectedEvent.title}
                  </h3>
                </div>

                {/* Seating Map Grid (Interactive Core Function!) */}
                <div className="pt-5 border-t border-neutral-900/60 space-y-3">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold">
                    SELECT PREFERRED SEAT ON STAGE CHART
                  </h4>

                  <div className="flex flex-col items-center bg-neutral-950/80 p-5 rounded-lg border border-neutral-900">
                    {/* Stage represent */}
                    <div className="w-full text-center border-b border-gold-500/20 pb-1 mb-6">
                      <span className="font-mono text-[8px] text-gold-500/80 tracking-[0.25em] uppercase">STAGE / MAIN FRONT</span>
                    </div>

                    {/* Seat Grid */}
                    <div className="grid gap-2 text-center">
                      {rows.map((row) => (
                        <div key={row} className="flex items-center gap-2">
                          <span className="w-4 text-[9px] font-mono text-neutral-600">{row}</span>
                          <div className="flex gap-2">
                            {cols.map((col) => {
                              const seatId = `${row}${col}`;
                              const isOccupied = occupiedSeats.includes(seatId);
                              const isChosen = selectedSeat === seatId;

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isOccupied}
                                  onClick={() => setSelectedSeat(seatId)}
                                  className={`h-6 w-6 rounded text-[8px] font-mono font-bold border transition-all ${
                                    isOccupied
                                      ? 'bg-neutral-900 border-neutral-900 text-neutral-800 cursor-not-allowed'
                                      : isChosen
                                      ? 'bg-gold-500 border-gold-400 text-neutral-950'
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-gold-500/40'
                                  }`}
                                  title={isOccupied ? `Seat ${seatId} (Booked)` : `Seat ${seatId} (Available)`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Legends */}
                    <div className="flex gap-4 font-mono text-[8px] text-neutral-500 mt-5">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded bg-neutral-950 border border-neutral-800" /> AVAILABLE
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded bg-neutral-900" /> OCCUPIED
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded bg-gold-500" /> CHOSEN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Inputs */}
                <div className="pt-5 border-t border-neutral-900/60 space-y-4">
                  <h4 className="font-serif text-xs font-bold text-white flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-gold-500" />
                    REGISTRATION DETAILS
                  </h4>

                  {isBooked && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gold-500/10 border border-gold-500/30 p-3.5 rounded-lg flex items-center gap-2 text-xs text-gold-500 font-serif italic"
                    >
                      <CheckCircle className="h-4.5 w-4.5 text-gold-500 shrink-0" />
                      <span>"Registration complete! Your tickets and barcode pass have been dispatched to your email."</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                          YOUR FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={attendeeName}
                          onChange={(e) => setAttendeeName(e.target.value)}
                          placeholder="e.g. Ted Logan"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-gold-500/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                          EMAIL ADDRESS *
                        </label>
                        <input
                          type="email"
                          required
                          value={attendeeEmail}
                          onChange={(e) => setAttendeeEmail(e.target.value)}
                          placeholder="e.g. ted@wyldstallyns.com"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-gold-500/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                          TICKET TIER
                        </label>
                        <select
                          value={ticketType}
                          onChange={(e) => setTicketType(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-gold-500/40"
                        >
                          <option value="general">Co-op General Pass ($0.00)</option>
                          <option value="donor">Supporter Donator Pass ($25.00)</option>
                          <option value="vip">Wyld VIP Circle Access ($100.00)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                          CHOSEN SEAT LOCATION
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={selectedSeat ? `Row ${selectedSeat[0]}, Seat ${selectedSeat[1]}` : 'None Selected (Stall Standing)'}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2 text-[10px] text-neutral-400 leading-relaxed font-mono">
                      <Info className="h-4 w-4 text-gold-500 shrink-0" />
                      <span>Note: Admittance requires photo ID matching the registered ticket name. Seats are secured upon registration verification.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded-lg tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      REGISTER TICKET PASS
                    </button>
                  </form>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
