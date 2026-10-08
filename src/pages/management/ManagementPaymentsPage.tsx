import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {ListToolbar} from '../../components/ui/ListToolbar';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {formatPrice} from '../../lib/membership';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '../../lib/payments';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {supabase} from '../../lib/supabase';
import type {MembershipPayment, ExperiencePayment, PaymentStatus} from '../../types';

interface MembershipPaymentRow extends MembershipPayment {
  membership?:
    | {id: string; membership_number: string | null; user?: {email: string | null}[] | null}
    | []
    | null;
  user?: {email: string | null; full_name: string | null}[] | null;
}

interface ExperiencePaymentRow extends ExperiencePayment {
  request?: {id: string; title: string}[] | null;
}

type Tab = 'memberships' | 'experiences';

const STATUS_FILTERS: Array<'all' | PaymentStatus> = [
  'all',
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'cancelled',
];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function ManagementPaymentsPage() {
  const [tab, setTab] = useState<Tab>('memberships');
  const [memberships, setMemberships] = useState<MembershipPaymentRow[]>([]);
  const [experiences, setExperiences] = useState<ExperiencePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membershipRes, experienceRes] = await Promise.all([
        supabase
          .from('membership_payments')
          .select(
            '*, membership:memberships(id, membership_number, user:profiles(email, full_name))',
          )
          .order('created_at', {ascending: false})
          .limit(200),
        supabase
          .from('experience_payments')
          .select('*, request:requests(id, title)')
          .order('created_at', {ascending: false})
          .limit(200),
      ]);
      const firstError = [membershipRes, experienceRes].map((result) => result.error).find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setMemberships((membershipRes.data as MembershipPaymentRow[]) ?? []);
      setExperiences((experienceRes.data as ExperiencePaymentRow[]) ?? []);
      setStatusFilter('all');
      setSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (
      table: 'membership_payments' | 'experience_payments',
      id: string,
      next: PaymentStatus,
      failureMessage: string,
    ) => {
      setBusyId(id);
      setActionError(null);
      setNotice(null);
      try {
        const payload: {status: PaymentStatus; paid_at?: string | null} = {status: next};
        if (next === 'paid') payload.paid_at = new Date().toISOString();
        const {data: updated, error: updateError} = await supabase
          .from(table)
          .update(payload)
          .eq('id', id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated) throw new Error(failureMessage);
        setNotice(`Payment marked ${next}.`);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : failureMessage);
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading payments" />;

  const query = debouncedSearch.trim().toLowerCase();
  const visibleMemberships = memberships.filter((payment) => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (!query) return true;
    const membership = first(payment.membership);
    const person = first(membership?.user);
    return (
      (payment.reference ?? '').toLowerCase().includes(query) ||
      (person?.email ?? '').toLowerCase().includes(query) ||
      (membership?.membership_number ?? '').toLowerCase().includes(query)
    );
  });
  const visibleExperiences = experiences.filter((payment) => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (!query) return true;
    const request = first(payment.request);
    return (
      (payment.reference ?? '').toLowerCase().includes(query) ||
      (request?.title ?? '').toLowerCase().includes(query)
    );
  });
  const visible = tab === 'memberships' ? visibleMemberships : visibleExperiences;

  const renderActions = (
    table: 'membership_payments' | 'experience_payments',
    payment: {id: string; status: PaymentStatus},
    className = '',
  ) => {
    if (payment.status !== 'pending' && payment.status !== 'processing') return null;
    const verifyLabel =
      table === 'membership_payments' ? 'Verify payment (membership)' : 'Verify payment';
    return confirmId === payment.id ? (
      <span className={`flex gap-2 ${className}`.trim()}>
        <Button variant="ghost" onClick={() => setConfirmId(null)}>
          Back
        </Button>
        <Button
          variant="secondary"
          loading={busyId === payment.id}
          onClick={() =>
            void updateStatus(
              table,
              payment.id,
              'paid',
              'This update was not saved. Verifying payments requires the payments.manage permission.',
            )
          }
        >
          Confirm paid
        </Button>
      </span>
    ) : (
      <span className={`flex gap-2 ${className}`.trim()}>
        <Button variant="secondary" onClick={() => setConfirmId(payment.id)}>
          {verifyLabel}
        </Button>
        <Button
          variant="ghost"
          loading={busyId === payment.id}
          onClick={() =>
            void updateStatus(
              table,
              payment.id,
              'failed',
              'This update was not saved. Payments require the payments.manage permission.',
            )
          }
        >
          Mark failed
        </Button>
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Business"
        title="Payments"
        description="Membership and experience payments — every row links to the record it belongs to. No credentials are ever shown here."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="filter-row">
        <button
          type="button"
          className={`filter-chip ${tab === 'memberships' ? 'is-active' : ''}`}
          onClick={() => setTab('memberships')}
        >
          Membership payments
        </button>
        <button
          type="button"
          className={`filter-chip ${tab === 'experiences' ? 'is-active' : ''}`}
          onClick={() => setTab('experiences')}
        >
          Experience payments
        </button>
      </div>

      <section className="surface p-4 sm:p-6">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Reference or member"
          count={`${visible.length} shown`}
          filter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as typeof statusFilter),
            label: 'Status',
            options: STATUS_FILTERS.map((value) => ({
              value,
              label: value === 'all' ? 'All statuses' : PAYMENT_STATUS_LABELS[value],
            })),
          }}
        />

        {visible.length === 0 ? (
          <EmptyState
            title="No payments match."
            description="Payments appear here as soon as a membership or experience reaches the payment stage."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {tab === 'memberships'
                  ? visibleMemberships.map((payment) => {
                      const membership = first(payment.membership);
                      const person = first(membership?.user);
                      return (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0">
                            <Link
                              to={`/management/memberships/${payment.membership_id}`}
                              className="block truncate text-sm font-medium text-charcoal hover:underline"
                            >
                              {formatPrice(payment.amount_cents, payment.currency)}
                            </Link>
                            <p className="truncate text-xs text-muted">
                              {person?.email ?? membership?.membership_number ?? 'Member'} ·{' '}
                              {PAYMENT_PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? 'Provider not set'}{' '}
                              · ref {payment.reference || '—'} · created {formatDate(payment.created_at)}
                              {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                              {PAYMENT_STATUS_LABELS[payment.status]}
                            </Chip>
                            {renderActions('membership_payments', payment)}
                          </div>
                        </li>
                      );
                    })
                  : visibleExperiences.map((payment) => {
                      const request = first(payment.request);
                      return (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0">
                            <Link
                              to={`/management/requests/${payment.request_id}`}
                              className="block truncate text-sm font-medium text-charcoal hover:underline"
                            >
                              {formatPrice(payment.amount_cents, payment.currency)} —{' '}
                              {request?.title ?? 'Request'}
                            </Link>
                            <p className="truncate text-xs text-muted">
                              {PAYMENT_PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? 'Provider not set'}{' '}
                              · ref {payment.reference || '—'} · created {formatDate(payment.created_at)}
                              {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                              {PAYMENT_STATUS_LABELS[payment.status]}
                            </Chip>
                            {renderActions('experience_payments', payment)}
                          </div>
                        </li>
                      );
                    })}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {tab === 'memberships'
                ? visibleMemberships.map((payment) => {
                    const membership = first(payment.membership);
                    const person = first(membership?.user);
                    const actions = renderActions('membership_payments', payment, 'flex-wrap');
                    return (
                      <div
                        key={payment.id}
                        className="block py-3 space-y-1"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                            {formatPrice(payment.amount_cents, payment.currency)}
                          </span>
                          <span className="shrink-0">
                            <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                              {PAYMENT_STATUS_LABELS[payment.status]}
                            </Chip>
                          </span>
                        </div>
                        <p className="break-words text-xs text-muted">
                          {person?.email ?? membership?.membership_number ?? 'Member'}
                        </p>
                        <p className="break-words text-xs text-muted">
                          {PAYMENT_PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? 'Provider not set'}{' '}
                          · ref {payment.reference || '—'}
                        </p>
                        <p className="break-words text-xs text-muted">
                          created {formatDate(payment.created_at)}
                          {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                        </p>
                        {actions ? <div className="pt-1">{actions}</div> : null}
                        <Link
                          to={`/management/memberships/${payment.membership_id}`}
                          className="flex items-center justify-between gap-2 min-h-11 border-t border-stone pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep hover:text-gold"
                        >
                          <span>View membership</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    );
                  })
                : visibleExperiences.map((payment) => {
                    const request = first(payment.request);
                    const actions = renderActions('experience_payments', payment, 'flex-wrap');
                    return (
                      <div
                        key={payment.id}
                        className="block py-3 space-y-1"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                            {formatPrice(payment.amount_cents, payment.currency)} —{' '}
                            {request?.title ?? 'Request'}
                          </span>
                          <span className="shrink-0">
                            <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                              {PAYMENT_STATUS_LABELS[payment.status]}
                            </Chip>
                          </span>
                        </div>
                        <p className="break-words text-xs text-muted">
                          {PAYMENT_PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? 'Provider not set'}{' '}
                          · ref {payment.reference || '—'}
                        </p>
                        <p className="break-words text-xs text-muted">
                          created {formatDate(payment.created_at)}
                          {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                        </p>
                        {actions ? <div className="pt-1">{actions}</div> : null}
                        <Link
                          to={`/management/requests/${payment.request_id}`}
                          className="flex items-center justify-between gap-2 min-h-11 border-t border-stone pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep hover:text-gold"
                        >
                          <span>View request</span>
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
