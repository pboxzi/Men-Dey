import {ArrowLeft} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Spinner} from '../../../components/ui/Spinner';
import {formatDate} from '../../../lib/format';
import {supabase} from '../../../lib/supabase';
import type {Membership, MembershipCard, MembershipTier} from '../../../types';
import {useAuth} from '../../../auth/AuthContext';
import {EmptyNote, ErrorNote} from '../components/SectionCard';

interface CardRow {
  membership: Membership;
  tier: MembershipTier | null;
  card: MembershipCard | null;
}

export function MembershipCardPage() {
  const {profile} = useAuth();
  const [data, setData] = useState<CardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const membershipRes = await supabase
        .from('memberships')
        .select('*, tier:membership_tiers(*), card:membership_cards(*)')
        .eq('status', 'active')
        .order('created_at', {ascending: false})
        .limit(1)
        .maybeSingle();
      if (membershipRes.error) throw new Error(membershipRes.error.message);

      const membership = membershipRes.data as (Membership & {
        tier?: MembershipTier | null;
        card?: MembershipCard | null;
      }) | null;

      if (!membership) {
        setData(null);
        return;
      }

      let card: MembershipCard | null = null;
      const cardRes = await supabase
        .from('membership_cards')
        .select('*')
        .eq('membership_id', membership.id)
        .maybeSingle();
      if (cardRes.error) throw new Error(cardRes.error.message);
      card = (cardRes.data as MembershipCard | null) ?? null;

      setData({membership, tier: membership.tier ?? null, card});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your membership card.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="border-b border-stone pb-6">
        <Link to="/dashboard/membership" className="nav-link mb-2 inline-flex items-center gap-1">
          <ArrowLeft className="size-4" aria-hidden /> Membership
        </Link>
        <p className="eyebrow mb-2">Membership card</p>
        <h1 className="text-3xl md:text-4xl">Your membership card</h1>
        <p className="mt-2 max-w-xl text-muted">
          Your card is issued by the platform when management activates your membership. Management
          can reissue it at any time.
        </p>
      </div>

      {error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : !data || !data.card ? (
        <EmptyNote
          title="No card yet."
          description="Your membership card is issued automatically once management activates your membership."
        />
      ) : (
        <>
          <div className="surface overflow-hidden border border-gold/40">
            <div className="flex items-center justify-between gap-3 border-b border-gold/30 bg-gold/10 px-6 py-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  Gillian Anderson Management
                </p>
                <p className="mt-1 text-sm uppercase tracking-widest text-charcoal">
                  Membership card
                </p>
              </div>
              <p className="text-xs uppercase tracking-widest text-muted">
                {data.tier?.name ?? 'Member'}
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Card number</p>
                <p className="mt-1 font-mono text-2xl tracking-widest text-charcoal">
                  {data.card.card_serial}
                </p>
              </div>

              <dl className="grid gap-4 border-t border-stone pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Member</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {profile?.full_name?.trim() || 'On file with management'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Member number</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {data.membership.membership_number ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Issued</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatDate(data.card.issued_at) || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    {data.membership.expiration_date ? 'Valid through' : 'Term'}
                  </dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatDate(data.membership.expiration_date) || 'No expiry'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-muted">
            This card is a record of your membership only. It holds no payment details and cannot be
            used for payments. If it is ever reissued, the previous serial is replaced.
          </p>
        </>
      )}
    </div>
  );
}
