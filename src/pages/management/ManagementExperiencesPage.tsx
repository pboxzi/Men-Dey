import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {formatPrice} from '../../lib/membership';
import {
  EXPERIENCE_REQUEST_TYPES,
  REQUEST_CATEGORIES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {Experience, MembershipTier, Request, RequestType} from '../../types';

interface RequestRow extends Request {
  user?: {email: string | null; full_name: string | null} | null;
}

const EXPERIENCE_STATUSES: Experience['status'][] = [
  'draft',
  'published',
  'full',
  'cancelled',
  'completed',
];

const BLANK = {
  id: '',
  title: '',
  slug: '',
  type: 'personal_experience' as RequestType,
  description: '',
  location: '',
  price: '',
  currency: 'USD',
  capacity: '',
  status: 'draft' as Experience['status'],
  starts_at: '',
  ends_at: '',
  required_tier_id: '',
};

export function ManagementExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [experiencesRes, requestsRes, tiersRes] = await Promise.all([
        supabase.from('experiences').select('*').order('created_at', {ascending: false}).limit(100),
        supabase
          .from('requests')
          .select('*, user:profiles!requests_user_id_fkey(email, full_name)')
          .order('created_at', {ascending: false})
          .limit(100),
        supabase.from('membership_tiers').select('*').order('sort_order', {ascending: true}),
      ]);
      const firstError = [experiencesRes, requestsRes, tiersRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setExperiences((experiencesRes.data as Experience[]) ?? []);
      const all = (requestsRes.data as RequestRow[]) ?? [];
      setRequests(
        all.filter(
          (row) =>
            EXPERIENCE_REQUEST_TYPES.includes(row.type) || row.experience_id !== null,
        ),
      );
      setTiers((tiersRes.data as MembershipTier[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load experiences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!form.title.trim()) throw new Error('Title is required.');
      const slug =
        form.slug.trim() ||
        form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-+|-+$)/g, '');
      if (!slug) throw new Error('A slug (URL key) is required.');
      const payload = {
        slug,
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        price_cents:
          form.price.trim() === ''
            ? null
            : Math.max(0, Math.round(Number(form.price) * 100)),
        currency: form.currency.trim().toUpperCase() || 'USD',
        capacity: form.capacity.trim() === '' ? null : Number(form.capacity),
        status: form.status,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        required_tier_id: form.required_tier_id || null,
      };
      if (form.id) {
        const {error: updateError} = await supabase
          .from('experiences')
          .update(payload)
          .eq('id', form.id);
        if (updateError) throw new Error(updateError.message);
        setNotice(`Experience “${payload.title}” updated.`);
      } else {
        const {error: insertError} = await supabase.from('experiences').insert(payload);
        if (insertError) throw new Error(insertError.message);
        setNotice(`Experience “${payload.title}” created as ${payload.status}.`);
      }
      setForm(BLANK);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save the experience.');
    } finally {
      setBusy(false);
    }
  }, [form, load]);

  if (loading) return <Spinner />;

  const openRequests = requests.filter(
    (row) => !['completed', 'declined', 'cancelled'].includes(row.status),
  );

  return (
    <div className="space-y-7 sm:space-y-10">
      <PageHeader
        eyebrow="Experiences"
        title="Experiences"
        description="Publish the experience catalog and work the request pipeline from intake to completion."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Request pipeline
          </h2>
          <span className="text-xs text-muted">{openRequests.length} open</span>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            title="No experience requests."
            description="Requests from members arrive here and in the requests inbox."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {requests.slice(0, 25).map((row) => (
              <li key={row.id}>
                <Link
                  to={`/management/experiences/${row.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-stone/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">{row.title}</p>
                    <p className="text-xs text-muted">
                      {row.user?.full_name || row.user?.email || row.user_id.slice(0, 8)} ·{' '}
                      {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  <Chip tone={REQUEST_STATUS_TONES[row.status]}>
                    {REQUEST_STATUS_LABELS[row.status]}
                  </Chip>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Experience catalog
          </h2>
          <span className="text-xs text-muted">{experiences.length} total</span>
        </div>

        <div className="mb-6 grid gap-4 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
            <input
              className="field-input"
              value={form.title}
              placeholder="A private tea gathering"
              onChange={(event) => setForm((prev) => ({...prev, title: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Type</span>
            <select
              className="field-input"
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({...prev, type: event.target.value as RequestType}))
              }
            >
              {REQUEST_CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Status</span>
            <select
              className="field-input"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({...prev, status: event.target.value as Experience['status']}))
              }
            >
              {EXPERIENCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Description
            </span>
            <textarea
              className="field-input min-h-24 resize-y"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Location</span>
            <input
              className="field-input"
              value={form.location}
              onChange={(event) => setForm((prev) => ({...prev, location: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Capacity</span>
            <input
              className="field-input"
              inputMode="numeric"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({...prev, capacity: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Price</span>
            <input
              className="field-input"
              inputMode="decimal"
              value={form.price}
              placeholder="blank = on request"
              onChange={(event) => setForm((prev) => ({...prev, price: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Currency</span>
            <input
              className="field-input"
              value={form.currency}
              onChange={(event) => setForm((prev) => ({...prev, currency: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Starts</span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm((prev) => ({...prev, starts_at: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Ends</span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.ends_at}
              onChange={(event) => setForm((prev) => ({...prev, ends_at: event.target.value}))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Required membership tier (optional)
            </span>
            <select
              className="field-input"
              value={form.required_tier_id}
              onChange={(event) =>
                setForm((prev) => ({...prev, required_tier_id: event.target.value}))
              }
            >
              <option value="">No tier required</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => void save()} loading={busy}>
              {form.id ? 'Save experience' : 'Create experience'}
            </Button>
            {form.id ? (
              <Button variant="secondary" onClick={() => setForm(BLANK)}>
                New experience
              </Button>
            ) : null}
          </div>
        </div>

        {experiences.length === 0 ? (
          <EmptyState
            title="No experiences published."
            description="Create the first experience above and set it to published to make it visible to members."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {experiences.map((experience) => (
              <li key={experience.id} className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal">{experience.title}</p>
                  <p className="text-xs text-muted">
                    {experience.slug} ·{' '}
                    {experience.price_cents !== null
                      ? formatPrice(experience.price_cents, experience.currency)
                      : 'price on request'}{' '}
                    · {experience.starts_at ? `starts ${formatDate(experience.starts_at)}` : 'no date'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip
                    tone={
                      experience.status === 'published'
                        ? 'success'
                        : experience.status === 'draft'
                          ? 'gold'
                          : 'neutral'
                    }
                  >
                    {experience.status}
                  </Chip>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActionError(null);
                      setNotice(null);
                      setForm({
                        id: experience.id,
                        title: experience.title,
                        slug: experience.slug,
                        type: experience.type,
                        description: experience.description ?? '',
                        location: experience.location ?? '',
                        price:
                          experience.price_cents !== null
                            ? (experience.price_cents / 100).toFixed(2)
                            : '',
                        currency: experience.currency,
                        capacity: experience.capacity !== null ? String(experience.capacity) : '',
                        status: experience.status,
                        starts_at: experience.starts_at
                          ? experience.starts_at.slice(0, 16)
                          : '',
                        ends_at: experience.ends_at ? experience.ends_at.slice(0, 16) : '',
                        required_tier_id: experience.required_tier_id ?? '',
                      });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
