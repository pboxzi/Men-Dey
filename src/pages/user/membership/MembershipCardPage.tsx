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

function mrzDate(value: string | null | undefined): string {
  if (!value) return '<<<<<<';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '<<<<<<';
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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

  const holderName = profile?.full_name?.trim() ?? '';
  const mrzLine1 = (`P<${holderName.toUpperCase().replace(/[^A-Z]+/g, '<')}`)
    .padEnd(44, '<')
    .slice(0, 44);
  const serialCode = (data?.card?.card_serial ?? '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .slice(0, 12)
    .padEnd(12, '<');
  const mrzLine2 = `${serialCode}<<<${mrzDate(data?.card?.issued_at)}${mrzDate(
    data?.membership?.expiration_date
  )}`
    .padEnd(44, '<')
    .slice(0, 44);

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
          <div className="relative mx-auto flex aspect-[1.5856/1] w-full max-w-[24rem] flex-col overflow-hidden rounded-md border border-gold/45 bg-gradient-to-br from-charcoal via-charcoal to-[#111111] text-alabaster shadow-[0_24px_48px_-30px_rgba(17,17,17,0.6)]">
            <div
              className="pointer-events-none absolute inset-2.5 rounded-sm border border-gold/20"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none font-display text-[5rem] leading-none text-alabaster/5"
              aria-hidden
            >
              GA
            </span>

            <div className="relative flex min-h-0 flex-1 flex-col justify-between p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 sm:pb-2.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm leading-none sm:text-base">
                    Gillian Anderson
                  </p>
                  <p className="mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.3em] text-gold">
                    Management
                  </p>
                </div>
                <p className="shrink-0 text-right text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
                  {data.tier?.name ?? 'Member'}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <dt className="text-[0.5rem] font-medium uppercase tracking-[0.24em] text-alabaster/50">
                    Holder
                  </dt>
                  <dd className="mt-0.5 truncate text-xs font-medium uppercase tracking-[0.06em] text-alabaster">
                    {holderName || 'On file with management'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.5rem] font-medium uppercase tracking-[0.24em] text-alabaster/50">
                    Member no
                  </dt>
                  <dd className="mt-0.5 font-mono text-xs tracking-wider text-alabaster">
                    {data.membership.membership_number ?? '—'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.5rem] font-medium uppercase tracking-[0.24em] text-alabaster/50">
                    Issued
                  </dt>
                  <dd className="mt-0.5 font-mono text-[0.65rem] text-alabaster">
                    {formatDate(data.card.issued_at) || '—'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.5rem] font-medium uppercase tracking-[0.24em] text-alabaster/50">
                    {data.membership.expiration_date ? 'Valid thru' : 'Term'}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[0.65rem] text-alabaster">
                    {formatDate(data.membership.expiration_date) || 'No expiry'}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              className="relative overflow-hidden border-t border-white/10 bg-black/40 px-4 pt-1.5 pb-2.5 sm:px-5 sm:pb-3"
              aria-hidden
            >
              <div className="flex items-baseline gap-2">
                <span className="hidden shrink-0 text-[0.5rem] font-medium uppercase tracking-[0.24em] text-alabaster/50 sm:inline">
                  Card no
                </span>
                <p className="min-w-0 break-words font-mono text-xs font-medium tracking-[0.1em] text-gold sm:text-[0.8rem]">
                  {data.card.card_serial}
                </p>
              </div>
              <p className="mt-1 whitespace-nowrap font-mono text-[0.5rem] leading-[1.35] text-alabaster/70 sm:text-[0.55rem]">
                {mrzLine1}
              </p>
              <p className="whitespace-nowrap font-mono text-[0.5rem] leading-[1.35] text-alabaster/70 sm:text-[0.55rem]">
                {mrzLine2}
              </p>
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
