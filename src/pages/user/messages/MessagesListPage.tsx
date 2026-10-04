import {MessageSquare, PenLine} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../../../auth/AuthContext';
import {Spinner} from '../../../components/ui/Spinner';
import {loadConversationSummaries, type ConversationSummary} from '../../../lib/conversations';
import {relativeTime} from '../../../lib/format';
import {onRowInserted} from '../../../lib/realtime';
import {supabase} from '../../../lib/supabase';
import {EmptyNote, ErrorNote, SectionCard} from '../components/SectionCard';

export function MessagesListPage() {
  const {session, profile} = useAuth();
  const navigate = useNavigate();
  const me = session?.user.id ?? null;

  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {conversations, unreadByConversation: counts} = await loadConversationSummaries(me);
      setRows(conversations);
      setUnreadByConversation(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your conversations.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => onRowInserted('management_messages', () => void load()), [load]);

  const startConversation = useCallback(async () => {
    if (!me) return;
    setStarting(true);
    setStartError(null);
    try {
      const existing = rows.find((r) => r.status !== 'closed');
      if (existing) {
        navigate(`/dashboard/messages/${existing.id}`);
        return;
      }
      const {data, error: insertError} = await supabase
        .from('management_conversations')
        .insert({
          user_id: me,
          subject: profile?.full_name
            ? `Conversation with management — ${profile.full_name}`
            : 'Conversation with management',
          status: 'open',
        })
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);
      navigate(`/dashboard/messages/${data.id}`);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start a conversation.');
    } finally {
      setStarting(false);
    }
  }, [me, navigate, profile, rows]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="eyebrow mb-2">Messages</p>
          <h1 className="text-3xl md:text-4xl">Your conversations</h1>
          <p className="mt-2 text-muted">
            You speak with management first. Everything stays private between you and the management
            office.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void startConversation()} disabled={starting}>
          {starting ? <Spinner /> : <PenLine className="size-4" aria-hidden />}
          Talk to management
        </button>
      </div>

      {startError ? <ErrorNote message={startError} /> : null}

      {error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <EmptyNote
          title="No conversations yet."
          description="When you write to management, your private conversation will appear here."
        />
      ) : (
        <SectionCard title="Conversations">
          <ul className="divide-y divide-stone">
            {rows.map((row) => {
              const last = row.last;
              const unread = unreadByConversation[row.id] ?? 0;
              return (
                <li key={row.id}>
                  <Link
                    to={`/dashboard/messages/${row.id}`}
                    className="flex items-start justify-between gap-4 py-4 transition-colors hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="size-4 shrink-0 text-gold-deep" aria-hidden />
                        <span className="truncate text-sm font-semibold text-charcoal">{row.subject}</span>
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted">
                        {last
                          ? `${last.sender_id === me ? 'You: ' : 'Management: '}${last.body}`
                          : 'No messages yet.'}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-xs text-muted">
                        {relativeTime(last?.created_at ?? row.updated_at)}
                      </span>
                      {unread > 0 ? (
                        <span className="inline-flex min-w-5 justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold leading-5 text-charcoal">
                          {unread}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
