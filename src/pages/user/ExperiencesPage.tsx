import {MapPin, Send} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {formatPrice} from '../../lib/membership';
import {
  EXPERIENCE_REQUEST_TYPES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  requestCategoryLabel,
} from '../../lib/requests';
import {supabase} from '../../lib/supabase';
import type {Experience, Request} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

interface CatalogRow extends Experience {
  required_tier?: {name: string} | null;
}

export function ExperiencesPage() {
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [journey, setJourney] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, requestsRes] = await Promise.all([
        supabase
          .from('experiences')
          .select('*, required_tier:membership_tiers(name)')
          .eq('status', 'published')
          .order('starts_at', {ascending: true})
          .limit(50),
        supabase.from('requests').select('*').order('created_at', {ascending: false}).limit(100),
      ]);
      if (catalogRes.error) throw new Error(catalogRes.error.message);
      if (requestsRes.error) throw new Error(requestsRes.error.message);
      setCatalog((catalogRes.data as CatalogRow[]) ?? []);
      const own = (requestsRes.data as Request[]) ?? [];
      setJourney(
        own.filter(
          (r) => EXPERIENCE_REQUEST_TYPES.includes(r.type) || r.experience_id !== null,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load experiences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="eyebrow mb-2">Experiences</p>
          <h1 className="text-3xl md:text-4xl">Experiences</h1>
          <p className="mt-2 max-w-xl text-muted">
            Experiences are proposed and arranged by management. Nothing here is confirmed until
            management approves, takes payment and schedules it.
          </p>
        </div>
        <Link to="/dashboard/requests/new" className="btn btn-primary">
          Request an experience
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : (
        <>
          <SectionCard title="Available experiences">
            {catalog.length === 0 ? (
              <EmptyNote
                title="No published experiences yet."
                description="When management publishes an experience you can request, it will appear here."
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {catalog.map((experience) => (
                  <li key={experience.id} className="flex flex-col rounded-sm border border-stone bg-stone/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                      {requestCategoryLabel(experience.type)}
                    </p>
                    <p className="mt-2 text-lg text-charcoal">{experience.title}</p>
                    {experience.description ? (
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">
                        {experience.description}
                      </p>
                    ) : null}
                    <dl className="mt-3 space-y-1 text-xs text-muted">
                      {experience.starts_at ? (
                        <div className="flex items-center gap-1.5">
                          <dt className="sr-only">Starts</dt>
                          <dd>Starts {formatDate(experience.starts_at)}</dd>
                        </div>
                      ) : null}
                      {experience.location ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0 text-gold-deep" aria-hidden />
                          <dt className="sr-only">Location</dt>
                          <dd>{experience.location}</dd>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <dt className="sr-only">Price</dt>
                        <dd className="font-medium text-charcoal">
                          {experience.price_cents !== null
                            ? formatPrice(experience.price_cents, experience.currency)
                            : 'Price on request'}
                        </dd>
                        <dd>
                          {experience.required_tier ? (
                            <Chip tone="gold">Members · {experience.required_tier.name}</Chip>
                          ) : (
                            <Chip tone="info">Open to request</Chip>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <Link
                      to={`/dashboard/requests/new?experience=${experience.id}`}
                      className="btn btn-secondary mt-4 justify-center"
                    >
                      <Send className="size-4" aria-hidden /> Request this experience
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Your experience journey" action={{to: '/dashboard/requests', label: 'All requests'}}>
            {journey.length === 0 ? (
              <EmptyNote
                title="Nothing here yet."
                description="When you request an experience or management proposes one for you, its journey will appear here."
              />
            ) : (
              <ul className="divide-y divide-stone">
                {journey.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/dashboard/experiences/${row.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-stone/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-charcoal">
                          {row.title}
                        </span>
                        <span className="block text-xs text-muted">
                          {requestCategoryLabel(row.type)} · {formatDateTime(row.created_at)}
                        </span>
                      </span>
                      <Chip tone={REQUEST_STATUS_TONES[row.status]}>
                        {REQUEST_STATUS_LABELS[row.status]}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
