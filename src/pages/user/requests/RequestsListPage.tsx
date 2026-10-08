import {Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Chip} from '../../../components/ui/Chip';
import {ListToolbar} from '../../../components/ui/ListToolbar';
import {Spinner} from '../../../components/ui/Spinner';
import {formatDate, relativeTime} from '../../../lib/format';
import {useLiveRefresh} from '../../../hooks/useLiveRefresh';
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

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);
  useLiveRefresh(refreshLive, ['requests', 'request_events']);

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-stone pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Requests</p>
          <h1 className="break-words text-2xl sm:text-3xl">Your requests</h1>
          <p className="mt-2 max-w-xl text-muted">
            Every request is read and reviewed by management. Nothing is promised automatically.
          </p>
        </div>
        <Link
          to="/dashboard/requests/new"
          className="btn btn-primary w-full min-h-11 justify-center sm:w-auto"
        >
          <Plus className="size-4" aria-hidden />
          New request
        </Link>
      </div>

      <ListToolbar
        className=""
        count={`${visible.length} of ${rows.length}`}
        filter={{
          value: filter,
          onChange: (value) => setFilter(value as typeof filter),
          label: 'Status',
          options: FILTERS.map((option) => ({
            value: option.key,
            label: option.key === 'all' ? 'All requests' : option.label,
          })),
        }}
      />

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
              <Link
                to={`/dashboard/requests/${request.id}`}
                className="block space-y-1.5 rounded-lg border border-[#EAE4DA] bg-white p-4 transition-colors hover:border-gold sm:p-5"
              >
                <span className="block break-words text-base text-charcoal sm:text-lg">
                  {request.title}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Chip tone={REQUEST_STATUS_TONES[request.status]}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </Chip>
                </span>
                <span className="block break-words text-xs text-muted">
                  {requestCategoryLabel(request.type)} · Submitted {formatDate(request.submitted_at)} ·{' '}
                  {relativeTime(request.created_at)}
                </span>
                {request.description ? (
                  <span className="line-clamp-2 text-sm leading-relaxed text-muted">
                    {request.description}
                  </span>
                ) : null}
                <span className="flex min-h-11 items-center justify-between border-t border-[#EAE4DA] pt-2 text-xs font-semibold uppercase tracking-wider text-gold-deep">
                  <span>View</span>
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
