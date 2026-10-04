import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {ExperienceRequest} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'Under Review',
  requirements: 'Awaiting Information',
  proposed: 'Proposal',
  approved: 'Approved',
  declined: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Row extends ExperienceRequest {
  experience: {title: string; starts_at: string | null} | null;
}

export function ExperiencesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('experience_requests')
        .select('*, experience:experiences(title, starts_at)')
        .order('created_at', {ascending: false})
        .limit(100);
      if (resError) throw new Error(resError.message);
      setRows((data as Row[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load experiences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="eyebrow mb-2">Experiences</p>
          <h1 className="text-3xl md:text-4xl">Experiences</h1>
          <p className="mt-2 max-w-xl text-muted">
            Experiences are proposed and arranged by management. Nothing here is confirmed until
            management approves and schedules it.
          </p>
        </div>
        <Link to="/dashboard/requests/new" className="btn btn-primary">
          Request an experience
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <EmptyNote
          title="Nothing here yet."
          description="When management proposes or approves an experience for you, it will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="surface flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-lg text-charcoal">{row.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {row.experience ? `${row.experience.title} · ` : ''}
                  {row.experience?.starts_at ? `Starts ${formatDate(row.experience.starts_at)}` : `Submitted ${formatDate(row.created_at)}`}
                </p>
              </div>
              <Chip tone={row.status === 'approved' || row.status === 'completed' ? 'success' : 'info'}>
                {STATUS_LABELS[row.status] ?? row.status}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
