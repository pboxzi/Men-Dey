import {Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {PAYMENT_PROVIDER_LABELS} from '../../lib/payments';
import {supabase} from '../../lib/supabase';
import type {SiteSetting} from '../../types';

const SENSITIVE_KEY = /secret|key|token|password|private|credential/i;

function isSensitive(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

function providerLabel(value: Record<string, unknown>): string | null {
  const provider = typeof value.provider === 'string' ? value.provider : null;
  if (!provider) return null;
  return PAYMENT_PROVIDER_LABELS[provider] ?? provider;
}

export function ManagementSettingsPage() {
  const {profile} = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({key: '', value: '{}', is_public: false});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('site_settings')
        .select('*')
        .order('key', {ascending: true});
      if (resError) throw new Error(resError.message);
      setSettings((data as SiteSetting[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSetting = useCallback(
    async (setting: SiteSetting) => {
      setBusyId(setting.id);
      setActionError(null);
      setNotice(null);
      try {
        let value: Record<string, unknown>;
        try {
          value = JSON.parse(editValue) as Record<string, unknown>;
        } catch {
          throw new Error('Value must be valid JSON.');
        }
        const {data: updated, error: updateError} = await supabase
          .from('site_settings')
          .update({value, is_public: editPublic})
          .eq('id', setting.id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error('The setting was not saved. Settings can only be changed by administrators.');
        setNotice('Setting saved and recorded in the audit log.');
        setEditingId(null);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not save the setting.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [editPublic, editValue, load],
  );

  const createSetting = useCallback(async () => {
    setCreating(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!form.key.trim()) throw new Error('A setting key is required.');
      let value: Record<string, unknown>;
      try {
        value = JSON.parse(form.value) as Record<string, unknown>;
      } catch {
        throw new Error('Value must be valid JSON.');
      }
      const {error: insertError} = await supabase.from('site_settings').insert({
        key: form.key.trim(),
        value,
        is_public: form.is_public,
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Setting created and recorded in the audit log.');
      setForm({key: '', value: '{}', is_public: false});
      setNewOpen(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create the setting.');
    } finally {
      setCreating(false);
    }
  }, [form, load]);

  if (loading) return <Spinner label="Loading settings" />;

  const paymentSetting = settings.find((row) => row.key === 'payment_settings');

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Platform configuration — values are stored as JSON and every change is recorded in the audit log."
        actions={
          <Button onClick={() => setNewOpen((prev) => !prev)}>
            <Plus className="size-4" aria-hidden /> New setting
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {!isAdmin ? (
        <p className="rounded-sm border border-stone bg-stone/40 px-4 py-3 text-sm text-muted">
          You can review every setting here. Writing changes requires an administrator account —
          the database enforces that, not the interface.
        </p>
      ) : null}

      {newOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Create a setting">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Key</span>
              <input
                className="field-input"
                value={form.key}
                placeholder="branding"
                onChange={(event) => setForm((prev) => ({...prev, key: event.target.value}))}
              />
            </label>
            <label className="flex flex-wrap items-end gap-2 text-sm text-muted min-h-11 sm:min-h-0">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(event) =>
                  setForm((prev) => ({...prev, is_public: event.target.checked}))
                }
              />
              Public value (safe to expose to visitors)
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Value (JSON)
              </span>
              <textarea
                className="field-input min-h-24 resize-y font-mono text-xs"
                rows={4}
                value={form.value}
                onChange={(event) => setForm((prev) => ({...prev, value: event.target.value}))}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={() => void createSetting()} loading={creating}>
                Create setting
              </Button>
              <Button variant="ghost" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="surface p-4 sm:p-6" aria-label="Payment settings">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Payment provider
          </h2>
          <span className="text-xs text-muted">Credentials are never displayed</span>
        </div>
        {!paymentSetting ? (
          <p className="text-sm text-muted">No payment settings configured yet.</p>
        ) : (
          <p className="text-sm text-charcoal">
            Provider:{' '}
            <span className="font-medium">
              {providerLabel(paymentSetting.value) ?? 'Not configured'}
            </span>
            <span className="ml-2 text-xs text-muted">
              Secret fields stay masked — the database value is never shown in full.
            </span>
          </p>
        )}
      </section>

      <section className="surface p-4 sm:p-6" aria-label="All settings">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            All settings
          </h2>
          <span className="text-xs text-muted">{settings.length} total</span>
        </div>

        {settings.length === 0 ? (
          <EmptyState
            title="No settings yet."
            description="Create the first setting above — values are JSON and changes are audited."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {settings.map((setting) => (
              <li key={setting.id} className="py-4">
                <div className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-charcoal">{setting.key}</p>
                    <p className="text-xs text-muted">updated {formatDate(setting.updated_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={setting.is_public ? 'info' : 'neutral'}>
                      {setting.is_public ? 'Public' : 'Internal'}
                    </Chip>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(editingId === setting.id ? null : setting.id);
                        setEditValue(JSON.stringify(setting.value, null, 2));
                        setEditPublic(setting.is_public);
                        setConfirmId(null);
                      }}
                    >
                      {editingId === setting.id ? 'Close' : 'Edit'}
                    </Button>
                  </div>
                </div>

                {editingId === setting.id ? (
                  <div className="mt-3 space-y-3 rounded-sm border border-stone bg-stone/40 p-4">
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-muted">
                      {Object.entries(setting.value)
                        .map(([key, val]) =>
                          isSensitive(key)
                            ? `${key}: ••••••••`
                            : `${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`,
                        )
                        .join('\n')}
                    </pre>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                        Value (JSON)
                      </span>
                      <textarea
                        className="field-input min-h-28 resize-y font-mono text-xs"
                        rows={5}
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                      />
                    </label>
                    <label className="flex flex-wrap items-center gap-2 text-sm text-muted min-h-11 sm:min-h-0">
                      <input
                        type="checkbox"
                        checked={editPublic}
                        disabled={!isAdmin}
                        onChange={(event) => setEditPublic(event.target.checked)}
                      />
                      Public value
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {confirmId === setting.id ? (
                        <>
                          <Button variant="ghost" onClick={() => setConfirmId(null)}>
                            Back
                          </Button>
                          <Button
                            loading={busyId === setting.id}
                            onClick={() => void saveSetting(setting)}
                          >
                            Confirm save
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setConfirmId(setting.id)}>Save setting</Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <pre className="mt-2 overflow-x-auto rounded-sm bg-stone/50 p-2 text-[11px] leading-relaxed text-muted">
                    {JSON.stringify(setting.value, null, 2)
                      .split('\n')
                      .map((line) =>
                        /"([^"]*(secret|key|token|password|private|credential)[^"]*)"\s*:/i.test(
                          line,
                        )
                          ? line.replace(/:\s*.*$/, ': ••••••••')
                          : line,
                      )
                      .join('\n')}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        Settings changes are written to the audit log automatically by the database.
      </p>
    </div>
  );
}
