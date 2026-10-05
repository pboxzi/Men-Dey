import {ArrowLeft, CreditCard} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {Chip} from '../../../components/ui/Chip';
import {Spinner} from '../../../components/ui/Spinner';
import {formatDate} from '../../../lib/format';
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_TONES,
  TIER_INTERVAL_LABELS,
  formatPrice,
} from '../../../lib/membership';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '../../../lib/payments';
import {supabase} from '../../../lib/supabase';
import type {
  Membership,
  MembershipCard,
  MembershipPayment,
  MembershipTier,
} from '../../../types';
import {ErrorNote} from '../components/SectionCard';

interface DetailRow {
  membership: Membership;
  tier: MembershipTier | null;
  card: MembershipCard | null;
  payments: MembershipPayment[];
}

function Row({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-charcoal">{value}</dd>
    </div>
  );
}

export function MembershipDetailPage() {
  const {id = ''} = useParams();
  const [data, setData] = useState<DetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const membershipRes = await supabase
        .from('memberships')
        .select('*, tier:membership_tiers(*), card:membership_cards(*)')
        .eq('id', id)
        .maybeSingle();
      if (membershipRes.error) throw new Error(membershipRes.error.message);
      if (!membershipRes.data) throw new Error('This membership could not be found.');

      const membership = membershipRes.data as Membership & {
        tier?: MembershipTier | null;
        card?: MembershipCard | null;
      };

      const paymentsRes = await supabase
        .from('membership_payments')
        .select('*')
        .eq('membership_id', membership.id)
        .order('created_at', {ascending: false});
      if (paymentsRes.error) throw new Error(paymentsRes.error.message);

      setData({
        membership,
        tier: membership.tier ?? null,
        card: membership.card ?? null,
        payments: (paymentsRes.data as MembershipPayment[]) ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this membership.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/membership" className="nav-link inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Membership
        </Link>
        <ErrorNote message={error ?? 'Membership not found.'} onRetry={() => void load()} />
      </div>
    );
  }

  const {membership, tier, card, payments} = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-stone pb-6">
        <Link to="/dashboard/membership" className="nav-link mb-2 inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Membership
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">{tier?.name ?? 'Membership'}</p>
            <h1 className="text-3xl md:text-4xl">
              {membership.membership_number ?? 'Membership details'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Reference {membership.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
            {MEMBERSHIP_STATUS_LABELS[membership.status]}
          </Chip>
        </div>
      </div>

      <section className="surface p-6">
        <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Overview
        </h2>
        <dl className="divide-y divide-stone">
          <Row label="Tier" value={tier?.name ?? null} />
          <Row
            label="Price"
            value={
              tier
                ? tier.price_cents > 0
                  ? `${formatPrice(tier.price_cents, tier.currency)} ${TIER_INTERVAL_LABELS[tier.interval]}`
                  : 'By invitation'
                : null
            }
          />
          <Row label="Member number" value={membership.membership_number} />
          <Row label="Activated" value={formatDate(membership.activation_date)} />
          <Row label="Expires" value={formatDate(membership.expiration_date)} />
          <Row label="Cancelled" value={formatDate(membership.cancelled_at)} />
          <Row label="Requested" value={formatDate(membership.created_at)} />
        </dl>
        {tier && tier.benefits.length > 0 ? (
          <>
            <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
              Benefits
            </h3>
            <ul className="space-y-1 text-sm text-muted">
              {tier.benefits.map((benefit) => (
                <li key={benefit}>· {benefit}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="surface p-6">
        <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Payments
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">
            No payment has been requested for this membership.
          </p>
        ) : (
          <ul className="divide-y divide-stone">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    {formatPrice(payment.amount_cents, payment.currency)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {payment.paid_at
                      ? `Paid ${formatDate(payment.paid_at)}`
                      : `Requested ${formatDate(payment.created_at)}`}
                    {payment.reference ? ` · Ref ${payment.reference}` : ''}
                  </p>
                </div>
                <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 border-t border-stone pt-3 text-xs text-muted">
          Management records payments manually. This platform never stores card numbers or CVVs.
        </p>
      </section>

      <section className="surface p-6">
        <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
          Membership card
        </h2>
        {card ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-lg tracking-widest text-charcoal">{card.card_serial}</p>
              <p className="mt-1 text-xs text-muted">Issued {formatDate(card.issued_at)}</p>
            </div>
            <Link to="/dashboard/membership/card" className="btn btn-secondary">
              <CreditCard className="size-4" aria-hidden /> View card
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {membership.status === 'active'
              ? 'Your card is being issued. It will appear here and on the card page.'
              : 'Your card is issued automatically when management activates your membership.'}
          </p>
        )}
      </section>
    </div>
  );
}
