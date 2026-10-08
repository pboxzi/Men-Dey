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
          <div className="relative mx-auto flex aspect-[1.5856/1] w-full max-w-[24rem] flex-col overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-b from-[#151412] via-[#100f0e] to-[#0a0a0a] text-alabaster shadow-[0_28px_50px_-28px_rgba(0,0,0,0.65)]">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_18%_0%,rgba(200,155,60,0.08),transparent_55%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0px,transparent_9px,rgba(255,255,255,0.02)_9px,rgba(255,255,255,0.02)_10px)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-2 rounded-lg border border-white/[0.07]"
              aria-hidden
            />

            <div className="relative flex min-h-0 flex-1 flex-col justify-between p-4 sm:p-5">
              <div className="shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[0.8rem] leading-none tracking-[0.04em] text-alabaster sm:text-[0.9rem]">
                      Gillian Anderson
                    </p>
                    <p className="mt-1 text-[0.45rem] font-semibold uppercase leading-none tracking-[0.38em] text-gold">
                      Official membership
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[0.5rem] font-semibold uppercase leading-none tracking-[0.24em] text-gold">
                    {data.tier?.name ?? 'Member'}
                  </p>
                </div>
                <div className="mt-2 h-px bg-gradient-to-r from-gold/70 via-gold/25 to-transparent" />
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:gap-y-2">
                <div className="min-w-0">
                  <dt className="text-[0.45rem] font-medium uppercase leading-none tracking-[0.22em] text-alabaster/45">
                    Holder
                  </dt>
                  <dd className="mt-0.5 truncate text-[0.7rem] font-medium uppercase leading-tight tracking-[0.05em] text-alabaster">
                    {holderName || 'On file with management'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.45rem] font-medium uppercase leading-none tracking-[0.22em] text-alabaster/45">
                    Member no
                  </dt>
                  <dd className="mt-0.5 font-mono text-[0.68rem] leading-tight tracking-[0.06em] text-alabaster">
                    {data.membership.membership_number ?? '—'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.45rem] font-medium uppercase leading-none tracking-[0.22em] text-alabaster/45">
                    Issued
                  </dt>
                  <dd className="mt-0.5 font-mono text-[0.625rem] leading-tight text-alabaster">
                    {formatDate(data.card.issued_at) || '—'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.45rem] font-medium uppercase leading-none tracking-[0.22em] text-alabaster/45">
                    {data.membership.expiration_date ? 'Valid thru' : 'Term'}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[0.625rem] leading-tight text-alabaster">
                    {formatDate(data.membership.expiration_date) || 'No expiry'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative flex items-center gap-3 border-t border-white/10 bg-black/45 px-4 pt-2 pb-2.5 sm:px-5 sm:pb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[0.45rem] font-medium uppercase leading-none tracking-[0.22em] text-alabaster/45">
                    Card no
                  </span>
                  <p className="min-w-0 break-words font-mono text-[0.72rem] font-medium leading-tight tracking-[0.1em] text-gold sm:text-[0.78rem]">
                    {data.card.card_serial}
                  </p>
                </div>
                <div className="mt-1" aria-hidden>
                  <p className="whitespace-nowrap font-mono text-[0.45rem] leading-[1.4] text-alabaster/60 sm:text-[0.5rem]">
                    {mrzLine1}
                  </p>
                  <p className="whitespace-nowrap font-mono text-[0.45rem] leading-[1.4] text-alabaster/60 sm:text-[0.5rem]">
                    {mrzLine2}
                  </p>
                </div>
              </div>
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full border border-gold/45 font-display text-[0.55rem] leading-none text-gold/75"
                aria-hidden
              >
                GA
              </span>
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
