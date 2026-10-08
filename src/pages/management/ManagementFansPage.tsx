import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {ListToolbar} from '../../components/ui/ListToolbar';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {supabase} from '../../lib/supabase';
import {PROFILE_STATUS_LABELS, PROFILE_STATUS_TONES} from './shared';
import type {ProfileStatus} from '../../types';

interface FanRow {
  id: string;
  email: string | null;
  full_name: string | null;
  status: ProfileStatus;
  country: string | null;
  city: string | null;
  profile_photo: string | null;
  occupation: string | null;
  created_at: string;
}

type StatusFilter = 'all' | ProfileStatus;

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'pending', 'suspended'];

function displayName(row: Pick<FanRow, 'full_name' | 'email'>): string {
  return row.full_name || row.email || 'Account';
}

function initialsFor(row: Pick<FanRow, 'full_name' | 'email'>): string {
  const source = (row.full_name || row.email || '?').trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function ManagementFansPage() {
  const [fans, setFans] = useState<FanRow[]>([]);
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
        .from('profiles')
        .select(
          'id, email, full_name, status, country, city, profile_photo, occupation, created_at',
        )
        .eq('role', 'user')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setFans((data as FanRow[]) ?? []);
      setSearch('');
      setStatusFilter('all');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load fan accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading fans" />;

  const query = debouncedSearch.trim().toLowerCase();
  const visible = fans.filter((fan) => {
    if (statusFilter !== 'all' && fan.status !== statusFilter) return false;
    if (!query) return true;
    return (
      (fan.full_name ?? '').toLowerCase().includes(query) ||
      (fan.email ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Relationships"
        title="Fans"
        description="Every account under management, with a direct path to each member record."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="surface p-4 sm:p-6">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Name or email"
          count={`${visible.length} of ${fans.length} accounts`}
          filter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as typeof statusFilter),
            label: 'Status',
            options: STATUS_FILTERS.map((value) => ({
              value,
              label: value === 'all' ? 'All statuses' : PROFILE_STATUS_LABELS[value],
            })),
          }}
        />

        {visible.length === 0 ? (
          <EmptyState
            title="No accounts match."
            description={
              fans.length === 0
                ? 'Fan accounts appear here as soon as they complete their application.'
                : 'Adjust the search or status filter to see more accounts.'
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {visible.map((fan) => (
                  <li key={fan.id}>
                    <Link
                      to={`/management/fans/${fan.id}`}
                      className="flex flex-wrap items-center justify-between gap-4 py-3 hover:bg-stone/40"
                    >
                      <span className="flex flex-wrap min-w-0 items-center gap-3">
                        {fan.profile_photo ? (
                          <img
                            src={fan.profile_photo}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone text-xs font-medium text-gold-deep">
                            {initialsFor(fan)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-charcoal">
                            {displayName(fan)}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {fan.occupation ? `${fan.occupation} · ` : ''}
                            {fan.country || fan.city ? [fan.city, fan.country].filter(Boolean).join(', ') : 'Location not set'}{' '}
                            · joined {formatDate(fan.created_at)}
                          </span>
                        </span>
                      </span>
                      <Chip tone={PROFILE_STATUS_TONES[fan.status]}>
                        {PROFILE_STATUS_LABELS[fan.status]}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {visible.map((fan) => (
                <div
                  key={fan.id}
                  className="block py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                      {displayName(fan)}
                    </span>
                    <span className="shrink-0">
                      <Chip tone={PROFILE_STATUS_TONES[fan.status]}>
                        {PROFILE_STATUS_LABELS[fan.status]}
                      </Chip>
                    </span>
                  </div>
                  {fan.full_name ? (
                    <p className="break-words text-xs text-muted">{fan.email ?? 'Email not on file'}</p>
                  ) : null}
                  <p className="break-words text-xs text-muted">
                    {fan.occupation ? `${fan.occupation} · ` : ''}
                    {fan.country || fan.city
                      ? [fan.city, fan.country].filter(Boolean).join(', ')
                      : 'Location not set'}
                  </p>
                  <p className="text-xs text-muted">joined {formatDate(fan.created_at)}</p>
                  <Link
                    to={`/management/fans/${fan.id}`}
                    className="flex items-center justify-between gap-2 min-h-11 border-t border-stone pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep hover:text-gold"
                  >
                    <span>View</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
