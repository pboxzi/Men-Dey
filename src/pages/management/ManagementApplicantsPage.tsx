import {ArrowRight, Search} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {relativeTime} from '../../lib/format';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {supabase} from '../../lib/supabase';
import {APPLICANT_STATUS_LABELS, APPLICANT_STATUS_TONES} from './shared';
import type {ApplicantStatus} from '../../types';

interface ApplicantRow {
  id: string;
  status: ApplicantStatus;
  headline: string | null;
  submitted_at: string | null;
  created_at: string;
  user?: {email: string | null; full_name: string | null}[] | null;
}

type StatusFilter = 'all' | ApplicantStatus;

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'new',
  'submitted',
  'in_review',
  'approved',
  'rejected',
];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function applicantName(row: ApplicantRow): string {
  const person = first(row.user);
  return person?.full_name || person?.email || 'Applicant';
}

export function ManagementApplicantsPage() {
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('applicant_profiles')
        .select('id, status, headline, submitted_at, created_at, user:profiles(email, full_name)')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setApplicants((data as ApplicantRow[]) ?? []);
      setSearch('');
      setStatusFilter('all');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load applicants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading applicants" />;

  const query = debouncedSearch.trim().toLowerCase();
  const visible = applicants.filter((applicant) => {
    if (statusFilter !== 'all' && applicant.status !== statusFilter) return false;
    if (!query) return true;
    const person = first(applicant.user);
    return (
      (person?.full_name ?? '').toLowerCase().includes(query) ||
      (person?.email ?? '').toLowerCase().includes(query) ||
      (applicant.headline ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Relationships"
        title="Applicants"
        description="Applications awaiting review — every row opens the full application for a decision."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : APPLICANT_STATUS_LABELS[filter]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            {visible.length} of {applicants.length}
          </span>
        </div>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Search</span>
          <span className="flex items-center gap-2">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              className="field-input"
              value={search}
              placeholder="Name, email or headline"
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>

        {visible.length === 0 ? (
          <EmptyState
            title="No applicants match."
            description={
              applicants.length === 0
                ? 'New applications arrive here as soon as someone completes the application form.'
                : 'Adjust the search or status filter to see more applications.'
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {visible.map((applicant) => (
                  <li key={applicant.id}>
                    <Link
                      to={`/management/applicants/${applicant.id}`}
                      className="flex flex-wrap items-center justify-between gap-4 py-3.5 hover:bg-stone/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-charcoal">
                          {applicantName(applicant)}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {applicant.headline ? `${applicant.headline} · ` : ''}
                          {applicant.submitted_at
                            ? `submitted ${relativeTime(applicant.submitted_at)}`
                            : `started ${relativeTime(applicant.created_at)}`}
                        </span>
                      </span>
                      <span className="flex flex-wrap shrink-0 items-center gap-3">
                        <Chip tone={APPLICANT_STATUS_TONES[applicant.status]}>
                          {APPLICANT_STATUS_LABELS[applicant.status]}
                        </Chip>
                        <ArrowRight className="size-4 text-muted" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 md:hidden">
              {visible.map((applicant) => {
                const person = first(applicant.user);
                return (
                  <div
                    key={applicant.id}
                    className="bg-white border border-[#EAE4DA] rounded-lg p-4 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                        {applicantName(applicant)}
                      </span>
                      <span className="shrink-0">
                        <Chip tone={APPLICANT_STATUS_TONES[applicant.status]}>
                          {APPLICANT_STATUS_LABELS[applicant.status]}
                        </Chip>
                      </span>
                    </div>
                    <p className="break-words text-xs text-muted">
                      {applicant.headline ?? 'No headline'}
                    </p>
                    {person?.full_name ? (
                      <p className="break-words text-xs text-muted">
                        {person.email ?? 'Email not on file'}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      {applicant.submitted_at
                        ? `submitted ${relativeTime(applicant.submitted_at)}`
                        : `started ${relativeTime(applicant.created_at)}`}
                    </p>
                    <Link
                      to={`/management/applicants/${applicant.id}`}
                      className="flex items-center justify-between min-h-11 border-t border-[#EAE4DA] pt-2 text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-gold"
                    >
                      <span>View</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
