import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry } from '../types';
import { useGlobalState } from '../utils/StateContext';
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
  const JOURNAL_ENTRIES = content.journalEntries.length > 0 ? content.journalEntries : [];
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
      console.error(err);
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
      console.error(err);
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
    <section id="journal-page" className="relative bg-[#050505] py-20 px-4 md:px-6 min-h-[700px]">
      <div className="absolute left-1/3 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />
      
      <div className="mx-auto max-w-6xl">
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
                  <BookOpen className="h-3.5 w-3.5" />
                  PERSPECTIVES & ESSAYS
                </div>
                <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
                  The <span className="text-gold-500">Journal</span>
                </h2>
                <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
                  Quiet reflections from Gillian Anderson on life, art, the freedom of the stage, and the collaborative soul of television.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                        activeCategory === cat
                          ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold'
                          : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
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
                    className="w-full bg-neutral-950 text-xs border border-neutral-900 rounded-lg px-3.5 py-2 text-white outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              {/* Entries Grid */}
              {filteredEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="group flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-950/40 overflow-hidden hover:border-neutral-800 hover:bg-neutral-950/80 transition-all cursor-pointer h-full"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
                          <img
                            src={entry.image}
                            alt={entry.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                          />
                        </div>

                        {/* Text */}
                        <div className="p-6 space-y-3 text-left">
                          <div className="flex items-center gap-2.5 text-[9px] font-mono text-gold-500/80 uppercase">
                            <span>{entry.date}</span>
                            <span>•</span>
                            <span>{entry.readTime}</span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-white tracking-wide group-hover:text-gold-500 transition-colors">
                            {entry.title}
                          </h3>
                          <p className="text-xs text-neutral-400 leading-relaxed font-sans line-clamp-3">
                            {entry.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-neutral-900/60 mt-auto flex items-center justify-between text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors">
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
                <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10">
                  <p className="text-sm text-neutral-500 font-sans">No reflections match your search parameters.</p>
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
                onClick={() => setSelectedEntry(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white transition-colors font-mono text-[10px] uppercase font-bold tracking-widest"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK TO ESSAYS
              </button>

              {/* Title Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-mono text-gold-500 uppercase tracking-widest">
                  <span className="bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded">
                    {selectedEntry.category}
                  </span>
                  <span>{selectedEntry.date}</span>
                  <span>•</span>
                  <span>{selectedEntry.readTime}</span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {selectedEntry.title}
                </h1>
              </div>

              {/* Immersive Image */}
              <div className="aspect-[21/9] rounded-xl overflow-hidden border border-neutral-900 bg-neutral-900">
                <img
                  src={selectedEntry.image}
                  alt={selectedEntry.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale brightness-90 contrast-105"
                />
              </div>

              {/* Body Content */}
              <div className="prose prose-invert max-w-none text-neutral-300 font-sans text-sm leading-relaxed space-y-6 pt-4 border-b border-neutral-900 pb-8">
                {selectedEntry.content.split('\n\n').map((para, i) => {
                  if (para.startsWith('>')) {
                    const blockquoteText = para.replace('>', '').replace(/"/g, '').trim();
                    return (
                      <blockquote key={i} className="border-l-2 border-gold-500 pl-4 py-2 italic font-serif text-lg text-neutral-200 bg-gold-500/5 rounded-r">
                        "{blockquoteText}"
                      </blockquote>
                    );
                  }
                  return <p key={i}>{para}</p>;
                })}
              </div>

              {/* Quick Actions Panel */}
              <div className="flex items-center justify-between py-4 border-b border-neutral-900">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleClap(selectedEntry.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 border border-neutral-900 hover:border-gold-500/40 text-neutral-300 hover:text-gold-500 transition-colors font-mono text-[10px] uppercase font-bold"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    CLAP ({claps[selectedEntry.id] || 0})
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    {(comments[selectedEntry.id] || []).length} COMMITTED DISCUSSIONS
                  </span>
                </div>
                <button className="p-2 rounded bg-neutral-950 text-neutral-500 hover:text-white border border-neutral-900 transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-6 pt-4">
                <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gold-500" />
                  RESPONSIVE REFLECTIONS
                </h3>

                {/* Comment Input */}
                <form
                  onSubmit={(e) => handleAddComment(e, selectedEntry.id)}
                  className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your name / alias (optional)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2 rounded outline-none focus:border-gold-500/30 w-full"
                    />
                  </div>
                  <textarea
                    required
                    placeholder="Share your thoughts on this reflection..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2 rounded outline-none focus:border-gold-500/30 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold px-4 py-2 rounded text-[10px] tracking-widest uppercase transition-all flex items-center gap-1.5"
                    >
                      <Send className="h-3 w-3" />
                      POST REFLECTION
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {(comments[selectedEntry.id] || []).length === 0 ? (
                    <div className="p-6 text-center text-neutral-500 font-mono text-xs bg-neutral-950/20 border border-neutral-900 rounded-xl">
                      No reflections yet. Be the first to share your thoughts!
                    </div>
                  ) : (
                    (comments[selectedEntry.id] || []).map((cmt) => (
                      <div key={cmt.id} className="bg-neutral-950/50 border border-neutral-900/60 p-4 rounded-xl space-y-3 text-left">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-gold-500">{cmt.author}</span>
                          <span className="text-neutral-500">{cmt.time}</span>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                          {cmt.text}
                        </p>

                        {/* Nested Replies */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="pl-4 border-l border-gold-500/20 space-y-3 pt-1">
                            {cmt.replies.map((reply) => (
                              <div key={reply.id} className="bg-neutral-900/10 p-2.5 rounded-lg border border-neutral-900/30 space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                                  <span className="text-neutral-300 font-semibold">{reply.author}</span>
                                  <span>{reply.time}</span>
                                </div>
                                <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Actions */}
                        <div className="pt-1">
                          {activeReplyId === cmt.id ? (
                            <form
                              onSubmit={(e) => handleAddReply(e, selectedEntry.id, cmt.id)}
                              className="flex gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-900/80 mt-1"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={newReplyText[cmt.id] || ''}
                                onChange={(e) =>
                                  setNewReplyText((prev) => ({ ...prev, [cmt.id]: e.target.value }))
                                }
                                placeholder={`Reply to ${cmt.author}...`}
                                className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/30"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  type="submit"
                                  disabled={!(newReplyText[cmt.id] || '').trim()}
                                  className="px-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded text-[9px] uppercase tracking-wide transition-colors"
                                >
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyId(null)}
                                  className="px-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded text-[9px] transition-colors"
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
                              className="text-[10px] font-mono text-neutral-500 hover:text-gold-500 flex items-center gap-1 transition-colors"
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
