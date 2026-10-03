import { supabase } from '../utils/supabase';

export type FanRequestType = 'fan_letter' | 'charitable' | 'event' | 'general';
export type FanRequestStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface Conversation {
  id: string;
  user_id: string;
  subject: string | null;
  status: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: string;
  text: string;
  read: boolean | null;
  created_at: string;
}

export interface FanRequest {
  id: string;
  user_id: string | null;
  reference_number: string | null;
  type: FanRequestType;
  status: FanRequestStatus;
  name: string | null;
  email: string | null;
  country: string | null;
  subject: string | null;
  message: string | null;
  communication_channel: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  text: string;
  notif_time: string | null;
  unread: boolean | null;
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

/* ------------------------------------------------------------------ messages */

export async function fetchConversations(userId: string) {
  return unwrap<Conversation[]>(
    supabase
      .from('fan_admin_conversations')
      .select('id, user_id, subject, status, last_message_at, created_at')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false }),
  );
}

export async function fetchMessages(conversationId: string) {
  return unwrap<ConversationMessage[]>(
    supabase
      .from('fan_admin_messages')
      .select('id, conversation_id, sender, text, read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  );
}

export async function createConversation(userId: string, subject: string, firstMessage: string) {
  try {
    const { data: conversation, error } = await supabase
      .from('fan_admin_conversations')
      .insert({ user_id: userId, subject, status: 'active', last_message_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) return { id: null as string | null, error: error.message };

    const { error: messageError } = await supabase
      .from('fan_admin_messages')
      .insert({ conversation_id: conversation.id, sender: 'user', text: firstMessage, read: false });
    if (messageError) return { id: conversation.id as string | null, error: messageError.message };

    return { id: conversation.id as string, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function sendMessage(conversationId: string, text: string) {
  try {
    const { error } = await supabase.from('fan_admin_messages').insert({
      conversation_id: conversationId,
      sender: 'user',
      text,
      read: false,
    });
    if (error) return { error: error.message };

    await supabase
      .from('fan_admin_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/* ------------------------------------------------------------------ requests */

export async function fetchMyRequests(userId: string) {
  return unwrap<FanRequest[]>(
    supabase
      .from('fan_requests')
      .select(
        'id, user_id, reference_number, type, status, name, email, country, subject, message, communication_channel, admin_notes, created_at, updated_at, reviewed_at, completed_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  );
}

export interface SubmitRequestPayload {
  userId: string;
  name: string;
  email: string;
  country: string | null;
  type: FanRequestType;
  subject: string;
  message: string;
  communicationChannel: string | null;
}

export async function submitFanRequest(payload: SubmitRequestPayload) {
  try {
    const reference = `FR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const { error } = await supabase.from('fan_requests').insert({
      user_id: payload.userId,
      reference_number: reference,
      type: payload.type,
      status: 'pending',
      name: payload.name,
      email: payload.email,
      country: payload.country,
      subject: payload.subject,
      message: payload.message,
      communication_channel: payload.communicationChannel,
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/* ------------------------------------------------------------- notifications */

export async function fetchMyNotifications(userId: string) {
  return unwrap<UserNotification[]>(
    supabase
      .from('notifications')
      .select('id, user_id, type, title, message, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  );
}

export async function markNotificationRead(id: string) {
  return unwrap(
    supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id),
  );
}

export async function fetchAnnouncements() {
  return unwrap<Announcement[]>(
    supabase
      .from('fan_notifications')
      .select('id, text, notif_time, unread, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  );
}
