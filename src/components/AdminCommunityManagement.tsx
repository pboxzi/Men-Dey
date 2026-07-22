import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Users, MessageSquare, Heart, FileText, Trash2, Search, RefreshCw,
  Loader2, Globe, Palette, Mail, Compass, Star, Filter, X, CheckCircle, Clock, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function AdminCommunityManagement({ showToast }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'discussions' | 'fancreations'>('posts');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, comments: 0, discussions: 0, replies: 0, fanCreations: 0 });

  const [posts, setPosts] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [fanCreations, setFanCreations] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [
      { count: pc }, { count: cc }, { count: dc }, { count: drc }, { count: fc },
      { data: p }, { data: d }, { data: f },
    ] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('discussions').select('*', { count: 'exact', head: true }),
      supabase.from('discussion_replies').select('*', { count: 'exact', head: true }),
      supabase.from('fan_creations').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('discussions').select('*').order('created_at', { ascending: false }),
      supabase.from('fan_creations').select('*').order('created_at', { ascending: false }),
    ]);
    setStats({
      posts: pc ?? 0, comments: cc ?? 0, discussions: dc ?? 0,
      replies: drc ?? 0, fanCreations: fc ?? 0,
    });
    if (p) setPosts(p);
    if (d) setDiscussions(d);
    if (f) setFanCreations(f);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
    setConfirmDelete(null);
    showToast('Post removed', 'info');
  };

  const deleteDiscussion = async (id: string) => {
    await supabase.from('discussion_replies').delete().eq('discussion_id', id);
    await supabase.from('discussions').delete().eq('id', id);
    setDiscussions(prev => prev.filter(d => d.id !== id));
    setStats(prev => ({ ...prev, discussions: prev.discussions - 1 }));
    setConfirmDelete(null);
    showToast('Discussion removed', 'info');
  };

  const deleteFanCreation = async (id: string) => {
    await supabase.from('fan_creations').delete().eq('id', id);
    setFanCreations(prev => prev.filter(f => f.id !== id));
    setStats(prev => ({ ...prev, fanCreations: prev.fanCreations - 1 }));
    setConfirmDelete(null);
    showToast('Fan work removed', 'info');
  };

  const categories = ['ALL', 'FAN ART', 'LETTERS', 'ENCOUNTERS'];
  const countries = ['ALL', 'Global', 'USA', 'Canada', 'UK', 'Australia', 'New Zealand', 'Japan', 'Germany', 'Brazil', 'France', 'India', 'Mexico', 'South Africa', 'South Korea', 'Italy', 'Spain', 'Argentina', 'Philippines', 'Singapore', 'Ireland', 'Netherlands'];

  const filteredPosts = posts.filter(p => {
    if (filterCategory !== 'ALL' && (p.category || 'FAN ART') !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.username?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredDiscussions = discussions.filter(d => {
    if (filterCountry !== 'ALL' && d.country !== filterCountry) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.author?.toLowerCase().includes(q) || d.text?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredFanCreations = fanCreations.filter(f => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return f.title?.toLowerCase().includes(q) || f.author?.toLowerCase().includes(q);
    }
    return true;
  });

  const getCategoryStyle = (cat: string) => {
    if (cat === 'FAN ART') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (cat === 'LETTERS') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (cat === 'ENCOUNTERS') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-neutral-900 text-neutral-500 border-neutral-800';
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'FAN ART') return <Palette className="h-3 w-3" />;
    if (cat === 'LETTERS') return <Mail className="h-3 w-3" />;
    if (cat === 'ENCOUNTERS') return <Compass className="h-3 w-3" />;
    return <Star className="h-3 w-3" />;
  };

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
            <Sparkles className="h-3 w-3" />
            Community Care
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Community Management</h2>
          <p className="text-xs text-neutral-500 font-mono">Gently moderate and nurture all community content.</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Stories', value: stats.posts, icon: FileText, color: 'text-gold-500' },
          { label: 'Kind Words', value: stats.comments, icon: MessageSquare, color: 'text-emerald-400' },
          { label: 'Club Talks', value: stats.discussions, icon: Users, color: 'text-amber-400' },
          { label: 'Replies', value: stats.replies, icon: Heart, color: 'text-red-400' },
          { label: 'Fan Works', value: stats.fanCreations, icon: Star, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-neutral-900 bg-neutral-950/40 p-3 text-center">
            <s.icon className={`h-4 w-4 ${s.color} mx-auto`} />
            <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5 w-fit">
        {[
          { id: 'posts' as const, label: 'Stories', icon: FileText },
          { id: 'discussions' as const, label: 'Club Talks', icon: Users },
          { id: 'fancreations' as const, label: 'Fan Works', icon: Star },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); setSearchQuery(''); setFilterCategory('ALL'); setFilterCountry('ALL'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
              activeSubTab === tab.id ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon className="h-3 w-3" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
        </div>
        {activeSubTab === 'posts' && (
          <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 ${
                  filterCategory === cat ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? <Filter className="h-2.5 w-2.5" /> : getCategoryIcon(cat)}
                {cat === 'ALL' ? 'All' : cat === 'FAN ART' ? 'Art' : cat === 'LETTERS' ? 'Letters' : 'Stories'}
              </button>
            ))}
          </div>
        )}
        {activeSubTab === 'discussions' && (
          <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5 overflow-x-auto max-w-md">
            {['ALL', 'Global', 'USA', 'UK', 'Canada', 'Australia', 'Japan', 'Germany'].map(c => (
              <button key={c} onClick={() => setFilterCountry(c)}
                className={`px-2 py-1 rounded text-[9px] font-mono tracking-wider uppercase whitespace-nowrap transition-all ${
                  filterCountry === c ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >{c}</button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
      ) : activeSubTab === 'posts' ? (
        /* ── POSTS TABLE ── */
        filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No stories found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold w-8"></th>
                    <th className="px-3 py-3 font-semibold">Author</th>
                    <th className="px-3 py-3 font-semibold">Content</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold text-center">Hearts</th>
                    <th className="px-3 py-3 font-semibold text-center">Replies</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredPosts.map(post => (
                    <tr key={post.id} className="hover:bg-neutral-950/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-mono font-medium text-gold-500">
                          {post.avatar_text || post.username?.slice(0, 2).toUpperCase() || '?'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-white font-semibold text-[11px] truncate max-w-[120px]">{post.username}</p>
                        <p className="text-[8px] font-mono text-neutral-500 truncate max-w-[120px]">{post.handle}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-neutral-300 text-[11px] line-clamp-2 max-w-[250px]">{post.content}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getCategoryStyle(post.category || 'FAN ART')}`}>
                          {getCategoryIcon(post.category || 'FAN ART')}
                          {post.category || 'FAN ART'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-neutral-400">{post.likes}</td>
                      <td className="px-3 py-3 text-center font-mono text-neutral-400">{post.replies_count || 0}</td>
                      <td className="px-3 py-3 font-mono text-neutral-500 text-[10px]">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {confirmDelete === post.id ? renderDeleteConfirm(post.id, () => deletePost(post.id)) : (
                          <button onClick={() => setConfirmDelete(post.id)}
                            className="text-red-500/50 hover:text-red-400 transition-colors"
                            title="Remove story"
                          ><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeSubTab === 'discussions' ? (
        /* ── DISCUSSIONS TABLE ── */
        filteredDiscussions.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <Globe className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No club talks found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold">Author</th>
                    <th className="px-3 py-3 font-semibold">Text</th>
                    <th className="px-3 py-3 font-semibold">Club</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredDiscussions.map(disc => (
                    <tr key={disc.id} className="hover:bg-neutral-950/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-mono font-medium text-amber-400">
                            {disc.author?.slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <span className="text-white font-semibold text-[11px]">{disc.author}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-neutral-300 text-[11px] line-clamp-2 max-w-[300px]">{disc.text}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border border-blue-500/20 bg-blue-500/10 text-blue-400">
                          <Globe className="h-2.5 w-2.5" /> {disc.country}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-neutral-500 text-[10px]">
                        {disc.created_at ? new Date(disc.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {confirmDelete === disc.id ? renderDeleteConfirm(disc.id, () => deleteDiscussion(disc.id)) : (
                          <button onClick={() => setConfirmDelete(disc.id)}
                            className="text-red-500/50 hover:text-red-400 transition-colors"
                            title="Remove discussion"
                          ><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ── FAN CREATIONS TABLE ── */
        filteredFanCreations.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <Star className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No fan works found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold">Creator</th>
                    <th className="px-3 py-3 font-semibold">Title</th>
                    <th className="px-3 py-3 font-semibold">Description</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold text-center">Likes</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredFanCreations.map(fc => (
                    <tr key={fc.id} className="hover:bg-neutral-950/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-mono font-medium text-purple-400">
                            {fc.author?.slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <span className="text-white font-semibold text-[11px]">{fc.author}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-white font-semibold text-[11px] truncate max-w-[150px]">{fc.title}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-neutral-300 text-[11px] line-clamp-2 max-w-[200px]">{fc.description}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                          getCategoryStyle(fc.category || 'Fan Art')
                        }`}>
                          {fc.category || 'Fan Art'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-neutral-400">{fc.likes || 0}</td>
                      <td className="px-3 py-3 font-mono text-neutral-500 text-[10px]">
                        {fc.created_at ? new Date(fc.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {confirmDelete === fc.id ? renderDeleteConfirm(fc.id, () => deleteFanCreation(fc.id)) : (
                          <button onClick={() => setConfirmDelete(fc.id)}
                            className="text-red-500/50 hover:text-red-400 transition-colors"
                            title="Remove fan work"
                          ><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
