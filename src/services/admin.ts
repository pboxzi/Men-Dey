import { supabase } from '../utils/supabase';

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string | null;
  status: string | null;
  created_at: string;
}

export interface RequestRow {
  id: string;
  reference_number: string | null;
  type: string;
  status: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  subject: string | null;
  status: string | null;
  last_message_at: string | null;
  created_at: string;
}

async function unwrap<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<{
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

/** Exact row count without transferring rows (`head: true` queries). */
async function countOf(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<{ data: number; error: string | null }> {
  try {
    const { count, error } = await query;
    if (error) return { data: 0, error: error.message };
    return { data: count ?? 0, error: null };
  } catch (err) {
    return { data: 0, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/** Management overview — real counts and the newest items awaiting attention. */
export async function fetchAdminOverview() {
  const [inquiries, newInquiries, requests, openRequests, conversations, newsCount, eventsCount] =
    await Promise.all([
      unwrap<InquiryRow[]>(
        supabase
          .from('contact_submissions')
          .select('id, name, email, subject, message, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ),
      countOf(
        supabase
          .from('contact_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),
      ),
      unwrap<RequestRow[]>(
        supabase
          .from('fan_requests')
          .select('id, reference_number, type, status, name, email, subject, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ),
      countOf(
        supabase
          .from('fan_requests')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'under_review']),
      ),
      unwrap<ConversationRow[]>(
        supabase
          .from('fan_admin_conversations')
          .select('id, user_id, subject, status, last_message_at, created_at')
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .limit(6),
      ),
      countOf(
        supabase.from('news').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ),
      countOf(
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
      ),
    ]);

  return {
    data: {
      inquiries: inquiries.data ?? [],
      newInquiryCount: newInquiries.data,
      requests: requests.data ?? [],
      openRequestCount: openRequests.data,
      conversations: conversations.data ?? [],
      publishedNews: newsCount.data,
      publishedEvents: eventsCount.data,
    },
    error:
      inquiries.error ??
      newInquiries.error ??
      requests.error ??
      openRequests.error ??
      conversations.error ??
      newsCount.error ??
      eventsCount.error,
  };
}
