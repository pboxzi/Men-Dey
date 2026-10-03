import { supabase } from '../utils/supabase';

export interface Appearance {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  location: string | null;
  address: string | null;
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  requires_registration: boolean;
  max_attendees: number | null;
  current_attendees: number | null;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  status: string;
  published_at: string | null;
}

export interface MediaVideo {
  id: string;
  title: string;
  category_id: string | null;
  duration: number | null;
  youtube_id: string | null;
  sort_order: number | null;
}

export interface MediaCategory {
  id: string;
  name: string;
}

export interface FilmCredit {
  id: string;
  title: string;
  role: string | null;
  year: number | null;
  tagline: string | null;
  sort_order: number | null;
}

export interface LiteraryWork {
  id: string;
  title: string;
  duration: string | null;
  vibe: string | null;
  sort_order: number | null;
}

export type InquiryCategory =
  | 'fan'
  | 'professional'
  | 'media'
  | 'event'
  | 'partnership'
  | 'appearance'
  | 'other';

async function all<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<{
  data: T | null;
  error: string | null;
}> {
  try {
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: (data ?? null) as T | null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/** Published, public appearances only — never exposes private scheduling. */
export async function fetchAppearances() {
  return all<Appearance[]>(
    supabase
      .from('events')
      .select(
        'id, title, slug, description, location, address, start_date, end_date, cover_image_url, requires_registration, max_attendees, current_attendees',
      )
      .eq('status', 'published')
      .eq('is_public', true)
      .order('start_date', { ascending: true }),
  );
}

export async function fetchNews() {
  return all<NewsItem[]>(
    supabase
      .from('news')
      .select(
        'id, title, slug, excerpt, content, cover_image_url, is_featured, status, published_at',
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  );
}

export async function fetchNewsBySlug(slug: string) {
  return all<NewsItem>(
    supabase
      .from('news')
      .select(
        'id, title, slug, excerpt, content, cover_image_url, is_featured, status, published_at',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle(),
  );
}

export interface MediaPhoto {
  id: string;
  title: string | null;
  url: string;
  description: string | null;
  category_id: string | null;
  sort_order: number | null;
}

export async function fetchMedia() {
  const [videos, categories, photos] = await Promise.all([
    all<MediaVideo[]>(
      supabase
        .from('videos')
        .select('id, title, category_id, duration, youtube_id, sort_order')
        .order('sort_order', { ascending: true, nullsFirst: false }),
    ),
    all<MediaCategory[]>(supabase.from('categories').select('id, name').order('name')),
    all<MediaPhoto[]>(
      supabase
        .from('photos')
        .select('id, title, url, description, category_id, sort_order')
        .order('sort_order', { ascending: true, nullsFirst: false }),
    ),
  ]);
  return {
    videos: videos.data ?? [],
    categories: categories.data ?? [],
    photos: photos.data ?? [],
    error: videos.error ?? categories.error ?? photos.error,
  };
}

export async function fetchFilmography() {
  return all<FilmCredit[]>(
    supabase
      .from('films_data')
      .select('id, title, role, year, tagline, sort_order')
      .order('year', { ascending: false, nullsFirst: false }),
  );
}

export async function fetchLiteraryWorks() {
  return all<LiteraryWork[]>(
    supabase
      .from('literary_works')
      .select('id, title, duration, vibe, sort_order')
      .order('sort_order', { ascending: true, nullsFirst: false }),
  );
}

export interface InquiryPayload {
  name: string;
  email: string;
  category: InquiryCategory;
  subject: string;
  message: string;
}

/**
 * Submits a structured inquiry to management.
 * The category is stored as a prefix on the subject line because the current
 * `contact_submissions` table has no category column — a dedicated `inquiries`
 * table with a category enum is planned for a later phase.
 */
export async function submitInquiry(payload: InquiryPayload) {
  try {
    const label = payload.category.charAt(0).toUpperCase() + payload.category.slice(1);
    const { error } = await supabase.from('contact_submissions').insert({
      name: payload.name,
      email: payload.email,
      subject: `[${label}] ${payload.subject}`,
      message: payload.message,
      status: 'new',
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
