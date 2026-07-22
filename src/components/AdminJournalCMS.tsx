import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  FileText, Plus, Search, Edit3, Trash2, X, Save, Loader2, RefreshCw, Eye, CheckCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function AdminJournalCMS({ showToast }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'entries' | 'articles'>('entries');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [entries, setEntries] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Edit/Create modal state
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; table: 'journal_entries' | 'journal_articles'; data?: any } | null>(null);

  // journal_entries fields
  const [entryTitle, setEntryTitle] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryImage, setEntryImage] = useState('');
  const [entryExcerpt, setEntryExcerpt] = useState('');
  const [entryReadTime, setEntryReadTime] = useState('');
  const [entryContent, setEntryContent] = useState('');

  // journal_articles fields
  const [articleTitle, setArticleTitle] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [articleExcerpt, setArticleExcerpt] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCoverImageUrl, setArticleCoverImageUrl] = useState('');
  const [articleCategoryId, setArticleCategoryId] = useState<string>('');
  const [articleTags, setArticleTags] = useState('');
  const [articleAuthor, setArticleAuthor] = useState('');
  const [articleReadingTime, setArticleReadingTime] = useState<number>(0);
  const [articleIsFeatured, setArticleIsFeatured] = useState(false);
  const [articleStatus, setArticleStatus] = useState<'draft' | 'published'>('draft');

  const catName = (id: string | null) => id ? categories.find(c => c.id === id)?.name || 'Unknown' : '-';

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: e }, { data: a }, { data: cats }] = await Promise.all([
      supabase.from('journal_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('journal_articles').select('*').order('created_at', { ascending: false }),
      supabase.from('journal_categories').select('*').order('name'),
    ]);
    if (e) setEntries(e);
    if (a) setArticles(a);
    if (cats) setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const nextEntryId = () => {
    const nums = entries.map(e => {
      const m = e.id?.match(/^journal-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    }).filter(n => !isNaN(n));
    return `journal-${(Math.max(0, ...nums) + 1).toString()}`;
  };

  const openCreateEntry = () => {
    setEditModal({ mode: 'create', table: 'journal_entries' });
    setEntryTitle(''); setEntryCategory(''); setEntryDate(''); setEntryImage('');
    setEntryExcerpt(''); setEntryReadTime(''); setEntryContent('');
  };

  const openEditEntry = (entry: any) => {
    setEditModal({ mode: 'edit', table: 'journal_entries', data: entry });
    setEntryTitle(entry.title || '');
    setEntryCategory(entry.category || '');
    setEntryDate(entry.date || '');
    setEntryImage(entry.image || '');
    setEntryExcerpt(entry.excerpt || '');
    setEntryReadTime(entry.read_time || '');
    setEntryContent(entry.content || '');
  };

  const openCreateArticle = () => {
    setEditModal({ mode: 'create', table: 'journal_articles' });
    setArticleTitle(''); setArticleSlug(''); setArticleExcerpt(''); setArticleContent('');
    setArticleCoverImageUrl(''); setArticleCategoryId(''); setArticleTags('');
    setArticleAuthor(''); setArticleReadingTime(0); setArticleIsFeatured(false); setArticleStatus('draft');
  };

  const openEditArticle = (article: any) => {
    setEditModal({ mode: 'edit', table: 'journal_articles', data: article });
    setArticleTitle(article.title || '');
    setArticleSlug(article.slug || '');
    setArticleExcerpt(article.excerpt || '');
    setArticleContent(article.content || '');
    setArticleCoverImageUrl(article.cover_image_url || '');
    setArticleCategoryId(article.category_id || '');
    setArticleTags(article.tags ? article.tags.join(', ') : '');
    setArticleAuthor(article.author || '');
    setArticleReadingTime(article.reading_time || 0);
    setArticleIsFeatured(article.is_featured || false);
    setArticleStatus(article.status || 'draft');
  };

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim()) return;
    setSaving(true);
    if (editModal?.mode === 'create') {
      const newId = nextEntryId();
      const { data, error } = await supabase.from('journal_entries').insert({
        id: newId, title: entryTitle.trim(), category: entryCategory.trim() || null,
        date: entryDate.trim() || null, image: entryImage.trim() || null,
        excerpt: entryExcerpt.trim() || null, read_time: entryReadTime.trim() || null,
        content: entryContent.trim() || null,
      }).select().single();
      if (error) {
        showToast(`Failed to create: ${error.message}`, 'error');
      } else if (data) {
        setEntries(prev => [data, ...prev]);
        showToast('Entry created', 'success');
        setEditModal(null);
      }
    } else if (editModal?.data) {
      const { error } = await supabase.from('journal_entries').update({
        title: entryTitle.trim(), category: entryCategory.trim() || null,
        date: entryDate.trim() || null, image: entryImage.trim() || null,
        excerpt: entryExcerpt.trim() || null, read_time: entryReadTime.trim() || null,
        content: entryContent.trim() || null,
      }).eq('id', editModal.data.id);
      if (error) {
        showToast(`Failed to update: ${error.message}`, 'error');
      } else {
        setEntries(prev => prev.map(entry => entry.id === editModal.data.id ? {
          ...entry, title: entryTitle.trim(), category: entryCategory.trim() || null,
          date: entryDate.trim() || null, image: entryImage.trim() || null,
          excerpt: entryExcerpt.trim() || null, read_time: entryReadTime.trim() || null,
          content: entryContent.trim() || null,
        } : entry));
        showToast('Entry updated', 'success');
        setEditModal(null);
      }
    }
    setSaving(false);
  };

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim()) return;
    setSaving(true);
    const tags = articleTags.split(',').map(t => t.trim()).filter(Boolean);
    const payload: any = {
      title: articleTitle.trim(), slug: articleSlug.trim() || null,
      excerpt: articleExcerpt.trim() || null, content: articleContent.trim() || null,
      cover_image_url: articleCoverImageUrl.trim() || null,
      category_id: articleCategoryId || null, tags,
      author: articleAuthor.trim() || null, reading_time: articleReadingTime,
      is_featured: articleIsFeatured, status: articleStatus,
    };
    if (editModal?.mode === 'create') {
      const { data, error } = await supabase.from('journal_articles').insert(payload).select().single();
      if (error) {
        showToast(`Failed to create: ${error.message}`, 'error');
      } else if (data) {
        setArticles(prev => [data, ...prev]);
        showToast('Article created', 'success');
        setEditModal(null);
      }
    } else if (editModal?.data) {
      const { error } = await supabase.from('journal_articles').update(payload).eq('id', editModal.data.id);
      if (error) {
        showToast(`Failed to update: ${error.message}`, 'error');
      } else {
        setArticles(prev => prev.map(a => a.id === editModal.data.id ? { ...a, ...payload } : a));
        showToast('Article updated', 'success');
        setEditModal(null);
      }
    }
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    showToast('Entry removed', 'info');
  };

  const deleteArticle = async (id: string) => {
    await supabase.from('journal_articles').delete().eq('id', id);
    setArticles(prev => prev.filter(a => a.id !== id));
    setConfirmDelete(null);
    showToast('Article removed', 'info');
  };

  const filteredEntries = entries.filter(en => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return en.title?.toLowerCase().includes(q) || en.category?.toLowerCase().includes(q);
  });

  const filteredArticles = articles.filter(ar => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ar.title?.toLowerCase().includes(q) || ar.author?.toLowerCase().includes(q);
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
            <FileText className="h-3 w-3" />
            Journal CMS
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Journal CMS</h2>
          <p className="text-xs text-neutral-500 font-mono">Manage journal entries and articles.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubTab === 'entries' ? (
            <button onClick={openCreateEntry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all active:scale-[0.97]"
            ><Plus className="h-3.5 w-3.5" /> New Entry</button>
          ) : (
            <button onClick={openCreateArticle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all active:scale-[0.97]"
            ><Plus className="h-3.5 w-3.5" /> New Article</button>
          )}
          <button onClick={fetchAll} disabled={loading}
            className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
          ><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Entries', value: entries.length, icon: FileText, color: 'text-gold-500' },
          { label: 'Articles', value: articles.length, icon: FileText, color: 'text-sky-400' },
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
          { id: 'entries' as const, label: 'Entries', icon: FileText },
          { id: 'articles' as const, label: 'Articles', icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
              activeSubTab === tab.id ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
            }`}
          ><tab.icon className="h-3 w-3" /> {tab.label}</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
        <input type="text" placeholder={`Search ${activeSubTab}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
      ) : activeSubTab === 'entries' ? (
        /* ── ENTRIES TABLE ── */
        filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No entries found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Read Time</th>
                    <th className="px-3 py-3 font-semibold">Excerpt</th>
                    <th className="px-3 py-3 font-semibold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-neutral-950/40 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-gold-500" />
                          </div>
                          <span className="text-white font-semibold text-[11px] truncate max-w-[180px]">{entry.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {entry.category ? (
                          <span className="px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-[8px] font-mono text-gold-500 uppercase">{entry.category}</span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-neutral-400 text-[10px]">{entry.date || '-'}</td>
                      <td className="px-3 py-3">
                        {entry.read_time ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                            <Clock className="h-3 w-3" /> {entry.read_time}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[10px] text-neutral-400 line-clamp-2 max-w-[200px]">{entry.excerpt || '-'}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditEntry(entry)}
                            className="p-1.5 rounded text-neutral-500 hover:text-gold-400 hover:bg-neutral-800 transition-all" title="Edit"
                          ><Edit3 className="h-3.5 w-3.5" /></button>
                          {confirmDelete === entry.id ? renderDeleteConfirm(entry.id, () => deleteEntry(entry.id)) : (
                            <button onClick={() => setConfirmDelete(entry.id)}
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
      ) : (
        /* ── ARTICLES TABLE ── */
        filteredArticles.length === 0 ? (
          <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">No articles found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-900 bg-[#0c0c0e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-3 py-3 font-semibold">Slug</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Featured</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Author</th>
                    <th className="px-3 py-3 font-semibold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {filteredArticles.map(article => (
                    <tr key={article.id} className="hover:bg-neutral-950/40 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-sky-400" />
                          </div>
                          <span className="text-white font-semibold text-[11px] truncate max-w-[180px]">{article.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] text-neutral-400">{article.slug || '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                          article.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {article.status === 'published' ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                          {article.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {article.is_featured ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-gold-500">
                            <CheckCircle className="h-3 w-3" /> Featured
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[8px] font-mono text-neutral-400 uppercase">
                          {catName(article.category_id)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-neutral-300">{article.author || '-'}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditArticle(article)}
                            className="p-1.5 rounded text-neutral-500 hover:text-gold-400 hover:bg-neutral-800 transition-all" title="Edit"
                          ><Edit3 className="h-3.5 w-3.5" /></button>
                          {confirmDelete === article.id ? renderDeleteConfirm(article.id, () => deleteArticle(article.id)) : (
                            <button onClick={() => setConfirmDelete(article.id)}
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

      {/* ── Edit / Create Modal (Entries) ── */}
      <AnimatePresence>
        {editModal && editModal.table === 'journal_entries' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setEditModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500 uppercase">
                  <Edit3 className="h-3.5 w-3.5 inline mr-1.5" />
                  {editModal.mode === 'create' ? 'New Entry' : 'Edit Entry'}
                </span>
                <button onClick={() => setEditModal(null)} className="p-1 rounded text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={saveEntry} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Title *</label>
                  <input type="text" required value={entryTitle} onChange={e => setEntryTitle(e.target.value)} placeholder="Entry title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Category</label>
                    <input type="text" value={entryCategory} onChange={e => setEntryCategory(e.target.value)} placeholder="e.g. Life, Film..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Date</label>
                    <input type="text" value={entryDate} onChange={e => setEntryDate(e.target.value)} placeholder="e.g. Mar 15, 2025"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Image URL</label>
                  <input type="text" value={entryImage} onChange={e => setEntryImage(e.target.value)} placeholder="https://..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Read Time</label>
                    <input type="text" value={entryReadTime} onChange={e => setEntryReadTime(e.target.value)} placeholder="e.g. 5 min read"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Excerpt</label>
                  <textarea rows={2} value={entryExcerpt} onChange={e => setEntryExcerpt(e.target.value)} placeholder="Brief excerpt..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Content</label>
                  <textarea rows={6} value={entryContent} onChange={e => setEntryContent(e.target.value)} placeholder="Full content..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setEditModal(null)}
                    className="px-4 py-2 border border-neutral-800 rounded-lg text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-all"
                  >Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50"
                  >{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit / Create Modal (Articles) ── */}
      <AnimatePresence>
        {editModal && editModal.table === 'journal_articles' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setEditModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-gold-500 uppercase">
                  <Edit3 className="h-3.5 w-3.5 inline mr-1.5" />
                  {editModal.mode === 'create' ? 'New Article' : 'Edit Article'}
                </span>
                <button onClick={() => setEditModal(null)} className="p-1 rounded text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={saveArticle} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Title *</label>
                  <input type="text" required value={articleTitle} onChange={e => setArticleTitle(e.target.value)} placeholder="Article title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Slug</label>
                    <input type="text" value={articleSlug} onChange={e => setArticleSlug(e.target.value)} placeholder="article-slug"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Category</label>
                    <select value={articleCategoryId} onChange={e => setArticleCategoryId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Cover Image URL</label>
                  <input type="text" value={articleCoverImageUrl} onChange={e => setArticleCoverImageUrl(e.target.value)} placeholder="https://..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Author</label>
                    <input type="text" value={articleAuthor} onChange={e => setArticleAuthor(e.target.value)} placeholder="Author name"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Reading Time (min)</label>
                    <input type="number" value={articleReadingTime} onChange={e => setArticleReadingTime(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Tags (comma-separated)</label>
                  <input type="text" value={articleTags} onChange={e => setArticleTags(e.target.value)} placeholder="tag1, tag2, tag3"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Status</label>
                    <select value={articleStatus} onChange={e => setArticleStatus(e.target.value as 'draft' | 'published')}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={articleIsFeatured} onChange={e => setArticleIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-gold-500 focus:ring-gold-500/40 focus:ring-offset-0" />
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Featured</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Excerpt</label>
                  <textarea rows={2} value={articleExcerpt} onChange={e => setArticleExcerpt(e.target.value)} placeholder="Brief excerpt..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Content</label>
                  <textarea rows={6} value={articleContent} onChange={e => setArticleContent(e.target.value)} placeholder="Full content..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 leading-relaxed" />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setEditModal(null)}
                    className="px-4 py-2 border border-neutral-800 rounded-lg text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-all"
                  >Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-amber-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50"
                  >{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
