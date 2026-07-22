import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Image, Film, Search, Trash2, X, CheckCircle, RefreshCw, Loader2,
  Plus, Save, Eye, SortAsc, Edit3, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function AdminMediaLibrary({ showToast }: Props) {
  const [activeMediaSubTab, setActiveMediaSubTab] = useState<'photos' | 'videos'>('photos');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ photos: 0, videos: 0 });
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<string>('sort_order');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editWidth, setEditWidth] = useState<number>(0);
  const [editHeight, setEditHeight] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addUrl, setAddUrl] = useState('');
  const [addYoutubeId, setAddYoutubeId] = useState('');
  const [addDuration, setAddDuration] = useState('');
  const [addWidth, setAddWidth] = useState<number>(400);
  const [addHeight, setAddHeight] = useState<number>(300);
  const [adding, setAdding] = useState(false);

  const catName = (id: number | null) => id ? categories.find(c => c.id === id)?.name || 'Unknown' : 'Uncategorized';

  const fetchAll = async () => {
    setLoading(true);
    const [{ count: pc }, { count: vc }, { data: p }, { data: v }, { data: cats }] = await Promise.all([
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*').order(sortBy === 'created_at' ? 'created_at' : 'sort_order', { ascending: true }),
      supabase.from('videos').select('*').order('sort_order'),
      supabase.from('categories').select('id, name').order('id'),
    ]);
    setStats({ photos: pc ?? 0, videos: vc ?? 0 });
    if (p) setPhotos(p);
    if (v) setVideos(v);
    if (cats) setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [sortBy]);

  const deletePhoto = async (id: string) => {
    await supabase.from('photos').delete().eq('id', id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    setStats(prev => ({ ...prev, photos: prev.photos - 1 }));
    setConfirmDelete(null);
    if (detailItem?.id === id && activeMediaSubTab === 'photos') setDetailItem(null);
    showToast('Photo removed', 'info');
  };

  const deleteVideo = async (id: string) => {
    await supabase.from('videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
    setStats(prev => ({ ...prev, videos: prev.videos - 1 }));
    setConfirmDelete(null);
    if (detailItem?.id === id && activeMediaSubTab === 'videos') setDetailItem(null);
    showToast('Video removed', 'info');
  };

  const openDetail = (item: any, type: 'photos' | 'videos') => {
    setDetailItem({ ...item, _type: type });
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditCategoryId(item.category_id ?? null);
    setEditYoutubeId(item.youtube_id || item.youtubeId || '');
    setEditDuration(item.duration || '');
    setEditUrl(item.url || '');
    setEditWidth(item.width || 0);
    setEditHeight(item.height || 0);
  };

  const saveDetail = async () => {
    if (!detailItem) return;
    setSaving(true);
    const table = detailItem._type === 'photos' ? 'photos' : 'videos';
    const updates: any = { title: editTitle, category_id: editCategoryId };
    if (table === 'photos') {
      updates.description = editDescription;
      updates.url = editUrl;
      updates.width = editWidth;
      updates.height = editHeight;
    } else {
      updates.youtube_id = editYoutubeId;
      updates.duration = editDuration;
    }
    const { error } = await supabase.from(table).update(updates).eq('id', detailItem.id);
    if (error) {
      showToast(`Failed to update: ${error.message}`, 'error');
    } else {
      showToast(`${table === 'photos' ? 'Photo' : 'Video'} updated`, 'success');
      const merged = { ...detailItem, ...updates };
      if (table === 'photos') {
        setPhotos(prev => prev.map(p => p.id === detailItem.id ? { ...p, ...updates } : p));
      } else {
        setVideos(prev => prev.map(v => v.id === detailItem.id ? { ...v, ...updates } : v));
      }
      setDetailItem(merged);
    }
    setSaving(false);
  };

  const nextId = (prefix: string, existing: any[]) => {
    const nums = existing.map(e => {
      const m = e.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
      return m ? parseInt(m[1], 10) : 0;
    }).filter(n => !isNaN(n));
    return `${prefix}-${(Math.max(0, ...nums) + 1).toString()}`;
  };

  const addPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addUrl.trim()) return;
    setAdding(true);
    const newId = nextId('photo', photos);
    const { data, error } = await supabase.from('photos').insert({
      id: newId, title: addTitle.trim(), description: addDescription.trim(),
      category_id: addCategoryId, url: addUrl.trim(),
      width: addWidth, height: addHeight, likes: 0,
    }).select().single();
    if (error) {
      showToast(`Failed to add: ${error.message}`, 'error');
    } else if (data) {
      setPhotos(prev => [data, ...prev]);
      setStats(prev => ({ ...prev, photos: prev.photos + 1 }));
      showToast('Photo added', 'success');
      setShowAddModal(false);
      setAddTitle(''); setAddDescription(''); setAddCategoryId(null); setAddUrl('');
      setAddWidth(400); setAddHeight(300);
    }
    setAdding(false);
  };

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addYoutubeId.trim()) return;
    setAdding(true);
    const newId = nextId('video', videos);
    const { data, error } = await supabase.from('videos').insert({
      id: newId, title: addTitle.trim(), category_id: addCategoryId,
      youtube_id: addYoutubeId.trim(), duration: addDuration.trim() || '0:00',
    }).select().single();
    if (error) {
      showToast(`Failed to add: ${error.message}`, 'error');
    } else if (data) {
      setVideos(prev => [data, ...prev]);
      setStats(prev => ({ ...prev, videos: prev.videos + 1 }));
      showToast('Video added', 'success');
      setShowAddModal(false);
      setAddTitle(''); setAddCategoryId(null); setAddYoutubeId(''); setAddDuration('');
    }
    setAdding(false);
  };

  const filteredPhotos = photos
    .filter(p => {
      const name = catName(p.category_id);
      if (categoryFilter !== 'ALL' && name !== categoryFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title?.localeCompare(b.title);
      if (sortBy === 'likes') return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortBy === 'created_at') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const filteredVideos = videos
    .filter(v => {
      const name = catName(v.category_id);
      if (categoryFilter !== 'ALL' && name !== categoryFilter) return false;
      if (!searchQuery) return true;
      return v.title?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title?.localeCompare(b.title);
      if (sortBy === 'created_at') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const renderDeleteConfirm = (id: string, onConfirm: () => void) => (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
      <span className="text-[8px] font-mono text-red-400 uppercase tracking-wider whitespace-nowrap">Confirm?</span>
      <button onClick={onConfirm}
        className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-400 text-neutral-950 font-bold text-[8px] font-mono uppercase tracking-widest transition-all"
      >Yes</button>
      <button onClick={() => setConfirmDelete(null)}
        className="px-2 py-0.5 rounded border border-neutral-700 text-neutral-400 hover:text-white text-[8px] font-mono uppercase transition-all"
      >No</button>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gold-400 tracking-widest uppercase mb-1">
            <Film className="h-3 w-3" />
            Media Vault
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Media Library</h2>
          <p className="text-xs text-neutral-500 font-mono">Manage photos and videos with full CRUD.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowAddModal(true); setAddTitle(''); setAddDescription(''); setAddCategoryId(null); setAddUrl(''); setAddYoutubeId(''); setAddDuration(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all active:scale-[0.97]"
          ><Plus className="h-3.5 w-3.5" /> Add {activeMediaSubTab === 'photos' ? 'Photo' : 'Video'}</button>
          <button onClick={fetchAll} disabled={loading}
            className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
          ><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Photos', value: stats.photos, icon: Image, color: 'text-sky-400' },
          { label: 'Videos', value: stats.videos, icon: Film, color: 'text-rose-400' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-neutral-900 bg-neutral-950/40 p-3 text-center">
            <s.icon className={`h-4 w-4 ${s.color} mx-auto`} />
            <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tab + filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5 w-fit">
          {[
            { id: 'photos' as const, label: `Photos (${stats.photos})`, icon: Image },
            { id: 'videos' as const, label: `Videos (${stats.videos})`, icon: Film },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveMediaSubTab(tab.id); setSearchQuery(''); setCategoryFilter('ALL'); setDetailItem(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
                activeMediaSubTab === tab.id ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
              }`}
            ><tab.icon className="h-3 w-3" /> {tab.label}</button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input type="text" placeholder={`Search ${activeMediaSubTab}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[10px] text-white font-mono outline-none focus:border-gold-500/40"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
          </select>
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
            <SortAsc className="h-3 w-3 text-neutral-500 ml-1.5" />
            {['sort_order', 'title', 'likes', 'created_at'].filter(s => s !== 'likes' || activeMediaSubTab === 'photos').map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all ${
                  sortBy === s ? 'bg-gold-500/10 text-gold-500 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >{s === 'sort_order' ? 'Order' : s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
      ) : activeMediaSubTab === 'photos' ? (
        /* ── Photos Grid ── */
        filteredPhotos.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <Image className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No photos found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
              <div key={photo.id} className="rounded-xl border border-neutral-900 bg-neutral-950/40 overflow-hidden group hover:border-gold-500/20 transition-all">
                <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden cursor-pointer" onClick={() => openDetail(photo, 'photos')}>
                  {photo.url ? (
                    <img src={photo.url} alt={photo.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Image className="h-8 w-8 text-neutral-700" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-[9px] font-mono">
                      <Eye className="h-3 w-3" /> View
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-white truncate flex-1">{photo.title || 'Untitled'}</h3>
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[7px] font-mono text-neutral-400 uppercase">{catName(photo.category_id)}</span>
                  </div>
                  {photo.description && (
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{photo.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                      <span>{photo.likes ?? 0} likes</span>
                      {photo.width && photo.height && <span>{photo.width}×{photo.height}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(photo, 'photos')}
                        className="p-1 rounded text-neutral-500 hover:text-gold-400 hover:bg-neutral-800 transition-all" title="Edit"
                      ><Edit3 className="h-3.5 w-3.5" /></button>
                      {confirmDelete === photo.id ? renderDeleteConfirm(photo.id, () => deletePhoto(photo.id)) : (
                        <button onClick={() => setConfirmDelete(photo.id)}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all" title="Delete"
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Videos Table ── */
        filteredVideos.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <Film className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No videos found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">YouTube ID</th>
                    <th className="px-3 py-3 font-semibold">Duration</th>
                    <th className="px-3 py-3 font-semibold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredVideos.map(video => (
                    <tr key={video.id} className="hover:bg-neutral-950/40 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                            <Film className="h-3.5 w-3.5 text-rose-400" />
                          </div>
                          <span className="text-white font-semibold text-[11px]">{video.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[8px] font-mono text-neutral-400 uppercase">{catName(video.category_id)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[10px] text-neutral-400">{video.youtube_id || '-'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[10px] text-neutral-400">{video.duration || '-'}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(video, 'videos')}
                            className="p-1.5 rounded text-neutral-500 hover:text-gold-400 hover:bg-neutral-800 transition-all" title="Edit"
                          ><Edit3 className="h-3.5 w-3.5" /></button>
                          {confirmDelete === video.id ? renderDeleteConfirm(video.id, () => deleteVideo(video.id)) : (
                            <button onClick={() => setConfirmDelete(video.id)}
                              className="p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all" title="Delete"
                            ><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Edit / Detail Modal ── */}
      <AnimatePresence>
        {detailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500 uppercase">
                  <Edit3 className="h-3.5 w-3.5 inline mr-1.5" />
                  Edit {detailItem._type === 'photos' ? 'Photo' : 'Video'}
                </span>
                <button onClick={() => setDetailItem(null)} className="p-1 rounded text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Preview */}
                {detailItem._type === 'photos' && detailItem.url && (
                  <div className="rounded-lg border border-neutral-900 overflow-hidden bg-neutral-900 max-h-64 flex items-center justify-center">
                    <img src={detailItem.url} alt="" className="max-w-full max-h-64 object-contain" />
                  </div>
                )}
                {detailItem._type === 'videos' && detailItem.youtube_id && (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-neutral-900 overflow-hidden bg-black aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${detailItem.youtube_id}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video preview"
                      />
                    </div>
                    <a href={`https://youtube.com/watch?v=${detailItem.youtube_id}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-mono text-gold-500 hover:text-gold-400 transition-colors"
                    ><ExternalLink className="h-3 w-3" /> Open on YouTube</a>
                  </div>
                )}

                {/* ID display */}
                <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-600">
                  <span>ID: {detailItem.id}</span>
                  {detailItem.created_at && (
                    <span>· Created: {new Date(detailItem.created_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Title</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Category</label>
                    <select value={editCategoryId ?? ''} onChange={e => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  {detailItem._type === 'photos' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Image URL</label>
                        <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Description</label>
                        <textarea rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Width</label>
                        <input type="number" value={editWidth} onChange={e => setEditWidth(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Height</label>
                        <input type="number" value={editHeight} onChange={e => setEditHeight(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                    </>
                  )}
                  {detailItem._type === 'videos' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">YouTube ID</label>
                        <input type="text" value={editYoutubeId} onChange={e => setEditYoutubeId(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Duration</label>
                        <input type="text" value={editDuration} onChange={e => setEditDuration(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                    </>
                  )}
                </div>

                {detailItem.likes !== undefined && (
                  <div className="text-[9px] font-mono text-neutral-500">
                    Likes: <span className="text-white font-bold">{detailItem.likes}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-neutral-900 flex items-center justify-between">
                <button onClick={() => { setConfirmDelete(detailItem.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                ><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetailItem(null)}
                    className="px-4 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-all"
                  >Cancel</button>
                  <button onClick={saveDetail} disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50"
                  >{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Media Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500 uppercase">
                  <Plus className="h-3.5 w-3.5 inline mr-1.5" />
                  Add {activeMediaSubTab === 'photos' ? 'Photo' : 'Video'}
                </span>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={activeMediaSubTab === 'photos' ? addPhoto : addVideo} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Title *</label>
                  <input type="text" required value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Media title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Category</label>
                    <select value={addCategoryId ?? ''} onChange={e => setAddCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  {activeMediaSubTab === 'photos' ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Image URL *</label>
                      <input type="text" required value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">YouTube ID *</label>
                      <input type="text" required value={addYoutubeId} onChange={e => setAddYoutubeId(e.target.value)} placeholder="e.g. u66sTWpxswM"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                    </div>
                  )}
                </div>
                {activeMediaSubTab === 'photos' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Description</label>
                      <textarea rows={3} value={addDescription} onChange={e => setAddDescription(e.target.value)} placeholder="Photo description..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Width</label>
                        <input type="number" value={addWidth} onChange={e => setAddWidth(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Height</label>
                        <input type="number" value={addHeight} onChange={e => setAddHeight(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Duration</label>
                    <input type="text" value={addDuration} onChange={e => setAddDuration(e.target.value)} placeholder="e.g. 11:42"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-neutral-800 rounded-lg text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-all"
                  >Cancel</button>
                  <button type="submit" disabled={adding}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50"
                  >{adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
