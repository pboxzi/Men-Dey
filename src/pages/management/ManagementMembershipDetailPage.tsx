import {ArrowLeft, CreditCard, Zap} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_TONES,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_TONES,
  TIER_INTERVAL_LABELS,
  formatPrice,
} from '../../lib/membership';
import {PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES} from '../../lib/payments';
import {supabase} from '../../lib/supabase';
import type {
  Membership,
  MembershipCard,
  MembershipOffer,
  MembershipPayment,
  MembershipTier,
} from '../../types';

interface DetailData {
  membership: Membership;
  tier: MembershipTier | null;
  card: MembershipCard | null;
  offer: MembershipOffer | null;
  userEmail: string | null;
  userName: string | null;
  payments: MembershipPayment[];
}

function Row({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words text-right text-sm font-medium text-charcoal">{value}</dd>
    </div>
  );
}

export function ManagementMembershipDetailPage() {
  const {id = ''} = useParams();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const membershipRes = await supabase
        .from('memberships')
        .select('*, tier:membership_tiers(*), card:membership_cards(*), user:profiles(email, full_name)')
        .eq('id', id)
        .maybeSingle();
      if (membershipRes.error) throw new Error(membershipRes.error.message);
      if (!membershipRes.data) throw new Error('This membership could not be found.');

      const membership = membershipRes.data as Membership & {
        tier?: MembershipTier | null;
        card?: MembershipCard | null;
        user?: {email: string | null; full_name: string | null} | null;
      };

      const [paymentsRes, offerRes] = await Promise.all([
        supabase
          .from('membership_payments')
          .select('*')
          .eq('membership_id', membership.id)
          .order('created_at', {ascending: false}),
        membership.offer_id
          ? supabase.from('membership_offers').select('*').eq('id', membership.offer_id).maybeSingle()
          : Promise.resolve({data: null, error: null}),
      ]);
      if (paymentsRes.error) throw new Error(paymentsRes.error.message);
      if (offerRes.error) throw new Error(offerRes.error.message);

      setData({
        membership,
        tier: membership.tier ?? null,
        card: membership.card ?? null,
        offer: (offerRes.data as MembershipOffer | null) ?? null,
        userEmail: membership.user?.email ?? null,
        userName: membership.user?.full_name ?? null,
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

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        await fn();
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'The action could not be completed.');
      } finally {
        setBusy(false);
        setConfirmAction(null);
      }
    },
    [load],
  );

  const markPaid = useCallback(
    (payment: MembershipPayment) =>
      run(async () => {
        const {error: updateError} = await supabase
          .from('membership_payments')
          .update({status: 'paid'})
          .eq('id', payment.id);
        if (updateError) throw new Error(updateError.message);
        setNotice('Payment recorded as paid. The membership now awaits verification.');
      }),
    [run],
  );

  const activate = useCallback(
    (membershipId: string) =>
      run(async () => {
        const {data, error: rpcError} = await supabase.rpc('activate_membership', {
          p_membership_id: membershipId,
        });
        if (rpcError) throw new Error(rpcError.message);
        const serial = (data as {card_serial?: string} | null)?.card_serial;
        setNotice(
          `Membership activated${serial ? ` — card ${serial} issued` : ''}. The member has been notified.`,
        );
      }),
    [run],
  );

  const reissue = useCallback(
    (membershipId: string) =>
      run(async () => {
        const {data, error: rpcError} = await supabase.rpc('reissue_membership_card', {
          p_membership_id: membershipId,
        });
        if (rpcError) throw new Error(rpcError.message);
        setNotice(`Card reissued: ${String(data)}`);
      }),
    [run],
  );

  const cancelMembership = useCallback(
    (membershipId: string) =>
      run(async () => {
        const {error: updateError} = await supabase
          .from('memberships')
          .update({status: 'cancelled', cancelled_at: new Date().toISOString()})
          .eq('id', membershipId);
        if (updateError) throw new Error(updateError.message);
        setNotice('Membership cancelled.');
      }),
    [run],
  );

  if (loading) return <Spinner />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/management/memberships" className="nav-link inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Memberships
        </Link>
        <Alert tone="error">{error ?? 'Membership not found.'}</Alert>
      </div>
    );
  }

  const {membership, tier, card, offer, payments, userEmail, userName} = data;
  const pendingPayment =
    payments.find((payment) => payment.status === 'pending' || payment.status === 'processing') ?? null;
  const canActivate =
    (membership.status === 'pending' || membership.status === 'verification') && !pendingPayment;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Membership"
        title={userName || userEmail || 'Member'}
        description={`${tier?.name ?? 'Membership'} · ${membership.membership_number ?? 'no number yet'}`}
        actions={
          <Link to="/management/memberships" className="btn btn-secondary">
            <ArrowLeft className="size-4" aria-hidden /> All memberships
          </Link>
        }
      />

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="surface p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Status
            </h2>
            <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
              {MEMBERSHIP_STATUS_LABELS[membership.status]}
            </Chip>
          </div>
          <dl className="divide-y divide-stone">
            <Row label="Member" value={userName ?? userEmail} />
            <Row label="Email" value={userEmail} />
            <Row label="Tier" value={tier?.name} />
            <Row
              label="Price"
              value={
                tier
                  ? tier.price_cents > 0
                    ? `${formatPrice(tier.price_cents, tier.currency)} ${TIER_INTERVAL_LABELS[tier.interval]}`
                    : 'No price'
                  : null
              }
            />
            <Row label="Member number" value={membership.membership_number} />
            <Row label="Activated" value={formatDate(membership.activation_date)} />
            <Row label="Expires" value={formatDate(membership.expiration_date)} />
            <Row label="Created" value={formatDate(membership.created_at)} />
            <Row label="Offer status" value={offer ? OFFER_STATUS_LABELS[offer.status] : null} />
          </dl>
          {offer ? (
            <p className="mt-3 text-xs text-muted">
              Offer {offer.status}
              {offer.expires_at ? ` · expires ${formatDate(offer.expires_at)}` : ''} ·
              responded {offer.responded_at ? formatDate(offer.responded_at) : 'not yet'}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-stone pt-4">
            {(membership.status === 'pending' || membership.status === 'verification') ? (
              <Button
                onClick={() => void activate(membership.id)}
                loading={busy && confirmAction === 'activate'}
                disabled={!canActivate || busy}
                title={
                  pendingPayment
                    ? 'Confirm the pending payment first'
                    : membership.status === 'pending'
                      ? 'Pending payment must be confirmed first'
                      : undefined
                }
              >
                <Zap className="size-4" aria-hidden /> Activate membership
              </Button>
            ) : null}
            {membership.status === 'active' && card ? (
              <Button
                variant="secondary"
                onClick={() => setConfirmAction('reissue')}
                disabled={busy}
              >
                <CreditCard className="size-4" aria-hidden /> Reissue card
              </Button>
            ) : null}
            {membership.status !== 'cancelled' && membership.status !== 'expired' ? (
              <Button variant="ghost" onClick={() => setConfirmAction('cancel')} disabled={busy}>
                Cancel membership
              </Button>
            ) : null}
          </div>

          {confirmAction === 'reissue' ? (
            <div className="mt-3 rounded-sm border border-gold/40 bg-gold/5 p-3 text-sm">
              <p className="text-charcoal">
                Reissue the membership card? The current serial ({card?.card_serial}) stops being
                valid immediately.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={busy}>
                  Keep card
                </Button>
                <Button
                  onClick={() => void reissue(membership.id)}
                  loading={busy}
                >
                  Yes, reissue
                </Button>
              </div>
            </div>
          ) : null}
          {confirmAction === 'cancel' ? (
            <div className="mt-3 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm">
              <p className="text-danger">
                Cancel this membership? The member is notified and the card stops being current.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={busy}>
                  Keep membership
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void cancelMembership(membership.id)}
                  loading={busy}
                >
                  Yes, cancel
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface p-4 sm:p-6">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Membership card
          </h2>
          {card ? (
            <div className="rounded-sm border border-gold/40 bg-gold/5 p-4">
              <p className="font-mono text-xl tracking-widest text-charcoal">{card.card_serial}</p>
              <p className="mt-2 text-xs text-muted">
                Issued {formatDateTime(card.issued_at)}
                {card.revoked_at ? ` · revoked ${formatDate(card.revoked_at)}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              No card issued yet. Cards are created server-side when the membership is activated.
            </p>
          )}
        </section>

        <section className="surface p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Payments
          </h2>
          {payments.length === 0 ? (
            <EmptyState
              title="No payments."
              description="A payment record appears automatically when this offer is accepted."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {formatPrice(payment.amount_cents, payment.currency)}
                    </p>
                    <p className="text-xs text-muted">
                      requested {formatDate(payment.created_at)}
                      {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                      {payment.reference ? ` · ref ${payment.reference}` : ''}
                      {payment.provider ? ` · ${payment.provider}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Chip>
                    {payment.status === 'pending' || payment.status === 'processing' ? (
                      confirmAction === payment.id ? (
                        <span className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                            Back
                          </Button>
                          <Button loading={busy} onClick={() => void markPaid(payment)}>
                            Confirm paid
                          </Button>
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => setConfirmAction(payment.id)}>
                          Mark paid
                        </Button>
                      )
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-stone pt-3 text-xs text-muted">
            Marking a payment paid moves the membership to verification — it never activates the
            membership. Activate explicitly once verified. Never record card numbers here.
          </p>
        </section>
      </div>
    </div>
  );
}
