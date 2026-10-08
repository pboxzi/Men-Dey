import {Plus, Search} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import {PERMISSION_LABELS} from './shared';
import type {Profile, StaffProfile, StaffRole} from '../../types';

interface StaffRow extends StaffProfile {
  user?: {email: string | null; full_name: string | null; role: string}[] | null;
  staff_role?:
    | {id: string; key: string; name: string; permissions: string[]}
    | {id: string; key: string; name: string; permissions: string[]}[]
    | null;
}

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const PLATFORM_ROLES: Profile['role'][] = ['user', 'management', 'admin'];

export function ManagementStaffPage() {
  const {session, profile} = useAuth();
  const me = session?.user.id ?? '';
  const isAdmin = profile?.role === 'admin';

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [emailQuery, setEmailQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    user_id: '',
    staff_role_id: '',
    title: '',
    department: '',
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [roleConfirm, setRoleConfirm] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, rolesRes, candidatesRes] = await Promise.all([
        supabase
          .from('staff_profiles')
          .select('*, user:profiles(email, full_name, role), staff_role:staff_roles(id, key, name, permissions)')
          .order('created_at', {ascending: false}),
        supabase.from('staff_roles').select('*').order('key', {ascending: true}),
        supabase
          .from('profiles')
          .select('*')
          .in('role', ['management', 'admin'])
          .order('created_at', {ascending: false})
          .limit(200),
      ]);
      const firstError = [staffRes, rolesRes, candidatesRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setStaff((staffRes.data as StaffRow[]) ?? []);
      setRoles((rolesRes.data as StaffRole[]) ?? []);
      setCandidates((candidatesRes.data as Profile[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load staff data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addStaff = useCallback(async () => {
    setAdding(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!form.user_id) throw new Error('Find and select a person first.');
      if (!form.staff_role_id) throw new Error('Choose a staff role.');
      const {error: insertError} = await supabase.from('staff_profiles').insert({
        user_id: form.user_id,
        staff_role_id: form.staff_role_id,
        title: form.title.trim() || null,
        department: form.department.trim() || null,
        is_active: true,
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Team member added.');
      setForm({user_id: '', staff_role_id: '', title: '', department: ''});
      setEmailQuery('');
      setAddOpen(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not add the team member.');
    } finally {
      setAdding(false);
    }
  }, [form, load]);

  const updateStaff = useCallback(
    async (id: string, payload: Record<string, unknown>, success: string) => {
      setBusyId(id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('staff_profiles')
          .update(payload)
          .eq('id', id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error('The change was not saved. Staff records are managed by administrators.');
        setNotice(success);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the staff record.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  const changePlatformRole = useCallback(
    async (userId: string, role: Profile['role']) => {
      setRoleBusyId(userId);
      setActionError(null);
      setNotice(null);
      try {
        const {error: rpcError} = await supabase.rpc('admin_set_user_role', {
          p_user_id: userId,
          p_role: role,
        });
        if (rpcError) throw new Error(rpcError.message);
        setNotice(`Platform role changed to ${role}.`);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not change the platform role.');
      } finally {
        setRoleBusyId(null);
        setRoleConfirm(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading staff" />;

  const query = emailQuery.trim().toLowerCase();
  const matches = query
    ? candidates.filter(
        (candidate) =>
          (candidate.email ?? '').toLowerCase().includes(query) ||
          (candidate.full_name ?? '').toLowerCase().includes(query),
      )
    : [];
  const selectedCandidate = candidates.find((candidate) => candidate.id === form.user_id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Staff"
        description="Console roles and permissions — enforced in the database, not just hidden in the interface."
        actions={
          <Button onClick={() => setAddOpen((prev) => !prev)}>
            <Plus className="size-4" aria-hidden /> Add team member
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {addOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Add a team member">
          <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Add a team member
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Find by email or name
              </span>
              <span className="flex items-center gap-2">
                <Search className="size-4 text-muted" aria-hidden />
                <input
                  className="field-input"
                  value={emailQuery}
                  placeholder="person@example.com"
                  onChange={(event) => {
                    setEmailQuery(event.target.value);
                    setForm((prev) => ({...prev, user_id: ''}));
                  }}
                />
              </span>
              {matches.length > 0 && !selectedCandidate ? (
                <span className="mt-2 flex flex-wrap gap-2">
                  {matches.slice(0, 6).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setForm((prev) => ({...prev, user_id: candidate.id}))}
                    >
                      {candidate.full_name || candidate.email}
                    </button>
                  ))}
                </span>
              ) : null}
              {selectedCandidate ? (
                <span className="mt-1 block text-xs text-gold-deep">
                  Selected: {selectedCandidate.full_name || selectedCandidate.email}
                </span>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Staff role
              </span>
              <select
                className="field-input"
                value={form.staff_role_id}
                onChange={(event) =>
                  setForm((prev) => ({...prev, staff_role_id: event.target.value}))
                }
              >
                <option value="">Choose a role…</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                className="field-input"
                value={form.title}
                placeholder="Relationship manager"
                onChange={(event) => setForm((prev) => ({...prev, title: event.target.value}))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Department
              </span>
              <input
                className="field-input"
                value={form.department}
                placeholder="Member relations"
                onChange={(event) => setForm((prev) => ({...prev, department: event.target.value}))}
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={() => void addStaff()} loading={adding}>
                Add to team
              </Button>
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="surface p-4 sm:p-6" aria-label="Team">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Console team
          </h2>
          <span className="text-xs text-muted">{staff.length} total</span>
        </div>
        {staff.length === 0 ? (
          <EmptyState
            title="No team members yet."
            description="Add someone above to scope what they can do inside the office."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {staff.map((row) => {
              const person = first(row.user);
              const role = first(row.staff_role);
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {person?.full_name || person?.email || row.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted">
                      {role?.name ?? 'No staff role'} · {row.title ?? 'No title'}
                      {row.department ? ` · ${row.department}` : ''}
                      {person?.role ? ` · platform: ${person.role}` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {role
                        ? (role.permissions.includes('*')
                            ? ['*']
                            : role.permissions
                          ).map((permission) => (
                            <Chip key={permission} tone="neutral">
                              {PERMISSION_LABELS[permission] ?? permission}
                            </Chip>
                          ))
                        : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={row.is_active ? 'success' : 'neutral'}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                    <select
                      className="field-input w-auto"
                      value={row.staff_role_id ?? ''}
                      onChange={(event) =>
                        void updateStaff(
                          row.id,
                          {staff_role_id: event.target.value || null},
                          'Staff role changed.',
                        )
                      }
                    >
                      <option value="">No role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {row.is_active ? (
                      confirmId === row.id ? (
                        <span className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => setConfirmId(null)}>
                            Keep
                          </Button>
                          <Button
                            variant="secondary"
                            loading={busyId === row.id}
                            onClick={() =>
                              void updateStaff(row.id, {is_active: false}, 'Access deactivated.')
                            }
                          >
                            Confirm deactivate
                          </Button>
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => setConfirmId(row.id)}>
                          Deactivate
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="ghost"
                        loading={busyId === row.id}
                        onClick={() => void updateStaff(row.id, {is_active: true}, 'Access restored.')}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="surface p-4 sm:p-6" aria-label="Role permissions">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Role permissions
          </h2>
          <span className="text-xs text-muted">Defined server-side</span>
        </div>
        <ul className="space-y-4">
          {roles.map((role) => (
            <li key={role.id}>
              <p className="text-sm font-medium text-charcoal">
                {role.name} <span className="text-xs text-muted">({role.key})</span>
              </p>
              {role.description ? <p className="text-xs text-muted">{role.description}</p> : null}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(role.permissions.includes('*') ? ['*'] : role.permissions).map((permission) => (
                  <Chip key={permission} tone="neutral">
                    {PERMISSION_LABELS[permission] ?? permission}
                  </Chip>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-stone pt-4 text-xs text-muted">
          Permission checks run inside the database — hiding a button in the interface is never the
          only defence.
        </p>
      </section>

      <section className="surface p-4 sm:p-6" aria-label="Platform roles">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Platform roles
          </h2>
          {!isAdmin ? <span className="text-xs text-muted">Administrators only</span> : null}
        </div>
        {!isAdmin ? (
          <p className="text-sm text-muted">
            Platform roles (user, management, admin) are changed by administrators and recorded in
            the audit log.
          </p>
        ) : (
          <ul className="divide-y divide-stone">
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-charcoal">
                    {candidate.full_name || candidate.email}
                  </p>
                  <p className="text-xs text-muted">
                    {candidate.email} · joined {formatDate(candidate.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={candidate.role === 'admin' ? 'danger' : candidate.role === 'management' ? 'gold' : 'neutral'}>
                    {candidate.role}
                  </Chip>
                  {candidate.id === me ? (
                    <span className="text-xs text-muted">You</span>
                  ) : roleConfirm === candidate.id ? (
                    <span className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => setRoleConfirm(null)}>
                        Keep
                      </Button>
                      {PLATFORM_ROLES.filter((role) => role !== candidate.role).map((role) => (
                        <Button
                          key={role}
                          variant="secondary"
                          loading={roleBusyId === candidate.id}
                          onClick={() => void changePlatformRole(candidate.id, role)}
                        >
                          Make {role}
                        </Button>
                      ))}
                    </span>
                  ) : (
                    <Button variant="secondary" onClick={() => setRoleConfirm(candidate.id)}>
                      Change role
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
