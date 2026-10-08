import {Plus, Search} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_TONES,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_TONES,
  TIER_INTERVAL_LABELS,
  formatPrice,
} from '../../lib/membership';
import {
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  fetchPaymentSettings,
  paymentMethodLabel,
  resolvePaymentDetails,
  type PaymentSettings,
} from '../../lib/payments';
import {supabase} from '../../lib/supabase';
import type {
  Membership,
  MembershipOffer,
  MembershipPayment,
  MembershipTier,
  Profile,
} from '../../types';

interface OfferRow extends MembershipOffer {
  user?: {email: string | null; full_name: string | null} | null;
  tier?: {name: string} | null;
}

interface MemberRow extends Membership {
  user?: {email: string | null; full_name: string | null} | null;
  tier?: {name: string} | null;
}

interface PaymentRow extends MembershipPayment {
  membership?: {
    user_id: string;
    user?: {email: string | null} | null;
  } | null;
}

const TIER_STATUSES: MembershipTier['status'][] = ['active', 'draft', 'archived'];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export function ManagementMembershipsPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [memberships, setMemberships] = useState<MemberRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [tierBusy, setTierBusy] = useState(false);
  const [tierForm, setTierForm] = useState({
    id: '',
    key: '',
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    interval: 'monthly' as MembershipTier['interval'],
    benefits: '',
    status: 'active' as MembershipTier['status'],
    sort_order: '0',
  });

  const [offerBusy, setOfferBusy] = useState(false);
  const [offerForm, setOfferForm] = useState({
    email: '',
    tier_id: '',
    price: '',
    message: '',
    benefits: '',
    terms: '',
    expires: '',
    paymentProvider: '',
    paymentInstructions: '',
  });
  const [foundUser, setFoundUser] = useState<Pick<Profile, 'id' | 'email' | 'full_name'> | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [paySettings, setPaySettings] = useState<PaymentSettings | null>(null);

  useEffect(() => {
    void fetchPaymentSettings().then((result) => setPaySettings(result.settings));
  }, []);

  const offerPreview = resolvePaymentDetails(
    {
      payment_provider: offerForm.paymentProvider || null,
      payment_instructions: offerForm.paymentInstructions.trim() || null,
    },
    paySettings,
  );

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersRes, offersRes, membersRes, paymentsRes] = await Promise.all([
        supabase.from('membership_tiers').select('*').order('sort_order', {ascending: true}),
        supabase
          .from('membership_offers')
          .select('*, user:profiles(email, full_name), tier:membership_tiers(name)')
          .order('created_at', {ascending: false})
          .limit(50),
        supabase
          .from('memberships')
          .select('*, user:profiles(email, full_name), tier:membership_tiers(name)')
          .order('created_at', {ascending: false})
          .limit(100),
        supabase
          .from('membership_payments')
          .select('*, membership:memberships(user_id, user:profiles(email))')
          .order('created_at', {ascending: false})
          .limit(100),
      ]);
      const firstError = [tiersRes, offersRes, membersRes, paymentsRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setTiers((tiersRes.data as MembershipTier[]) ?? []);
      setOffers((offersRes.data as OfferRow[]) ?? []);
      setMemberships((membersRes.data as MemberRow[]) ?? []);
      setPayments((paymentsRes.data as PaymentRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load membership management data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const findUser = useCallback(async () => {
    const email = offerForm.email.trim().toLowerCase();
    if (!email) {
      setActionError('Enter the member’s email address first.');
      return;
    }
    setSearchingUser(true);
    setActionError(null);
    try {
      const {data, error: resError} = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .maybeSingle();
      if (resError) throw new Error(resError.message);
      if (!data) throw new Error('No account found with that email address.');
      setFoundUser(data as Pick<Profile, 'id' | 'email' | 'full_name'>);
    } catch (e) {
      setFoundUser(null);
      setActionError(e instanceof Error ? e.message : 'Could not look up that account.');
    } finally {
      setSearchingUser(false);
    }
  }, [offerForm.email]);

  const saveTier = useCallback(
    async (status?: MembershipTier['status']) => {
      setTierBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        if (!tierForm.name.trim()) throw new Error('Tier name is required.');
        const key = tierForm.key.trim() || slugify(tierForm.name);
        if (!key) throw new Error('Tier key is required.');
        const payload = {
          key,
          name: tierForm.name.trim(),
          description: tierForm.description.trim() || null,
          price_cents: Math.max(0, Math.round(Number(tierForm.price || '0') * 100)),
          currency: tierForm.currency.trim().toUpperCase() || 'USD',
          interval: tierForm.interval,
          benefits: tierForm.benefits
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          status: status ?? tierForm.status,
          sort_order: Number(tierForm.sort_order || '0'),
        };
        if (tierForm.id) {
          const {error: updateError} = await supabase
            .from('membership_tiers')
            .update(payload)
            .eq('id', tierForm.id);
          if (updateError) throw new Error(updateError.message);
          setNotice(`Tier “${payload.name}” updated.`);
        } else {
          const {error: insertError} = await supabase.from('membership_tiers').insert(payload);
          if (insertError) throw new Error(insertError.message);
          setNotice(`Tier “${payload.name}” created.`);
        }
        setTierForm({
          id: '',
          key: '',
          name: '',
          description: '',
          price: '',
          currency: 'USD',
          interval: 'monthly',
          benefits: '',
          status: 'active',
          sort_order: '0',
        });
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not save the tier.');
      } finally {
        setTierBusy(false);
      }
    },
    [load, tierForm],
  );

  const editTier = useCallback((tier: MembershipTier) => {
    setActionError(null);
    setNotice(null);
    setTierForm({
      id: tier.id,
      key: tier.key,
      name: tier.name,
      description: tier.description ?? '',
      price: (tier.price_cents / 100).toFixed(2),
      currency: tier.currency,
      interval: tier.interval,
      benefits: tier.benefits.join('\n'),
      status: tier.status,
      sort_order: String(tier.sort_order),
    });
  }, []);

  const saveOffer = useCallback(
    async (send: boolean) => {
      setOfferBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        if (!foundUser) throw new Error('Find the member’s account first.');
        if (!offerForm.tier_id) throw new Error('Choose a tier for the offer.');
        const tier = tiers.find((row) => row.id === offerForm.tier_id);
        const benefits = offerForm.benefits
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        const {data: created, error: insertError} = await supabase
          .from('membership_offers')
          .insert({
            user_id: foundUser.id,
            tier_id: offerForm.tier_id,
            price_cents:
              offerForm.price.trim() === ''
                ? null
                : Math.max(0, Math.round(Number(offerForm.price) * 100)),
            currency: tier?.currency ?? 'USD',
            message: offerForm.message.trim() || null,
            benefits: benefits.length > 0 ? benefits : (tier?.benefits ?? []),
            terms: offerForm.terms.trim() || null,
            payment_provider: offerForm.paymentProvider || null,
            payment_instructions: offerForm.paymentInstructions.trim() || null,
            expires_at: offerForm.expires ? new Date(`${offerForm.expires}T23:59:59`).toISOString() : null,
            status: 'draft',
          })
          .select('id')
          .single();
        if (insertError) throw new Error(insertError.message);

        if (send) {
          const {error: sendError} = await supabase
            .from('membership_offers')
            .update({status: 'sent'})
            .eq('id', created.id);
          if (sendError) throw new Error(sendError.message);
          setNotice(`Offer sent to ${foundUser.email ?? 'the member'}.`);
        } else {
          setNotice('Offer saved as a draft. Send it when you are ready.');
        }
        setOfferForm({email: '', tier_id: '', price: '', message: '', benefits: '', terms: '', expires: '', paymentProvider: '', paymentInstructions: ''});
        setFoundUser(null);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not save the offer.');
      } finally {
        setOfferBusy(false);
      }
    },
    [foundUser, load, offerForm, tiers],
  );

  const offerAction = useCallback(
    async (offer: OfferRow, next: 'sent' | 'cancelled') => {
      setBusyId(offer.id);
      setActionError(null);
      setNotice(null);
      try {
        const {error: updateError} = await supabase
          .from('membership_offers')
          .update({status: next})
          .eq('id', offer.id);
        if (updateError) throw new Error(updateError.message);
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

  const markPaid = useCallback(
    async (payment: PaymentRow) => {
      setBusyId(payment.id);
      setActionError(null);
      setNotice(null);
      try {
        const {error: updateError} = await supabase
          .from('membership_payments')
          .update({status: 'paid'})
          .eq('id', payment.id);
        if (updateError) throw new Error(updateError.message);
        setNotice('Payment recorded as paid. The membership now awaits verification.');
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the payment.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner />;

  const renderOfferActions = (offer: OfferRow) => (
    <>
      {offer.status === 'draft' ? (
        <Button
          variant="secondary"
          loading={busyId === offer.id}
          onClick={() => void offerAction(offer, 'sent')}
        >
          Send
        </Button>
      ) : null}
      {offer.status === 'sent' || offer.status === 'viewed' ? (
        confirmId === offer.id ? (
          <>
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
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmId(offer.id)}>
            Cancel
          </Button>
        )
      ) : null}
    </>
  );

  const renderPaymentActions = (payment: PaymentRow) => (
    <>
      {payment.status === 'pending' || payment.status === 'processing' ? (
        confirmId === payment.id ? (
          <>
            <Button variant="ghost" onClick={() => setConfirmId(null)}>
              Back
            </Button>
            <Button
              variant="secondary"
              loading={busyId === payment.id}
              onClick={() => void markPaid(payment)}
            >
              Confirm paid
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmId(payment.id)}>
            Mark paid
          </Button>
        )
      ) : null}
    </>
  );

  return (
    <div className="space-y-7 sm:space-y-10">
      <PageHeader
        eyebrow="Membership"
        title="Memberships"
        description="Tiers, offers, members and payment records — the full membership lifecycle in one console."
      />

      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {/* ---------------- Tiers ---------------- */}
      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Membership tiers
          </h2>
          <span className="text-xs text-muted">{tiers.length} total</span>
        </div>

        {tiers.length === 0 ? (
          <EmptyState
            title="No tiers yet."
            description="Create the first membership tier below. Members only see tiers with active status."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {tiers.map((tier) => (
                  <li key={tier.id} className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal">
                        {tier.name} <span className="text-xs text-muted">({tier.key})</span>
                      </p>
                      <p className="text-xs text-muted">
                        {tier.price_cents > 0
                          ? `${formatPrice(tier.price_cents, tier.currency)} ${TIER_INTERVAL_LABELS[tier.interval]}`
                          : 'No price'}{' '}
                        · {tier.benefits.length} benefits
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        tone={tier.status === 'active' ? 'success' : tier.status === 'draft' ? 'gold' : 'neutral'}
                      >
                        {tier.status}
                      </Chip>
                      <Button variant="secondary" onClick={() => editTier(tier)}>
                        Edit
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="block py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
                    <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                      {tier.name} <span className="text-xs text-muted">({tier.key})</span>
                    </span>
                    <span className="shrink-0">
                      <Chip
                        tone={
                          tier.status === 'active'
                            ? 'success'
                            : tier.status === 'draft'
                              ? 'gold'
                              : 'neutral'
                        }
                      >
                        {tier.status}
                      </Chip>
                    </span>
                  </div>
                  <p className="break-words text-xs text-muted">
                    {tier.price_cents > 0
                      ? `${formatPrice(tier.price_cents, tier.currency)} ${TIER_INTERVAL_LABELS[tier.interval]}`
                      : 'No price'}{' '}
                    · {tier.benefits.length} benefits
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="secondary" onClick={() => editTier(tier)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 grid gap-4 border-t border-stone pt-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Name</span>
            <input
              className="field-input"
              value={tierForm.name}
              placeholder="Inner Circle"
              onChange={(event) => setTierForm((prev) => ({...prev, name: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Key (auto from name if empty)
            </span>
            <input
              className="field-input"
              value={tierForm.key}
              placeholder="inner-circle"
              onChange={(event) => setTierForm((prev) => ({...prev, key: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Description</span>
            <input
              className="field-input"
              value={tierForm.description}
              onChange={(event) => setTierForm((prev) => ({...prev, description: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Price</span>
            <input
              className="field-input"
              inputMode="decimal"
              value={tierForm.price}
              placeholder="49.00"
              onChange={(event) => setTierForm((prev) => ({...prev, price: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Currency</span>
            <input
              className="field-input"
              value={tierForm.currency}
              onChange={(event) => setTierForm((prev) => ({...prev, currency: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Interval</span>
            <select
              className="field-input"
              value={tierForm.interval}
              onChange={(event) =>
                setTierForm((prev) => ({
                  ...prev,
                  interval: event.target.value as MembershipTier['interval'],
                }))
              }
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="one_time">One-time</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Status</span>
            <select
              className="field-input"
              value={tierForm.status}
              onChange={(event) =>
                setTierForm((prev) => ({
                  ...prev,
                  status: event.target.value as MembershipTier['status'],
                }))
              }
            >
              {TIER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Benefits (one per line)
            </span>
            <textarea
              className="field-input min-h-24 resize-y"
              rows={4}
              value={tierForm.benefits}
              onChange={(event) => setTierForm((prev) => ({...prev, benefits: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Sort order</span>
            <input
              className="field-input"
              inputMode="numeric"
              value={tierForm.sort_order}
              onChange={(event) => setTierForm((prev) => ({...prev, sort_order: event.target.value}))}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => void saveTier()} loading={tierBusy}>
              {tierForm.id ? 'Save tier' : 'Create tier'}
            </Button>
            {tierForm.id ? (
              <Button
                variant="secondary"
                onClick={() =>
                  setTierForm({
                    id: '',
                    key: '',
                    name: '',
                    description: '',
                    price: '',
                    currency: 'USD',
                    interval: 'monthly',
                    benefits: '',
                    status: 'active',
                    sort_order: '0',
                  })
                }
              >
                New tier
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- Offers ---------------- */}
      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Membership offers
          </h2>
          <span className="text-xs text-muted">{offers.length} total</span>
        </div>

        <div className="mb-6 grid gap-4 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Member email
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                className="field-input"
                value={offerForm.email}
                placeholder="member@example.com"
                onChange={(event) => {
                  setOfferForm((prev) => ({...prev, email: event.target.value}));
                  setFoundUser(null);
                }}
              />
              <Button variant="secondary" onClick={() => void findUser()} loading={searchingUser}>
                <Search className="size-4" aria-hidden /> Find
              </Button>
            </div>
            {foundUser ? (
              <span className="mt-1 block text-xs text-gold-deep">
                Matched: {foundUser.full_name || foundUser.email}
              </span>
            ) : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Tier</span>
            <select
              className="field-input"
              value={offerForm.tier_id}
              onChange={(event) => setOfferForm((prev) => ({...prev, tier_id: event.target.value}))}
            >
              <option value="">Select a tier…</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} — {formatPrice(tier.price_cents, tier.currency)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Price override (blank = tier price)
            </span>
            <input
              className="field-input"
              inputMode="decimal"
              value={offerForm.price}
              placeholder="99.00"
              onChange={(event) => setOfferForm((prev) => ({...prev, price: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Message</span>
            <textarea
              className="field-input min-h-20 resize-y"
              rows={3}
              value={offerForm.message}
              onChange={(event) => setOfferForm((prev) => ({...prev, message: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Benefits for this offer (one per line, blank = tier benefits)
            </span>
            <textarea
              className="field-input min-h-20 resize-y"
              rows={3}
              value={offerForm.benefits}
              onChange={(event) => setOfferForm((prev) => ({...prev, benefits: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Terms</span>
            <textarea
              className="field-input min-h-20 resize-y"
              rows={3}
              value={offerForm.terms}
              onChange={(event) => setOfferForm((prev) => ({...prev, terms: event.target.value}))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Payment method
            </span>
            <select
              className="field-input"
              value={offerForm.paymentProvider}
              onChange={(event) =>
                setOfferForm((prev) => ({...prev, paymentProvider: event.target.value}))
              }
            >
              <option value="">
                Account default — {paySettings ? paymentMethodLabel(paySettings) : 'Managed payment'}
              </option>
              {PAYMENT_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Payment instructions (blank = account default)
            </span>
            <textarea
              className="field-input min-h-16 resize-y"
              rows={2}
              placeholder={
                paySettings?.instructions ?? 'Leave empty to send your account default instructions.'
              }
              value={offerForm.paymentInstructions}
              onChange={(event) =>
                setOfferForm((prev) => ({...prev, paymentInstructions: event.target.value}))
              }
            />
          </label>
          <div className="rounded-sm border border-gold/40 bg-gold/5 p-3 text-xs leading-relaxed text-muted sm:col-span-2">
            <span className="font-medium text-charcoal">
              Payment instructions the member will see when paying this offer:
            </span>{' '}
            {paymentMethodLabel(offerPreview)} —{' '}
            {offerPreview.instructions ?? 'Management will confirm the accepted payment method.'}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Expires (optional)
            </span>
            <input
              className="field-input"
              type="date"
              value={offerForm.expires}
              onChange={(event) => setOfferForm((prev) => ({...prev, expires: event.target.value}))}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => void saveOffer(true)} loading={offerBusy}>
              <Plus className="size-4" aria-hidden /> Save & send
            </Button>
            <Button variant="secondary" onClick={() => void saveOffer(false)} loading={offerBusy}>
              Save draft
            </Button>
          </div>
        </div>

        {offers.length === 0 ? (
          <EmptyState
            title="No offers yet."
            description="Create a personalized membership offer above. It appears in the member’s account when you send it."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {offers.map((offer) => (
                  <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal">
                        {offer.user?.full_name || offer.user?.email || offer.user_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted">
                        {offer.tier?.name ?? 'Tier'} ·{' '}
                        {offer.price_cents !== null && offer.price_cents !== undefined
                          ? formatPrice(offer.price_cents, offer.currency)
                          : 'tier price'}{' '}
                        · {formatDate(offer.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={OFFER_STATUS_TONES[offer.status]}>
                        {OFFER_STATUS_LABELS[offer.status]}
                      </Chip>
                      {renderOfferActions(offer)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="block py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                      {offer.user?.full_name || offer.user?.email || offer.user_id.slice(0, 8)}
                    </span>
                    <span className="shrink-0">
                      <Chip tone={OFFER_STATUS_TONES[offer.status]}>
                        {OFFER_STATUS_LABELS[offer.status]}
                      </Chip>
                    </span>
                  </div>
                  <p className="break-words text-xs text-muted">{offer.tier?.name ?? 'Tier'}</p>
                  <p className="break-words text-xs text-muted">
                    {offer.price_cents !== null && offer.price_cents !== undefined
                      ? formatPrice(offer.price_cents, offer.currency)
                      : 'tier price'}{' '}
                    · {formatDate(offer.created_at)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">{renderOfferActions(offer)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---------------- Members ---------------- */}
      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Members
          </h2>
          <span className="text-xs text-muted">{memberships.length} total</span>
        </div>
        {memberships.length === 0 ? (
          <EmptyState
            title="No members yet."
            description="A membership row appears here the moment a member accepts one of your offers."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {memberships.map((membership) => (
                  <li key={membership.id}>
                    <Link
                      to={`/management/memberships/${membership.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-stone/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal">
                          {membership.user?.full_name || membership.user?.email || membership.user_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted">
                          {membership.tier?.name ?? 'Tier'} ·{' '}
                          {membership.membership_number ?? 'no number yet'}
                        </p>
                      </div>
                      <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
                        {MEMBERSHIP_STATUS_LABELS[membership.status]}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="block py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                      {membership.user?.full_name ||
                        membership.user?.email ||
                        membership.user_id.slice(0, 8)}
                    </span>
                    <span className="shrink-0">
                      <Chip tone={MEMBERSHIP_STATUS_TONES[membership.status]}>
                        {MEMBERSHIP_STATUS_LABELS[membership.status]}
                      </Chip>
                    </span>
                  </div>
                  {membership.user?.full_name ? (
                    <p className="break-words text-xs text-muted">
                      {membership.user.email ?? 'Email not on file'}
                    </p>
                  ) : null}
                  <p className="break-words text-xs text-muted">
                    {membership.tier?.name ?? 'Tier'} ·{' '}
                    {membership.membership_number ?? 'no number yet'}
                  </p>
                  <Link
                    to={`/management/memberships/${membership.id}`}
                    className="flex items-center justify-between gap-2 min-h-11 border-t border-stone pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep hover:text-gold"
                  >
                    <span>View</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---------------- Payments ---------------- */}
      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Membership payments
          </h2>
          <span className="text-xs text-muted">{payments.length} total</span>
        </div>
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet."
            description="Payment records are created automatically when a member accepts a priced offer."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal">
                        {formatPrice(payment.amount_cents, payment.currency)}
                      </p>
                      <p className="text-xs text-muted">
                        {payment.membership?.user?.email ?? payment.membership?.user_id?.slice(0, 8) ?? 'Member'} ·
                        requested {formatDate(payment.created_at)}
                        {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={PAYMENT_STATUS_TONES[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Chip>
                      {renderPaymentActions(payment)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="divide-y divide-stone md:hidden">
              {payments.map((payment) => (
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
                    {payment.membership?.user?.email ??
                      payment.membership?.user_id?.slice(0, 8) ??
                      'Member'}
                  </p>
                  <p className="break-words text-xs text-muted">
                    requested {formatDate(payment.created_at)}
                    {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">{renderPaymentActions(payment)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
