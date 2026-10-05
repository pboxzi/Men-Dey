import {Search} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import {PROFILE_STATUS_LABELS, PROFILE_STATUS_TONES} from './shared';
import type {Profile} from '../../types';

type Status = Profile['status'];

const STATUS_FILTERS: Array<'all' | Status> = ['all', 'active', 'pending', 'suspended'];
const PLATFORM_ROLES: Profile['role'][] = ['user', 'management', 'admin'];

function roleTone(role: Profile['role']) {
  if (role === 'admin') return 'danger' as const;
  if (role === 'management') return 'gold' as const;
  return 'neutral' as const;
}

export function ManagementSecurityPage() {
  const {session, profile} = useAuth();
  const me = session?.user.id ?? '';
  const isAdmin = profile?.role === 'admin';

  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status, email_verified_at, created_at, updated_at')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setRows((data as Profile[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = useCallback(
    async (account: Profile, next: Status) => {
      setBusyId(account.id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('profiles')
          .update({status: next})
          .eq('id', account.id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The change was not saved. Account status is enforced server-side and requires an administrator.',
          );
        setNotice(
          `Account marked ${PROFILE_STATUS_LABELS[next].toLowerCase()}. The change is recorded in the audit log.`,
        );
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not change the account status.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  const changeRole = useCallback(
    async (account: Profile, next: Profile['role']) => {
      setBusyId(account.id);
      setActionError(null);
      setNotice(null);
      try {
        const {error: rpcError} = await supabase.rpc('admin_set_user_role', {
          p_user_id: account.id,
          p_role: next,
        });
        if (rpcError) throw new Error(rpcError.message);
        setNotice(`Platform role changed to ${next}. Recorded in the audit log.`);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not change the platform role.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading accounts" />;

  const query = search.trim().toLowerCase();
  const visible = rows.filter((account) => {
    if (statusFilter !== 'all' && account.status !== statusFilter) return false;
    if (!query) return true;
    return (
      (account.full_name ?? '').toLowerCase().includes(query) ||
      (account.email ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="Security"
        description="Account access across the platform — every change here is enforced in the database and written to the audit log."
      />

      <p className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
        Account status and roles are enforced server-side. Suspending an account removes access
        immediately, regardless of anything in the interface.
      </p>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className="surface p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : PROFILE_STATUS_LABELS[filter]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            {visible.length} of {rows.length} accounts
          </span>
        </div>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Search</span>
          <span className="flex items-center gap-2">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              className="field-input"
              value={search}
              placeholder="Name or email"
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>

        {visible.length === 0 ? (
          <EmptyState
            title="No accounts match."
            description="Adjust the search or status filter to see more accounts."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {visible.map((account) => (
              <li key={account.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {account.full_name || account.email}
                    </p>
                    <p className="text-xs text-muted">
                      {account.email} ·{' '}
                      {account.email_verified_at
                        ? `verified ${formatDate(account.email_verified_at)}`
                        : 'not verified'}{' '}
                      · joined {formatDate(account.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={roleTone(account.role)}>{account.role}</Chip>
                    <Chip tone={PROFILE_STATUS_TONES[account.status]}>
                      {PROFILE_STATUS_LABELS[account.status]}
                    </Chip>
                    {isAdmin ? (
                      account.id === me ? (
                        <span className="text-xs text-muted">Your account</span>
                      ) : confirmId === `status-${account.id}` ? (
                        <span className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setConfirmId(null)}
                          >
                            Keep
                          </Button>
                          {(
                            (['active', 'pending', 'suspended'] as Status[]).filter(
                              (value) => value !== account.status,
                            ) as Status[]
                          ).map((status) => (
                            <Button
                              key={status}
                              variant={status === 'suspended' ? 'ghost' : 'secondary'}
                              loading={busyId === account.id}
                              onClick={() => void changeStatus(account, status)}
                            >
                              {status === 'suspended' ? 'Confirm suspend' : `Mark ${status}`}
                            </Button>
                          ))}
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => setConfirmId(`status-${account.id}`)}>
                          Change status
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>

                {isAdmin && account.id !== me ? (
                  confirmId === `role-${account.id}` ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-sm border border-stone bg-stone/40 p-3">
                      <span className="text-xs text-muted">
                        Choose the new platform role — administrators only, recorded in the audit
                        log:
                      </span>
                      {PLATFORM_ROLES.filter((role) => role !== account.role).map((role) => (
                        <Button
                          key={role}
                          variant={role === 'admin' ? 'ghost' : 'secondary'}
                          loading={busyId === account.id}
                          onClick={() => void changeRole(account, role)}
                        >
                          Make {role}
                        </Button>
                      ))}
                      <Button variant="ghost" onClick={() => setConfirmId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-xs text-gold-deep hover:underline"
                        onClick={() => setConfirmId(`role-${account.id}`)}
                      >
                        Change platform role
                      </button>
                    </div>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-6" aria-label="How access is enforced">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          How access is enforced
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-charcoal">
          <li>Roles live in the database — the interface can never grant access on its own.</li>
          <li>
            Staff permissions are scoped through staff roles, checked inside every protected
            operation.
          </li>
          <li>Status and role changes are written to the audit log automatically.</li>
          <li>Suspending an account takes effect immediately, everywhere.</li>
        </ul>
      </section>
    </div>
  );
}
