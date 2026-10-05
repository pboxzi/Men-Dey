import {ArrowRight, Search} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES, requestCategoryLabel} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import {PRIORITY_LABELS, PRIORITY_TONES} from './shared';
import type {Request, RequestStatus} from '../../types';

interface RequestRow extends Request {
  user?: {email: string | null; full_name: string | null}[] | null;
}

const STATUS_FILTERS: Array<'all' | RequestStatus> = [
  'all',
  'submitted',
  'in_review',
  'information_requested',
  'proposal',
  'payment_required',
  'confirmed',
  'approved',
  'scheduled',
  'completed',
  'declined',
  'cancelled',
];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function ManagementRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('requests')
        .select('*, user:profiles(email, full_name)')
        .order('submitted_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setRequests((data as RequestRow[]) ?? []);
      setSearch('');
      setStatusFilter('all');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading requests" />;

  const query = search.trim().toLowerCase();
  const visible = requests.filter((request) => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (!query) return true;
    const person = first(request.user);
    return (
      request.title.toLowerCase().includes(query) ||
      (person?.full_name ?? '').toLowerCase().includes(query) ||
      (person?.email ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Relationships"
        title="Requests"
        description="Every request routed through management, each row opening the full record and its history."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="surface p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : REQUEST_STATUS_LABELS[filter]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            {visible.length} of {requests.length}
          </span>
        </div>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Search</span>
          <span className="flex items-center gap-2">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              className="field-input"
              value={search}
              placeholder="Title or requester"
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>

        {visible.length === 0 ? (
          <EmptyState
            title="No requests match."
            description={
              requests.length === 0
                ? 'Requests submitted by members appear here immediately.'
                : 'Adjust the search or status filter to see more requests.'
            }
          />
        ) : (
          <ul className="divide-y divide-stone">
            {visible.map((request) => {
              const person = first(request.user);
              return (
                <li key={request.id}>
                  <Link
                    to={`/management/requests/${request.id}`}
                    className="flex items-center justify-between gap-4 py-3.5 hover:bg-stone/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-charcoal">
                        {request.title}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {person?.full_name || person?.email || 'Account'} ·{' '}
                        {requestCategoryLabel(request.type)} · {formatDate(request.submitted_at)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Chip tone={PRIORITY_TONES[request.priority] ?? 'neutral'}>
                        {PRIORITY_LABELS[request.priority] ?? request.priority}
                      </Chip>
                      <Chip tone={REQUEST_STATUS_TONES[request.status]}>
                        {REQUEST_STATUS_LABELS[request.status]}
                      </Chip>
                      <ArrowRight className="size-4 text-muted" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
