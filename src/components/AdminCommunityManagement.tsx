import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Users, MessageSquare, Heart, FileText, Trash2, Search, RefreshCw,
  Loader2, Globe, Palette, Mail, Compass, Star, Filter, X, CheckCircle, Clock, User, Sparkles,
  Pin, Flag, Eye, MessageCircle, ShieldAlert
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
  const [comments, setComments] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [fanCreations, setFanCreations] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Detail modal
  const [detailPost, setDetailPost] = useState<any | null>(null);
  const [detailComments, setDetailComments] = useState<any[]>([]);
  const [adminCommentText, setAdminCommentText] = useState('');
  const [flagReason, setFlagReason] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [
      { count: pc }, { count: cc }, { count: dc }, { count: drc }, { count: fc },
      { data: p }, { data: cm }, { data: d }, { data: f },
    ] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('discussions').select('*', { count: 'exact', head: true }),
      supabase.from('discussion_replies').select('*', { count: 'exact', head: true }),
      supabase.from('fan_creations').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('comments').select('*').order('created_at'),
      supabase.from('discussions').select('*').order('created_at', { ascending: false }),
      supabase.from('fan_creations').select('*').order('created_at', { ascending: false }),
    ]);
    setStats({
      posts: pc ?? 0, comments: cc ?? 0, discussions: dc ?? 0,
      replies: drc ?? 0, fanCreations: fc ?? 0,
    });
    if (p) setPosts(p);
    if (cm) setComments(cm);
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
    if (detailPost?.id === id) setDetailPost(null);
    showToast('Story removed', 'info');
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

  const togglePin = async (id: string, current: boolean) => {
    const { error } = await supabase.from('posts').update({ pinned: !current }).eq('id', id);
    if (error) { showToast('Failed to pin', 'error'); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !current } : p));
    if (detailPost?.id === id) setDetailPost(prev => prev ? { ...prev, pinned: !current } : null);
    showToast(current ? 'Unpinned' : 'Pinned to top', 'success');
  };

  const toggleFlag = async (id: string, reason: string) => {
    const post = posts.find(p => p.id === id);
    const newFlagged = !post?.flagged;
    const { error } = await supabase.from('posts').update({
      flagged: newFlagged,
      flag_reason: newFlagged ? reason : '',
    }).eq('id', id);
    if (error) { showToast('Failed to update flag', 'error'); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, flagged: newFlagged, flag_reason: newFlagged ? reason : '' } : p));
    if (detailPost?.id === id) setDetailPost(prev => prev ? { ...prev, flagged: newFlagged, flag_reason: newFlagged ? reason : '' } : null);
    showToast(newFlagged ? 'Flagged for review' : 'Flag removed', 'info');
    setFlagReason('');
  };

  const adminComment = async (postId: string) => {
    if (!adminCommentText.trim()) return;
    const id = `admin-cmt-${Date.now()}`;
    const { error } = await supabase.from('comments').insert({
      id, post_id: postId, username: 'Management', avatar_text: 'MG', content: `[Admin] ${adminCommentText.trim()}`,
    });
    if (error) { showToast('Failed to post', 'error'); return; }
    const { data: post } = await supabase.from('posts').select('replies_count').eq('id', postId).single();
    if (post) {
      await supabase.from('posts').update({ replies_count: (post.replies_count || 0) + 1 }).eq('id', postId);
    }
    setDetailComments(prev => [...prev, {
      id, post_id: postId, username: 'Management', avatar_text: 'MG', content: `[Admin] ${adminCommentText.trim()}`, created_at: new Date().toISOString(),
    }]);
    setAdminCommentText('');
    showToast('Admin comment posted', 'success');
  };

  const openDetail = async (post: any) => {
    setDetailPost(post);
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at');
    setDetailComments(data || []);
  };

  const getPostComments = (postId: string) => comments
    .filter(c => c.post_id === postId && !c.parent_comment_id)
    .map(c => ({
      ...c,
      replies: comments.filter((r: any) => r.parent_comment_id === c.id),
    }));

  const categories = ['ALL', 'FAN ART', 'LETTERS', 'ENCOUNTERS'];
  const countries = ['ALL', 'Global', 'USA', 'Canada', 'UK', 'Australia', 'New Zealand', 'Japan', 'Germany', 'Brazil', 'France', 'India', 'Mexico', 'South Africa', 'South Korea', 'Italy', 'Spain', 'Argentina', 'Philippines', 'Singapore', 'Ireland', 'Netherlands'];

  let filteredPosts = posts.filter(p => {
    if (showFlaggedOnly && !p.flagged) return false;
    if (filterCategory !== 'ALL' && (p.category || 'FAN ART') !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.username?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q);
    }
    return true;
  });
  // Sort: pinned first, then by date desc
  filteredPosts = filteredPosts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
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

  const flaggedCount = posts.filter(p => p.flagged).length;
  const pinnedCount = posts.filter(p => p.pinned).length;

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
          <p className="text-xs text-neutral-500 font-mono">Moderate, pin, flag, and nurture all community content.</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-7 gap-3">
        {[
          { label: 'Stories', value: stats.posts, icon: FileText, color: 'text-gold-500' },
          { label: 'Kind Words', value: stats.comments, icon: MessageSquare, color: 'text-emerald-400' },
          { label: 'Club Talks', value: stats.discussions, icon: Users, color: 'text-amber-400' },
          { label: 'Replies', value: stats.replies, icon: Heart, color: 'text-red-400' },
          { label: 'Fan Works', value: stats.fanCreations, icon: Star, color: 'text-purple-400' },
          { label: 'Pinned', value: pinnedCount, icon: Pin, color: 'text-sky-400' },
          { label: 'Flagged', value: flaggedCount, icon: Flag, color: 'text-rose-400' },
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
          <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); setSearchQuery(''); setFilterCategory('ALL'); setFilterCountry('ALL'); setShowFlaggedOnly(false); }}
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
            <button onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`px-2.5 py-1 rounded text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 ${
                showFlaggedOnly ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Flag className="h-2.5 w-2.5" /> Flagged {flaggedCount > 0 && `(${flaggedCount})`}
            </button>
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
            <p className="text-sm text-neutral-500">{showFlaggedOnly ? 'No flagged stories found.' : 'No stories found.'}</p>
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
                    <th className="px-3 py-3 font-semibold text-left">Tags</th>
                    <th className="px-3 py-3 font-semibold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredPosts.map(post => (
                    <tr key={post.id} className={`hover:bg-neutral-950/20 transition-all ${post.pinned ? 'bg-sky-500/5' : ''} ${post.flagged ? 'bg-rose-500/5' : ''}`}>
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
                        <button onClick={() => openDetail(post)}
                          className="text-neutral-300 text-[11px] line-clamp-2 max-w-[220px] text-left hover:text-gold-400 transition-colors cursor-pointer"
                        >{post.content}</button>
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
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {post.pinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              <Pin className="h-2 w-2" /> Pinned
                            </span>
                          )}
                          {post.flagged && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20" title={post.flag_reason || 'Flagged'}>
                              <Flag className="h-2 w-2" /> Flagged
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(post)}
                            className="p-1.5 rounded text-neutral-500 hover:text-sky-400 hover:bg-neutral-800 transition-all" title="View details"
                          ><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => togglePin(post.id, post.pinned)}
                            className={`p-1.5 rounded transition-all ${post.pinned ? 'text-sky-400 bg-sky-500/10' : 'text-neutral-500 hover:text-sky-400 hover:bg-neutral-800'}`}
                            title={post.pinned ? 'Unpin' : 'Pin to top'}
                          ><Pin className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setDetailPost(post); setFlagReason(post.flag_reason || ''); }}
                            className={`p-1.5 rounded transition-all ${post.flagged ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'}`}
                            title={post.flagged ? 'Remove flag' : 'Flag as inappropriate'}
                          ><Flag className="h-3.5 w-3.5" /></button>
                          {confirmDelete === post.id ? renderDeleteConfirm(post.id, () => deletePost(post.id)) : (
                            <button onClick={() => setConfirmDelete(post.id)}
                              className="p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all" title="Remove story"
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

      {/* ── POST DETAIL MODAL ── */}
      <AnimatePresence>
        {detailPost && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-[#0a0a0c] p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sm font-mono font-medium text-gold-500">
                    {detailPost.avatar_text || detailPost.username?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{detailPost.username}</p>
                    <p className="text-[10px] font-mono text-neutral-500">{detailPost.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePin(detailPost.id, detailPost.pinned)}
                    className={`p-2 rounded-lg transition-all ${detailPost.pinned ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'bg-neutral-900 text-neutral-500 hover:text-sky-400 hover:bg-neutral-800 border border-neutral-800'}`}
                    title={detailPost.pinned ? 'Unpin' : 'Pin'}
                  ><Pin className="h-4 w-4" /></button>
                  {detailPost.flagged ? (
                    <button onClick={() => toggleFlag(detailPost.id, '')}
                      className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 transition-all"
                      title="Remove flag"
                    ><Flag className="h-4 w-4" /></button>
                  ) : (
                    <div className="relative group">
                      <button className="p-2 rounded-lg bg-neutral-900 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 border border-neutral-800 transition-all"
                        title="Flag"
                      ><Flag className="h-4 w-4" /></button>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-[#0c0c0e] border border-neutral-800 rounded-xl p-3 shadow-2xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-wider">Flag reason</p>
                        <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-rose-500/40 mb-2 resize-none" rows={2}
                          placeholder="Why is this inappropriate?" />
                        <button onClick={() => { if (flagReason.trim()) toggleFlag(detailPost.id, flagReason.trim()); }}
                          className="w-full px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-neutral-950 font-bold text-[10px] font-mono uppercase transition-all"
                        >Submit Flag</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setDetailPost(null)}
                    className="p-2 rounded-lg bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-all"
                  ><X className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Post content */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border mb-3 ${getCategoryStyle(detailPost.category || 'FAN ART')}`}>
                  {getCategoryIcon(detailPost.category || 'FAN ART')}
                  {detailPost.category || 'FAN ART'}
                </span>
                <p className="text-sm text-neutral-200 leading-relaxed">{detailPost.content}</p>
                {detailPost.image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-neutral-900/60">
                    <img src={detailPost.image} alt="" className="w-full h-48 object-cover" />
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-900/50 pt-3 mb-4">
                <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-red-400" /> {detailPost.likes} {detailPost.likes === 1 ? 'Heart' : 'Hearts'}</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-gold-500" /> {detailPost.replies_count || 0} Responses</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {detailPost.created_at ? new Date(detailPost.created_at).toLocaleDateString() : '-'}</span>
                {detailPost.pinned && <span className="flex items-center gap-1.5 text-sky-400"><Pin className="h-3.5 w-3.5" /> Pinned</span>}
                {detailPost.flagged && <span className="flex items-center gap-1.5 text-rose-400"><ShieldAlert className="h-3.5 w-3.5" /> Flagged{detailPost.flag_reason ? `: ${detailPost.flag_reason}` : ''}</span>}
              </div>

              {/* Comments section */}
              <div className="border-t border-neutral-900/50 pt-4">
                <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-gold-500" />
                  Responses ({detailComments.length})
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
                  {detailComments.length === 0 ? (
                    <p className="text-[11px] text-neutral-600 italic">No responses yet.</p>
                  ) : (
                    getPostComments(detailPost.id).map(comment => (
                      <div key={comment.id} className="p-3 rounded-lg border border-neutral-900/60 bg-neutral-900/15 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                          <span className={`font-bold flex items-center gap-1.5 ${comment.username === 'Management' ? 'text-gold-400' : 'text-gold-500/90'}`}>
                            <span className="h-5 w-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[8px] font-medium shrink-0">
                              {comment.avatar_text || comment.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                            {comment.username}
                            {comment.username === 'Management' && (
                              <span className="text-[7px] font-mono uppercase tracking-wider bg-gold-500/15 text-gold-400 border border-gold-500/30 px-1 py-0.5 rounded">Admin</span>
                            )}
                          </span>
                          <span>{comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed">{comment.content}</p>
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-4 ml-2 border-l border-gold-500/15 space-y-2 pt-1">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="bg-neutral-950/40 p-2 rounded-lg border border-neutral-900/40 space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                                  <span className="text-neutral-300 font-semibold">{reply.username}</span>
                                  <span>{reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}</span>
                                </div>
                                <p className="text-neutral-300 text-[11px] leading-relaxed">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Admin comment input */}
                <div className="flex gap-2 pt-3 border-t border-neutral-900/30">
                  <input
                    type="text" value={adminCommentText}
                    onChange={e => setAdminCommentText(e.target.value)}
                    placeholder="Write an admin response..."
                    className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded-lg px-3 py-2.5 text-white outline-none focus:border-gold-500/40 placeholder-neutral-600"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adminComment(detailPost.id); } }}
                  />
                  <button onClick={() => adminComment(detailPost.id)} disabled={!adminCommentText.trim()}
                    className="px-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded-lg text-[10px] uppercase transition-all font-mono flex items-center gap-1.5"
                  ><MessageCircle className="h-3.5 w-3.5" /> Reply</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
