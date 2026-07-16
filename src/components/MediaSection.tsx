import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { YOUTUBE_VIDEOS as FALLBACK_VIDEOS, GALLERY_PHOTOS as FALLBACK_PHOTOS } from '../mediaData';
import { MediaItem, PhotoItem } from '../types';
import {
  Play,
  Tv,
  Film,
  Heart,
  ChevronRight,
  ChevronLeft,
  Search,
  Image,
  X,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Share2,
  Sparkles
} from 'lucide-react';

export default function MediaSection() {
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [embedError, setEmbedError] = useState(false);

  // Video States
  const [selectedVideo, setSelectedVideo] = useState<MediaItem>(FALLBACK_VIDEOS[0]);
  const [videoLikes, setVideoLikes] = useState<{ [id: string]: number }>({
    'media-bts': 1240,
    'video-kimmel': 892,
    'video-fallon': 1560,
    'video-colbert': 945,
  });
  const [hasLikedVideo, setHasLikedVideo] = useState<{ [id: string]: boolean }>({});
  const [videoSearch, setVideoSearch] = useState<string>('');
  const [videoCategory, setVideoCategory] = useState<string>('All');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Data fetched from API
  const [videos, setVideos] = useState<MediaItem[]>(FALLBACK_VIDEOS);
  const [photos, setPhotos] = useState<PhotoItem[]>(FALLBACK_PHOTOS);

  // Fetch media data from backend API
  useEffect(() => {
    Promise.all([
      fetch('/api/videos').then(r => r.ok ? r.json() : Promise.reject()).catch(() => FALLBACK_VIDEOS),
      fetch('/api/photos').then(r => r.ok ? r.json() : Promise.reject()).catch(() => FALLBACK_PHOTOS),
    ]).then(([v, p]) => {
      setVideos(v);
      setPhotos(p);
    });
  }, []);

  // Photo States
  const [photoSearch, setPhotoSearch] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<string>('All');
  const [photoLikes, setPhotoLikes] = useState<{ [id: string]: number }>({});
  const [hasLikedPhoto, setHasLikedPhoto] = useState<{ [id: string]: boolean }>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setIsSlideshowActive] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Initialize photo likes from photos
  useEffect(() => {
    const initialLikes: { [id: string]: number } = {};
    photos.forEach((p) => {
      initialLikes[p.id] = p.likes;
    });
    setPhotoLikes(initialLikes);
  }, [photos]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if ((window as any).YT || document.getElementById('youtube-iframe-api')) return;

    (window as any).onYouTubeIframeAPIReady = () => {
      if (playerContainerRef.current && selectedVideo.youtubeId) {
        playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
          videoId: selectedVideo.youtubeId,
          playerVars: { controls: 1, autoplay: 1 },
          events: {
            onError: (e: any) => {
              if (e.data === 101 || e.data === 150) {
                setEmbedError(true);
              }
            },
            onReady: () => setEmbedError(false),
          }
        });
      }
    };

    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Update player when video changes
  useEffect(() => {
    if (!selectedVideo.youtubeId) return;
    setEmbedError(false);

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(selectedVideo.youtubeId);
    } else if ((window as any).YT && (window as any).YT.Player && playerContainerRef.current) {
      playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
        videoId: selectedVideo.youtubeId,
        playerVars: { controls: 1, autoplay: 1 },
        events: {
          onError: (e: any) => {
            if (e.data === 101 || e.data === 150) {
              setEmbedError(true);
            }
          },
          onReady: () => setEmbedError(false),
        }
      });
    }
  }, [selectedVideo]);

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

  useEffect(() => {
    setIsZoomed(false);
  }, [lightboxIndex]);

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

  const filteredVideos = videos.filter((video) => {
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

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
      photo.description.toLowerCase().includes(photoSearch.toLowerCase());
    const matchesCategory = photoCategory === 'All' || photo.category === photoCategory;
    return matchesSearch && matchesCategory;
  });

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
    <section id="media-page" className="py-20 px-4 md:px-6 relative min-h-[900px] border-t border-neutral-900 bg-[#050505]">
      <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-[120px] pointer-events-none bg-gold-500/5" />
      <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-[140px] pointer-events-none bg-gold-500/3" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-4">
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
        <div className="flex justify-center">
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
              Videos ({videos.length})
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
              Photos ({photos.length})
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
              {/* Left Column: YouTube Player */}
              <div className="lg:col-span-8 space-y-5">
                <div className="relative aspect-video rounded-xl border border-neutral-900 overflow-hidden shadow-2xl bg-black">
                  {embedError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95 gap-4 p-6">
                      <p className="text-xs font-mono text-neutral-400 text-center">
                        This video cannot be embedded due to the uploader's restrictions
                      </p>
                      <a
                        href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold transition-colors"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                  ) : selectedVideo.youtubeId ? (
                    <div ref={playerContainerRef} className="w-full h-full" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 text-neutral-500 text-xs font-mono">
                      No video source
                    </div>
                  )}
                </div>

                {/* Video Info Card */}
                <div className="bg-neutral-950/40 border border-neutral-900 p-6 rounded-xl space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gold-500 uppercase tracking-wider font-semibold">
                        {selectedVideo.category}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-white mt-1">
                        {selectedVideo.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink('video', selectedVideo.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white transition-colors text-[10px] font-mono font-bold"
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
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">SOURCE</span>
                      <span className="text-xs font-mono text-white font-semibold">YOUTUBE</span>
                    </div>
                    <div className="border border-neutral-900 p-3 rounded-lg text-center bg-neutral-950/20">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">QUALITY</span>
                      <span className="text-xs font-mono text-white font-semibold">HD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Video Selection Sidebar */}
              <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
                <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    <Filter className="h-3.5 w-3.5 text-gold-500" />
                    <span>Filter ({filteredVideos.length})</span>
                  </div>
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

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredVideos.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/20 text-neutral-500 text-xs font-mono">
                      No videos match criteria
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
                            <Play className={`h-3.5 w-3.5 transition-colors ${isCurrent ? 'text-gold-500 fill-gold-500/20' : 'text-neutral-500 group-hover:text-gold-500'}`} />
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
              <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gold-500" />
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest font-bold">
                    Filter Galleries ({filteredPhotos.length} / {photos.length})
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 md:w-2/3 items-stretch sm:items-center">
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
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[8px] font-mono text-gold-500 border border-neutral-900">
                            {photo.category}
                          </span>
                        </div>
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
            <div className="w-full flex items-center justify-between pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-left flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono bg-neutral-900 text-gold-500 px-2.5 py-1 rounded border border-neutral-800 uppercase tracking-widest font-semibold">
                  {currentPhoto.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  PORTRAIT #{currentPhoto.id.replace('photo-', '')} of {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
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
                >
                  <Play className={`h-3 w-3 ${isSlideshowActive ? 'fill-gold-500 text-gold-500' : 'fill-current'}`} />
                  <span>{isSlideshowActive ? 'Slideshow Active' : 'Autoplay'}</span>
                </button>
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
                >
                  {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <a
                  href={`${currentPhoto.url}&dl=gillian_archive.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setIsSlideshowActive(false);
                  }}
                  className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-between w-full relative max-h-[70vh]">
              <button
                onClick={handlePrevPhoto}
                className="p-3.5 rounded-full bg-neutral-900/65 border border-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all absolute left-0 sm:left-4 z-50 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

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

              <button
                onClick={handleNextPhoto}
                className="p-3.5 rounded-full bg-neutral-900/65 border border-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all absolute right-0 sm:right-4 z-50 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

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
              <div className="flex items-center gap-3 shrink-0 border-t border-neutral-900 pt-3 md:border-0 md:pt-0">
                <button
                  onClick={() => handleCopyLink('photo', currentPhoto.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-xs font-mono font-bold cursor-pointer"
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
