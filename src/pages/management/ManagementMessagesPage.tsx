import {ArrowLeft, Loader2, Paperclip, Send} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {loadConversationSummaries} from '../../lib/conversations';
import type {ConversationSummary} from '../../lib/conversations';
import {reportError} from '../../lib/errors';
import {formatDateTime, relativeTime} from '../../lib/format';
import {onRowInserted, onRowUpdated} from '../../lib/realtime';
import {supabase} from '../../lib/supabase';
import {CONVERSATION_STATUS_LABELS, CONVERSATION_STATUS_TONES} from './shared';
import type {ManagementMessage, MessageAttachment} from '../../types';

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type Person = {email: string | null; full_name: string | null};

function personName(person: Person | null | undefined): string {
  return person?.full_name || person?.email || 'Member';
}

export function ManagementMessagesPage() {
  const {conversationId} = useParams();
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [listLoading, setListLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [messages, setMessages] = useState<ManagementMessage[]>([]);
  const [active, setActive] = useState<(ConversationSummary & {user?: Person[] | null}) | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');

  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [pending, setPending] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    setError(null);
    try {
      const result = await loadConversationSummaries(me || null);
      setSummaries(result.conversations);
      setUnread(result.unreadByConversation);
      const userIds = Array.from(new Set(result.conversations.map((row) => row.user_id)));
      if (userIds.length > 0) {
        const {data: profiles, error: peopleError} = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        if (peopleError) throw new Error(peopleError.message);
        const map: Record<string, Person> = {};
        for (const row of (profiles ?? []) as Array<Person & {id: string}>) {
          map[row.id] = {email: row.email, full_name: row.full_name};
        }
        setPeople(map);
      } else {
        setPeople({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load conversations.');
    } finally {
      setListLoading(false);
    }
  }, [me]);

  const loadThread = useCallback(async (silent = false) => {
    if (!conversationId) {
      setMessages([]);
      setActive(null);
      return;
    }
    if (!silent) setThreadLoading(true);
    setError(null);
    try {
      const [conversationRes, messagesRes] = await Promise.all([
        supabase
          .from('management_conversations')
          .select('*, user:profiles!management_conversations_user_id_fkey(email, full_name)')
          .eq('id', conversationId)
          .maybeSingle(),
        supabase
          .from('management_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', {ascending: true}),
      ]);
      if (conversationRes.error) throw new Error(conversationRes.error.message);
      if (messagesRes.error) throw new Error(messagesRes.error.message);
      const conversation = conversationRes.data as
        | (ConversationSummary & {user?: Person[] | null})
        | null;
      const rows = (messagesRes.data as ManagementMessage[]) ?? [];
      setActive(conversation);
      setMessages(rows);
      if (!silent) {
        setBody('');
        setInternal(false);
        setConfirmingClose(false);
        setPending([]);
        setAttachError(null);
      }
      const hasIncomingUnread = rows.some((row) => row.sender_id !== me && !row.read_at);
      if (hasIncomingUnread) {
        const {error: readError} = await supabase
          .from('management_messages')
          .update({read_at: new Date().toISOString()})
          .eq('conversation_id', conversationId)
          .neq('sender_id', me)
          .is('read_at', null);
        if (readError) throw new Error(readError.message);
        setUnread((prev) => ({...prev, [conversationId]: 0}));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this conversation.');
    } finally {
      setThreadLoading(false);
    }
  }, [conversationId, me]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    const stops = [
      onRowInserted('management_messages', () => {
        void loadThread(true);
        void loadList(true);
      }),
      onRowUpdated('management_conversations', undefined, () => {
        void loadThread(true);
        void loadList(true);
      }),
    ];
    return () => {
      for (const stop of stops) stop();
    };
  }, [loadList, loadThread]);

  const send = useCallback(async () => {
    const trimmed = body.trim();
    if (!conversationId) return;
    if (!trimmed && pending.length === 0) return;
    setSending(true);
    setActionError(null);
    setNotice(null);
    try {
      const {error: insertError} = await supabase.from('management_messages').insert({
        conversation_id: conversationId,
        sender_id: me,
        body: trimmed,
        is_internal: internal,
        attachments: pending,
      });
      if (insertError) throw new Error(insertError.message);
      const {error: touchError} = await supabase
        .from('management_conversations')
        .update({updated_at: new Date().toISOString()})
        .eq('id', conversationId)
        .select('id')
        .maybeSingle();
      if (touchError) throw new Error(touchError.message);
      setBody('');
      setPending([]);
      await Promise.all([loadThread(), loadList()]);
    } catch (e) {
      setActionError(await reportError('management.messages.send', e));
    } finally {
      setSending(false);
    }
  }, [body, conversationId, internal, loadList, loadThread, me, pending]);

  const uploadAttachment = useCallback(
    async (file: File) => {
      const ownerId = active?.user_id;
      if (!ownerId || !conversationId) return;
      setAttachError(null);
      if (file.size > 10 * 1024 * 1024) {
        setAttachError('Attachments must be 10 MB or smaller.');
        return;
      }
      setUploading(true);
      try {
        const safe = file.name.replace(/[^\w.-]+/g, '_');
        const path = `${ownerId}/messages/${conversationId}/${crypto.randomUUID()}-${safe}`;
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
    [active, conversationId],
  );

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

  const changeStatus = useCallback(
    async (next: 'open' | 'waiting' | 'closed') => {
      if (!conversationId) return;
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('management_conversations')
          .update({status: next})
          .eq('id', conversationId)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The status was not saved. This action requires the messages.manage permission.',
          );
        setNotice(`Conversation marked ${CONVERSATION_STATUS_LABELS[next].toLowerCase()}.`);
        await Promise.all([loadThread(), loadList()]);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the status.');
      } finally {
        setBusy(false);
        setConfirmingClose(false);
      }
    },
    [conversationId, loadList, loadThread],
  );

  const assignToMe = useCallback(async () => {
    if (!conversationId || !me) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const {data: updated, error: updateError} = await supabase
        .from('management_conversations')
        .update({assigned_to: me})
        .eq('id', conversationId)
        .select('id, assigned_to')
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);
      if (!updated)
        throw new Error(
          'The assignment was not saved. This action requires the messages.manage permission.',
        );
      setNotice('Assigned to you.');
      await loadThread();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not assign the conversation.');
    } finally {
      setBusy(false);
    }
  }, [conversationId, loadThread, me]);

  const visibleSummaries = summaries.filter(
    (summary) => statusFilter === 'all' || summary.status === statusFilter,
  );

  const threadPane = conversationId ? (
    // min-w-0: as a grid item this pane's automatic minimum size is its
    // min-content width, so a long nowrap subject pushed the track past the
    // viewport (whole page zoomed out on phones). Same for the list pane below.
    <div className="surface flex min-h-[32rem] min-w-0 flex-col p-0">
      {threadLoading && !active ? (
        <div className="p-4 sm:p-6">
          <Spinner label="Loading conversation" />
        </div>
      ) : !active ? (
        <div className="p-4 sm:p-6">
          <EmptyState
            title="Conversation not found."
            description="It may have been closed, or the link is out of date."
          />
          <Link to="/management/messages" className="text-sm text-gold-deep hover:underline py-3 sm:py-0">
            Back to messages
          </Link>
        </div>
      ) : (
        <>
          <header className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 border-b border-stone p-5">
            <div className="min-w-0">
              <Link
                to="/management/messages"
                className="mb-1 inline-flex min-h-11 items-center gap-1 text-xs text-muted hover:text-gold-deep lg:hidden"
              >
                <ArrowLeft className="size-3" aria-hidden /> All conversations
              </Link>
              <p className="truncate text-sm font-medium text-charcoal">{active.subject}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Link
                  to={`/management/fans/${active.user_id}`}
                  className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0"
                >
                  {personName(first(active.user))}
                </Link>
                <Chip tone={CONVERSATION_STATUS_TONES[active.status] ?? 'neutral'}>
                  {CONVERSATION_STATUS_LABELS[active.status] ?? active.status}
                </Chip>
                {active.assigned_to === me ? <Chip tone="info">Assigned to you</Chip> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" loading={busy} onClick={() => void assignToMe()}>
                Assign to me
              </Button>
              <select
                className="field-input w-auto"
                value={active.status}
                onChange={(event) => {
                  const next = event.target.value as 'open' | 'waiting' | 'closed';
                  if (next === 'closed') {
                    setConfirmingClose(true);
                  } else {
                    void changeStatus(next);
                  }
                }}
              >
                <option value="open">Open</option>
                <option value="waiting">Waiting</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </header>

          {confirmingClose ? (
            <div className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 border-b border-stone bg-stone/40 px-5 py-3">
              <p className="text-sm text-charcoal">
                Close this conversation? The member will see it as closed.
              </p>
              <span className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setConfirmingClose(false)}>
                  Back
                </Button>
                <Button loading={busy} onClick={() => void changeStatus('closed')}>
                  Confirm close
                </Button>
              </span>
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <p className="text-sm text-muted">No messages in this conversation yet.</p>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === me;
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                        message.is_internal
                          ? 'border-l-4 border-gold bg-stone/70'
                          : mine
                            ? 'bg-charcoal text-ivory'
                            : 'bg-stone text-charcoal'
                      }`}
                    >
                      {message.is_internal ? (
                        <span className="mb-1 inline-block">
                          <Chip tone="gold">Internal — never sent to the member</Chip>
                        </span>
                      ) : null}
                      <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                      {message.attachments.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <li key={attachment.path}>
                              <button
                                type="button"
                                className="block py-3 text-left text-xs underline sm:py-0"
                                onClick={() => void openAttachment(attachment)}
                              >
                                {attachment.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p
                        className={`mt-1 text-[11px] ${mine && !message.is_internal ? 'text-stone' : 'text-muted'}`}
                      >
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <footer className="sticky bottom-0 border-t border-stone bg-white p-4 sm:p-5 lg:static lg:bg-transparent">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Reply to the member
              </span>
              <textarea
                className="field-input min-h-20 resize-y"
                rows={3}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            {pending.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
                      className="-my-3 flex min-h-11 min-w-11 items-center justify-center text-muted hover:text-danger sm:my-0 sm:min-h-0 sm:min-w-0"
                      onClick={() => setPending((prev) => prev.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            {attachError ? (
              <div className="mt-2">
                <Alert tone="error">{attachError}</Alert>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
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
                  className="btn btn-ghost"
                  aria-label="Attach a file"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Paperclip className="size-4" aria-hidden />
                  )}
                </button>
                <label className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(event) => setInternal(event.target.checked)}
                  />
                  Internal note — never shown to the fan
                </label>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={() => void send()}
                loading={sending}
                disabled={uploading || (!body.trim() && pending.length === 0)}
              >
                <Send className="size-4" aria-hidden /> Send
              </Button>
            </div>
          </footer>
        </>
      )}
    </div>
  ) : (
    <div className="surface hidden p-4 sm:p-6 lg:block">
      <EmptyState
        title="No conversation selected."
        description="Choose a conversation from the list to read the thread and reply."
      />
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Relationships"
        title="Messages"
        description="Every conversation with a member, kept in one place with internal notes clearly separated."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[22rem_1fr]">
        <div className={`surface min-w-0 p-4 ${conversationId ? 'hidden lg:block' : ''}`}>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(['all', 'open', 'waiting', 'closed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(filter)}
              >
                {filter === 'all' ? 'All' : CONVERSATION_STATUS_LABELS[filter]}
              </button>
            ))}
          </div>

          {listLoading ? (
            <Spinner label="Loading conversations" />
          ) : visibleSummaries.length === 0 ? (
            <EmptyState
              title="No conversations."
              description="Conversations start the moment a member messages management."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {visibleSummaries.map((summary) => {
                const count = unread[summary.id] ?? 0;
                return (
                  <li key={summary.id}>
                    <Link
                      to={`/management/messages/${summary.id}`}
                      className={`block px-3 py-3 hover:bg-stone/40 ${
                        conversationId === summary.id ? 'bg-stone/60' : ''
                      }`}
                    >
                      <span className="flex flex-wrap min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-charcoal">
                          {summary.subject}
                        </span>
                        {count > 0 ? (
                          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-charcoal">
                            {count} unread
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs text-muted">
                          {personName(people[summary.user_id])} ·{' '}
                          {CONVERSATION_STATUS_LABELS[summary.status] ?? summary.status}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted">
                          {relativeTime(summary.updated_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {threadPane}
      </div>
    </div>
  );
}
