import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Experience, ExperienceBooking, TimelineEntry } from '../types';
import {
  Search, Plus, Edit3, Trash2, Copy, Eye, ArrowUp, ArrowDown,
  Check, X, Star, MapPin, Users, Clock,
  Save, FileSpreadsheet, RefreshCw, ChevronRight, ArrowLeft,
  Calendar, MessageCircle, Mail, ExternalLink, Filter,
  LayoutGrid, List,
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const CATEGORIES = [
  'Meet & Greet', 'VIP Meet & Greet', 'Professional Photo Sessions',
  'Private Dinner Experiences', 'Theatre Backstage Tours', 'Script Reading Sessions',
  'Virtual Coffee Chats', 'Charity Experiences', 'Exclusive Q&A Sessions',
  "Women's Leadership Conversations", 'Wellness Experiences', 'Book Discussions',
  'Acting Workshops', 'Theatre Masterclasses', 'Creative Writing Sessions',
  'Film Screenings', 'Mentorship Experiences', 'Fundraising Experiences',
  'Studio Tours', 'Fan Appreciation Experiences',
];

const DEFAULT_FORM: Record<string, any> = {
  title: '', category: 'Meet & Greet', tier: 'Scully', duration: '',
  location: '', price: '', spots: 10, spotsTaken: 0, description: '',
  short_description: '', full_description: '', image: '',
  gallery_images: '', is_virtual: false, max_guests: 10,
  availability: 'Available', booking_requirements: '',
  featured: false, published: true, archived: false, popular: false,
  sort_order: 999, capacity: 'Physical', intensity: '',
};

const BOOKING_STATUS_OPTIONS = ['pending', 'under_review', 'discussion', 'active', 'completed', 'cancelled'];

function formatDate(d: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminExperiences({ showToast }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'catalogue' | 'bookings'>('catalogue');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Experiences</h2>
        <p className="text-xs text-neutral-500 font-mono">Manage the experience catalogue and fan bookings.</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-xl p-1 w-fit">
        {[
          { id: 'catalogue' as const, label: 'Catalogue', icon: LayoutGrid },
          { id: 'bookings' as const, label: 'Bookings', icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all ${
              activeSubTab === tab.id
                ? 'bg-gold-500 text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'catalogue' ? (
        <CatalogueTab showToast={showToast} />
      ) : (
        <BookingsTab showToast={showToast} />
      )}
    </div>
  );
}

function CatalogueTab({ showToast }: Props) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'unpublished' | 'archived'>('all');
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const mapExpFromDb = (e: any): Experience => {
    let extras: any = {};
    try { if (e.details && e.details.length > 0) extras = JSON.parse(e.details[0]); } catch {}
    return {
      id: e.id, title: e.title, category: e.category || 'Meet & Greet', tier: e.tier || 'Gold',
      duration: e.duration, location: e.location, price: e.price || 'Complimentary',
      spots: e.spots || 10, spotsTaken: e.spots_taken || 0, description: e.description,
      short_description: extras.short_description || e.description?.substring(0, 120) || '',
      full_description: extras.full_description || e.description || '',
      details: e.details || [], image: e.image || '',
      gallery_images: extras.gallery_images || e.image || '',
      is_virtual: extras.is_virtual === true || e.capacity?.toLowerCase() === 'virtual',
      max_guests: extras.max_guests || e.spots || 10, availability: extras.availability || 'Available',
      booking_requirements: extras.booking_requirements || e.intensity || '',
      featured: extras.featured === true || e.popular === true, published: extras.published !== false,
      archived: extras.archived === true, popular: e.popular || false,
      sort_order: e.sort_order || 0, capacity: e.capacity || '', intensity: e.intensity || '',
    };
  };

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase.from('experiences').select('*').order('sort_order').order('title');
      if (!error) setExperiences((data || []).map(mapExpFromDb));
    } catch (err) {
      console.error('Failed to load experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExperiences(); }, []);

  const filtered = experiences.filter(e => {
    if (filterPublished === 'published' && (!e.published || e.archived)) return false;
    if (filterPublished === 'unpublished' && (e.published || e.archived)) return false;
    if (filterPublished === 'archived' && !e.archived) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    }
    return true;
  });

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM, sort_order: experiences.length + 1 });
    setEditing(null);
  };

  const openEdit = (exp: Experience) => {
    setForm({ ...DEFAULT_FORM, ...exp, capacity: exp.capacity || (exp.is_virtual ? 'Virtual' : 'Physical') });
    setEditing(exp);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const f = form;
      if (editing) {
        const updates: any = {};
        if (f.title !== undefined) updates.title = f.title;
        if (f.category !== undefined) updates.category = f.category;
        if (f.tier !== undefined) updates.tier = f.tier;
        if (f.duration !== undefined) updates.duration = f.duration;
        if (f.location !== undefined) updates.location = f.location;
        if (f.price !== undefined) updates.price = f.price;
        if (f.spots !== undefined) updates.spots = f.spots;
        if (f.spots_taken !== undefined) updates.spots_taken = f.spots_taken;
        if (f.description !== undefined) updates.description = f.description;
        if (f.image !== undefined) updates.image = f.image;
        if (f.popular !== undefined) updates.popular = f.popular;
        if (f.sort_order !== undefined) updates.sort_order = f.sort_order;
        if (f.capacity !== undefined) updates.capacity = f.capacity;
        if (f.intensity !== undefined) updates.intensity = f.intensity;
        if (f.details !== undefined) updates.details = f.details;
        if (f.published !== undefined || f.archived !== undefined) {
          const { data: current } = await supabase.from('experiences').select('details').eq('id', editing.id).single();
          let details: any = {};
          try { if (current?.details?.length > 0) details = JSON.parse(current.details[0]); } catch {}
          if (f.published !== undefined) details.published = f.published;
          if (f.archived !== undefined) details.archived = f.archived;
          updates.details = [JSON.stringify(details)];
        }
        const { error } = await supabase.from('experiences').update(updates).eq('id', editing.id);
        if (error) throw new Error(error.message);
        showToast('Experience updated!', 'success');
      } else {
        const id = f.id || `exp-${Date.now()}`;
        const detailsArr = [JSON.stringify({
          short_description: f.short_description || '',
          full_description: f.full_description || '',
          gallery_images: f.gallery_images || '',
          is_virtual: f.is_virtual || false,
          max_guests: f.max_guests || 10,
          availability: f.availability || 'Available',
          booking_requirements: f.booking_requirements || '',
          featured: f.featured || false,
          published: f.published !== false,
          archived: f.archived || false,
        })];
        const { error } = await supabase.from('experiences').insert({
          id, title: f.title || 'Untitled', category: f.category || 'Meet & Greet',
          tier: f.tier || 'Gold', duration: f.duration || '', location: f.location || '',
          price: f.price || 'Complimentary', spots: f.spots || 10, spots_taken: f.spots_taken || 0,
          description: f.description || '', details: detailsArr, image: f.image || '',
          popular: f.popular || false, sort_order: f.sort_order || 0,
          capacity: f.capacity || '', intensity: f.intensity || '',
        });
        if (error) throw new Error(error.message);
        showToast('Experience created!', 'success');
      }
      setEditing(null); setForm({ ...DEFAULT_FORM });
      loadExperiences();
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (exp: Experience) => {
    if (!confirm(`Archive "${exp.title}"? Historical bookings preserved.`)) return;
    try {
      const { error } = await supabase.from('experiences').update({ archived: true }).eq('id', exp.id);
      if (error) throw new Error(error.message);
      showToast('Experience archived.', 'info');
      loadExperiences();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDuplicate = async (exp: Experience) => {
    try {
      const { data: orig, error: fetchErr } = await supabase.from('experiences').select('*').eq('id', exp.id).single();
      if (fetchErr) throw new Error(fetchErr.message);
      const newId = `exp-${Date.now()}`;
      const detailsArr = orig.details ? [...orig.details] : [];
      if (detailsArr.length > 0) {
        try { const d = JSON.parse(detailsArr[0]); d.published = false; detailsArr[0] = JSON.stringify(d); } catch {}
      }
      const { error } = await supabase.from('experiences').insert({
        ...orig, id: newId, title: orig.title + ' (Copy)', sort_order: 999, details: detailsArr,
      });
      if (error) throw new Error(error.message);
      showToast('Experience duplicated!', 'success');
      loadExperiences();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const togglePublished = async (exp: Experience) => {
    try {
      const { data: current } = await supabase.from('experiences').select('details').eq('id', exp.id).single();
      let details: any = {};
      try { if (current?.details?.length > 0) details = JSON.parse(current.details[0]); } catch {}
      details.published = !exp.published;
      const { error } = await supabase.from('experiences').update({
        details: [JSON.stringify(details)]
      }).eq('id', exp.id);
      if (error) throw new Error(error.message);
      showToast(exp.published ? 'Unpublished.' : 'Published!', 'success');
      loadExperiences();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const moveOrder = async (id: string, dir: 'up' | 'down') => {
    const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(e => e.id === id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const errors: string[] = [];
    for (const { id: eid, sort_order } of [
      { id: sorted[idx].id, sort_order: sorted[swapIdx].sort_order },
      { id: sorted[swapIdx].id, sort_order: sorted[idx].sort_order },
    ]) {
      const { error } = await supabase.from('experiences').update({ sort_order }).eq('id', eid);
      if (error) errors.push(error.message);
    }
    if (errors.length > 0) showToast('Failed to reorder', 'error');
    else loadExperiences();
  };

  const exportCsv = () => {
    const header = 'Title,Category,Tier,Duration,Location,Price,Spots,SpotsTaken,Published,Featured,Sort Order';
    const rows = experiences.map(e =>
      [e.title, e.category, e.tier, e.duration, e.location, e.price, e.spots, e.spotsTaken, e.published ? 'Yes' : 'No', e.featured ? 'Yes' : 'No', e.sort_order].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiences-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported!', 'success');
  };

  const seedExperiences = async () => {
    try {
      const { default: seedData } = await import('../data/_exp_data.json');
      let count = 0;
      for (const exp of seedData) {
        const detailsArr = [JSON.stringify({
          short_description: exp.description?.substring(0, 120) || '',
          full_description: exp.description || '',
          gallery_images: exp.image || '',
          is_virtual: exp.capacity === 'Virtual',
          max_guests: exp.spots || 10,
          availability: exp.spots - exp.spots_taken > 0 ? 'Available' : 'Fully Booked',
          booking_requirements: exp.intensity || '',
          featured: (exp as any).featured || false,
          published: true, archived: false,
        })];
        const { error } = await supabase.from('experiences').upsert(
          { ...exp, details: detailsArr },
          { onConflict: 'id', ignoreDuplicates: false }
        );
        if (!error) count++;
      }
      showToast(`Seeded ${count} experiences!`, 'success');
      loadExperiences();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (previewId) {
    const exp = experiences.find(e => e.id === previewId);
    if (!exp) return <div className="text-neutral-500">Not found</div>;
    return (
      <div className="space-y-4">
        <button onClick={() => setPreviewId(null)} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors">← Back</button>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-4">
          <div className="relative h-48 rounded-lg overflow-hidden bg-neutral-900">
            {exp.image ? <img src={exp.image} alt={exp.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">No Image</div>}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="font-serif text-xl font-bold text-white">{exp.title}</h2>
              <p className="text-xs text-neutral-400">{exp.category} — {exp.duration}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Location', value: exp.location }, { label: 'Price', value: exp.price },
              { label: 'Spots', value: `${exp.spots - exp.spotsTaken} / ${exp.spots}` }, { label: 'Type', value: exp.is_virtual ? 'Virtual' : 'Physical' },
            ].map(s => (
              <div key={s.label} className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-3">
                <span className="text-[8px] font-mono text-neutral-500 uppercase">{s.label}</span>
                <p className="text-xs font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">{exp.short_description || exp.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={seedExperiences} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">
            <RefreshCw className="h-3.5 w-3.5" /> Seed
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all">
          <Plus className="h-3.5 w-3.5" /> New Experience
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search experiences..." className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
        </div>
        <select value={filterPublished} onChange={e => setFilterPublished(e.target.value as any)}
          className="bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40">
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-[10px] font-mono text-neutral-500">{filtered.length} experience{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Edit/Create Form */}
      {(editing || form.title) && (
        <div className="rounded-xl border border-gold-500/20 bg-neutral-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">
              {editing ? `Edit: ${editing.title}` : 'New Experience'}
            </h3>
            <button onClick={() => { setEditing(null); setForm({ ...DEFAULT_FORM }); }} className="text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Tier</label>
              <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40">
                <option value="Scully">Scully</option><option value="Gibson">Gibson</option><option value="Milburn">Milburn</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 Hours"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. London, UK"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Price</label>
              <input type="text" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. $2,500"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Type</label>
              <select value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value, is_virtual: e.target.value === 'Virtual' })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40">
                <option value="Physical">Physical</option><option value="Virtual">Virtual</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Spots</label>
              <input type="number" min={1} value={form.spots} onChange={e => setForm({ ...form, spots: parseInt(e.target.value) || 1 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Max Guests</label>
              <input type="number" min={1} value={form.max_guests} onChange={e => setForm({ ...form, max_guests: parseInt(e.target.value) || 1 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Image URL</label>
              <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Gallery Images (comma-separated URLs)</label>
              <input type="text" value={form.gallery_images} onChange={e => setForm({ ...form, gallery_images: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Short Description</label>
              <textarea rows={2} value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Full Description</label>
              <textarea rows={4} value={form.full_description} onChange={e => setForm({ ...form, full_description: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Booking Requirements</label>
              <textarea rows={2} value={form.booking_requirements} onChange={e => setForm({ ...form, booking_requirements: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-gold-500 h-3.5 w-3.5" />
              <span className="text-[10px] font-mono text-neutral-400">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="accent-gold-500 h-3.5 w-3.5" />
              <span className="text-[10px] font-mono text-neutral-400">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={e => setForm({ ...form, popular: e.target.checked })} className="accent-gold-500 h-3.5 w-3.5" />
              <span className="text-[10px] font-mono text-neutral-400">Popular</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setEditing(null); setForm({ ...DEFAULT_FORM }); }}
              className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all disabled:opacity-40">
              {saving ? <span className="h-3 w-3 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> : <Save className="h-3 w-3" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20"><div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.sort((a, b) => a.sort_order - b.sort_order).map(exp => (
            <div key={exp.id} className={`rounded-xl border bg-neutral-950/40 overflow-hidden group transition-all hover:border-gold-500/20 ${exp.archived ? 'border-neutral-900/40 opacity-60' : 'border-neutral-900'}`}>
              <div className="relative h-28 bg-neutral-900/60 overflow-hidden">
                {exp.image ? (
                  <img src={exp.image} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Star className="h-6 w-6 text-neutral-700" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {exp.featured && <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase bg-gold-500/10 border border-gold-500/20 text-gold-500">Featured</span>}
                  {exp.is_virtual && <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400">Virtual</span>}
                  {!exp.published && <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">Draft</span>}
                  {exp.archived && <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase bg-red-500/10 border border-red-500/20 text-red-400">Archived</span>}
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-1.5 py-0.5 rounded text-[7px] font-mono uppercase bg-neutral-900/80 border border-neutral-800 text-neutral-400">{exp.category}</span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">{exp.title}</h3>
                <p className="text-[9px] font-mono text-neutral-500">{exp.duration} — {exp.price}</p>
                <div className="flex items-center gap-1.5 text-[8px] text-neutral-500">
                  <MapPin className="h-2.5 w-2.5" />{exp.location}
                  <Users className="h-2.5 w-2.5 ml-1" />{exp.spots - exp.spotsTaken}/{exp.spots}
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-neutral-900/60">
                  <button onClick={() => openEdit(exp)} className="p-1 rounded text-neutral-500 hover:text-gold-500 hover:bg-gold-500/5 transition-all" title="Edit"><Edit3 className="h-3 w-3" /></button>
                  <button onClick={() => togglePublished(exp)} className="p-1 rounded text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all" title={exp.published ? 'Unpublish' : 'Publish'}>
                    {exp.published ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </button>
                  <button onClick={() => handleDuplicate(exp)} className="p-1 rounded text-neutral-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all" title="Duplicate"><Copy className="h-3 w-3" /></button>
                  <button onClick={() => setPreviewId(exp.id)} className="p-1 rounded text-neutral-500 hover:text-purple-400 hover:bg-purple-500/5 transition-all" title="Preview"><Eye className="h-3 w-3" /></button>
                  <button onClick={() => moveOrder(exp.id, 'up')} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all" title="Move Up"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => moveOrder(exp.id, 'down')} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all" title="Move Down"><ArrowDown className="h-3 w-3" /></button>
                  <button onClick={() => handleArchive(exp)} className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all ml-auto" title="Archive"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl">
          <p className="text-sm text-neutral-500">No experiences found.</p>
          <button onClick={openCreate} className="mt-3 text-xs text-gold-500 hover:text-gold-400 font-mono">Create your first experience</button>
        </div>
      )}
    </div>
  );
}

function BookingsTab({ showToast }: Props) {
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<ExperienceBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [experiences, setExperiences] = useState<Record<string, any>>({});

  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editVirtualLink, setEditVirtualLink] = useState('');
  const [editDressCode, setEditDressCode] = useState('');
  const [editArrival, setEditArrival] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCancelReason, setEditCancelReason] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBookings(); loadExperiences(); }, []);

  const mapBooking = (r: any): ExperienceBooking => ({
    id: r.id, experienceId: r.experience_id || '', experienceTitle: r.experience_title || '',
    bookingReference: r.booking_reference || r.id, fullName: r.full_name || '',
    email: r.email || '', phone: r.phone || '', country: r.country || '',
    preferredDate: r.preferred_date || '', preferredTime: r.preferred_time || '',
    participants: r.participants || 1, specialRequests: r.special_requests || '',
    communicationMethod: r.communication_method || 'email', status: r.status || 'pending',
    confirmedDate: r.confirmed_date || '', confirmedTime: r.confirmed_time || '',
    confirmedLocation: r.confirmed_location || '', meetingVenue: r.meeting_venue || '',
    virtualLink: r.virtual_link || '', dressCode: r.dress_code || '',
    arrivalInstructions: r.arrival_instructions || '', adminNotes: r.admin_notes || '',
    cancelledReason: r.cancelled_reason || '', submittedDate: r.submitted_date || '',
    createdAt: r.created_at || '', userId: r.user_id || '', timeline: [],
  });

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase.from('experience_requests').select('*').order('created_at', { ascending: false });
      if (!error) setBookings((data || []).map(mapBooking));
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase.from('experiences').select('*');
      if (!error) {
        const map: Record<string, any> = {};
        (data || []).forEach((e: any) => { map[e.id] = e; });
        setExperiences(map);
      }
    } catch {}
  };

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const exp = experiences[b.experienceId];
      return (b.fullName && b.fullName.toLowerCase().includes(q)) ||
        (b.bookingReference && b.bookingReference.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (exp?.title?.toLowerCase().includes(q));
    }
    return true;
  });

  const openDetail = (b: ExperienceBooking) => {
    setSelectedBooking(b);
    setEditStatus(b.status);
    setEditDate(b.confirmedDate || '');
    setEditTime(b.confirmedTime || '');
    setEditVenue(b.meetingVenue || '');
    setEditVirtualLink(b.virtualLink || '');
    setEditDressCode(b.dressCode || '');
    setEditArrival(b.arrivalInstructions || '');
    setEditNotes(b.adminNotes || '');
    setEditCancelReason(b.cancelledReason || '');
    setEditLocation(b.confirmedLocation || '');
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (editStatus) updates.status = editStatus;
      if (editDate !== undefined) updates.confirmed_date = editDate;
      if (editTime !== undefined) updates.confirmed_time = editTime;
      if (editVenue !== undefined) updates.meeting_venue = editVenue;
      if (editVirtualLink !== undefined) updates.virtual_link = editVirtualLink;
      if (editDressCode !== undefined) updates.dress_code = editDressCode;
      if (editArrival !== undefined) updates.arrival_instructions = editArrival;
      if (editNotes !== undefined) updates.admin_notes = editNotes;
      if (editCancelReason !== undefined) updates.cancelled_reason = editCancelReason;
      if (editLocation !== undefined) updates.confirmed_location = editLocation;

      const timelineEvents: any[] = [];
      if (editStatus !== selectedBooking!.status) {
        timelineEvents.push({ event: `Status changed to ${editStatus}`, status: editStatus, note: `Administrator updated status from ${selectedBooking!.status} to ${editStatus}.` });
      }
      if (editDate && editDate !== selectedBooking!.confirmedDate) {
        timelineEvents.push({ event: 'Confirmed date updated', status: editStatus, note: `Confirmed date set to ${editDate}.` });
      }
      if (timelineEvents.length > 0) {
        const { data: current } = await supabase.from('experience_requests').select('timeline').eq('id', selectedBooking!.id).single();
        let existingTimeline: any[] = [];
        try {
          const raw = current?.timeline;
          if (raw) {
            if (typeof raw === 'string') existingTimeline = JSON.parse(raw);
            else if (Array.isArray(raw)) existingTimeline = raw;
            else if (typeof raw === 'object') existingTimeline = [raw];
          }
        } catch {}
        if (!Array.isArray(existingTimeline)) existingTimeline = [];
        existingTimeline.push({
          event: timelineEvents[timelineEvents.length - 1].event || '',
          date: new Date().toISOString(),
          status: editStatus,
          note: timelineEvents[timelineEvents.length - 1].note || '',
        });
        updates.timeline = JSON.stringify(existingTimeline);
      }

      const { error } = await supabase.from('experience_requests').update(updates).eq('id', selectedBooking!.id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Booking updated!', 'success');
        loadBookings();
      }
    } catch (err) {
      showToast('Failed to update booking.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = 'Reference,Fan Name,Experience,Email,Phone,Country,Date,Status,Method,Submitted';
    const rows = bookings.map(b => {
      const expTitle = experiences[b.experienceId]?.title || b.experienceTitle;
      return [b.bookingReference, b.fullName, expTitle, b.email, b.phone, b.country, b.preferredDate, b.status, b.communicationMethod, b.submittedDate || b.createdAt].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported!', 'success');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      under_review: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      discussion: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || 'bg-neutral-900 text-neutral-400 border-neutral-800';
  };

  if (selectedBooking) {
    const b = selectedBooking;
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-500 hover:text-gold-500 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Bookings
        </button>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg font-bold text-white">{experiences[b.experienceId]?.title || b.experienceTitle}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${getStatusBadge(b.status)}`}>{b.status}</span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-1">Ref: {b.bookingReference} | ID: {b.id}</p>
              <p className="text-[10px] font-mono text-neutral-500">Submitted: {formatDate(b.submittedDate || b.createdAt)}</p>
              <p className="text-[10px] font-mono text-neutral-500">{b.fullName} — {b.email}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
          <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Update Booking</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40">
                {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Date</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Time</label>
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Meeting Venue</label>
              <input type="text" value={editVenue} onChange={e => setEditVenue(e.target.value)} placeholder="e.g. The Ritz London"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Virtual Link</label>
              <input type="text" value={editVirtualLink} onChange={e => setEditVirtualLink(e.target.value)} placeholder="e.g. https://zoom.us/j/..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Dress Code</label>
              <input type="text" value={editDressCode} onChange={e => setEditDressCode(e.target.value)} placeholder="e.g. Black tie"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Confirmed Location</label>
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. London, UK"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Arrival Instructions</label>
              <input type="text" value={editArrival} onChange={e => setEditArrival(e.target.value)} placeholder="e.g. Enter through the main lobby..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">Admin Notes</label>
            <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none" />
          </div>
          {editStatus === 'cancelled' && (
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-red-400 uppercase tracking-wider">Cancellation Reason *</label>
              <input type="text" value={editCancelReason} onChange={e => setEditCancelReason(e.target.value)} required
                className="w-full bg-neutral-900 border border-red-900/50 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-red-500/40" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">Cancel</button>
            <button onClick={handleUpdate} disabled={saving || (editStatus === 'cancelled' && !editCancelReason.trim())}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase transition-all disabled:opacity-40">
              {saving ? <span className="h-3 w-3 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
              Update
            </button>
          </div>
        </div>
        {b.timeline && b.timeline.length > 0 && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-3">
            <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Activity Timeline</h4>
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
                    <p className="text-[8px] font-mono text-neutral-600 mt-0.5">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-1.5 text-[11px]">
            <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider font-bold">Fan Details</h5>
            <p><span className="text-neutral-500">Name:</span> <span className="text-white">{b.fullName}</span></p>
            <p><span className="text-neutral-500">Email:</span> <span className="text-white">{b.email}</span></p>
            <p><span className="text-neutral-500">Phone:</span> <span className="text-white">{b.phone || 'N/A'}</span></p>
            <p><span className="text-neutral-500">Country:</span> <span className="text-white">{b.country}</span></p>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-1.5 text-[11px]">
            <h5 className="text-[9px] font-mono text-gold-500 uppercase tracking-wider font-bold">Booking Details</h5>
            <p className="capitalize"><span className="text-neutral-500">Method:</span> <span className="text-white">{b.communicationMethod}</span></p>
            <p><span className="text-neutral-500">Guests:</span> <span className="text-white">{b.participants}</span></p>
            <p><span className="text-neutral-500">Pref. Date:</span> <span className="text-white">{b.preferredDate} {b.preferredTime}</span></p>
            {b.specialRequests && <div className="pt-1 border-t border-neutral-900/60 mt-1"><span className="text-neutral-500">Requests:</span><p className="text-white mt-0.5">{b.specialRequests}</p></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono transition-all">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by fan, reference, experience..." className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40">
          <option value="all">All Status</option>
          {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="text-center py-20"><div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length > 0 ? (
        <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[9px] uppercase">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Fan</th>
                  <th className="px-4 py-3 font-semibold">Experience</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/40">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-neutral-950/30 transition-all">
                    <td className="px-4 py-3.5 font-mono font-semibold text-neutral-300">{b.bookingReference}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-white">{b.fullName}</span>
                      <span className="block text-[9px] text-neutral-500">{b.email}</span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-300">{experiences[b.experienceId]?.title || b.experienceTitle}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getStatusBadge(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 capitalize">{b.communicationMethod}</td>
                    <td className="px-4 py-3.5 text-neutral-500 font-mono">{formatDate(b.submittedDate || b.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => openDetail(b)} className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9px] font-mono text-neutral-300 rounded hover:text-white transition-colors">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl">
          <p className="text-sm text-neutral-500">No bookings found.</p>
        </div>
      )}
    </div>
  );
}
