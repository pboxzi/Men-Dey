import { useEffect, useMemo, useState } from 'react';
import { X, Play } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchMedia, type MediaCategory, type MediaPhoto, type MediaVideo } from '../services/content';

interface MediaData {
  videos: MediaVideo[];
  categories: MediaCategory[];
  photos: MediaPhoto[];
}
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

function formatDuration(seconds: number | null) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MediaPage() {
  useSeo({
    title: 'Media',
    description: 'Photography, interviews, press and video featuring Gillian Anderson.',
    canonicalPath: '/media',
  });

  const { data, loading, error, reload } = useAsync<MediaData>(async () => {
    const res = await fetchMedia();
    return {
      data: { videos: res.videos, categories: res.categories, photos: res.photos },
      error: res.error,
    };
  }, []);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [playing, setPlaying] = useState<{ id: string; title: string; youtubeId: string } | null>(null);

  const videos = useMemo(() => data?.videos ?? [], [data]);
  const photos = useMemo(() => data?.photos ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const usedCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    videos.forEach((v) => v.category_id && ids.add(v.category_id));
    photos.forEach((p) => p.category_id && ids.add(p.category_id));
    return ids;
  }, [videos, photos]);

  const visibleCategories = categories.filter((c) => usedCategoryIds.has(c.id));
  const filteredVideos = activeCategory === 'all' ? videos : videos.filter((v) => v.category_id === activeCategory);
  const filteredPhotos = activeCategory === 'all' ? photos : photos.filter((p) => p.category_id === activeCategory);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlaying(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [playing]);

  const nothingYet = !loading && !error && filteredVideos.length === 0 && filteredPhotos.length === 0;

  return (
    <>
      <section
        className="ed-shell"
        style={{ paddingTop: 'clamp(4rem,10vw,7rem)', paddingBottom: 'clamp(2.5rem,5vw,3.5rem)' }}
      >
        <span className="t-meta">Media</span>
        <h1 className="t-h1 mt-3">Photography, interviews &amp; video</h1>
        <p className="t-body mt-5" style={{ maxWidth: '40rem' }}>
          Approved media only. Nothing here is sourced from external sites.
        </p>
      </section>

      {/* Category filter */}
      {visibleCategories.length > 0 && (
        <div className="ed-shell pb-8">
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter media by category">
            <FilterChip active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label="All" />
            {visibleCategories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                label={cat.name}
              />
            ))}
          </div>
        </div>
      )}

      <section className="ed-shell pb-16">
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <ErrorState
            title="Media could not be loaded"
            description="Please try again in a moment."
            onRetry={reload}
          />
        )}

        {nothingYet && (
          <EmptyState
            title="No media published yet"
            description="Photography, interviews and video will appear here once published."
          />
        )}

        {!loading && !error && filteredVideos.length > 0 && (
          <div className="space-y-12">
            <div>
              <h2 className="t-h3 mb-6">Video</h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video) => {
                  const thumb = video.youtube_id
                    ? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`
                    : null;
                  return (
                    <li key={video.id}>
                      <button
                        type="button"
                        onClick={() =>
                          video.youtube_id &&
                          setPlaying({ id: video.id, title: video.title, youtubeId: video.youtube_id })
                        }
                        disabled={!video.youtube_id}
                        className="group block w-full text-left"
                        aria-label={`Play ${video.title}`}
                      >
                        <div className="ed-card relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="ed-media aspect-video" loading="lazy" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="ed-media aspect-video grid place-items-center" aria-hidden="true">
                              <span className="t-caption">No preview</span>
                            </div>
                          )}
                          <span className="absolute inset-0 grid place-items-center">
                            <span
                              className="flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-105"
                              style={{ background: 'rgba(20,24,27,.82)', color: '#fff' }}
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </span>
                          </span>
                          {formatDuration(video.duration) && (
                            <span
                              className="absolute bottom-2 right-2 rounded-sm px-1.5 py-0.5 text-[11px] font-mono"
                              style={{ background: 'rgba(20,24,27,.85)', color: '#fff' }}
                            >
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>
                        <h3 className="t-body-sm mt-3" style={{ color: 'var(--ed-ink)', fontWeight: 500 }}>
                          {video.title}
                        </h3>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {!loading && !error && filteredPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="t-h3 mb-6">Photography</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredPhotos.map((photo) => (
                <li key={photo.id} className="ed-card">
                  <img src={photo.url} alt={photo.title ?? ''} className="ed-media aspect-[4/5]" loading="lazy" referrerPolicy="no-referrer" />
                  {photo.title && <p className="t-caption p-3">{photo.title}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Player overlay */}
      {playing && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(20,24,27,.92)' }}
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          onClick={() => setPlaying(null)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 className="t-h3" style={{ color: '#fff' }}>
                {playing.title}
              </h2>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full" style={{ background: '#000' }}>
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] transition-colors"
      style={{
        border: `1px solid ${active ? 'var(--ed-ink)' : 'var(--ed-line)'}`,
        background: active ? 'var(--ed-ink)' : 'transparent',
        color: active ? '#FBFAF7' : 'var(--ed-ink-soft)',
      }}
    >
      {label}
    </button>
  );
}
