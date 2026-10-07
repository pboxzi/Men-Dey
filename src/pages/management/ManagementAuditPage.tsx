import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Alert} from '../../components/ui/Alert';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDateTime} from '../../lib/format';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {supabase} from '../../lib/supabase';
import type {AuditLog} from '../../types';

type Tone = 'neutral' | 'info' | 'success' | 'danger' | 'gold';

const KNOWN_ENTITIES = [
  'requests',
  'memberships',
  'membership_offers',
  'experience_proposals',
  'membership_payments',
  'experience_payments',
  'documents',
  'staff_profiles',
  'profiles',
  'tasks',
  'applicant_profiles',
  'site_settings',
];

function actionTone(action: string): Tone {
  if (action.includes('deleted')) return 'danger';
  if (action.includes('status_changed')) return 'gold';
  if (action.includes('role_changed')) return 'danger';
  if (action.includes('verified')) return 'success';
  if (action.includes('created') || action.includes('uploaded') || action.includes('added')) {
    return 'info';
  }
  if (action.includes('changed')) return 'gold';
  return 'neutral';
}

function recordLink(row: AuditLog): {text: string; to: string} | null {
  if (!row.entity_id) return null;
  switch (row.entity) {
    case 'requests':
      return {text: 'View request', to: `/management/requests/${row.entity_id}`};
    case 'memberships':
      return {text: 'View membership', to: `/management/memberships/${row.entity_id}`};
    case 'profiles':
      return {text: 'View account', to: `/management/fans/${row.entity_id}`};
    case 'applicant_profiles':
      return {text: 'View application', to: `/management/applicants/${row.entity_id}`};
    case 'documents':
      return {text: 'Open documents', to: '/management/documents'};
    case 'tasks':
      return {text: 'Open tasks', to: '/management/tasks'};
    case 'staff_profiles':
      return {text: 'Open staff', to: '/management/staff'};
    case 'site_settings':
      return {text: 'Open settings', to: '/management/settings'};
    default:
      return null;
  }
}

export function ManagementAuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      setRows((data as AuditLog[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading the audit log" />;

  const query = debouncedSearch.trim().toLowerCase();
  const actions = Array.from(new Set(rows.map((row) => row.action))).sort();
  const visible = rows.filter((row) => {
    if (entityFilter !== 'all' && row.entity !== entityFilter) return false;
    if (actionFilter !== 'all' && row.action !== actionFilter) return false;
    if (!query) return true;
    return (
      (row.actor_label ?? '').toLowerCase().includes(query) ||
      row.action.toLowerCase().includes(query) ||
      (row.entity_id ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="Audit log"
        description="Every privileged action, written automatically by the database — append-only and administrator-only."
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="surface p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className="field-input w-full sm:w-auto"
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
          >
            <option value="all">All records</option>
            {KNOWN_ENTITIES.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
          <select
            className="field-input w-full sm:w-auto"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="all">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <input
            className="field-input w-full sm:max-w-56"
            value={search}
            placeholder="Search actor or action"
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="text-xs text-muted sm:ml-auto">
            {visible.length} of {rows.length} entries
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No audit entries match."
            description="Entries appear here automatically whenever a privileged change happens."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ul className="divide-y divide-stone">
                {visible.map((row) => {
                  const link = recordLink(row);
                  return (
                    <li key={row.id} className="py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <Chip tone={actionTone(row.action)}>{row.action}</Chip>
                          <span className="text-sm text-charcoal">
                            {row.actor_label ?? 'System'}
                          </span>
                          <span className="text-xs text-muted">
                            {row.entity}
                            {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">{formatDateTime(row.created_at)}</span>
                          {link ? (
                            <Link to={link.to} className="text-xs text-gold-deep hover:underline">
                              {link.text}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {Object.keys(row.metadata ?? {}).length > 0 ? (
                        <pre className="mt-2 overflow-x-auto rounded-sm bg-stone/50 p-2 text-[11px] leading-relaxed text-muted">
                          {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-3 md:hidden">
              {visible.map((row) => {
                const link = recordLink(row);
                return (
                  <div
                    key={row.id}
                    className="bg-white border border-[#EAE4DA] rounded-lg p-4 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-medium text-charcoal">
                        {row.actor_label ?? 'System'}
                      </span>
                      <span className="shrink-0">
                        <Chip tone={actionTone(row.action)}>{row.action}</Chip>
                      </span>
                    </div>
                    <p className="break-words text-xs text-muted">
                      {row.entity}
                      {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ''}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(row.created_at)}</p>
                    {Object.keys(row.metadata ?? {}).length > 0 ? (
                      <pre className="overflow-x-auto rounded-sm bg-stone/50 p-2 text-[11px] leading-relaxed text-muted">
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    ) : null}
                    {link ? (
                      <Link
                        to={link.to}
                        className="flex items-center justify-between min-h-11 border-t border-[#EAE4DA] pt-2 text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-gold"
                      >
                        <span>{link.text}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <p className="text-xs text-muted">
        The audit log is append-only — entries are created by the database itself and cannot be
        edited or removed from this interface.
      </p>
    </div>
  );
}
