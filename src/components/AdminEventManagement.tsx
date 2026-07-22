import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase';
import { notifyEventRegistration } from '../utils/notifications';
import { Calendar, Clock, MapPin, Users, Trash2, RefreshCw, Plus, X, Check, Search, ArrowLeft, LayoutGrid, List, AlertTriangle, ChevronRight, MessageCircle, Mail, Copy, Ban } from 'lucide-react';

interface AdminEvent {
  id: string; title: string; type: string; description: string;
  day: string; month: string; location: string; time: string;
  capacity: number; created_at: string; event_type?: string; event_time?: string;
}

interface EventReg {
  id: string; event_id: string; event_title: string; member_name: string;
  member_email: string; ticket_ref: string; status: string;
  created_at: string; ticket_type: string; ticket_qty: number;
}

interface Props {
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

import { openWhatsApp, openEmail } from '../utils/contactSettings';

const REG_STATUS_OPTIONS = ['pending', 'confirmed', 'active', 'attended', 'cancelled'];

function formatDate(d: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminEventManagement({ showToast }: Props) {
  const [subTab, setSubTab] = useState<'catalogue' | 'registrations'>('catalogue');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Event Management</h2>
        <p className="text-xs text-neutral-500 font-mono">Manage events and fan registrations.</p>
      </div>
      <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-xl p-1 w-fit">
        {[
          { id: 'catalogue' as const, label: 'Catalogue', icon: LayoutGrid },
          { id: 'registrations' as const, label: 'Registrations', icon: List },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all ${
              subTab === tab.id ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
            }`}
          ><tab.icon className="h-3.5 w-3.5" /> {tab.label}</button>
        ))}
      </div>
      {subTab === 'catalogue' ? <CatalogueTab showToast={showToast} /> : <RegistrationsTab showToast={showToast} />}
    </div>
  );
}

function CatalogueTab({ showToast }: Props) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Event', description: '', day: '', month: '', location: '', time: '', capacity: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('admin_events').select('*').order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else if (data) {
      setEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    await supabase.from('admin_events').insert({
      id: `ev-${Date.now()}`, title: form.title, event_type: form.type, description: form.description,
      day: form.day || '1', month: form.month || 'January', location: form.location || 'TBD',
      event_time: form.time || '7:00 PM', capacity: form.capacity || 50, registered: '0',
    });
    setForm({ title: '', type: 'Event', description: '', day: '', month: '', location: '', time: '', capacity: 50 });
    setShowForm(false);
    setSubmitting(false);
    void fetchEvents();
    showToast?.('Event created', 'success');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('admin_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    showToast?.('Event deleted', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={fetchEvents} title="Refresh"
          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
        ><RefreshCw className="h-4 w-4" /></button>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs transition-all uppercase tracking-wider flex items-center gap-1.5"
        ><Plus className="h-3.5 w-3.5" /> New Event</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-white">Create Event</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-900 rounded transition-colors">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event Title"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} placeholder="Type (e.g. Panel)"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
                <input value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) || 0 }))} type="number" placeholder="Capacity"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
              </div>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
              <div className="grid grid-cols-3 gap-3">
                <input value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} placeholder="Month"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
                <input value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))} placeholder="Day"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
                <input value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} placeholder="Time"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
              </div>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Location"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-neutral-600" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.title}
                className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >{submitting ? 'Creating...' : 'Create Event'}</button>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <div key={i} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-neutral-800" />
                <div className="h-6 w-6 rounded bg-neutral-800" />
              </div>
              <div className="h-5 w-48 rounded bg-neutral-800" />
              <div className="h-3 w-full rounded bg-neutral-800" />
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-neutral-800" />
                <div className="h-3 w-36 rounded bg-neutral-800" />
                <div className="h-3 w-44 rounded bg-neutral-800" />
                <div className="h-3 w-32 rounded bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border border-dashed border-red-900/40 rounded-xl bg-red-950/10 space-y-4"
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
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(ev => (
            <div key={ev.id} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20">{ev.event_type || ev.type || 'Event'}</span>
                <div className="flex gap-1.5">
                  {confirmDelete === ev.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleDelete(ev.id)} className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-all">Yes</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] transition-all">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(ev.id)} title="Delete event"
                      className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-red-900/30 hover:border-red-800/30 text-neutral-500 hover:text-red-400 transition-all"
                    ><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
              </div>
              <h3 className="font-serif text-base font-bold text-white tracking-wide">{ev.title}</h3>
              {ev.description && <p className="text-xs text-neutral-500 font-sans leading-relaxed">{ev.description}</p>}
              <div className="space-y-1 text-xs text-neutral-400 font-mono pt-1">
                <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.month} {ev.day}, 2026</p>
                <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.event_time || ev.time}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.location}</p>
                <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> Capacity: {ev.capacity}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
          <Calendar className="h-8 w-8 text-neutral-700 mx-auto" />
          <div>
            <p className="text-sm text-neutral-400 font-bold">No events created yet</p>
            <p className="text-[10px] text-neutral-600 mt-1 font-mono">Click "New Event" to create your first event.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationsTab({ showToast }: Props) {
  const [registrations, setRegistrations] = useState<EventReg[]>([]);
  const [events, setEvents] = useState<{id: string; title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState<EventReg | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [regRes, evRes] = await Promise.all([
      supabase.from('event_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_events').select('id, title').order('title'),
    ]);
    if (regRes.error) {
      setError(regRes.error.message);
      setLoading(false);
      return;
    }
    if (regRes.data) setRegistrations(regRes.data);
    if (evRes.data) setEvents(evRes.data);
    setLoading(false);
  };

  const filtered = registrations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (eventFilter !== 'all' && r.event_id !== eventFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.member_name.toLowerCase().includes(q) || r.member_email.toLowerCase().includes(q) || (r.ticket_ref?.toLowerCase().includes(q));
    }
    return true;
  });

  const openDetail = (r: EventReg) => {
    setSelectedReg(r);
    setEditStatus(r.status);
    setEditDate((r as any).confirmed_date || '');
    setEditTime((r as any).confirmed_time || '');
    setEditLocation((r as any).confirmed_location || '');
    setEditNotes((r as any).admin_notes || '');
  };

  const handleUpdate = async () => {
    if (!selectedReg) return;
    setSaving(true);
    const updates: any = { status: editStatus };
    if (editDate !== undefined) updates.confirmed_date = editDate;
    if (editTime !== undefined) updates.confirmed_time = editTime;
    if (editLocation !== undefined) updates.confirmed_location = editLocation;
    if (editNotes !== undefined) updates.admin_notes = editNotes;
    await supabase.from('event_registrations').update(updates).eq('id', selectedReg.id);
    setRegistrations(prev => prev.map(r => r.id === selectedReg.id ? { ...r, status: editStatus, confirmed_date: editDate, confirmed_time: editTime, confirmed_location: editLocation, admin_notes: editNotes } : r));
    setSaving(false);
    showToast?.('Registration updated!', 'success');

    // Notify the fan
    notifyEventRegistration(selectedReg.user_id, selectedReg.event_title || 'Event', selectedReg.ticket_ref || '');
  };

  const getBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      confirmed: 'bg-gold-500/10 text-gold-500 border-gold-500/20',
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      attended: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || 'bg-neutral-900 text-neutral-400 border-neutral-800';
  };

  if (selectedReg) {
    const r = selectedReg;
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedReg(null)} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Registrations
        </button>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-white">{r.event_title}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${getBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] font-mono text-neutral-500 mt-2">Ticket Ref: {r.ticket_ref}</p>
              <p className="text-[10px] font-mono text-neutral-500">Ticket ID: {r.id}</p>
              <p className="text-[10px] font-mono text-neutral-500">Ticket Type: {r.ticket_type} × {r.ticket_qty}</p>
              <p className="text-[10px] font-mono text-neutral-500">Registered: {formatDate(r.created_at)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Fan Details</h4>
          <div className="text-[11px] space-y-1">
            <p><span className="text-neutral-500">Name:</span> <span className="text-white">{r.member_name}</span></p>
            <p><span className="text-neutral-500">Email:</span> <span className="text-white">{r.member_email}</span></p>
            <p><span className="text-neutral-500">Ticket:</span> <span className="text-white">{r.ticket_type} × {r.ticket_qty}</span></p>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Manage Registration</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40">
                {REG_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Date</label>
              <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} placeholder="e.g. August 15, 2026"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Time</label>
              <input type="text" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="e.g. 7:00 PM EST"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Location</label>
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. The Ryman, Nashville"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Admin Notes</label>
              <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes for the fan..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setSelectedReg(null)}
              className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">Cancel</button>
            <button onClick={handleUpdate} disabled={saving || editStatus === selectedReg.status}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all disabled:opacity-40">
              {saving ? <span className="h-3 w-3 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
              Update
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
          <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {
              setEditStatus('cancelled');
              setEditNotes(`Cancelled by admin — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
              setTimeout(() => handleUpdate(), 0);
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-800/30 bg-red-950/10 text-red-400 hover:bg-red-950/20 text-[10px] font-mono transition-all"
            ><Ban className="h-3 w-3" /> Cancel Registration</button>

            <button onClick={() => {
              const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${r.ticket_ref}\nEvent: ${r.event_title}\nStatus: ${r.status}\n\n--- ADMIN MESSAGE ---\n`;
              openWhatsApp(msg);
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-800/30 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-950/20 text-[10px] font-mono transition-all"
            ><MessageCircle className="h-3 w-3" /> Contact via WhatsApp</button>

            <button onClick={() => {
              const msg = `EVENT REGISTRATION\n\nRegistration Ref: ${r.ticket_ref}\nEvent: ${r.event_title}\nStatus: ${r.status}\n\n--- ADMIN MESSAGE ---\n`;
              openEmail(`Event Registration - ${r.ticket_ref}`, msg, r.member_email);
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-800/30 bg-blue-950/10 text-blue-400 hover:bg-blue-950/20 text-[10px] font-mono transition-all"
            ><Mail className="h-3 w-3" /> Contact via Email</button>

            <button onClick={() => {
              const details = `Registration: ${r.ticket_ref}\nEvent: ${r.event_title}\nFan: ${r.member_name} <${r.member_email}>\nStatus: ${r.status}\nTicket: ${r.ticket_type} × ${r.ticket_qty}\nRegistered: ${r.created_at}`;
              navigator.clipboard.writeText(details).then(() => showToast?.('Copied!', 'success'));
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white text-[10px] font-mono transition-all"
            ><Copy className="h-3 w-3" /> Copy Details</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, ticket..." className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40">
          <option value="all">All Statuses</option>
          {REG_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40">
          <option value="all">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <button onClick={loadData} title="Refresh"
          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
        ><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 rounded bg-neutral-800" />
                    <div className="h-4 w-16 rounded bg-neutral-800" />
                  </div>
                  <div className="h-3 w-48 rounded bg-neutral-800" />
                  <div className="h-3 w-36 rounded bg-neutral-800" />
                </div>
                <div className="h-4 w-4 rounded bg-neutral-800 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border border-dashed border-red-900/40 rounded-xl bg-red-950/10 space-y-4"
        >
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <div>
            <p className="text-sm text-red-400 font-semibold">Failed to load registrations</p>
            <p className="text-[10px] text-red-500/60 mt-1 font-mono">{error}</p>
          </div>
          <button onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-800/30 bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-mono transition-colors"
          ><RefreshCw className="h-3 w-3" /> Try Again</button>
        </motion.div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id}
              onClick={() => openDetail(r)}
              className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-gold-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white group-hover:text-gold-500/80 transition-colors">{r.member_name}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border ${getBadge(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 mt-1">
                    <span>{r.member_email}</span>
                    <span className="text-neutral-700">•</span>
                    <span className="font-mono">{r.ticket_ref}</span>
                  </div>
                  <p className="text-[10px] font-mono text-gold-500/70 mt-0.5">{r.event_title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-gold-500/60 mt-1 shrink-0 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3"
        >
          <Users className="h-8 w-8 text-neutral-700 mx-auto" />
          <div>
            <p className="text-sm text-neutral-400 font-bold">
              {registrations.length === 0 ? 'No registrations yet' : 'No matching registrations'}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1 font-mono">
              {registrations.length === 0
                ? 'Registrations appear when fans sign up for events.'
                : 'Try adjusting your search or filters above.'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
