import type {ManagementConversation, ManagementMessage} from '../types';

import {supabase} from './supabase';

export interface ConversationSummary extends ManagementConversation {
  last: Pick<ManagementMessage, 'body' | 'created_at' | 'sender_id'> | null;
}

export interface ConversationSummaries {
  conversations: ConversationSummary[];
  unreadByConversation: Record<string, number>;
}

type MessageRow = Pick<
  ManagementMessage,
  'conversation_id' | 'sender_id' | 'body' | 'created_at' | 'read_at'
>;

function activityKey(row: ConversationSummary): number {
  const updated = Date.parse(row.updated_at) || 0;
  const last = row.last ? Date.parse(row.last.created_at) || 0 : 0;
  return Math.max(updated, last);
}

function sortSummaries(a: ConversationSummary, b: ConversationSummary): number {
  const aClosed = a.status === 'closed' ? 1 : 0;
  const bClosed = b.status === 'closed' ? 1 : 0;
  if (aClosed !== bClosed) return aClosed - bClosed;
  return activityKey(b) - activityKey(a);
}

// PostgREST rejects order/limit directives inside a select embed, so the
// conversation rows and their messages are fetched separately and joined here.
// Active threads sort first, then by real activity: max(updated_at, last message).
export async function loadConversationSummaries(
  me: string | null,
  limit = 100,
): Promise<ConversationSummaries> {
  const [convsRes, msgsRes] = await Promise.all([
    supabase
      .from('management_conversations')
      .select('*')
      .order('updated_at', {ascending: false})
      .limit(limit),
    supabase
      .from('management_messages')
      .select('conversation_id, sender_id, body, created_at, read_at')
      .order('created_at', {ascending: false})
      .limit(500),
  ]);
  if (convsRes.error) throw new Error(convsRes.error.message);
  if (msgsRes.error) throw new Error(msgsRes.error.message);

  const conversations = (convsRes.data ?? []) as ManagementConversation[];
  const messages = (msgsRes.data ?? []) as MessageRow[];

  const inScope = new Set(conversations.map((c) => c.id));
  const lastByConversation: Record<string, ConversationSummary['last']> = {};
  const unreadByConversation: Record<string, number> = {};

  for (const msg of messages) {
    if (!inScope.has(msg.conversation_id)) continue;
    if (!lastByConversation[msg.conversation_id]) {
      lastByConversation[msg.conversation_id] = {
        body: msg.body,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      };
    }
    if (me && msg.sender_id !== me && !msg.read_at) {
      unreadByConversation[msg.conversation_id] =
        (unreadByConversation[msg.conversation_id] ?? 0) + 1;
    }
  }

  const summaries = conversations.map((c) => ({
    ...c,
    last: lastByConversation[c.id] ?? null,
  }));
  summaries.sort(sortSummaries);
  return {conversations: summaries, unreadByConversation};
}
