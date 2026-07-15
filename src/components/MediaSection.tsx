import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { YOUTUBE_VIDEOS, GALLERY_PHOTOS } from '../mediaData';
import { MediaItem, PhotoItem } from '../types';
import {
  Play,
  Pause,
  Tv,
  Film,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Heart,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Image,
  X,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Share2
} from 'lucide-react';

export default function MediaSection() {
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');
  
  // Video States
  const [selectedVideo, setSelectedVideo] = useState<MediaItem>(YOUTUBE_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoLikes, setVideoLikes] = useState<{ [id: string]: number }>({
    'media-bts': 1240,
    'video-kimmel': 892,
    'video-fallon': 1560,
    'video-colbert': 945,
  });
  const [hasLikedVideo, setHasLikedVideo] = useState<{ [id: string]: boolean }>({});
  const [videoSearch, setVideoSearch] = useState<string>('');
  const [videoCategory, setVideoCategory] = useState<string>('All');
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Photo States
  const [photoSearch, setPhotoSearch] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<string>('All');
  const [photoLikes, setPhotoLikes] = useState<{ [id: string]: number }>({});
  const [hasLikedPhoto, setHasLikedPhoto] = useState<{ [id: string]: boolean }>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setIsSlideshowActive] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // References
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize photo likes from GALLERY_PHOTOS
  useEffect(() => {
    const initialLikes: { [id: string]: number } = {};
    GALLERY_PHOTOS.forEach((p) => {
      initialLikes[p.id] = p.likes;
    });
    setPhotoLikes(initialLikes);
  }, []);

  // Custom subtitle & progress bar timer (runs if isPlaying is active)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset video progress when changing selected video
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [selectedVideo]);

  // Handle postMessage commands for play/pause and mute/unmute to prevent iframe reloading
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
    }
  }, [isPlaying]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
    }
  }, [isMuted]);

  // Photo Slideshow loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSlideshowActive && lightboxIndex !== null) {
      interval = setInterval(() => {
        handleNextPhoto();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowActive, lightboxIndex]);

  // Reset zoom on photo change
  useEffect(() => {
    setIsZoomed(false);
  }, [lightboxIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const restartVideo = () => {
    setCurrentTime(0);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
        '*'
      );
    }
  };

  const handleVideoLike = (id: string) => {
    if (hasLikedVideo[id]) {
      setVideoLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
      setHasLikedVideo((prev) => ({ ...prev, [id]: false }));
    } else {
      setVideoLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      setHasLikedVideo((prev) => ({ ...prev, [id]: true }));
    }
  };

  const handlePhotoLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasLikedPhoto[id]) {
      setPhotoLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
      setHasLikedPhoto((prev) => ({ ...prev, [id]: false }));
    } else {
      setPhotoLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      setHasLikedPhoto((prev) => ({ ...prev, [id]: true }));
    }
  };

  const handleCopyLink = (type: 'video' | 'photo', id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?${type}=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowToast(`Direct archive link to this ${type} copied to clipboard!`);
      setTimeout(() => setShowToast(null), 3500);
    }).catch(() => {
      setShowToast("Failed to copy link.");
      setTimeout(() => setShowToast(null), 2000);
    });
  };

  // Video Search & Filtering
  const videoCategories = [
    'All',
    'Interviews',
    'The X-Files',
    'Sex Education',
    'The Crown',
    'Theater Life',
    'Public Appearances',
    'Behind The Scenes',
    'Charity & Speeches'
  ];

  const filteredVideos = YOUTUBE_VIDEOS.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      video.category.toLowerCase().includes(videoSearch.toLowerCase());
    const matchesCategory = videoCategory === 'All' || video.category === videoCategory;
    return matchesSearch && matchesCategory;
  });

  // Photo Search & Filtering
  const photoCategories = [
    'All',
    'The X-Files',
    'Sex Education',
    'The Crown',
    'Theater Life',
    'Photoshoots',
    'Charity & Public',
    'Candid Moments',
    'Fan Art Tributes'
  ];

  const filteredPhotos = GALLERY_PHOTOS.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
      photo.description.toLowerCase().includes(photoSearch.toLowerCase());
    const matchesCategory = photoCategory === 'All' || photo.category === photoCategory;
    return matchesSearch && matchesCategory;
  });

  // Subtitles Sync helper
  const activeSubtitleIndex = Math.min(
    Math.floor((currentTime / 100) * (selectedVideo.subtitles?.length || 1)),
    (selectedVideo.subtitles?.length || 1) - 1
  );
  const activeSubtitle = selectedVideo.subtitles?.[activeSubtitleIndex] || '';

  const parseDurationSeconds = (dur: string) => {
    const parts = dur.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 300;
  };

  const totalSeconds = parseDurationSeconds(selectedVideo.duration);
  const currentSeconds = Math.floor((currentTime / 100) * totalSeconds);
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Lightbox Handlers
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => {
        if (prev === null) return null;
        return prev === 0 ? filteredPhotos.length - 1 : prev - 1;
      });
    }
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => {
        if (prev === null) return null;
        return prev === filteredPhotos.length - 1 ? 0 : prev + 1;
      });
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredPhotos]);

  const currentPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <section id="media-page" className={`py-20 px-4 md:px-6 relative min-h-[900px] border-t border-neutral-900 transition-colors duration-1000 ${
      isTheaterMode ? 'bg-[#010101]' : 'bg-[#050505]'
    }`}>
      <div className={`absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
        isTheaterMode ? 'bg-gold-500/1' : 'bg-gold-500/5'
      }`} />
      <div className={`absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ${
        isTheaterMode ? 'bg-gold-500/1' : 'bg-gold-500/3'
      }`} />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Page Title */}
        <div className={`text-center space-y-4 transition-opacity duration-700 ${isTheaterMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Tv className="h-3.5 w-3.5" />
            MEDIA THEATER & ARCHIVES
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Official <span className="text-gold-500">Media</span> Vault
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Step into Gillian Anderson's official theater. Play real YouTube broadcasts, exclusive set interviews, behind-the-scenes clips, and explore over 100 curated portrait archives.
          </p>
        </div>

        {/* Section Tab Bar Switcher */}
        <div className={`flex justify-center transition-opacity duration-700 ${isTheaterMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
          <div className="inline-flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-900 shadow-2xl">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs tracking-widest font-mono uppercase font-bold transition-all ${
                activeTab === 'videos'
                  ? 'bg-gold-500 text-neutral-950 shadow-lg shadow-gold-500/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="h-4 w-4" />
              Videos ({YOUTUBE_VIDEOS.length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs tracking-widest font-mono uppercase font-bold transition-all ${
                activeTab === 'photos'
                  ? 'bg-gold-500 text-neutral-950 shadow-lg shadow-gold-500/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Image className="h-4 w-4" />
              Photos ({GALLERY_PHOTOS.length})
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'videos' ? (
            <motion.div
              key="videos-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 lg:grid-cols-12 items-start"
            >
              {/* Left Column: Big Cinema Player */}
              <div className="lg:col-span-8 space-y-5">
                <div className={`relative aspect-video rounded-xl border transition-all duration-500 overflow-hidden shadow-2xl flex flex-col justify-between group ${
                  isTheaterMode
                    ? 'border-gold-500/40 shadow-[0_0_60px_rgba(212,163,89,0.2)] bg-black'
                    : 'border-neutral-900 bg-neutral-950 shadow-black/80'
                }`}>
                  
                  {/* Embedded Real YouTube Player or Simulated Aura Backdrop */}
                  {selectedVideo.youtubeId ? (
                    <div className="absolute inset-0 z-0">
                      <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?enablejsapi=1&rel=0&modestbranding=1&mute=${isMuted ? 1 : 0}`}
                        title={selectedVideo.title}
                        className="w-full h-full object-cover border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-neutral-900/40" />
                  )}

                  {/* Top info bar overlay */}
                  <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/95 via-black/40 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-500 text-[8px] font-mono border border-gold-500/30 uppercase">
                        {selectedVideo.category}
                      </span>
                      <span className="text-xs font-semibold text-white tracking-wider truncate max-w-[200px] sm:max-w-md">
                        {selectedVideo.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-300 bg-black/50 px-2 py-0.5 rounded border border-neutral-900">
                      <Clock className="h-3 w-3 text-gold-500" />
                      <span>{formatSeconds(currentSeconds)} / {selectedVideo.duration}</span>
                    </div>
                  </div>

                  {/* Big central overlay play button to activate playback if paused */}
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10 transition-opacity">
                      <button
                        onClick={togglePlay}
                        className="p-5 rounded-full bg-gold-500 text-neutral-950 hover:bg-gold-400 shadow-2xl shadow-gold-500/20 transition-transform active:scale-90 hover:scale-105"
                        aria-label="Play Video"
                      >
                        <Play className="h-8 w-8 fill-neutral-950" />
                      </button>
                      <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                        Activate Stream Synchronizer
                      </span>
                    </div>
                  )}

                  {/* Subtitles Overlay Panel */}
                  <div className="relative z-10 mx-auto max-w-xl text-center px-4 py-2.5 bg-black/85 backdrop-blur-md border border-neutral-900 rounded-lg shadow-2xl shrink-0 min-h-[50px] flex items-center justify-center mb-16">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeSubtitleIndex + '-' + selectedVideo.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="font-serif italic text-xs md:text-sm text-neutral-100 leading-relaxed font-semibold tracking-wide"
                      >
                        {isPlaying ? `"${activeSubtitle}"` : `"Click play to synchronize sub-archives for ${selectedVideo.title}."`}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Custom Player Controls Bar */}
                  <div className="relative z-10 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent space-y-3">
                    {/* Progress bar */}
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = (clickX / rect.width) * 100;
                        setCurrentTime(percentage);
                      }}
                      className="relative h-1 w-full bg-neutral-800 rounded-full overflow-hidden cursor-pointer group/progress"
                    >
                      <div
                        className="absolute top-0 left-0 h-full bg-gold-500 transition-all duration-150"
                        style={{ width: `${currentTime}%` }}
                      />
                    </div>

                    {/* Buttons controls row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Play/Pause */}
                        <button
                          onClick={togglePlay}
                          className="p-2 rounded-full bg-gold-500 text-neutral-950 hover:bg-gold-400 active:scale-95 transition-all shadow"
                          aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <Pause className="h-3.5 w-3.5 fill-neutral-950" /> : <Play className="h-3.5 w-3.5 fill-neutral-950" />}
                        </button>

                        {/* Restart */}
                        <button
                          onClick={restartVideo}
                          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                          title="Restart Stream"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>

                         {/* Mute/Unmute */}
                        <button
                          onClick={toggleMute}
                          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        </button>

                        {/* Theater Mode Toggle */}
                        <button
                          onClick={() => setIsTheaterMode(!isTheaterMode)}
                          className={`p-1.5 rounded border transition-colors ${
                            isTheaterMode
                              ? 'bg-gold-500/20 border-gold-500 text-gold-500'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title={isTheaterMode ? "Disable Theater Mode" : "Enable Theater Mode"}
                        >
                          {isTheaterMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Video Actions (Like, Share) */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink('video', selectedVideo.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white transition-colors text-[10px] font-mono font-bold"
                          title="Share direct archive link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={() => handleVideoLike(selectedVideo.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors text-[10px] font-mono font-bold ${
                            hasLikedVideo[selectedVideo.id]
                              ? 'border-red-500/40 bg-red-500/5 text-red-500'
                              : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${hasLikedVideo[selectedVideo.id] ? 'fill-red-500 stroke-red-500' : ''}`} />
                          <span>{videoLikes[selectedVideo.id] || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info Card */}
                <div className="bg-neutral-950/40 border border-neutral-900 p-6 rounded-xl space-y-4 text-left">
                  <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold-500" />
                    BROADCAST TRANSMISSION LOG
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    You are viewing a high-fidelity broadcast titled <strong className="text-white">"{selectedVideo.title}"</strong> under the <strong className="text-gold-500">{selectedVideo.category}</strong> archive catalog. Playback supports embedded streaming with real-time closed caption tracking.
                  </p>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 pt-2">
                    <div className="border border-neutral-900 p-3 rounded-lg text-center bg-neutral-950/20">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">DURATION</span>
                      <span className="text-xs font-mono text-white font-semibold">{selectedVideo.duration}</span>
                    </div>
                    <div className="border border-neutral-900 p-3 rounded-lg text-center bg-neutral-950/20">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">REACTIONS</span>
                      <span className="text-xs font-mono text-white font-semibold">{videoLikes[selectedVideo.id] || 0}</span>
                    </div>
                    <div className="border border-neutral-900 p-3 rounded-lg text-center bg-neutral-950/20">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">FEED STREAM</span>
                      <span className="text-xs font-mono text-white font-semibold">YOUTUBE API</span>
                    </div>
                    <div className="border border-neutral-900 p-3 rounded-lg text-center bg-neutral-950/20">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">SUBTITLE CAPTIONS</span>
                      <span className="text-xs font-mono text-white font-semibold">SYNCED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Broadcast Selection Sidebar with Filter & Search */}
              <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
                
                {/* Sidebar Filter Panel */}
                <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    <Filter className="h-3.5 w-3.5 text-gold-500" />
                    <span>Filter Broadcasts ({filteredVideos.length})</span>
                  </div>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
                    <input
                      type="text"
                      placeholder="Search videos..."
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  {/* Categories Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                    {videoCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setVideoCategory(cat)}
                        className={`px-2 py-1 rounded text-[9px] font-mono uppercase border transition-all ${
                          videoCategory === cat
                            ? 'bg-gold-500/10 border-gold-500 text-gold-500 font-bold'
                            : 'bg-neutral-900 border-neutral-800/80 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playlist Sidebar List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredVideos.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/20 text-neutral-500 text-xs font-mono">
                      No broadcasts match criteria
                    </div>
                  ) : (
                    filteredVideos.map((item) => {
                      const isCurrent = item.id === selectedVideo.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedVideo(item)}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 group cursor-pointer ${
                            isCurrent
                              ? 'bg-gold-500/5 border-gold-500/40 shadow-lg'
                              : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-950/80'
                          }`}
                        >
                          <div className="h-9 w-9 rounded bg-neutral-900 border border-neutral-800/80 flex items-center justify-center shrink-0">
                            {isCurrent && isPlaying ? (
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 bg-gold-500 animate-[bounce_0.8s_infinite_100ms]" style={{ height: '60%' }} />
                                <span className="w-0.5 bg-gold-500 animate-[bounce_0.8s_infinite_300ms]" style={{ height: '100%' }} />
                                <span className="w-0.5 bg-gold-500 animate-[bounce_0.8s_infinite_200ms]" style={{ height: '40%' }} />
                              </div>
                            ) : (
                              <Play className={`h-3.5 w-3.5 transition-colors ${isCurrent ? 'text-gold-500 fill-gold-500/20' : 'text-neutral-500 group-hover:text-gold-500'}`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-mono text-gold-500/80 uppercase font-semibold">
                                {item.category}
                              </span>
                              <span className="text-[8px] font-mono text-neutral-500">
                                {item.duration}
                              </span>
                            </div>
                            <h4 className={`text-xs font-bold truncate mt-0.5 ${isCurrent ? 'text-gold-500' : 'text-white'}`}>
                              {item.title}
                            </h4>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="photos-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Photo Filter & Toolbar */}
              <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gold-500" />
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest font-bold">
                    Filter Galleries ({filteredPhotos.length} / {GALLERY_PHOTOS.length})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:w-2/3 items-stretch sm:items-center">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
                    <input
                      type="text"
                      placeholder="Search photo titles & archives..."
                      value={photoSearch}
                      onChange={(e) => setPhotoSearch(e.target.value)}
                      className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50"
                    />
                    {photoSearch && (
                      <button
                        onClick={() => setPhotoSearch('')}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category dropdown */}
                  <div className="relative">
                    <select
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 cursor-pointer pr-8 appearance-none"
                    >
                      {photoCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'All' ? 'All Galleries' : cat}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-3 pointer-events-none text-neutral-500 border-l border-neutral-800 pl-1.5 text-[8px] font-mono">▼</span>
                  </div>
                </div>
              </div>

              {/* Desktop category tags pill layout */}
              <div className="hidden md:flex flex-wrap gap-2 justify-center pb-2">
                {photoCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPhotoCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase border tracking-wider transition-all ${
                      photoCategory === cat
                        ? 'bg-gold-500 border-gold-500 text-neutral-950 font-bold shadow-lg shadow-gold-500/10'
                        : 'bg-neutral-950/60 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid Layout of 100 photos */}
              {filteredPhotos.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/10">
                  <Image className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
                  <p className="text-xs font-mono text-neutral-500">No portrait records match criteria.</p>
                  <button
                    onClick={() => {
                      setPhotoSearch('');
                      setPhotoCategory('All');
                    }}
                    className="mt-4 text-[10px] font-mono text-gold-500 border border-gold-500/30 hover:bg-gold-500/5 px-4 py-1.5 rounded"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPhotos.map((photo, index) => {
                    const isLiked = hasLikedPhoto[photo.id];
                    const count = photoLikes[photo.id] !== undefined ? photoLikes[photo.id] : photo.likes;
                    return (
                      <motion.div
                        key={photo.id}
                        layoutId={`photo-card-${photo.id}`}
                        onClick={() => setLightboxIndex(index)}
                        className="group relative aspect-[4/5] bg-neutral-950 rounded-xl border border-neutral-900 overflow-hidden cursor-pointer hover:border-gold-500/40 shadow-lg hover:shadow-2xl hover:shadow-black/60 transition-all flex flex-col justify-end"
                        whileHover={{ y: -4 }}
                      >
                        {/* Image */}
                        <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-900">
                          <img
                            src={photo.url}
                            alt={photo.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/5 opacity-80 z-1" />
                        </div>

                        {/* Top corner hover metadata */}
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[8px] font-mono text-gold-500 border border-neutral-900">
                            {photo.category}
                          </span>
                        </div>

                        {/* Bottom Info Details */}
                        <div className="relative z-10 p-3 space-y-1 bg-gradient-to-t from-black/95 to-transparent text-left">
                          <h4 className="text-[11px] font-bold text-white tracking-wide truncate group-hover:text-gold-500 transition-colors">
                            {photo.title.split(' (Archive')[0]}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-neutral-500 uppercase">
                              #{photo.id.replace('photo-', '')}
                            </span>
                            <button
                              onClick={(e) => handlePhotoLike(photo.id, e)}
                              className="flex items-center gap-1 text-[9px] font-mono text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 stroke-red-500 text-red-500' : ''}`} />
                              <span className={isLiked ? 'text-red-500 font-bold' : ''}>{count}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
            onClick={() => {
              setLightboxIndex(null);
              setIsSlideshowActive(false);
            }}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-left flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono bg-neutral-900 text-gold-500 px-2.5 py-1 rounded border border-neutral-800 uppercase tracking-widest font-semibold">
                  {currentPhoto.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  PORTRAIT #{currentPhoto.id.replace('photo-', '')} of {GALLERY_PHOTOS.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Autoplay Slideshow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSlideshowActive(!isSlideshowActive);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-mono font-bold cursor-pointer ${
                    isSlideshowActive
                      ? 'bg-gold-500/20 border-gold-500 text-gold-500 animate-pulse'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle 4-second auto slideshow playback"
                >
                  <Play className={`h-3 w-3 ${isSlideshowActive ? 'fill-gold-500 text-gold-500' : 'fill-current'}`} />
                  <span>{isSlideshowActive ? 'Slideshow Active' : 'Autoplay'}</span>
                </button>

                {/* Zoom toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isZoomed
                      ? 'bg-gold-500 border-gold-400 text-neutral-950'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title={isZoomed ? "Zoom Out" : "Zoom In"}
                >
                  {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                <a
                  href={`${currentPhoto.url}&dl=gillian_archive.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  title="Open high-res in new tab"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setIsSlideshowActive(false);
                  }}
                  className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  title="Close Lightbox (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Central Stage: Image + Navigation Arrows */}
            <div className="flex-1 flex items-center justify-between w-full relative max-h-[70vh]">
              {/* Left Arrow */}
              <button
                onClick={handlePrevPhoto}
                className="p-3.5 rounded-full bg-neutral-900/65 border border-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all absolute left-0 sm:left-4 z-50 cursor-pointer"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Main Image View with Zoom Controls */}
              <div
                className={`mx-auto max-w-4xl max-h-full rounded-xl border border-neutral-900 overflow-hidden shadow-2xl bg-neutral-950 flex items-center justify-center relative transition-all duration-500 ${
                  isZoomed ? 'scale-110 md:scale-125 overflow-auto max-h-[85vh] cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
              >
                <img
                  src={currentPhoto.url.replace('&w=600&q=80', '&w=1200&q=95')}
                  alt={currentPhoto.title}
                  referrerPolicy="no-referrer"
                  className={`max-w-full max-h-[70vh] object-contain transition-transform duration-500 ${
                    isZoomed ? 'scale-110' : 'scale-100'
                  }`}
                />
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNextPhoto}
                className="p-3.5 rounded-full bg-neutral-900/65 border border-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all absolute right-0 sm:right-4 z-50 cursor-pointer"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Bottom Metadata Panel */}
            <div
              className="w-full max-w-4xl mx-auto bg-neutral-950/80 backdrop-blur-sm border border-neutral-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 text-left z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 space-y-1.5">
                <h3 className="font-serif text-lg sm:text-xl font-extrabold text-white uppercase tracking-tight">
                  {currentPhoto.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl font-sans">
                  {currentPhoto.description}
                </p>
              </div>

              {/* Interactive Liking & Sharing Actions */}
              <div className="flex items-center gap-3 shrink-0 border-t border-neutral-900 pt-3 md:border-0 md:pt-0">
                <button
                  onClick={() => handleCopyLink('photo', currentPhoto.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-xs font-mono font-bold cursor-pointer"
                  title="Copy direct archive link"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={(e) => handlePhotoLike(currentPhoto.id, e)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-xs font-mono font-bold cursor-pointer ${
                    hasLikedPhoto[currentPhoto.id]
                      ? 'border-red-500 bg-red-500/10 text-red-500 font-extrabold'
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${hasLikedPhoto[currentPhoto.id] ? 'fill-red-500 stroke-red-500' : ''}`} />
                  <span>{photoLikes[currentPhoto.id] !== undefined ? photoLikes[currentPhoto.id] : currentPhoto.likes} Likes</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-gold-500 text-neutral-950 px-6 py-3 rounded-xl font-mono text-[11px] font-bold shadow-2xl flex items-center gap-2 border border-gold-400"
          >
            <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
