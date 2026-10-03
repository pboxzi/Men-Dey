import { useState, type FormEvent } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  createConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
} from '../../services/fan';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/States';
import Button from '../../components/ui/Button';
import { TextAreaField, TextField } from '../../components/ui/Field';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FanMessagesPage() {
  const { user, profile } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const conversations = useAsync(
    () => (user ? fetchConversations(user.id) : Promise.resolve({ data: [], error: null })),
    [user?.id],
  );

  const messages = useAsync(
    () =>
      selectedId
        ? fetchMessages(selectedId)
        : Promise.resolve({ data: [], error: null }),
    [selectedId],
  );

  const selected = conversations.data?.find((c) => c.id === selectedId) ?? null;

  const startConversation = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!user) return;
    if (!subject.trim()) {
      setFormError('Please add a short subject.');
      return;
    }
    if (body.trim().length < 5) {
      setFormError('Please write your message (at least a few words).');
      return;
    }

    setSending(true);
    const { id, error } = await createConversation(user.id, subject.trim(), body.trim());
    setSending(false);

    if (error && !id) {
      setFormError(error);
      return;
    }
    setSubject('');
    setBody('');
    setComposing(false);
    conversations.reload();
    if (id) setSelectedId(id);
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!selectedId) return;
    if (!reply.trim()) return;

    setSending(true);
    const { error } = await sendMessage(selectedId, reply.trim());
    setSending(false);

    if (error) {
      setFormError(error);
      return;
    }
    setReply('');
    messages.reload();
    conversations.reload();
  };

  const profileName = profile?.name || user?.email || '';

  if (composing || conversations.data?.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <span className="t-meta">Fan Area</span>
          <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
            Messages
          </h1>
          <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
            Write to Gillian’s management and keep every reply in one private thread.
          </p>
        </header>

        <form className="ed-card space-y-4 p-6" onSubmit={startConversation} noValidate>
          <h2 className="t-h3">New message to management</h2>
          {formError && (
            <div className="form-alert form-alert-error" role="alert">
              {formError}
            </div>
          )}
          <TextField
            id="msg-subject"
            label="Subject"
            name="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this about?"
          />
          <TextAreaField
            id="msg-body"
            label="Your message"
            name="message"
            required
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message to the management office."
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" loading={sending}>
              <Send className="h-4 w-4" /> Send Message
            </Button>
            {conversations.data && conversations.data.length > 0 && (
              <Button variant="ghost" onClick={() => setComposing(false)}>
                Cancel
              </Button>
            )}
          </div>
          <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
            Sending as {profileName}. Management reviews every message and replies here.
          </p>
        </form>

        {conversations.data && conversations.data.length > 0 && (
          <section aria-label="Your conversations">
            <h2 className="t-h3">Your conversations</h2>
            <hr className="ed-rule mt-3" />
            <ul className="mt-4 space-y-2">
              {conversations.data.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setComposing(false);
                      setSelectedId(conversation.id);
                    }}
                    className="ed-card w-full p-4 text-left transition-colors"
                  >
                    <span className="t-h3 block" style={{ fontSize: '1rem' }}>
                      {conversation.subject || 'Conversation'}
                    </span>
                    <span className="t-caption mt-1 block" style={{ color: 'var(--ed-muted)' }}>
                      Started {formatDateTime(conversation.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (selectedId && selected) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--ed-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" /> All conversations
          </button>
          <span className="t-caption" style={{ color: 'var(--ed-muted)' }}>
            {formatDateTime(selected.last_message_at || selected.created_at)}
          </span>
        </div>

        <header>
          <span className="t-meta">Conversation</span>
          <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.4rem,2.6vw,1.85rem)' }}>
            {selected.subject || 'Conversation'}
          </h1>
        </header>

        <div className="space-y-3">
          {messages.loading && <LoadingState label="Loading messages" />}
          {messages.error && (
            <ErrorState title="Messages unavailable" onRetry={messages.reload} />
          )}
          {!messages.loading && !messages.error && messages.data?.length === 0 && (
            <EmptyState title="No messages yet" description="Start the conversation below." />
          )}
          {messages.data?.map((message) => {
            const fromUser = message.sender !== 'admin';
            return (
              <article
                key={message.id}
                className="ed-card p-4"
                style={{
                  marginLeft: fromUser ? '0' : 'clamp(0px, 12%, 5rem)',
                  marginRight: fromUser ? 'clamp(0px, 12%, 5rem)' : '0',
                  borderColor: fromUser ? 'var(--ed-line-strong)' : 'var(--ed-line)',
                }}
              >
                <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                  {fromUser ? 'You' : 'Management'} · {formatDateTime(message.created_at)}
                </p>
                <p className="t-body-sm mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </p>
              </article>
            );
          })}
        </div>

        <form className="ed-card space-y-4 p-5" onSubmit={sendReply} noValidate>
          {formError && (
            <div className="form-alert form-alert-error" role="alert">
              {formError}
            </div>
          )}
          <TextAreaField
            id="msg-reply"
            label="Reply"
            name="reply"
            rows={4}
            required
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply to management."
          />
          <Button type="submit" variant="primary" loading={sending} disabled={!reply.trim()}>
            <Send className="h-4 w-4" /> Send Reply
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="t-meta">Fan Area</span>
          <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
            Messages
          </h1>
        </div>
        <Button variant="primary" onClick={() => setComposing(true)}>
          <MessageSquare className="h-4 w-4" /> New Message
        </Button>
      </header>

      {conversations.loading && (
        <div className="space-y-3">
          <Skeleton style={{ height: '4.5rem' }} />
          <Skeleton style={{ height: '4.5rem' }} />
        </div>
      )}
      {conversations.error && (
        <ErrorState title="Conversations unavailable" onRetry={conversations.reload} />
      )}
      {!conversations.loading && !conversations.error && (conversations.data?.length ?? 0) === 0 && (
        <EmptyState
          title="No conversations yet"
          description="Write your first message to the management office."
          action={
            <Button variant="primary" onClick={() => setComposing(true)}>
              Start a Conversation
            </Button>
          }
        />
      )}

      <ul className="space-y-2">
        {conversations.data?.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className="ed-card w-full p-5 text-left transition-colors"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="t-h3" style={{ fontSize: '1.05rem' }}>
                  {conversation.subject || 'Conversation'}
                </span>
                <span className="t-caption shrink-0" style={{ color: 'var(--ed-muted)' }}>
                  {formatDateTime(conversation.last_message_at || conversation.created_at)}
                </span>
              </span>
              <span className="t-body-sm mt-1 block" style={{ color: 'var(--ed-muted)' }}>
                Open conversation →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
