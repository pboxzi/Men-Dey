import {Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Chip} from '../../../components/ui/Chip';
import {Spinner} from '../../../components/ui/Spinner';
import {formatDate, relativeTime} from '../../../lib/format';
import {REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES, requestCategoryLabel} from '../../../lib/requests';
import {supabase} from '../../../lib/supabase';
import type {Request, RequestStatus} from '../../../types';
import {EmptyNote, ErrorNote} from '../components/SectionCard';

const FILTERS: Array<{key: RequestStatus | 'all'; label: string}> = [
  {key: 'all', label: 'All'},
  {key: 'submitted', label: 'Submitted'},
  {key: 'in_review', label: 'Under Review'},
  {key: 'information_requested', label: 'Awaiting Information'},
  {key: 'proposal', label: 'Proposal'},
  {key: 'approved', label: 'Approved'},
  {key: 'scheduled', label: 'Scheduled'},
  {key: 'completed', label: 'Completed'},
  {key: 'declined', label: 'Declined'},
  {key: 'cancelled', label: 'Cancelled'},
];

export function RequestsListPage() {
  const [rows, setRows] = useState<Request[]>([]);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('requests')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setRows((data as Request[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="eyebrow mb-2">Requests</p>
          <h1 className="text-3xl md:text-4xl">Your requests</h1>
          <p className="mt-2 max-w-xl text-muted">
            Every request is read and reviewed by management. Nothing is promised automatically.
          </p>
        </div>
        <Link to="/dashboard/requests/new" className="btn btn-primary">
          <Plus className="size-4" aria-hidden />
          New request
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium tracking-wide transition-colors ${
              filter === option.key
                ? 'border-charcoal bg-charcoal text-alabaster'
                : 'border-stone bg-white text-muted hover:border-gold'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : visible.length === 0 ? (
        <EmptyNote
          title={rows.length === 0 ? 'Nothing here yet.' : 'No requests with this status.'}
          description={
            rows.length === 0
              ? 'When management receives your first request, it will appear here.'
              : 'Try another status filter, or start a new request.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((request) => (
            <li key={request.id}>
              <Link to={`/dashboard/requests/${request.id}`} className="surface block p-5 transition-colors hover:border-gold">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-lg text-charcoal">{request.title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {requestCategoryLabel(request.type)} · Submitted {formatDate(request.submitted_at)} ·{' '}
                      {relativeTime(request.created_at)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Chip tone={REQUEST_STATUS_TONES[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Chip>
                  </span>
                </div>
                {request.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{request.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
