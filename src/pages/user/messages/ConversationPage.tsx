import {ArrowLeft, Download, Loader2, Paperclip, Send} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../../auth/AuthContext';
import {Chip} from '../../../components/ui/Chip';
import {Spinner} from '../../../components/ui/Spinner';
import {formatDateTime} from '../../../lib/format';
import {onRowInserted, onRowUpdated} from '../../../lib/realtime';
import {supabase} from '../../../lib/supabase';
import type {ManagementConversation, ManagementMessage, MessageAttachment} from '../../../types';
import {EmptyNote, ErrorNote} from '../components/SectionCard';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  waiting: 'Awaiting reply',
  closed: 'Closed',
};

export function ConversationPage() {
  const {conversationId = ''} = useParams();
  const {session} = useAuth();
  const me = session?.user.id ?? null;

  const [conversation, setConversation] = useState<ManagementConversation | null>(null);
  const [messages, setMessages] = useState<ManagementMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [pending, setPending] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [convRes, msgRes] = await Promise.all([
        supabase.from('management_conversations').select('*').eq('id', conversationId).maybeSingle(),
        supabase
          .from('management_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', {ascending: true})
          .limit(500),
      ]);
      if (convRes.error) throw new Error(convRes.error.message);
      if (msgRes.error) throw new Error(msgRes.error.message);
      if (!convRes.data) throw new Error('This conversation is no longer available.');
      setConversation(convRes.data as ManagementConversation);
      const rows = (msgRes.data ?? []) as ManagementMessage[];
      setMessages(rows);

      if (me && rows.some((m) => m.sender_id !== me && !m.read_at)) {
        void supabase
          .from('management_messages')
          .update({read_at: new Date().toISOString()})
          .eq('conversation_id', conversationId)
          .is('read_at', null)
          .neq('sender_id', me)
          .then(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, me]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const stopInsert = onRowInserted('management_messages', () => void load(true));
    const stopUpdate = onRowUpdated('management_messages', `conversation_id=eq.${conversationId}`, () =>
      void load(true),
    );
    const stopConv = onRowUpdated('management_conversations', `id=eq.${conversationId}`, () =>
      void load(true),
    );
    return () => {
      stopInsert();
      stopUpdate();
      stopConv();
    };
  }, [load, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({behavior: 'smooth', block: 'end'});
  }, [messages.length]);

  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!me || !conversationId) return;
      setAttachError(null);
      if (file.size > 10 * 1024 * 1024) {
        setAttachError('Attachments must be 10 MB or smaller.');
        return;
      }
      setUploading(true);
      try {
        const safe = file.name.replace(/[^\w.-]+/g, '_');
        const path = `${me}/messages/${conversationId}/${crypto.randomUUID()}-${safe}`;
        const {error: upError} = await supabase.storage.from('documents').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upError) throw new Error(upError.message);
        setPending((prev) => [
          ...prev,
          {name: file.name, path, size: file.size, mime: file.type || undefined},
        ]);
      } catch (e) {
        setAttachError(e instanceof Error ? e.message : 'Could not upload the attachment.');
      } finally {
        setUploading(false);
      }
    },
    [conversationId, me],
  );

  const send = useCallback(async () => {
    if (!me || !conversationId) return;
    const body = draft.trim();
    if (!body && pending.length === 0) return;
    setSending(true);
    setAttachError(null);
    try {
      const {data, error: insertError} = await supabase
        .from('management_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: me,
          body,
          attachments: pending,
        })
        .select('*')
        .single();
      if (insertError) throw new Error(insertError.message);
      setMessages((prev) => [...prev, data as ManagementMessage]);
      setDraft('');
      setPending([]);
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }, [conversationId, draft, me, pending]);

  const openAttachment = useCallback(async (attachment: MessageAttachment) => {
    try {
      const {data, error: signError} = await supabase.storage
        .from('documents')
        .createSignedUrl(attachment.path, 60);
      if (signError) throw new Error(signError.message);
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : 'Could not open the attachment.');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-4 sm:h-[calc(100dvh-4rem)] lg:h-auto lg:min-h-[50vh]">
        <img
          src="/assets/images/ga_logo_horizontal_transparent.png"
          alt="Gillian Anderson Management"
          className="h-10 w-auto object-contain sm:h-12"
          loading="eager"
        />
        <Spinner label="Loading conversation" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 lg:p-0">
        <Link to="/dashboard/messages" className="nav-link inline-flex min-h-11 items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Back to conversations
        </Link>
        <ErrorNote message={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col sm:h-[calc(100dvh-4rem)] lg:h-auto">
      <header className="flex shrink-0 items-center gap-1 border-b border-stone px-4 py-2 sm:gap-2 sm:py-3 lg:px-0 lg:py-4">
        <Link
          to="/dashboard/messages"
          aria-label="Back to conversations"
          className="-ml-2 flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-muted transition-colors hover:bg-stone/50 hover:text-charcoal"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden />
          <span className="hidden text-sm sm:inline">Conversations</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-charcoal sm:text-lg md:text-2xl">
          {conversation?.subject}
        </h1>
        <span className="shrink-0">
          <Chip tone={conversation?.status === 'closed' ? 'neutral' : 'info'}>
            {STATUS_LABELS[conversation?.status ?? 'open'] ?? conversation?.status}
          </Chip>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:my-4 lg:max-h-[58vh] lg:min-h-72 lg:flex-none lg:rounded-sm lg:border lg:border-stone lg:bg-white lg:p-5">
        {messages.length === 0 ? (
          <EmptyNote
            title="No messages yet."
            description="Write to management below. They will reply to you here."
          />
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === me;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-sm px-4 py-3 md:max-w-[70%] ${
                    mine ? 'bg-charcoal text-alabaster' : 'border border-stone bg-white text-ink'
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                    {mine ? 'You' : 'Management'}
                  </p>
                  {message.body ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed">{message.body}</p>
                  ) : null}
                  {(message.attachments ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(message.attachments ?? []).map((attachment) => (
                        <button
                          key={attachment.path}
                          type="button"
                          onClick={() => void openAttachment(attachment)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                            mine
                              ? 'border-alabaster/40 text-alabaster hover:bg-alabaster/10'
                              : 'border-stone text-charcoal hover:bg-stone/60'
                          }`}
                        >
                          <Download className="size-3" aria-hidden />
                          {attachment.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <p
                    className={`mt-2 text-[11px] ${mine ? 'text-alabaster/70' : 'text-muted'}`}
                  >
                    {formatDateTime(message.created_at)}
                    {mine ? (message.read_at ? ' · Read' : ' · Sent') : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {attachError ? (
        <div className="shrink-0 px-4 pb-2 sm:px-6 lg:px-0">
          <ErrorNote message={attachError} />
        </div>
      ) : null}

      <div className="shrink-0 border-t border-stone bg-[#FCFAF7] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:border-t-0 lg:bg-transparent lg:px-0 lg:pt-4 lg:pb-0">
        {pending.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {pending.map((attachment, index) => (
              <span
                key={attachment.path}
                className="inline-flex items-center gap-2 rounded-full border border-stone bg-white px-3 py-1 text-xs text-charcoal"
              >
                <Paperclip className="size-3" aria-hidden />
                {attachment.name}
                <button
                  type="button"
                  aria-label={`Remove ${attachment.name}`}
                  className="-mr-1 flex h-7 w-7 items-center justify-center text-muted hover:text-danger"
                  onClick={() => setPending((prev) => prev.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAttachment(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-secondary h-11 w-11 shrink-0 px-0"
            aria-label="Attach a file"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Paperclip className="size-4" aria-hidden />}
          </button>
          <label htmlFor="message-draft" className="sr-only">
            Message
          </label>
          <textarea
            id="message-draft"
            className="field-input min-h-11 min-w-0 flex-1 resize-none sm:min-h-12 sm:resize-y"
            rows={2}
            placeholder="Write to management…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary h-11 w-11 shrink-0 px-0"
            aria-label="Send"
            disabled={sending || uploading || (!draft.trim() && pending.length === 0)}
            onClick={() => void send()}
          >
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  );
}
