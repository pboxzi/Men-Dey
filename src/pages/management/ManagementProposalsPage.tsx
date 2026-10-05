import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {OFFER_STATUS_LABELS, OFFER_STATUS_TONES, formatPrice} from '../../lib/membership';
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TONES,
} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {ExperienceProposal, MembershipOffer} from '../../types';

interface ProposalRow extends ExperienceProposal {
  request?:
    | {
        id: string;
        title: string;
        status: string;
        user?: {email: string | null; full_name: string | null}[] | null;
      }[]
    | null;
}

interface OfferRow extends MembershipOffer {
  user?: {email: string | null; full_name: string | null}[] | null;
  tier?: {name: string}[] | null;
}

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type Tab = 'experiences' | 'memberships';

export function ManagementProposalsPage() {
  const [tab, setTab] = useState<Tab>('experiences');
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proposalsRes, offersRes] = await Promise.all([
        supabase
          .from('experience_proposals')
          .select('*, request:requests(id, title, status, user:profiles(email, full_name))')
          .order('created_at', {ascending: false})
          .limit(200),
        supabase
          .from('membership_offers')
          .select('*, user:profiles(email, full_name), tier:membership_tiers(name)')
          .order('created_at', {ascending: false})
          .limit(200),
      ]);
      const firstError = [proposalsRes, offersRes].map((result) => result.error).find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setProposals((proposalsRes.data as ProposalRow[]) ?? []);
      setOffers((offersRes.data as OfferRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load proposals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const proposalAction = useCallback(
    async (proposal: ProposalRow, next: 'sent' | 'cancelled') => {
      setBusyId(proposal.id);
      setActionError(null);
      setNotice(null);
      try {
        const payload =
          next === 'sent'
            ? {status: next, sent_at: new Date().toISOString()}
            : {status: next};
        const {data: updated, error: updateError} = await supabase
          .from('experience_proposals')
          .update(payload)
          .eq('id', proposal.id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The proposal was not updated. This action requires the requests.manage permission.',
          );
        setNotice(next === 'sent' ? 'Proposal sent to the member.' : 'Proposal cancelled.');
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the proposal.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  const offerAction = useCallback(
    async (offer: OfferRow, next: 'sent' | 'cancelled') => {
      setBusyId(offer.id);
      setActionError(null);
      setNotice(null);
      try {
        const payload =
          next === 'sent' ? {status: next, offered_at: new Date().toISOString()} : {status: next};
        const {data: updated, error: updateError} = await supabase
          .from('membership_offers')
          .update(payload)
          .eq('id', offer.id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The offer was not updated. This action requires the membership.manage permission.',
          );
        setNotice(next === 'sent' ? 'Offer sent to the member.' : 'Offer cancelled.');
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the offer.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading proposals" />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Business"
        title="Proposals"
        description="Experience proposals and membership offers awaiting a member response."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="flex gap-2">
        <button
          type="button"
          className={`btn ${tab === 'experiences' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('experiences')}
        >
          Experience proposals
        </button>
        <button
          type="button"
          className={`btn ${tab === 'memberships' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('memberships')}
        >
          Membership offers
        </button>
      </div>

      {tab === 'experiences' ? (
        <section className="surface p-6" aria-label="Experience proposals">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Experience proposals
            </h2>
            <span className="text-xs text-muted">{proposals.length} total</span>
          </div>
          {proposals.length === 0 ? (
            <EmptyState
              title="No proposals yet."
              description="Proposals are created from a request once you are ready to offer dates and terms."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {proposals.map((proposal) => {
                const request = first(proposal.request);
                const requester = first(request?.user);
                return (
                  <li key={proposal.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/management/requests/${proposal.request_id}`}
                        className="block truncate text-sm font-medium text-charcoal hover:underline"
                      >
                        {request?.title ?? 'Request'} · v{proposal.version}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {requester?.full_name || requester?.email || 'Account'} ·{' '}
                        {formatDate(proposal.created_at)}
                        {proposal.amount_cents !== null
                          ? ` · ${formatPrice(proposal.amount_cents, proposal.currency)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip tone={PROPOSAL_STATUS_TONES[proposal.status]}>
                        {PROPOSAL_STATUS_LABELS[proposal.status]}
                      </Chip>
                      {proposal.status === 'draft' ? (
                        <Button
                          variant="secondary"
                          loading={busyId === proposal.id}
                          onClick={() => void proposalAction(proposal, 'sent')}
                        >
                          Send
                        </Button>
                      ) : null}
                      {['draft', 'sent', 'viewed'].includes(proposal.status) ? (
                        confirmId === proposal.id ? (
                          <span className="flex gap-2">
                            <Button variant="ghost" onClick={() => setConfirmId(null)}>
                              Keep
                            </Button>
                            <Button
                              variant="secondary"
                              loading={busyId === proposal.id}
                              onClick={() => void proposalAction(proposal, 'cancelled')}
                            >
                              Confirm cancel
                            </Button>
                          </span>
                        ) : (
                          <Button variant="secondary" onClick={() => setConfirmId(proposal.id)}>
                            Cancel
                          </Button>
                        )
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="surface p-6" aria-label="Membership offers">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Membership offers
            </h2>
            <span className="text-xs text-muted">{offers.length} total</span>
          </div>
          {offers.length === 0 ? (
            <EmptyState
              title="No offers yet."
              description="Membership offers are created from the memberships console and sent to a member."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {offers.map((offer) => {
                const person = first(offer.user);
                const tier = first(offer.tier);
                return (
                  <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/management/fans/${offer.user_id}`}
                        className="block truncate text-sm font-medium text-charcoal hover:underline"
                      >
                        {person?.full_name || person?.email || 'Member'}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {tier?.name ?? 'Tier'} ·{' '}
                        {offer.price_cents !== null
                          ? formatPrice(offer.price_cents, offer.currency)
                          : 'tier price'}{' '}
                        · offered {formatDate(offer.offered_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip tone={OFFER_STATUS_TONES[offer.status]}>
                        {OFFER_STATUS_LABELS[offer.status]}
                      </Chip>
                      {offer.status === 'draft' ? (
                        <Button
                          variant="secondary"
                          loading={busyId === offer.id}
                          onClick={() => void offerAction(offer, 'sent')}
                        >
                          Send
                        </Button>
                      ) : null}
                      {['draft', 'sent', 'viewed'].includes(offer.status) ? (
                        confirmId === offer.id ? (
                          <span className="flex gap-2">
                            <Button variant="ghost" onClick={() => setConfirmId(null)}>
                              Keep
                            </Button>
                            <Button
                              variant="secondary"
                              loading={busyId === offer.id}
                              onClick={() => void offerAction(offer, 'cancelled')}
                            >
                              Confirm cancel
                            </Button>
                          </span>
                        ) : (
                          <Button variant="secondary" onClick={() => setConfirmId(offer.id)}>
                            Cancel
                          </Button>
                        )
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
