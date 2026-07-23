import React, { useState, useEffect } from 'react';
import { ExperienceBooking, TimelineEntry } from '../types';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import {
  Ticket, ArrowLeft, ChevronRight, CheckCircle, Clock, MapPin,
  Calendar, Users, MessageCircle, Mail, X, Eye, Star, Download,
  ExternalLink, HelpCircle, Shield, AlertCircle,
} from 'lucide-react';
import { openWhatsApp, openEmail } from '../utils/contactSettings';

interface Props {
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function formatDate(d: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const SNAKE_TO_CAMEL: Record<string, string> = {
  experience_id: 'experienceId',
  experience_title: 'experienceTitle',
  booking_reference: 'bookingReference',
  full_name: 'fullName',
  preferred_date: 'preferredDate',
  preferred_time: 'preferredTime',
  special_requests: 'specialRequests',
  communication_method: 'communicationMethod',
  confirmed_date: 'confirmedDate',
  confirmed_time: 'confirmedTime',
  confirmed_location: 'confirmedLocation',
  meeting_venue: 'meetingVenue',
  virtual_link: 'virtualLink',
  dress_code: 'dressCode',
  arrival_instructions: 'arrivalInstructions',
  admin_notes: 'adminNotes',
  cancelled_reason: 'cancelledReason',
  submitted_date: 'submittedDate',
  created_at: 'createdAt',
  user_id: 'userId',
};

function toCamelCase(row: Record<string, any>): ExperienceBooking {
  const out: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const camel = SNAKE_TO_CAMEL[key] || key;
    out[camel] = row[key];
  }
  if (out.timeline && typeof out.timeline === 'string') {
    try { out.timeline = JSON.parse(out.timeline); } catch { out.timeline = []; }
  }
  return out as ExperienceBooking;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Request Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'discussion', label: 'Discussion in Progress' },
  { key: 'active', label: 'Booking Confirmed' },
  { key: 'completed', label: 'Experience Completed' },
];

export default function FanExperienceBookings({ showToast }: Props) {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<ExperienceBooking | null>(null);
  const [experiences, setExperiences] = useState<Record<string, any>>({});

  useEffect(() => {
    loadBookings();
    loadExperiences();
  }, []);

  const loadBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('experience_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setBookings(data.map((r: any) => toCamelCase(r)));
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase.from('experiences').select('*');
      if (!error && data) {
        const map: Record<string, any> = {};
        data.forEach((e: any) => { map[e.id] = e; });
        setExperiences(map);
      }
    } catch {}
  };

  const getStatusIndex = (status: string) => {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'completed': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
      case 'cancelled': return 'text-red-400 border-red-500/20 bg-red-500/5';
      default: return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-amber-500';
    }
  };

  const continueConversation = (booking: ExperienceBooking) => {
    const experienceTitle = booking.experienceTitle || experiences[booking.experienceId]?.title || 'Experience';
    const message = `Hi, I'd like to follow up on my booking.\n\n` +
      `Reference: ${booking.bookingReference}\n` +
      `Experience: ${experienceTitle}\n\n` +
      `Thank you.`;
    if (booking.communicationMethod === 'whatsapp') {
      openWhatsApp(message);
    } else {
      openEmail('Booking Follow-Up - ' + booking.bookingReference, message);
    }
  };

  const withdrawBooking = async (booking: ExperienceBooking) => {
    if (!confirm('Are you sure you want to withdraw this booking request?')) return;
    try {
      const { data: current } = await supabase.from('experience_requests').select('timeline').eq('id', booking.id).single();
      let existingTimeline: any[] = [];
      try {
        const raw = current?.timeline;
        if (raw) {
          if (typeof raw === 'string') existingTimeline = JSON.parse(raw);
          else if (Array.isArray(raw)) existingTimeline = raw;
        }
      } catch {}
      if (!Array.isArray(existingTimeline)) existingTimeline = [];
      existingTimeline.push({ event: 'Booking Withdrawn', status: 'cancelled', note: 'The requester withdrew this booking.', date: new Date().toISOString() });
      const { error } = await supabase.from('experience_requests').update({
        status: 'cancelled', cancelled_reason: 'Withdrawn by requester',
        timeline: JSON.stringify(existingTimeline), updated_at: new Date().toISOString(),
      }).eq('id', booking.id);
      if (!error) {
        showToast('Booking has been withdrawn.', 'info');
        loadBookings();
        setSelectedBooking(null);
      }
    } catch (err) {
      showToast('Failed to withdraw booking.', 'error');
    }
  };

  const expImg = (booking: ExperienceBooking) => {
    const exp = experiences[booking.experienceId];
    return exp?.image || '';
  };

  if (selectedBooking) {
    const b = selectedBooking;
    const currentIdx = getStatusIndex(b.status);
    const isCancelled = b.status === 'cancelled';
    const isPast = b.status === 'completed' || b.status === 'cancelled';

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Bookings
        </button>

        {/* Experience Info */}
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
              {expImg(b) ? (
                <img src={expImg(b)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Star className="h-6 w-6 text-neutral-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base font-bold text-white">{b.experienceTitle}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-wider uppercase border ${getStatusColor(b.status)}`}>
                  {STATUS_STEPS.find(s => s.key === b.status)?.label || b.status}
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-1">Reference: {b.bookingReference}</p>
              <p className="text-[10px] font-mono text-neutral-500">Submitted: {formatDate(b.submittedDate || b.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Booking Details</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-neutral-500">Preferred Date</span><span className="text-white">{b.preferredDate}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Preferred Time</span><span className="text-white">{b.preferredTime}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Guests</span><span className="text-white">{b.participants}</span></div>
              {b.specialRequests && <div className="pt-1 border-t border-neutral-900/60"><span className="text-neutral-500">Special Requests:</span><p className="text-white mt-0.5">{b.specialRequests}</p></div>}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Communication</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px]">
                {b.communicationMethod === 'whatsapp' ? (
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Mail className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-white capitalize">{b.communicationMethod}</span>
              </div>
              <button
                onClick={() => continueConversation(b)}
                className="flex items-center gap-1.5 text-[10px] font-mono text-gold-500 hover:text-gold-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Continue Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Confirmed Details (when active/completed) */}
        {(b.status === 'active' || b.status === 'completed') && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 space-y-3">
            <h4 className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> Confirmed Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {b.confirmedDate && <div><span className="text-neutral-500 block text-[9px]">Confirmed Date</span><span className="text-white">{b.confirmedDate}</span></div>}
              {b.confirmedTime && <div><span className="text-neutral-500 block text-[9px]">Confirmed Time</span><span className="text-white">{b.confirmedTime}</span></div>}
              {b.meetingVenue && <div><span className="text-neutral-500 block text-[9px]">Meeting Venue</span><span className="text-white">{b.meetingVenue}</span></div>}
              {b.virtualLink && <div><span className="text-neutral-500 block text-[9px]">Virtual Link</span><span className="text-gold-500">{b.virtualLink}</span></div>}
              {b.dressCode && <div><span className="text-neutral-500 block text-[9px]">Dress Code</span><span className="text-white">{b.dressCode}</span></div>}
              {b.arrivalInstructions && <div className="sm:col-span-2"><span className="text-neutral-500 block text-[9px]">Arrival Instructions</span><span className="text-white">{b.arrivalInstructions}</span></div>}
            </div>
          </div>
        )}

        {/* Cancelled Reason */}
        {isCancelled && b.cancelledReason && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold">Cancellation Reason</h4>
            <p className="text-[11px] text-neutral-300">{b.cancelledReason}</p>
          </div>
        )}

        {/* Progress Tracker */}
        {!isPast && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Booking Progress
            </h4>
            <div className="relative">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                        isDone ? 'border-gold-500 bg-gold-500 text-neutral-950' :
                        isCurrent ? 'border-gold-500/50 bg-gold-500/10 text-gold-500' :
                        'border-neutral-800 bg-neutral-900/40 text-neutral-600'
                      }`}>
                        {isDone ? <CheckCircle className="h-3 w-3" /> : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-px h-6 ${isDone ? 'bg-gold-500/30' : 'bg-neutral-900'}`} />
                      )}
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

        {/* Admin Notes */}
        {b.adminNotes && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-2">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Administrator Notes</h4>
            <p className="text-[11px] text-neutral-300 whitespace-pre-line">{b.adminNotes}</p>
          </div>
        )}

        {/* Timeline */}
        {b.timeline && b.timeline.length > 0 && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Booking Timeline</h4>
            <div className="space-y-3">
              {b.timeline.map((entry: TimelineEntry, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-2 w-2 rounded-full bg-gold-500/40 ring-2 ring-[#050505]" />
                    {i < b.timeline.length - 1 && <div className="w-px flex-1 bg-neutral-900/60" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-xs font-bold text-neutral-200">{entry.event}</p>
                    {entry.note && <p className="text-[10px] text-neutral-500 mt-0.5">{entry.note}</p>}
                    <p className="text-[8px] font-mono text-neutral-600 mt-0.5">{formatDate(entry.date)} {formatTime(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-900/60">
          {b.status === 'pending' && (
            <>
              <button onClick={() => continueConversation(b)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all">
                <ExternalLink className="h-3 w-3" /> Continue Conversation
              </button>
              <button onClick={() => withdrawBooking(b)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-950/20 text-[10px] font-mono uppercase transition-all">
                <X className="h-3 w-3" /> Withdraw Request
              </button>
            </>
          )}
          {b.status === 'active' && (
            <>
              <button onClick={() => continueConversation(b)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all">
                <ExternalLink className="h-3 w-3" /> Continue Conversation
              </button>
            </>
          )}
          {b.status === 'completed' && (
            <>
              <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all">
                <Ticket className="h-3 w-3" /> Book Another Experience
              </button>
            </>
          )}
          {b.status === 'cancelled' && (
            <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all">
              <Ticket className="h-3 w-3" /> Book Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 mt-4 font-mono">Loading your bookings...</p>
      </div>
    );
  }

  // Separate active/upcoming from past
  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-neutral-900 pb-4">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">My Experience Bookings</h2>
        <p className="text-xs text-neutral-500 font-mono">Track, manage, and review your experience bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
          <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
            <Ticket className="h-5 w-5 text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-500">No experience bookings yet.</p>
          <p className="text-[10px] text-neutral-600 font-mono">Browse experiences and book your first unforgettable moment.</p>
        </div>
      ) : (
        <>
          {/* Active Bookings */}
          {activeBookings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Active Bookings</h3>
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-gold-500/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                      {expImg(b) ? (
                        <img src={expImg(b)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Star className="h-5 w-5 text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white group-hover:text-gold-500/80 transition-colors">{b.experienceTitle}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border ${getStatusColor(b.status)}`}>
                          {STATUS_STEPS.find(s => s.key === b.status)?.label || b.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 mt-1">
                        <span className="font-mono">{b.bookingReference}</span>
                        <span>{formatDate(b.submittedDate || b.createdAt)}</span>
                        <span className="capitalize">{b.communicationMethod}</span>
                      </div>
                      {b.specialRequests && (
                        <p className="text-[10px] text-neutral-500 italic line-clamp-1 mt-0.5">"{b.specialRequests}"</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-gold-500/60 mt-1 shrink-0 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Experiences */}
          {pastBookings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Past Experiences</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {pastBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 hover:border-neutral-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                        {expImg(b) ? (
                          <img src={expImg(b)} alt="" className="h-full w-full object-cover opacity-60" />
                        ) : (
                          <Star className="h-4 w-4 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">{b.experienceTitle}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-neutral-600 mt-0.5">
                          <span>{formatDate(b.submittedDate || b.createdAt)}</span>
                          <span className={`uppercase ${b.status === 'completed' ? 'text-blue-500' : 'text-red-400'}`}>{STATUS_STEPS.find(s => s.key === b.status)?.label || b.status}</span>
                        </div>
                        <p className="text-[8px] font-mono text-neutral-600 mt-0.5">{b.bookingReference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
