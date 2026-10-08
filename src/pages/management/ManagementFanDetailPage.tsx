import {ArrowLeft, Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime, relativeTime} from '../../lib/format';
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_TONES,
} from '../../lib/membership';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import {
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_STATUS_TONES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_LABELS,
  PROFILE_STATUS_LABELS,
  PROFILE_STATUS_TONES,
} from './shared';
import type {Membership, Profile, Request} from '../../types';

interface ConversationRow {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
}

interface DocumentRowLite {
  id: string;
  title: string;
  category: string;
  visibility: string;
  created_at: string;
}

interface NoteRow {
  id: string;
  body: string;
  created_at: string;
  author?: {email: string | null; full_name: string | null}[] | null;
}

interface FanData {
  profile: Profile | null;
  memberships: Membership[];
  requests: Request[];
  conversations: ConversationRow[];
  documents: DocumentRowLite[];
  notes: NoteRow[];
}

const EMPTY: FanData = {
  profile: null,
  memberships: [],
  requests: [],
  conversations: [],
  documents: [],
  notes: [],
};

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function personLabel(person: {email: string | null; full_name: string | null} | null): string {
  return person?.full_name || person?.email || 'Unknown';
}

export function ManagementFanDetailPage() {
  const {id = ''} = useParams();
  const {session} = useAuth();

  const [data, setData] = useState<FanData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, membershipsRes, requestsRes, conversationsRes, documentsRes, notesRes] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
          supabase
            .from('memberships')
            .select('*, tier:membership_tiers(name)')
            .eq('user_id', id)
            .order('created_at', {ascending: false}),
          supabase
            .from('requests')
            .select('*')
            .eq('user_id', id)
            .order('submitted_at', {ascending: false})
            .limit(50),
          supabase
            .from('management_conversations')
            .select('id, subject, status, updated_at')
            .eq('user_id', id)
            .order('updated_at', {ascending: false})
            .limit(50),
          supabase
            .from('documents')
            .select('id, title, category, visibility, created_at')
            .eq('owner_user_id', id)
            .is('archived_at', null)
            .order('created_at', {ascending: false})
            .limit(50),
          supabase
            .from('management_notes')
            .select('id, body, created_at, author:profiles(full_name, email)')
            .eq('user_id', id)
            .order('created_at', {ascending: false})
            .limit(50),
        ]);
      const firstError = [profileRes, membershipsRes, requestsRes, conversationsRes, documentsRes, notesRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setData({
        profile: (profileRes.data as Profile | null) ?? null,
        memberships: (membershipsRes.data as Membership[]) ?? [],
        requests: (requestsRes.data as Request[]) ?? [],
        conversations: (conversationsRes.data as ConversationRow[]) ?? [],
        documents: (documentsRes.data as DocumentRowLite[]) ?? [],
        notes: (notesRes.data as NoteRow[]) ?? [],
      });
      setNoteBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this account.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveNote = useCallback(async () => {
    const body = noteBody.trim();
    if (!body) {
      setActionError('Write the note before saving.');
      return;
    }
    setSavingNote(true);
    setActionError(null);
    try {
      const me = session?.user.id;
      if (!me) throw new Error('You are not signed in.');
      const {error: insertError} = await supabase.from('management_notes').insert({
        user_id: id,
        author_id: me,
        body,
      });
      if (insertError) throw new Error(insertError.message);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save the note.');
    } finally {
      setSavingNote(false);
    }
  }, [id, load, noteBody, session]);

  if (loading) return <Spinner label="Loading account" />;

  const profile = data.profile;
  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Fans" title="Account not found" />
        <EmptyState
          title="No account here."
          description="This account may have been removed, or the link is out of date."
        />
        <Link to="/management/fans" className="text-sm text-gold-deep hover:underline py-3 sm:py-0">
          Back to fans
        </Link>
      </div>
    );
  }

  const info: Array<{label: string; value: string}> = [
    {label: 'Email', value: profile.email ?? ''},
    {label: 'Phone', value: profile.phone ?? ''},
    {label: 'Country', value: profile.country ?? ''},
    {label: 'City', value: profile.city ?? ''},
    {label: 'Occupation', value: profile.occupation ?? ''},
    {label: 'Company', value: profile.company ?? ''},
    {label: 'Website', value: profile.website ?? ''},
    {
      label: 'Preferred contact',
      value: profile.preferred_contact_method ?? '',
    },
    {label: 'Date of birth', value: profile.date_of_birth ? formatDate(profile.date_of_birth) : ''},
    {label: 'Member since', value: formatDate(profile.created_at)},
  ].filter((row) => row.value);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Fans"
        title={profile.full_name || profile.email || 'Account'}
        description={profile.email ?? undefined}
        actions={
          <Link to="/management/fans" className="btn btn-ghost">
            <ArrowLeft className="size-4" aria-hidden /> All fans
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={PROFILE_STATUS_TONES[profile.status]}>
          {PROFILE_STATUS_LABELS[profile.status]}
        </Chip>
        <Chip tone="neutral">{profile.role}</Chip>
        <Link to="/management/applicants" className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0">
          Application history
        </Link>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      <section className="surface p-4 sm:p-6" aria-label="Profile">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Profile
        </h2>
        {info.length === 0 ? (
          <p className="text-sm text-muted">This account has not filled in profile details yet.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {info.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wider text-muted">{row.label}</dt>
                <dd className="mt-0.5 break-words text-sm text-charcoal">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="surface p-4 sm:p-6" aria-label="Memberships">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Memberships
            </h2>
            <span className="text-xs text-muted">{data.memberships.length} total</span>
          </div>
          {data.memberships.length === 0 ? (
            <p className="text-sm text-muted">No memberships yet.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.memberships.map((membership) => (
                <li key={membership.id}>
                  <Link
                    to={`/management/memberships/${membership.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">
                        {membership.membership_number ?? 'Membership'}
                      </span>
                      <span className="block text-xs text-muted">
                        since {formatDate(membership.activation_date ?? membership.created_at)}
                      </span>
                    </span>
                    <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
                      {MEMBERSHIP_STATUS_LABELS[membership.status]}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-6" aria-label="Requests">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Requests
            </h2>
            <span className="text-xs text-muted">{data.requests.length} total</span>
          </div>
          {data.requests.length === 0 ? (
            <p className="text-sm text-muted">No requests submitted yet.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.requests.map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/management/requests/${request.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">{request.title}</span>
                      <span className="block text-xs text-muted">
                        {relativeTime(request.submitted_at)}
                      </span>
                    </span>
                    <Chip tone={REQUEST_STATUS_TONES[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-6" aria-label="Conversations">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Conversations
            </h2>
            <span className="text-xs text-muted">{data.conversations.length} total</span>
          </div>
          {data.conversations.length === 0 ? (
            <p className="text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    to={`/management/messages/${conversation.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-charcoal">
                        {conversation.subject}
                      </span>
                      <span className="block text-xs text-muted">
                        updated {relativeTime(conversation.updated_at)}
                      </span>
                    </span>
                    <Chip tone={CONVERSATION_STATUS_TONES[conversation.status] ?? 'neutral'}>
                      {CONVERSATION_STATUS_LABELS[conversation.status] ?? conversation.status}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-6" aria-label="Documents">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Documents
            </h2>
            <Link to="/management/documents" className="text-xs text-gold-deep hover:underline py-3.5 sm:py-0">
              Document centre
            </Link>
          </div>
          {data.documents.length === 0 ? (
            <p className="text-sm text-muted">No documents on file.</p>
          ) : (
            <ul className="divide-y divide-stone">
              {data.documents.map((document) => (
                <li key={document.id} className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-charcoal">{document.title}</span>
                    <span className="block text-xs text-muted">
                      {DOCUMENT_CATEGORY_LABELS[document.category] ?? document.category} ·{' '}
                      {formatDate(document.created_at)}
                    </span>
                  </span>
                  <Chip tone="neutral">
                    {DOCUMENT_VISIBILITY_LABELS[document.visibility] ?? document.visibility}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface p-4 sm:p-6" aria-label="Internal notes">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Internal notes
          </h2>
          <Chip tone="gold">Internal — never visible to the fan</Chip>
        </div>

        <div className="mb-5">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Add a note</span>
            <textarea
              className="field-input min-h-20 resize-y"
              rows={3}
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
            />
          </label>
          <div className="mt-2">
            <Button onClick={() => void saveNote()} loading={savingNote}>
              <Plus className="size-4" aria-hidden /> Save note
            </Button>
          </div>
        </div>

        {data.notes.length === 0 ? (
          <p className="text-sm text-muted">No internal notes yet.</p>
        ) : (
          <ul className="divide-y divide-stone">
            {data.notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="whitespace-pre-wrap text-sm text-charcoal">{note.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {personLabel(first(note.author))} · {formatDateTime(note.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
