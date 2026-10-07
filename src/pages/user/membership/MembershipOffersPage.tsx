import {ArrowLeft, ArrowUpRight, Check, X} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {Alert} from '../../../components/ui/Alert';
import {Button} from '../../../components/ui/Button';
import {Chip} from '../../../components/ui/Chip';
import {Spinner} from '../../../components/ui/Spinner';
import {formatDate} from '../../../lib/format';
import {useLiveRefresh} from '../../../hooks/useLiveRefresh';
import {
  OFFER_STATUS_LABELS,
  OFFER_STATUS_TONES,
  TIER_INTERVAL_LABELS,
  formatPrice,
  offerIsExpired,
  offerRespondable,
} from '../../../lib/membership';
import {supabase} from '../../../lib/supabase';
import type {MembershipOffer, MembershipTier} from '../../../types';
import {EmptyNote, ErrorNote} from '../components/SectionCard';

interface OfferRow extends MembershipOffer {
  tier?: MembershipTier | null;
}

export function MembershipOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [confirmDeclineId, setConfirmDeclineId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('membership_offers')
        .select('*, tier:membership_tiers(*)')
        .order('created_at', {ascending: false})
        .limit(50);
      if (resError) throw new Error(resError.message);

      let rows = (data as OfferRow[]) ?? [];
      const sent = rows.filter((offer) => offer.status === 'sent');
      if (sent.length > 0) {
        try {
          const results = await Promise.all(
            sent.map((offer) =>
              supabase.from('membership_offers').update({status: 'viewed'}).eq('id', offer.id),
            ),
          );
          const viewError = results.map((result) => result.error).find(Boolean);
          if (viewError) throw new Error(viewError.message);
          rows = rows.map((offer) =>
            offer.status === 'sent'
              ? {...offer, status: 'viewed', viewed_at: new Date().toISOString()}
              : offer,
          );
        } catch {
          // marking as viewed is cosmetic; the offer still renders normally
        }
      }
      setOffers(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your offers.');
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
  useLiveRefresh(refreshLive, ['membership_offers', 'memberships']);

  const respond = useCallback(
    async (offer: OfferRow, next: 'accepted' | 'declined') => {
      setResponding(offer.id);
      setActionError(null);
      setNotice(null);
      try {
        const {error: updateError} = await supabase
          .from('membership_offers')
          .update({status: next})
          .eq('id', offer.id);
        if (updateError) throw new Error(updateError.message);
        if (next === 'accepted') {
          navigate('/dashboard/membership', {replace: true});
          return;
        }
        setNotice('Offer declined. You are welcome to ask management about other options any time.');
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not respond to this offer.');
      } finally {
        setResponding(null);
        setConfirmDeclineId(null);
      }
    },
    [load, navigate],
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <Link to="/dashboard/membership" className="nav-link mb-2 inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Membership
        </Link>
        <p className="eyebrow mb-2">Membership offers</p>
        <h1 className="text-3xl md:text-4xl">Offers from management</h1>
        <p className="mt-2 max-w-xl text-muted">
          Every offer is made personally by management. Read the benefits and terms, then accept or
          decline — you decide.
        </p>
      </div>

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : offers.length === 0 ? (
        <EmptyNote
          title="No offers right now."
          description="When management sends you a membership offer, it will appear here with its benefits and terms."
        />
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => {
            const expired = offerIsExpired(offer.expires_at);
            const respondable = offerRespondable(offer.status, offer.expires_at);
            const displayStatus =
              expired && (offer.status === 'sent' || offer.status === 'viewed')
                ? 'expired'
                : offer.status;
            return (
              <li key={offer.id} className="surface p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                      Membership offer
                    </p>
                    <p className="mt-1 text-xl text-charcoal">
                      {offer.tier?.name ?? 'Membership tier'}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {offer.price_cents !== null && offer.price_cents !== undefined
                        ? `${formatPrice(offer.price_cents, offer.currency)} ${
                            TIER_INTERVAL_LABELS[
                              (offer.tier?.interval ?? 'one_time') as keyof typeof TIER_INTERVAL_LABELS
                            ]
                          }`
                        : 'Terms as described below'}
                      {offer.expires_at
                        ? ` · ${expired ? 'Expired' : 'Expires'} ${formatDate(offer.expires_at)}`
                        : ''}
                    </p>
                  </div>
                  <Chip tone={OFFER_STATUS_TONES[displayStatus as keyof typeof OFFER_STATUS_TONES]}>
                    {OFFER_STATUS_LABELS[displayStatus as keyof typeof OFFER_STATUS_LABELS] ??
                      offer.status}
                  </Chip>
                </div>

                {offer.message ? (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">
                    {offer.message}
                  </p>
                ) : null}

                {offer.benefits.length > 0 ? (
                  <ul className="mt-4 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
                    {offer.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {offer.terms ? (
                  <div className="mt-4 rounded-sm border border-stone bg-stone/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Terms</p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">
                      {offer.terms}
                    </p>
                  </div>
                ) : null}

                {respondable ? (
                  confirmDeclineId === offer.id ? (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                      <p className="text-sm text-muted">
                        Decline this offer? You can always ask management for a new one later.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmDeclineId(null)}
                          disabled={responding === offer.id}
                        >
                          Keep offer
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => void respond(offer, 'declined')}
                          loading={responding === offer.id}
                        >
                          <X className="size-4" aria-hidden /> Yes, decline
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                      <p className="text-sm text-muted">
                        Accepting creates your membership and a payment request — activation still
                        requires management verification.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmDeclineId(offer.id)}
                          disabled={responding === offer.id}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => void respond(offer, 'accepted')}
                          loading={responding === offer.id}
                        >
                          <Check className="size-4" aria-hidden /> Accept offer
                        </Button>
                      </div>
                    </div>
                  )
                ) : displayStatus === 'accepted' ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
                    <p className="text-sm text-muted">
                      You accepted this offer. Continue to your membership to complete the payment.
                    </p>
                    <Link to="/dashboard/membership" className="btn btn-secondary w-full justify-center sm:w-auto">
                      Membership status <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                ) : displayStatus === 'expired' ? (
                  <p className="mt-5 border-t border-stone pt-4 text-sm text-muted">
                    This offer has expired. You are welcome to ask management about a new offer.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
