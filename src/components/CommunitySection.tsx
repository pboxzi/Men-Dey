import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityHighlight } from '../types';
import { useGlobalState } from '../utils/StateContext';
import {
  Users,
  Heart,
  MessageSquare,
  Upload,
  Send,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  Trash2,
  Sparkles,
  Award,
  Clock,
  TrendingUp,
  MessageCircle,
  Palette,
  Mail,
  Compass,
  Star
} from 'lucide-react';

export default function CommunitySection() {
  const { posts: highlights, likePost, addPost, commentPost, replyComment } = useGlobalState();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCommentDrawer, setActiveCommentDrawer] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [id: string]: string }>({});
  const [newReplyTexts, setNewReplyTexts] = useState<{ [commentId: string]: string }>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);

  // Form states for uploading/adding a community post
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderHandle, setUploaderHandle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Fan Art');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Like a highlight post
  const handleLikeHighlight = async (id: string) => {
    try {
      await likePost(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit comment to a highlight post
  const handleAddComment = async (e: React.FormEvent, highlightId: string) => {
    e.preventDefault();
    const commentText = newCommentTexts[highlightId];
    if (!commentText || !commentText.trim()) return;

    try {
      await commentPost(highlightId, commentText.trim(), 'You');
      setNewCommentTexts((prev) => ({ ...prev, [highlightId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  // Submit nested reply to a comment thread
  const handleAddReply = async (e: React.FormEvent, highlightId: string, commentId: string) => {
    e.preventDefault();
    const replyText = newReplyTexts[commentId];
    if (!replyText || !replyText.trim()) return;

    try {
      await replyComment(highlightId, commentId, replyText.trim(), 'You');
      setNewReplyTexts((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop handlers
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

  // Submit new post to feed
  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName || !postContent) return;

    const cleanHandle = uploaderHandle.startsWith('@')
      ? uploaderHandle
      : uploaderHandle
      ? `@${uploaderHandle}`
      : `@${uploaderName.toLowerCase().replace(/\s+/g, '')}`;

    // Standard high-quality placeholder image if none selected
    const fallbackImages = [
      '/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
      '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg',
      '/src/assets/images/iceland_landscape_1782919139830.jpg'
    ];
    const imageToUse = postImage || fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    try {
      await addPost(postContent, imageToUse, uploaderName, cleanHandle, postCategory);
      // Show success banner
      setUploadSuccess(true);

      // Reset Form
      setUploaderName('');
      setUploaderHandle('');
      setPostContent('');
      setPostImage(null);

      setTimeout(() => {
        setUploadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { id: 'ALL', label: 'ALL', icon: Users },
    { id: 'FAN ART', label: 'FAN ART', icon: Palette },
    { id: 'LETTERS', label: 'LETTERS', icon: Mail },
    { id: 'ENCOUNTERS', label: 'ENCOUNTERS', icon: Compass },
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
      return 0; // latest = default Supabase order (created_at DESC)
    });
  }, [highlights, activeCategory, searchQuery, activeSort]);

  return (
    <section id="community-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute left-10 top-1/3 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Users className="h-3.5 w-3.5" />
            OFFICIAL FAN CO-OP
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Fan <span className="text-gold-500">Kindred</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            A space dedicated entirely to collective stories, beautiful fan art, private letters of appreciation, and heartwarming encounters with Gillian.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { icon: FileText, value: communityStats.posts, label: 'Posts', color: 'text-gold-500' },
            { icon: MessageCircle, value: communityStats.comments, label: 'Comments', color: 'text-emerald-400' },
            { icon: Heart, value: communityStats.likes, label: 'Likes', color: 'text-red-400' },
            { icon: Users, value: communityStats.contributors, label: 'Contributors', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 text-center space-y-1.5 hover:border-neutral-800 transition-colors">
              <stat.icon className={`h-4 w-4 ${stat.color} mx-auto`} />
              <span className={`block text-xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Content Columns: Left (Post Form), Right (Social Feed) */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Post Form - 4 Cols */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-neutral-950/80 border border-neutral-900 rounded-xl p-6 shadow-xl space-y-5 text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
                <Sparkles className="h-4.5 w-4.5 text-gold-500" />
                <h3 className="font-serif text-sm tracking-widest text-white uppercase font-bold">
                  SHARE YOUR TRIUMPH
                </h3>
              </div>

              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gold-500/10 border border-gold-500/30 p-3.5 rounded-lg flex items-center gap-2 text-xs text-gold-500 font-serif italic"
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-gold-500" />
                  <span>"Excellent submission! Your story is now part of the kindred timeline."</span>
                </motion.div>
              )}

              <form onSubmit={handleCreatePostSubmit} className="space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    YOUR NAME OR ALIAS *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dana Scully Enthusiast"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40"
                  />
                </div>

                {/* Handle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    SOCIAL HANDLE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @truth_seeker_93"
                    value={uploaderHandle}
                    onChange={(e) => setUploaderHandle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    POST CATEGORY
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'FAN ART', label: 'Art', icon: Palette },
                      { id: 'LETTERS', label: 'Letter', icon: Mail },
                      { id: 'ENCOUNTERS', label: 'Story', icon: Compass },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPostCategory(cat.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                          postCategory === cat.id
                            ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold scale-[1.02]'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <cat.icon className="h-3 w-3" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Story/Message Content */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    YOUR REVEALED WORD / STORY *
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Describe your encounters, draw comparison, or write notes of inspiration..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-mono ${postContent.length > 450 ? 'text-red-400' : 'text-neutral-600'}`}>
                      {postContent.length}/500
                    </span>
                  </div>
                </div>

                {/* Drag & Drop File Upload Panel */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    MEDIA / SKETCH (OPTIONAL)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                      isDragOver
                        ? 'border-gold-500 bg-gold-500/5'
                        : postImage
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'
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
                      <div className="relative w-full aspect-video rounded overflow-hidden">
                        <img src={postImage} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostImage(null);
                          }}
                          className="absolute right-2 top-2 p-1 rounded-full bg-neutral-950/80 text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-neutral-500" />
                        <p className="font-mono text-[9px] text-neutral-400">
                          DRAG & DROP IMAGE OR CLICK TO BROWSE
                        </p>
                        <p className="text-[8px] text-neutral-600">Supports PNG, JPG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  SUBMIT TO TIMELINE
                </button>
              </form>
            </div>
          </div>

          {/* Social Feed Column - 8 Cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* Feed Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const IconComp = cat.icon;
                  const count = cat.id === 'ALL' ? highlights.length : highlights.filter(h => (h.category || 'FAN ART') === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                        activeCategory === cat.id
                          ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold'
                          : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                      }`}
                    >
                      <IconComp className="h-3 w-3" />
                      {cat.label}
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] ${
                        activeCategory === cat.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-900 text-neutral-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
                  {[
                    { id: 'latest' as const, label: 'Latest', icon: Clock },
                    { id: 'liked' as const, label: 'Most Liked', icon: TrendingUp },
                    { id: 'discussed' as const, label: 'Most Discussed', icon: MessageCircle },
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => setActiveSort(sort.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider transition-all ${
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
                <span className="text-[9px] font-mono text-neutral-600">
                  {filteredHighlights.length} post{filteredHighlights.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Social Cards Stream */}
            <div className="space-y-6">
              {filteredHighlights.length > 0 ? (
                filteredHighlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4 transition-all duration-300 hover:border-gold-500/20 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.08)] text-left"
                  >
                    {/* Creator Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono font-medium text-gold-500 shrink-0">
                          {hl.avatarText}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                            {hl.username}
                            {hl.likes >= 5 && (
                              <span title="Verified Contributor" className="text-gold-500">
                                <Star className="h-3 w-3 fill-gold-500" />
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">{hl.handle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                          (hl.category || 'FAN ART') === 'FAN ART' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          (hl.category || 'FAN ART') === 'LETTERS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {hl.category || 'FAN ART'}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-600 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {getRelativeTime((hl as any).created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Content Text */}
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">{hl.content}</p>

                    {/* Uploaded visual */}
                    {hl.image && (
                      <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-900/60">
                        <img
                          src={hl.image}
                          alt="Community Highlight Visual"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover grayscale brightness-95 hover:grayscale-0 hover:scale-[1.01] transition-all duration-700"
                        />
                      </div>
                    )}

                    {/* Footer Likes and comment toggler */}
                    <div className="flex items-center gap-5 text-[10px] font-mono text-neutral-500 border-t border-neutral-900/50 pt-3.5">
                      <button
                        onClick={() => handleLikeHighlight(hl.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          hl.liked ? 'text-red-500 font-semibold' : 'hover:text-white'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${hl.liked ? 'fill-red-500 stroke-red-500' : ''}`} />
                        <span>{hl.likes} Likes</span>
                      </button>

                      <button
                        onClick={() => setActiveCommentDrawer(activeCommentDrawer === hl.id ? null : hl.id)}
                        className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                          activeCommentDrawer === hl.id ? 'text-gold-500' : ''
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{hl.replies} Responses</span>
                      </button>
                    </div>

                    {/* Inner Comments Sliding Block */}
                    <AnimatePresence>
                      {activeCommentDrawer === hl.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-4 pt-4 border-t border-neutral-900/50"
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                            <span>Discussion Threads</span>
                            <span>{hl.comments?.length || 0} top-level {hl.comments?.length === 1 ? 'thread' : 'threads'}</span>
                          </div>

                          {/* Inner comments listing */}
                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                            {hl.comments && hl.comments.length > 0 ? (
                              hl.comments.map((comment) => (
                                <div key={comment.id} className="p-3.5 rounded-xl border border-neutral-900/60 bg-neutral-900/15 space-y-3 text-xs">
                                  {/* Thread OP Header */}
                                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                    <span className="text-gold-500/90 font-bold flex items-center gap-1.5">
                                      <span className="h-5 w-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[9px] font-medium text-gold-500 shrink-0">
                                        {comment.avatarText}
                                      </span>
                                      {comment.username}
                                    </span>
                                    <span>{comment.timestamp}</span>
                                  </div>

                                  {/* Comment Body */}
                                  <p className="text-neutral-200 leading-relaxed font-sans">{comment.content}</p>

                                  {/* Nested Replies Thread list */}
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

                                  {/* Reply actions & Inline Form */}
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
                                          onChange={(e) =>
                                            setNewReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                          }
                                          placeholder={`Reply to ${comment.username}...`}
                                          className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/30"
                                        />
                                        <div className="flex gap-1.5">
                                          <button
                                            type="submit"
                                            disabled={!(newReplyTexts[comment.id] || '').trim()}
                                            className="px-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-neutral-950 font-bold rounded text-[10px] uppercase tracking-wide transition-colors"
                                          >
                                            Reply
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setActiveReplyCommentId(null)}
                                            className="px-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded text-[10px] transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </form>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActiveReplyCommentId(comment.id);
                                          setNewReplyTexts((prev) => ({ ...prev, [comment.id]: '' }));
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
                            ) : (
                              <p className="text-[10px] text-neutral-600 italic py-2">No responses yet. Be the first to share your thoughts.</p>
                            )}
                          </div>

                          {/* Top-level comment form */}
                          <div className="border-t border-neutral-900/60 pt-3.5 space-y-2">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">
                              Start a new thread
                            </span>
                            <form
                              onSubmit={(e) => handleAddComment(e, hl.id)}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={newCommentTexts[hl.id] || ''}
                                onChange={(e) =>
                                  setNewCommentTexts((prev) => ({ ...prev, [hl.id]: e.target.value }))
                                }
                                placeholder="Write a supportive reply..."
                                className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40"
                              />
                              <button
                                type="submit"
                                disabled={!(newCommentTexts[hl.id] || '').trim()}
                                className="px-4.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded text-[10px] tracking-wide transition-all active:scale-95 disabled:opacity-40 uppercase"
                              >
                                Post Thread
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                    <MessageSquare className="h-5 w-5 text-neutral-600" />
                  </div>
                  <p className="text-sm text-neutral-500 font-sans">No posts match your filters.</p>
                  <p className="text-[10px] text-neutral-600 font-mono">Be the first to share a story in this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
