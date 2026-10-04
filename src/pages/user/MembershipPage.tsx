import {Ticket} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {Membership, MembershipApplication, MembershipTier} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

export function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membershipRes, applicationsRes, tiersRes] = await Promise.all([
        supabase.from('memberships').select('*').order('created_at', {ascending: false}).limit(1).maybeSingle(),
        supabase
          .from('membership_applications')
          .select('*')
          .order('created_at', {ascending: false})
          .limit(10),
        supabase.from('membership_tiers').select('*').eq('is_active', true).order('sort_order', {ascending: true}),
      ]);
      if (membershipRes.error) throw new Error(membershipRes.error.message);
      if (applicationsRes.error) throw new Error(applicationsRes.error.message);
      if (tiersRes.error) throw new Error(tiersRes.error.message);
      setMembership((membershipRes.data as Membership | null) ?? null);
      setApplications((applicationsRes.data as MembershipApplication[]) ?? []);
      setTiers((tiersRes.data as MembershipTier[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load membership information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <p className="eyebrow mb-2">Membership</p>
        <h1 className="text-3xl md:text-4xl">Your membership</h1>
        <p className="mt-2 max-w-xl text-muted">
          Membership is reviewed and issued by management. Nothing is ever purchased automatically —
          if you are invited to apply, it will appear here.
        </p>
      </div>

      {error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : (
        <>
          <SectionCard title="Status">
            {membership ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg text-charcoal">
                    Membership {membership.status}
                    {membership.membership_number ? ` · ${membership.membership_number}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Started {formatDate(membership.started_at) || 'not yet'}
                    {membership.expires_at ? ` · Renews ${formatDate(membership.expires_at)}` : ''}
                  </p>
                </div>
                <Chip tone={membership.status === 'active' ? 'success' : 'neutral'}>{membership.status}</Chip>
              </div>
            ) : (
              <EmptyNote
                title="No membership yet."
                description="When management invites you to apply for membership, your application and status will appear here."
              />
            )}
          </SectionCard>

          <SectionCard title="Applications">
            {applications.length === 0 ? (
              <EmptyNote
                title="No applications."
                description="Membership applications you submit will appear here with their review status."
              />
            ) : (
              <ul className="divide-y divide-stone">
                {applications.map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-charcoal">Application {application.id.slice(0, 8).toUpperCase()}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted">{formatDate(application.submitted_at)}</span>
                      <Chip tone={application.status === 'approved' ? 'success' : 'info'}>{application.status}</Chip>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="How membership works">
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              <p className="flex items-start gap-2">
                <Ticket className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
                Management reviews every account personally. Membership is offered, never sold on
                this page.
              </p>
              <p>
                If a membership tier suits you, management will send you an application or an offer
                through this platform. You will always see the terms before accepting anything.
              </p>
            </div>
            {tiers.length > 0 ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <li key={tier.id} className="rounded-sm border border-stone bg-stone/40 p-4">
                    <p className="font-medium text-charcoal">{tier.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {tier.price_cents > 0
                        ? `${(tier.price_cents / 100).toFixed(2)} ${tier.currency} / ${tier.interval}`
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
