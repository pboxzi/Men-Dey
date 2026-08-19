import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { JournalEntry } from '../types';
import { useGlobalState } from '../utils/StateContext';
import { logger } from '../utils/logger';
import { JOURNAL_ENTRIES as STATIC_JOURNAL_ENTRIES } from '../data';
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  ChevronRight,
  Send,
  ThumbsUp,
  Award
} from 'lucide-react';

interface JournalComment {
  id: string;
  author: string;
  text: string;
  time: string;
  replies?: JournalComment[];
}

export default function JournalSection() {
  const { journalComments: comments, addJournalComment, content } = useGlobalState();
  const navigate = useNavigate();
  const location = useLocation();
  
  const LOCAL_IMAGES = [
    '/assets/images/gillian_investigator_look_1783349694204.jpg',
    '/assets/images/gillian_theatre_rehearsal_1783349680324.jpg',
    '/assets/images/gillian_mentoring_warmth_1783349719383.jpg',
    '/assets/images/gillian_speaking_event_1783349739126.jpg',
    '/assets/images/gillian_studio_portrait_1783349751129.jpg',
    '/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
    '/assets/images/gillian_hero_one_1783349664739.jpg',
    '/assets/images/gillian_pencil_sketch_1783350359030.jpg',
    '/assets/images/iceland_landscape_1782919139830.jpg',
  ];

  // Map journal_articles to JournalEntry format for display
  const articleEntries = ((content.journalArticles || []) as unknown as Record<string, unknown>[])
    .filter((a) => a.status === 'published')
    .map((a, i): JournalEntry => ({
      id: a.id as string,
      title: a.title as string,
      category: 'JOURNAL',
      date: a.created_at ? new Date(a.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      image: LOCAL_IMAGES[i % LOCAL_IMAGES.length],
      excerpt: (a.excerpt as string) || '',
      content: (a.content as string) || '',
      readTime: a.reading_time ? `${a.reading_time} min read` : '',
    }));
  
  const allEntries: JournalEntry[] = [...articleEntries, ...(content.journalEntries || []).map((e, i) => ({
    ...e,
    image: LOCAL_IMAGES[(articleEntries.length + i) % LOCAL_IMAGES.length],
  }))];
  const isLoading = allEntries.length === 0 && (content.journalArticles === undefined || content.journalEntries === undefined);
  const JOURNAL_ENTRIES = allEntries.length > 0 ? allEntries : STATIC_JOURNAL_ENTRIES;
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [claps, setClaps] = useState<{ [id: string]: number }>({
    'journal-1': 342,
    'journal-2': 512,
    'journal-3': 889,
    'journal-4': 1247,
    'journal-5': 876,
    'journal-6': 2103,
    'journal-7': 654,
    'journal-8': 3421,
  });

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [commentName, setCommentName] = useState<string>('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState<{ [commentId: string]: string }>({});

  // URL-based routing: read slug from /journal/:slug path
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const slug = pathParts[1] === 'journal' && pathParts[2] ? pathParts[2] : null;
    if (slug && JOURNAL_ENTRIES.length > 0) {
      const entry = JOURNAL_ENTRIES.find(e => e.id === slug || e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
      if (entry) setSelectedEntry(entry);
    } else if (!slug) {
      setSelectedEntry(null);
    }
  }, [location.pathname, JOURNAL_ENTRIES]);

  const setMetaTag = (name: string, content: string) => {
    const isProperty = name.startsWith('og:');
    let el = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${name}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      if (isProperty) el.setAttribute('property', name);
      else el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // SEO: update document title and meta tags when viewing a post
  useEffect(() => {
    if (selectedEntry) {
      const title = `${selectedEntry.title} | Gillian Anderson Community`;
      const description = selectedEntry.excerpt || selectedEntry.title;
      const slug = selectedEntry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const url = `${window.location.origin}/journal/${slug}`;
      const image = selectedEntry.image?.startsWith('http') ? selectedEntry.image : `${window.location.origin}${selectedEntry.image}`;

      document.title = title;
      setMetaTag('og:title', title);
      setMetaTag('og:description', description);
      setMetaTag('og:url', url);
      setMetaTag('og:image', image);
      setMetaTag('twitter:title', title);
      setMetaTag('twitter:description', description);
      setMetaTag('twitter:image', image);

      return () => {
        document.title = 'Gillian Anderson Official Community | Fan Sanctuary';
        setMetaTag('og:title', 'Gillian Anderson Official Community | Fan Sanctuary');
        setMetaTag('og:description', 'The official Gillian Anderson fan community.');
        setMetaTag('og:url', window.location.origin);
      };
    }
  }, [selectedEntry]);

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    const slug = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/journal/${slug}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
    navigate('/journal', { replace: true });
  };

  const handleShare = (platform: string) => {
    if (!selectedEntry) return;
    const slug = selectedEntry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `${window.location.origin}/journal/${slug}`;
    const text = `${selectedEntry.title} — Gillian Anderson Community`;
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    if (shareUrls[platform]) window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const handleClap = (entryId: string) => {
    setClaps((prev) => ({
      ...prev,
      [entryId]: (prev[entryId] || 0) + 1,
    }));
  };

  const handleAddComment = async (e: React.FormEvent, entryId: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorName = commentName.trim() || 'Anonymous Fan';
    try {
      await addJournalComment(entryId, newComment.trim(), authorName);
      setNewComment('');
    } catch (err) {
      logger.error(err);
    }
  };

  const handleAddReply = async (e: React.FormEvent, entryId: string, commentId: string) => {
    e.preventDefault();
    const replyText = newReplyText[commentId];
    if (!replyText || !replyText.trim()) return;

    const authorName = commentName.trim() || 'Anonymous Fan';
    try {
      await addJournalComment(entryId, `@${authorName}: ${replyText.trim()}`, authorName);
      setNewReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      logger.error(err);
    }
  };

  const categories = ['ALL', 'JOURNAL', 'PERSONAL', 'BEHIND THE SCENES'];

  const filteredEntries = JOURNAL_ENTRIES.filter((entry) => {
    const matchesCategory =
      activeCategory === 'ALL' || entry.category.toUpperCase() === activeCategory;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="journal-page" className="relative bg-white py-20 px-4 md:px-6 min-h-[700px] border-t border-neutral-200">
      
      <div className="mx-auto max-w-6xl relative z-10">
        <AnimatePresence mode="wait">
          {!selectedEntry ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C89B3C]/30 bg-[#C89B3C]/10 text-[#A97828] text-[10px] font-mono tracking-widest uppercase font-bold">
                  <BookOpen className="h-3.5 w-3.5" />
                  PERSPECTIVES & ESSAYS
                </div>
                <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-[#111] uppercase tracking-tight">
                  The <span className="text-[#C89B3C]">Journal</span>
                </h2>
                <p className="text-xs md:text-sm text-[#333] max-w-2xl mx-auto font-sans leading-relaxed">
                  Quiet reflections from Gillian Anderson on life, art, the freedom of the stage, and the collaborative soul of television.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[rgba(0,0,0,0.06)] pb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-lg text-[11px] font-mono tracking-wider uppercase border transition-all ${
                        activeCategory === cat
                          ? 'bg-[#C89B3C] border-gold-400 text-neutral-950 font-bold'
                          : 'bg-white border-[rgba(0,0,0,0.06)] text-[#222] hover:text-neutral-900 hover:border-[rgba(0,0,0,0.06)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search journal entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white text-xs border border-[rgba(0,0,0,0.06)] rounded-lg px-3.5 py-2 text-[#111] outline-none focus:border-[#C89B3C]/50"
                  />
                </div>
              </div>

              {/* Entries Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] overflow-hidden animate-pulse">
                      <div className="aspect-[16/10] bg-white" />
                      <div className="p-6 space-y-3">
                        <div className="h-2 w-24 bg-[#F8F6F2] rounded" />
                        <div className="h-4 w-3/4 bg-[#F8F6F2] rounded" />
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-[#F8F6F2] rounded" />
                          <div className="h-2 w-2/3 bg-[#F8F6F2] rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleSelectEntry(entry)}
                      className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white overflow-hidden hover:border-neutral-300 hover:shadow-lg transition-all cursor-pointer h-full shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="aspect-[16/10] overflow-hidden bg-white relative">
                           <img
                            src={entry.image}
                            alt={entry.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="h-full w-full object-cover brightness-95 group-hover:scale-105 transition-all duration-500"
                          />
                        </div>

                        {/* Text */}
                        <div className="p-6 space-y-3 text-left">
                          <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#C89B3C] uppercase">
                            <span>{entry.date}</span>
                            <span>•</span>
                            <span>{entry.readTime}</span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-[#111] tracking-wide group-hover:text-[#A97828] transition-colors">
                            {entry.title}
                          </h3>
                          <p className="text-xs text-[#222] leading-relaxed font-sans line-clamp-3">
                            {entry.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-[rgba(0,0,0,0.06)]/60 mt-auto flex items-center justify-between text-[10px] font-mono text-[#222]">
                        <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                          READ ARTICLE <ChevronRight className="h-3 w-3" />
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {claps[entry.id] || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {(comments[entry.id] || []).length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[rgba(0,0,0,0.06)] rounded-xl bg-white/10">
                  <p className="text-sm text-[#222] font-sans">No reflections match your search parameters.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-8 text-left"
            >
              {/* Back button */}
              <button
                onClick={handleBackToList}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] text-[#222] hover:text-neutral-900 transition-colors font-mono text-[10px] uppercase font-bold tracking-widest"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK TO ESSAYS
              </button>

              {/* Title Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#C89B3C] uppercase tracking-widest">
                  <span className="bg-[#C89B3C]/10 border border-[#C89B3C]/20 px-2 py-0.5 rounded">
                    {selectedEntry.category}
                  </span>
                  <span>{selectedEntry.date}</span>
                  <span>•</span>
                  <span>{selectedEntry.readTime}</span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#111] leading-tight">
                  {selectedEntry.title}
                </h1>
              </div>

              {/* Immersive Image */}
              <div className="aspect-[21/9] rounded-xl overflow-hidden border border-[rgba(0,0,0,0.06)] bg-white">
                <img
                  src={selectedEntry.image}
                  alt={selectedEntry.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover brightness-95 contrast-105"
                />
              </div>

              {/* Body Content */}
              <div
                className="prose prose-invert max-w-none text-[#222] font-sans text-sm leading-relaxed space-y-6 pt-4 border-b border-[rgba(0,0,0,0.06)] pb-8 [&_p]:leading-relaxed [&_p]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#C89B3C] [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:font-serif [&_blockquote]:text-lg [&_blockquote]:text-[#222] [&_blockquote]:bg-[#C89B3C]/5 [&_blockquote]:rounded-r [&_blockquote]:my-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEntry.content) }}
              />

              {/* Quick Actions Panel */}
              <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleClap(selectedEntry.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] hover:border-[#C89B3C]/40 text-[#222] hover:text-[#C89B3C] transition-colors font-mono text-[10px] uppercase font-bold"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    CLAP ({claps[selectedEntry.id] || 0})
                  </button>
                  <span className="text-[10px] font-mono text-[#222] uppercase">
                    {(comments[selectedEntry.id] || []).length} COMMITTED DISCUSSIONS
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[#222] uppercase mr-1">Share</span>
                  <button onClick={() => handleShare('twitter')} className="p-2 rounded bg-white text-[#222] hover:text-blue-400 border border-[rgba(0,0,0,0.06)] hover:border-blue-800/40 transition-colors" title="Share on X">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button onClick={() => handleShare('whatsapp')} className="p-2 rounded bg-white text-[#222] hover:text-emerald-400 border border-[rgba(0,0,0,0.06)] hover:border-emerald-800/40 transition-colors" title="Share on WhatsApp">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                  <button onClick={() => handleShare('facebook')} className="p-2 rounded bg-white text-[#222] hover:text-blue-500 border border-[rgba(0,0,0,0.06)] hover:border-blue-700/40 transition-colors" title="Share on Facebook">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-6 pt-4">
                <h3 className="font-serif text-lg font-bold text-[#111] uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#C89B3C]" />
                  RESPONSIVE REFLECTIONS
                </h3>

                {/* Comment Input */}
                <form
                  onSubmit={(e) => handleAddComment(e, selectedEntry.id)}
                  className="bg-white border border-[rgba(0,0,0,0.06)] p-4 rounded-xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your name / alias (optional)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="bg-white border border-neutral-200 text-xs text-neutral-900 px-3.5 py-2 rounded-lg outline-none focus:border-amber-400 w-full placeholder:text-neutral-400"
                    />
                  </div>
                  <textarea
                    required
                    placeholder="Share your thoughts on this reflection..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-900 px-3.5 py-2 rounded-lg outline-none focus:border-amber-400 resize-none placeholder:text-neutral-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#C89B3C] hover:bg-[#A97828] text-neutral-950 font-bold px-4 py-2 rounded text-[10px] tracking-widest uppercase transition-all flex items-center gap-1.5"
                    >
                      <Send className="h-3 w-3" />
                      POST REFLECTION
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {(comments[selectedEntry.id] || []).length === 0 ? (
                    <div className="p-6 text-center text-[#222] font-mono text-xs bg-[#F8F6F2] border border-[rgba(0,0,0,0.06)] rounded-xl">
                      No reflections yet. Be the first to share your thoughts!
                    </div>
                  ) : (
                    (comments[selectedEntry.id] || []).map((cmt) => (
                      <div key={cmt.id} className="bg-[#F8F6F2] border border-[rgba(0,0,0,0.06)]/60 p-4 rounded-xl space-y-3 text-left">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#C89B3C]">{cmt.author}</span>
                          <span className="text-[#222]">{cmt.time}</span>
                        </div>
                        <p className="text-xs text-[#222] leading-relaxed font-sans">
                          {cmt.text}
                        </p>

                        {/* Nested Replies */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="pl-4 border-l border-[#C89B3C]/20 space-y-3 pt-1">
                            {cmt.replies.map((reply) => (
                              <div key={reply.id} className="bg-white/10 p-2.5 rounded-lg border border-[rgba(0,0,0,0.06)]/30 space-y-1">
                                <div className="flex justify-between items-center text-[11px] font-mono text-[#222]">
                                  <span className="text-[#222] font-semibold">{reply.author}</span>
                                  <span>{reply.time}</span>
                                </div>
                                <p className="text-[#222] text-[11px] leading-relaxed font-sans">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Actions */}
                        <div className="pt-1">
                          {activeReplyId === cmt.id ? (
                            <form
                              onSubmit={(e) => handleAddReply(e, selectedEntry.id, cmt.id)}
                              className="flex gap-2 bg-white p-2 rounded-lg border border-[rgba(0,0,0,0.06)]/80 mt-1"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={newReplyText[cmt.id] || ''}
                                onChange={(e) =>
                                  setNewReplyText((prev) => ({ ...prev, [cmt.id]: e.target.value }))
                                }
                                placeholder={`Reply to ${cmt.author}...`}
                                className="flex-1 bg-white text-xs border border-[rgba(0,0,0,0.06)] rounded px-2.5 py-1.5 text-[#111] outline-none focus:border-[#C89B3C]/30"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  type="submit"
                                  disabled={!(newReplyText[cmt.id] || '').trim()}
                                  className="px-3 bg-[#C89B3C] hover:bg-[#A97828] disabled:opacity-50 text-neutral-950 font-bold rounded text-[11px] uppercase tracking-wide transition-colors"
                                >
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyId(null)}
                                  className="px-2 bg-white border border-[rgba(0,0,0,0.06)] text-[#222] hover:text-neutral-900 rounded text-[11px] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveReplyId(cmt.id);
                                setNewReplyText((prev) => ({ ...prev, [cmt.id]: '' }));
                              }}
                              className="text-[10px] font-mono text-[#222] hover:text-[#C89B3C] flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Reply to thread</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
