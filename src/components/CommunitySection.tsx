import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityHighlight } from '../types';
import { useGlobalState } from '../utils/StateContext';
import { useAuth } from '../utils/AuthContext';
import {
  Users,
  Heart,
  MessageSquare,
  Upload,
  Send,
  CheckCircle,
  Trash2,
  Sparkles,
  Clock,
  TrendingUp,
  MessageCircle,
  Palette,
  Mail,
  Compass,
  Star,
  Search,
  X,
  AlertCircle
} from 'lucide-react';

export default function CommunitySection() {
  const navigate = useNavigate();
  const { posts: highlights, likePost, addPost, deletePost, commentPost, replyComment } = useGlobalState();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeCommentDrawer, setActiveCommentDrawer] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [id: string]: string }>({});
  const [newReplyTexts, setNewReplyTexts] = useState<{ [commentId: string]: string }>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);

  // Post creation form
  const [uploaderName, setUploaderName] = useState(displayName);
  const [uploaderHandle, setUploaderHandle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('FAN ART');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayName && !uploaderName) setUploaderName(displayName);
  }, [displayName, uploaderName]);

  const handleLikeHighlight = async (id: string) => {
    if (!user) { navigate('/portal?mode=login'); return; }
    try {
      await likePost(id);
    } catch (err) {
      showToast('Could not send your heart. Please try again.', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent, highlightId: string) => {
    e.preventDefault();
    if (!user) { navigate('/portal?mode=login'); return; }
    const commentText = newCommentTexts[highlightId];
    if (!commentText || !commentText.trim()) return;

    try {
      await commentPost(highlightId, commentText.trim(), displayName || 'A kindred spirit');
      setNewCommentTexts((prev) => ({ ...prev, [highlightId]: '' }));
      showToast('Your kind word was shared.', 'success');
    } catch (err) {
      showToast('Could not share your words. Please try again.', 'error');
    }
  };

  const handleAddReply = async (e: React.FormEvent, highlightId: string, commentId: string) => {
    e.preventDefault();
    if (!user) { navigate('/portal?mode=login'); return; }
    const replyText = newReplyTexts[commentId];
    if (!replyText || !replyText.trim()) return;

    try {
      await replyComment(highlightId, commentId, replyText.trim(), displayName || 'A kindred spirit');
      setNewReplyTexts((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
      showToast('Your reply was shared with kindness.', 'success');
    } catch (err) {
      showToast('Could not send your reply. Please try again.', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setDeleteConfirmId(null);
      showToast('Your story has been gently removed.', 'success');
    } catch {
      showToast('Could not remove the story. Please try again.', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPostImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/portal?mode=login');
      return;
    }
    if (!uploaderName || !postContent) return;

    const cleanHandle = uploaderHandle.startsWith('@')
      ? uploaderHandle
      : uploaderHandle
      ? `@${uploaderHandle}`
      : `@${uploaderName.toLowerCase().replace(/\s+/g, '')}`;

    const fallbackImages = [
      '/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
      '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg',
      '/src/assets/images/iceland_landscape_1782919139830.jpg'
    ];
    const imageToUse = postImage || fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    try {
      await addPost(postContent, imageToUse, uploaderName, cleanHandle, postCategory);
      setUploadSuccess(true);
      setUploaderName(displayName || '');
      setUploaderHandle('');
      setPostContent('');
      setPostImage(null);
      setTimeout(() => setUploadSuccess(false), 5000);
      showToast('Your story now lives among the Kindred.', 'success');
    } catch (err) {
      showToast('Could not share your story. Please try again.', 'error');
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Stories', icon: Users },
    { id: 'FAN ART', label: 'Art & Creativity', icon: Palette },
    { id: 'LETTERS', label: 'Letters of Light', icon: Mail },
    { id: 'ENCOUNTERS', label: 'Encounters & Moments', icon: Compass },
  ];

  const [activeSort, setActiveSort] = useState<'latest' | 'liked' | 'discussed'>('latest');

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const communityStats = useMemo(() => ({
    posts: highlights.length,
    comments: highlights.reduce((sum, h) => sum + (h.comments?.length || 0), 0),
    likes: highlights.reduce((sum, h) => sum + h.likes, 0),
    contributors: new Set(highlights.map(h => h.username)).size,
  }), [highlights]);

  const filteredHighlights = useMemo(() => {
    const filtered = highlights.filter((hl) => {
      const postCategory = hl.category || 'FAN ART';
      const matchesCategory =
        activeCategory === 'ALL' || postCategory === activeCategory;

      const matchesSearch =
        hl.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hl.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hl.handle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (activeSort === 'liked') return b.likes - a.likes;
      if (activeSort === 'discussed') return (b.comments?.length || 0) - (a.comments?.length || 0);
      return 0;
    });
  }, [highlights, activeCategory, searchQuery, activeSort]);

  return (
    <section id="community-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px] overflow-hidden">
      {/* Ambient glow layers */}
      <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gold-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute right-10 bottom-1/4 h-72 w-72 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute left-20 top-1/2 h-1 w-1/3 opacity-[0.03] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono border ${
              toast.type === 'success'
                ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl space-y-16">
        {/* ─── WELCOME BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-[10px] font-mono tracking-[0.2em] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome Home
          </div>
          <div>
            <h2 className="font-serif text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-tight">
              The <span className="text-gold-500">Kindred</span>
            </h2>
            <p className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed mt-3">
              A sanctuary for every soul who finds light in Gillian's work. Here, your voice matters —{' '}
              <br className="hidden sm:block" />
              your art, your letters, your cherished encounters. You are among friends.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-xl mx-auto px-6 py-4 rounded-2xl border border-gold-500/10 bg-gradient-to-r from-gold-500/[0.03] via-transparent to-gold-500/[0.03]"
          >
            <p className="text-[11px] font-mono text-neutral-500 leading-relaxed italic">
              &ldquo;This is a space woven from appreciation — every story shared, every heart given,{' '}
              every kind word whispered between strangers who became family.&rdquo;
            </p>
          </motion.div>
        </motion.div>

        {/* ─── STATS GALLERY ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Heart, value: communityStats.posts, label: 'Stories Shared', color: 'text-gold-500' },
            { icon: MessageCircle, value: communityStats.comments, label: 'Kind Words', color: 'text-emerald-400' },
            { icon: Star, value: communityStats.likes, label: 'Hearts Given', color: 'text-red-400' },
            { icon: Users, value: communityStats.contributors, label: 'Souls Connected', color: 'text-amber-400' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative group bg-gradient-to-b from-neutral-950/80 to-neutral-950/40 border border-neutral-900 rounded-xl p-4 text-center space-y-1.5 hover:border-gold-500/20 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto relative`} />
              <span className={`block text-xl font-bold ${stat.color} relative`}>{stat.value}</span>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest relative">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* ═══ POST FORM ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:sticky lg:top-24 space-y-5"
          >
            <div className="relative bg-gradient-to-b from-neutral-950/90 to-neutral-950/60 border border-gold-500/10 rounded-2xl p-6 shadow-xl space-y-5 text-left">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

              <div className="flex items-center gap-2 pb-4 border-b border-gold-500/10">
                <div className="h-8 w-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-serif text-sm tracking-widest text-gold-300 uppercase font-bold">
                    Share Your Light
                  </h3>
                  <p className="text-[9px] font-mono text-neutral-600">Your voice matters here</p>
                </div>
              </div>

              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 p-4 rounded-xl flex items-center gap-3 text-xs text-gold-400 font-serif"
                >
                  <div className="h-8 w-8 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-gold-400" />
                  </div>
                  <span>&ldquo;Thank you, dear heart. Your story now lives among the Kindred, held in gentle hands.&rdquo;</span>
                </motion.div>
              )}

              <form onSubmit={handleCreatePostSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gold-500/60" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A fellow traveller"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40 focus:bg-neutral-900 placeholder-neutral-600 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-neutral-600/60" />
                    Social Handle <span className="text-neutral-600 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @truth_seeker_93"
                    value={uploaderHandle}
                    onChange={(e) => setUploaderHandle(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40 focus:bg-neutral-900 placeholder-neutral-600 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gold-500/60" />
                    What kind of story?
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'FAN ART', label: 'Art', icon: Palette, desc: 'Drawings, designs, visual creations' },
                      { id: 'LETTERS', label: 'Letter', icon: Mail, desc: 'Words from the heart' },
                      { id: 'ENCOUNTERS', label: 'Memory', icon: Compass, desc: 'Moments that moved you' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        title={cat.desc}
                        onClick={() => setPostCategory(cat.id)}
                        className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                          postCategory === cat.id
                            ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold scale-[1.02] shadow-lg shadow-gold-500/20'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <cat.icon className="h-3.5 w-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gold-500/60" />
                    Your story
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="What's in your heart? A cherished memory, a piece of art, words of gratitude..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40 focus:bg-neutral-900 resize-none leading-relaxed placeholder-neutral-600 transition-all duration-300"
                  />
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-mono transition-colors duration-300 ${postContent.length > 450 ? 'text-red-400' : 'text-neutral-600'}`}>
                      {postContent.length}/500
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-neutral-600/60" />
                    Add a picture <span className="text-neutral-600 font-normal normal-case">(optional)</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                      isDragOver
                        ? 'border-gold-500 bg-gold-500/5 scale-[1.01]'
                        : postImage
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900/70'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {postImage ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <img src={postImage} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPostImage(null); }}
                          className="absolute right-2 top-2 p-1.5 rounded-full bg-neutral-950/80 text-red-500 hover:text-red-400 hover:bg-neutral-950 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center">
                          <Upload className="h-4 w-4 text-neutral-500" />
                        </div>
                        <p className="font-mono text-[9px] text-neutral-400">Drop an image here or click to browse</p>
                        <p className="text-[8px] text-neutral-600">PNG, JPG &middot; up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-neutral-950 font-bold py-3 rounded-xl tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  Share with the Kindred
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* ═══ SOCIAL FEED ═══ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Feed Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Search bar */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search stories, names, or words..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-lg pl-9 pr-8 py-2 text-xs text-white outline-none focus:border-gold-500/40 placeholder-neutral-600 transition-all duration-300"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category + Sort row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const IconComp = cat.icon;
                    const count = cat.id === 'ALL' ? highlights.length : highlights.filter(h => (h.category || 'FAN ART') === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                          activeCategory === cat.id
                            ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold shadow-sm'
                            : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <IconComp className="h-3 w-3" />
                        {cat.label}
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium ${
                          activeCategory === cat.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
                    {[
                      { id: 'latest' as const, label: 'Latest', icon: Clock },
                      { id: 'liked' as const, label: 'Most Loved', icon: TrendingUp },
                      { id: 'discussed' as const, label: 'Most Discussed', icon: MessageCircle },
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => setActiveSort(sort.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[8px] font-mono uppercase tracking-wider transition-all ${
                          activeSort === sort.id
                            ? 'bg-neutral-900 text-gold-500'
                            : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        <sort.icon className="h-2.5 w-2.5" />
                        {sort.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-600 min-w-[5rem] text-right">
                    {filteredHighlights.length} {filteredHighlights.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Cards */}
            <div className="space-y-6">
              {filteredHighlights.length > 0 ? (
                filteredHighlights.map((hl, i) => (
                  <motion.div
                    key={hl.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * Math.min(i, 5), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group rounded-2xl border border-neutral-900 bg-gradient-to-b from-neutral-950/70 via-neutral-950/40 to-neutral-950/20 p-5 space-y-4 transition-all duration-500 hover:border-gold-500/20 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.08)] text-left overflow-hidden"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Creator Header + Delete */}
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold-500/20 via-amber-500/10 to-neutral-900 border border-gold-500/20 flex items-center justify-center text-xs font-mono font-medium text-gold-400 shrink-0">
                          {hl.avatarText}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                            {hl.username}
                            {hl.likes >= 5 && (
                              <span title="Kindred Heart" className="text-gold-500">
                                <Star className="h-3 w-3 fill-gold-500" />
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">{hl.handle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${
                          (hl.category || 'FAN ART') === 'FAN ART' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          (hl.category || 'FAN ART') === 'LETTERS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {hl.category || 'FAN ART'}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-600 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {getRelativeTime((hl as any).created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans relative">{hl.content}</p>

                    {/* Image */}
                    {hl.image && (
                      <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-900/60 group/img">
                        <img
                          src={hl.image}
                          alt="Community Highlight Visual"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover brightness-[0.85] saturate-[0.9] group-hover/img:brightness-100 group-hover/img:saturate-100 group-hover/img:scale-[1.02] transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500" />
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center gap-6 text-[10px] font-mono text-neutral-500 border-t border-neutral-900/50 pt-3.5 relative">
                      <motion.button
                        whileTap={{ scale: 1.2 }}
                        onClick={() => handleLikeHighlight(hl.id)}
                        className={`flex items-center gap-1.5 transition-colors duration-200 ${
                          hl.liked ? 'text-red-500 font-semibold' : 'hover:text-white'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${hl.liked ? 'fill-red-500 stroke-red-500' : ''}`} />
                        <span>{hl.likes} {hl.likes === 1 ? 'Heart' : 'Hearts'}</span>
                      </motion.button>

                      <button
                        onClick={() => setActiveCommentDrawer(activeCommentDrawer === hl.id ? null : hl.id)}
                        className={`flex items-center gap-1.5 transition-colors duration-200 hover:text-white ${
                          activeCommentDrawer === hl.id ? 'text-gold-500' : ''
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{hl.replies} {hl.replies === 1 ? 'Response' : 'Responses'}</span>
                      </button>

                      {/* Delete own post */}
                      <div className="ml-auto">
                        {deleteConfirmId === hl.id ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
                            <span className="text-[8px] font-mono text-red-400 uppercase">Remove?</span>
                            <button onClick={() => handleDeletePost(hl.id)} className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-400 text-neutral-950 font-bold text-[8px] font-mono uppercase">Yes</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 rounded border border-neutral-700 text-neutral-400 hover:text-white text-[8px] font-mono uppercase">No</button>
                          </div>
                        ) : (
                          displayName && hl.username === displayName && (
                            <button onClick={() => setDeleteConfirmId(hl.id)} className="text-neutral-600 hover:text-red-400 transition-colors" title="Remove your story">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {activeCommentDrawer === hl.id && (
                        <motion.div
                          key={`comments-${hl.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden space-y-4 pt-4 border-t border-neutral-900/50 relative"
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                            <span className="flex items-center gap-1.5">
                              <MessageCircle className="h-3 w-3" />
                              Kind Words
                            </span>
                            <span>{hl.comments?.length || 0} {hl.comments?.length === 1 ? 'thread' : 'threads'}</span>
                          </div>

                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                            {hl.comments && hl.comments.length > 0 ? (
                              hl.comments.map((comment) => (
                                <div key={comment.id} className="p-3.5 rounded-xl border border-neutral-900/60 bg-neutral-900/15 space-y-3 text-xs">
                                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                    <span className="text-gold-500/90 font-bold flex items-center gap-1.5">
                                      <span className="h-5 w-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-medium text-gold-500 shrink-0">
                                        {comment.avatarText}
                                      </span>
                                      {comment.username}
                                    </span>
                                    <span>{comment.timestamp}</span>
                                  </div>

                                  <p className="text-neutral-200 leading-relaxed font-sans">{comment.content}</p>

                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-4 ml-2 border-l border-gold-500/15 space-y-3 pt-1">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-900/40 space-y-1.5">
                                          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                                            <span className="text-neutral-300 font-semibold flex items-center gap-1">
                                              <span className="h-4.5 w-4.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[8px] font-medium text-neutral-400 shrink-0">
                                                {reply.avatarText}
                                              </span>
                                              {reply.username}
                                            </span>
                                            <span>{reply.timestamp}</span>
                                          </div>
                                          <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">{reply.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-1.5">
                                    {activeReplyCommentId === comment.id ? (
                                      <form
                                        onSubmit={(e) => handleAddReply(e, hl.id, comment.id)}
                                        className="flex gap-2 bg-neutral-950/30 p-2 rounded-lg border border-neutral-900/50 mt-1"
                                      >
                                        <input
                                          type="text"
                                          autoFocus
                                          value={newReplyTexts[comment.id] || ''}
                                          onChange={(e) => setNewReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                          placeholder={`Reply to ${comment.username}...`}
                                          className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/30 transition-all"
                                        />
                                        <div className="flex gap-1.5">
                                          <button type="submit" disabled={!(newReplyTexts[comment.id] || '').trim()} className="px-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded text-[10px] uppercase tracking-wide transition-colors">Reply</button>
                                          <button type="button" onClick={() => setActiveReplyCommentId(null)} className="px-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded text-[10px] transition-colors">Cancel</button>
                                        </div>
                                      </form>
                                    ) : (
                                      <button
                                        onClick={() => { setActiveReplyCommentId(comment.id); setNewReplyTexts((prev) => ({ ...prev, [comment.id]: '' })); }}
                                        className="text-[10px] font-mono text-neutral-500 hover:text-gold-500 flex items-center gap-1 transition-colors"
                                      >
                                        <MessageSquare className="h-3 w-3" />
                                        <span>Reply with kindness</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 px-4">
                                <p className="text-[10px] text-neutral-600 italic">No words yet. Your kindness would be a gift here.</p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-neutral-900/60 pt-3.5 space-y-2">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                              <Heart className="h-2.5 w-2.5" />
                              Leave a kind word
                            </span>
                            <form onSubmit={(e) => handleAddComment(e, hl.id)} className="flex gap-2">
                              <input
                                type="text"
                                value={newCommentTexts[hl.id] || ''}
                                onChange={(e) => setNewCommentTexts((prev) => ({ ...prev, [hl.id]: e.target.value }))}
                                placeholder="Write something encouraging..."
                                className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40 transition-all"
                              />
                              <motion.button type="submit" whileTap={{ scale: 0.95 }} disabled={!(newCommentTexts[hl.id] || '').trim()} className="px-4.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded text-[10px] tracking-wide transition-all disabled:opacity-40 uppercase">Share</motion.button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center py-28 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/10 space-y-5 ${
                    searchQuery ? 'border-gold-500/20' : ''
                  }`}
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gold-500/10 via-amber-500/5 to-neutral-900 border border-gold-500/20 flex items-center justify-center mx-auto">
                    {searchQuery ? <Search className="h-8 w-8 text-gold-500/60" /> : <Heart className="h-8 w-8 text-gold-500/60" />}
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    {searchQuery ? (
                      <>
                        <p className="text-base text-neutral-400 font-sans">No stories match your search.</p>
                        <p className="text-[11px] text-neutral-600 font-mono">Try a different word or browse all stories.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-base text-neutral-400 font-sans">This space is waiting for your story.</p>
                        <p className="text-[11px] text-neutral-600 font-mono leading-relaxed">
                          Every journey begins with a single step — share your art, your letters,{' '}
                          a cherished memory. The Kindred is listening.
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
