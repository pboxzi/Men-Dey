import {ArrowUpRight, CreditCard, Ticket} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {useLiveRefresh} from '../../hooks/useLiveRefresh';
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_TONES,
  TIER_INTERVAL_LABELS,
  formatPrice,
} from '../../lib/membership';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  fetchPaymentSettings,
  paymentMethodLabel,
  type PaymentSettings,
} from '../../lib/payments';
import {supabase} from '../../lib/supabase';
import type {
  Membership,
  MembershipCard,
  MembershipOffer,
  MembershipPayment,
  MembershipTier,
} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

interface MembershipRow extends Membership {
  tier?: MembershipTier | null;
  card?: MembershipCard | null;
}

interface OfferRow extends MembershipOffer {
  tier?: {name: string} | null;
}

export function MembershipPage() {
  const [membership, setMembership] = useState<MembershipRow | null>(null);
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [membershipRes, offersRes, tiersRes, settingsRes] = await Promise.all([
        supabase
          .from('memberships')
          .select('*, tier:membership_tiers(*), card:membership_cards(*)')
          .order('created_at', {ascending: false})
          .limit(1)
          .maybeSingle(),
        supabase
          .from('membership_offers')
          .select('*, tier:membership_tiers(name)')
          .in('status', ['sent', 'viewed'])
          .order('created_at', {ascending: false})
          .limit(5),
        supabase
          .from('membership_tiers')
          .select('*')
          .eq('status', 'active')
          .order('sort_order', {ascending: true}),
        fetchPaymentSettings(),
      ]);
      if (membershipRes.error) throw new Error(membershipRes.error.message);
      if (offersRes.error) throw new Error(offersRes.error.message);
      if (tiersRes.error) throw new Error(tiersRes.error.message);

      const loaded = (membershipRes.data as MembershipRow | null) ?? null;
      let loadedPayments: MembershipPayment[] = [];
      if (loaded) {
        const paymentsRes = await supabase
          .from('membership_payments')
          .select('*')
          .eq('membership_id', loaded.id)
          .order('created_at', {ascending: false});
        if (paymentsRes.error) throw new Error(paymentsRes.error.message);
        loadedPayments = (paymentsRes.data as MembershipPayment[]) ?? [];
      }

      setMembership(loaded);
      setPayments(loadedPayments);
      setOffers((offersRes.data as OfferRow[]) ?? []);
      setTiers((tiersRes.data as MembershipTier[]) ?? []);
      setSettings(settingsRes.settings);
      if (settingsRes.error) {
        setError(settingsRes.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load membership information.');
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
  useLiveRefresh(refreshLive, [
    'memberships',
    'membership_offers',
    'membership_payments',
    'membership_cards',
  ]);

  if (loading) return <Spinner />;

  const latestPayment = payments[0] ?? null;
  const pendingPayment = payments.find((p) => p.status === 'pending' || p.status === 'processing') ?? null;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <p className="eyebrow mb-2">Membership</p>
        <h1 className="text-3xl md:text-4xl">Your membership</h1>
        <p className="mt-2 max-w-xl text-muted">
          Membership is offered and activated by management. Payments are recorded here and never
          activate anything on their own — management verifies and issues your card.
        </p>
      </div>

      {offers.length > 0 ? (
        <div className="surface flex flex-wrap items-center justify-between gap-3 border-l-2 border-l-gold p-5">
          <div>
            <p className="text-lg text-charcoal">
              Management sent you {offers.length === 1 ? 'a membership offer' : 'membership offers'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Review the benefits and terms, then accept or decline it yourself.
            </p>
          </div>
          <Link to="/dashboard/membership/offers" className="btn btn-primary">
            Review {offers.length === 1 ? 'offer' : 'offers'} <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      {error && !membership && !offers.length && !tiers.length ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : (
        <>
          <SectionCard
            title="Status"
            action={
              membership ? {to: `/dashboard/membership/${membership.id}`, label: 'Details'} : undefined
            }
          >
            {membership ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg text-charcoal">
                      {MEMBERSHIP_STATUS_LABELS[membership.status]}
                      {membership.membership_number ? ` · ${membership.membership_number}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {membership.tier ? `${membership.tier.name} membership` : 'Membership'}
                    </p>
                  </div>
                  <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
                    {MEMBERSHIP_STATUS_LABELS[membership.status]}
                  </Chip>
                </div>

                {membership.status === 'active' ? (
                  <dl className="grid gap-3 border-t border-stone pt-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted">Member number</dt>
                      <dd className="mt-1 font-medium text-charcoal">{membership.membership_number ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted">Activated</dt>
                      <dd className="mt-1 font-medium text-charcoal">
                        {formatDate(membership.activation_date) || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted">
                        {membership.expiration_date ? 'Renews' : 'Term'}
                      </dt>
                      <dd className="mt-1 font-medium text-charcoal">
                        {formatDate(membership.expiration_date) || 'No expiry'}
                      </dd>
                    </div>
                  </dl>
                ) : null}

                {membership.status === 'active' && membership.card ? (
                  <Link to="/dashboard/membership/card" className="btn btn-secondary w-full justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="size-4" aria-hidden /> View your membership card
                    </span>
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                ) : null}

                {membership.status === 'pending' && pendingPayment ? (
                  <div className="rounded-sm border border-gold/40 bg-gold/5 p-4">
                    <p className="text-sm font-medium text-charcoal">
                      Payment of {formatPrice(pendingPayment.amount_cents, pendingPayment.currency)} required
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {settings ? paymentMethodLabel(settings) : 'Managed payment'} —{' '}
                      {settings?.instructions ??
                        'Management will confirm the accepted payment method for your membership.'}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Never send card numbers, CVVs or passwords through this platform. Once you have
                      paid, management verifies the payment and activates your membership.
                    </p>
                  </div>
                ) : null}

                {membership.status === 'verification' ? (
                  <div className="rounded-sm border border-gold/40 bg-gold/5 p-4">
                    <p className="text-sm font-medium text-charcoal">Payment received</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Management is verifying your payment. Your membership will be activated — and
                      your card issued — after confirmation.
                    </p>
                  </div>
                ) : null}

                {membership.status === 'cancelled' || membership.status === 'expired' ? (
                  <p className="text-sm text-muted">
                    This membership is no longer active. If management sends you a new offer, you can
                    accept it from the offers page.
                  </p>
                ) : null}
              </div>
            ) : offers.length === 0 ? (
              <EmptyNote
                title="No membership yet."
                description="When management sends you a membership offer, it will appear here for you to review and accept."
              />
            ) : (
              <EmptyNote
                title="No active membership."
                description="Accept a membership offer to start the process. Management activates your membership after verifying payment."
              />
            )}
          </SectionCard>

          {payments.length > 0 ? (
            <SectionCard title="Payments">
              <ul className="divide-y divide-stone">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal">
                        {formatPrice(payment.amount_cents, payment.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {payment.paid_at
                          ? `Recorded ${formatDate(payment.paid_at)}`
                          : `Requested ${formatDate(payment.created_at)}`}
                        {payment.provider ? ` · ${payment.provider}` : ''}
                      </p>
                    </div>
                    <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Chip>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-stone pt-3 text-xs text-muted">
                {latestPayment && latestPayment.status === 'paid'
                  ? 'Payment recorded. Management confirms activation manually.'
                  : 'Payments are recorded by management. This platform never stores card details.'}
              </p>
            </SectionCard>
          ) : null}

          <SectionCard title="How membership works">
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              <p className="flex items-start gap-2">
                <Ticket className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
                Management sends you a personal offer. You review the benefits and terms, then accept
                or decline it — nothing is purchased automatically.
              </p>
              <p>
                After you accept, a payment is requested. Once management verifies the payment, your
                membership is activated and your membership card is issued by the platform.
              </p>
            </div>
            {tiers.length > 0 ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <li key={tier.id} className="rounded-sm border border-stone bg-stone/40 p-4">
                    <p className="font-medium text-charcoal">{tier.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {tier.price_cents > 0
                        ? `${formatPrice(tier.price_cents, tier.currency)} ${TIER_INTERVAL_LABELS[tier.interval]}`
                        : 'By invitation'}
                    </p>
                    {tier.benefits.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-muted">
                        {tier.benefits.slice(0, 4).map((benefit) => (
                          <li key={benefit}>· {benefit}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </SectionCard>
        </>
      )}
    </div>
  );
}
