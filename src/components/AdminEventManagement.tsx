import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase';
import { Calendar, Clock, MapPin, Users, Trash2, RefreshCw, Plus, X } from 'lucide-react';

interface AdminEvent {
  id: string; title: string; type: string; description: string;
  day: string; month: string; location: string; time: string;
  capacity: number; created_at: string;
}

interface Props {
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AdminEventManagement({ showToast }: Props) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Event', description: '', day: '', month: '', location: '', time: '', capacity: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_events').select('*').order('created_at', { ascending: false });
    if (data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => { void fetchEvents(); }, []);

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    await supabase.from('admin_events').insert({
      id: `ev-${Date.now()}`, title: form.title, type: form.type, description: form.description,
      day: form.day || '1', month: form.month || 'January', location: form.location || 'TBD',
      time: form.time || '7:00 PM', capacity: form.capacity || 50,
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

  if (loading) return null;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Event Management</h2>
          <p className="text-xs text-neutral-500 font-mono">Create and manage community events.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEvents} title="Refresh"
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
          ><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded-lg text-xs transition-all uppercase tracking-wider flex items-center gap-1.5"
          ><Plus className="h-3.5 w-3.5" /> New Event</button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(ev => (
          <div key={ev.id} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 text-gold-500 text-[8px] font-mono uppercase font-bold border border-gold-800/20">{ev.type}</span>
              <div className="flex gap-1.5">
                <button onClick={() => {}} title={`${ev.title} registrations`}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all"
                ><Users className="h-3 w-3" /></button>
                {confirmDelete === ev.id ? (
                  <div className="flex gap-1 items-center">
                    <button onClick={() => handleDelete(ev.id)}
                      className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-all"
                    >Yes</button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] transition-all"
                    >No</button>
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
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.time}</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> {ev.location}</p>
              <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> Capacity: {ev.capacity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
