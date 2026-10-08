import {ChevronDown, ChevronRight, Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import {PRIORITY_LABELS, PRIORITY_TONES, TASK_STATUS_LABELS, TASK_STATUS_TONES} from './shared';
import type {Request, Task} from '../../types';

type TaskStatus = Task['status'];
type Priority = Task['priority'];

interface TaskHit extends Task {
  assignee?: {email: string | null; full_name: string | null}[] | null;
  related_request_id?: string | null;
  related_user_id?: string | null;
  related_experience_id?: string | null;
}

interface Person {
  id: string;
  email: string | null;
  full_name: string | null;
}

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done', 'cancelled'];
const PRIORITIES: Priority[] = ['low', 'normal', 'high', 'urgent'];

function first<T>(value: T[] | T | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function ManagementTasksPage() {
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [tasks, setTasks] = useState<TaskHit[]>([]);
  const [staff, setStaff] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [fans, setFans] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'mine' | 'unassigned' | string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({title: '', description: '', priority: 'normal', due_at: ''});

  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as Priority,
    assignee_id: '',
    due_date: '',
    related_request_id: '',
    related_user_id: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, staffRes, requestsRes, fansRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, email)')
          .order('due_at', {ascending: true, nullsFirst: false})
          .order('created_at', {ascending: false})
          .limit(200),
        supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('role', ['management', 'admin']),
        supabase
          .from('requests')
          .select('*')
          .order('submitted_at', {ascending: false})
          .limit(100),
        supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('role', 'user')
          .order('created_at', {ascending: false})
          .limit(100),
      ]);
      const firstError = [tasksRes, staffRes, requestsRes, fansRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      setTasks((tasksRes.data as TaskHit[]) ?? []);
      setStaff((staffRes.data as Person[]) ?? []);
      setRequests((requestsRes.data as Request[]) ?? []);
      setFans((fansRes.data as Person[]) ?? []);
      setNowMs(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTask = useCallback(async () => {
    setCreating(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!form.title.trim()) throw new Error('A task title is required.');
      const {error: insertError} = await supabase.from('tasks').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        due_at: form.due_date ? new Date(`${form.due_date}T09:00:00.000Z`).toISOString() : null,
        created_by: me,
        related_request_id: form.related_request_id || null,
        related_user_id: form.related_user_id || null,
        status: 'open',
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Task created.');
      setForm({
        title: '',
        description: '',
        priority: 'normal',
        assignee_id: '',
        due_date: '',
        related_request_id: '',
        related_user_id: '',
      });
      setFormOpen(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create the task.');
    } finally {
      setCreating(false);
    }
  }, [form, load, me]);

  const updateTask = useCallback(
    async (id: string, payload: Record<string, unknown>, success: string) => {
      setBusyId(id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The change was not saved. Managing tasks requires the tasks.manage permission.',
          );
        setNotice(success);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the task.');
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading tasks" />;

  const visible = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (assigneeFilter === 'mine' && task.assignee_id !== me) return false;
    if (assigneeFilter === 'unassigned' && task.assignee_id) return false;
    return true;
  });

  const overdue = (task: TaskHit) =>
    !!task.due_at &&
    Date.parse(task.due_at) < nowMs &&
    task.status !== 'done' &&
    task.status !== 'cancelled';

  const relatedTo = (task: TaskHit): {text: string; to: string} | null => {
    if (task.related_request_id) {
      const request = requests.find((row) => row.id === task.related_request_id);
      return {
        text: request?.title ?? 'Request',
        to: `/management/requests/${task.related_request_id}`,
      };
    }
    if (task.related_user_id) {
      const fan = fans.find((row) => row.id === task.related_user_id);
      return {
        text: fan?.full_name || fan?.email || 'Fan account',
        to: `/management/fans/${task.related_user_id}`,
      };
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Tasks"
        description="The team work queue — every task can point at the record it belongs to."
        actions={
          <Button onClick={() => setFormOpen((prev) => !prev)}>
            <Plus className="size-4" aria-hidden /> New task
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {formOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Create a task">
          <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Create a task
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                className="field-input"
                value={form.title}
                onChange={(event) => setForm((prev) => ({...prev, title: event.target.value}))}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Description
              </span>
              <textarea
                className="field-input min-h-16 resize-y"
                rows={2}
                value={form.description}
                onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Priority</span>
              <select
                className="field-input"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({...prev, priority: event.target.value as Priority}))
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Due date</span>
              <input
                className="field-input"
                type="date"
                value={form.due_date}
                onChange={(event) => setForm((prev) => ({...prev, due_date: event.target.value}))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Assignee</span>
              <select
                className="field-input"
                value={form.assignee_id}
                onChange={(event) => setForm((prev) => ({...prev, assignee_id: event.target.value}))}
              >
                <option value="">Unassigned</option>
                <option value={me}>Me</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Related request
              </span>
              <select
                className="field-input"
                value={form.related_request_id}
                onChange={(event) =>
                  setForm((prev) => ({...prev, related_request_id: event.target.value}))
                }
              >
                <option value="">None</option>
                {requests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Related fan
              </span>
              <select
                className="field-input"
                value={form.related_user_id}
                onChange={(event) =>
                  setForm((prev) => ({...prev, related_user_id: event.target.value}))
                }
              >
                <option value="">None</option>
                {fans.map((fan) => (
                  <option key={fan.id} value={fan.id}>
                    {fan.full_name || fan.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={() => void createTask()} loading={creating}>
                Create task
              </Button>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', ...STATUSES] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : TASK_STATUS_LABELS[filter]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">{visible.length} shown</span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <select
            className="field-input w-auto"
            value={assigneeFilter}
            onChange={(event) =>
              setAssigneeFilter(event.target.value as 'all' | 'mine' | 'unassigned' | string)
            }
          >
            <option value="all">Anyone</option>
            <option value="mine">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select
            className="field-input w-auto"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No tasks match."
            description="Create the first task above — cancelled tasks stay on record instead of being deleted."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {visible.map((task) => {
              const assignee = first(task.assignee);
              const related = relatedTo(task);
              const expanded = expandedId === task.id;
              return (
                <li key={task.id} className="py-3">
                  <div className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex flex-wrap min-w-0 items-start gap-2">
                      <button
                        type="button"
                        className="flex min-h-11 min-w-11 items-center justify-center text-muted hover:text-gold-deep sm:mt-0.5 sm:min-h-0 sm:min-w-0"
                        aria-expanded={expanded}
                        onClick={() => {
                          setExpandedId(expanded ? null : task.id);
                          setEditForm({
                            title: task.title,
                            description: task.description ?? '',
                            priority: task.priority,
                            due_at: task.due_at ? task.due_at.slice(0, 10) : '',
                          });
                        }}
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal">
                          {related ? (
                            <Link to={related.to} className="hover:underline">
                              {task.title}
                            </Link>
                          ) : (
                            task.title
                          )}
                        </p>
                        <p className="text-xs text-muted">
                          {assignee ? assignee.full_name || assignee.email : 'Unassigned'}
                          {task.due_at ? ` · due ${formatDate(task.due_at)}` : ''}
                          {related ? ` · ${related.text}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {overdue(task) ? <Chip tone="danger">Overdue</Chip> : null}
                      <Chip tone={PRIORITY_TONES[task.priority] ?? 'neutral'}>
                        {PRIORITY_LABELS[task.priority]}
                      </Chip>
                      <select
                        className="field-input w-auto"
                        value={task.status}
                        onChange={(event) =>
                          void updateTask(
                            task.id,
                            {status: event.target.value as TaskStatus},
                            `Task marked ${TASK_STATUS_LABELS[event.target.value as TaskStatus]}.`,
                          )
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-3 grid gap-4 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
                      <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Title
                        </span>
                        <input
                          className="field-input"
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm((prev) => ({...prev, title: event.target.value}))
                          }
                        />
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Description
                        </span>
                        <textarea
                          className="field-input min-h-16 resize-y"
                          rows={2}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((prev) => ({...prev, description: event.target.value}))
                          }
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Priority
                        </span>
                        <select
                          className="field-input"
                          value={editForm.priority}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              priority: event.target.value as Priority,
                            }))
                          }
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                              {PRIORITY_LABELS[priority]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Due date
                        </span>
                        <input
                          className="field-input"
                          type="date"
                          value={editForm.due_at}
                          onChange={(event) =>
                            setEditForm((prev) => ({...prev, due_at: event.target.value}))
                          }
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <Button
                          loading={busyId === task.id}
                          onClick={() =>
                            void updateTask(
                              task.id,
                              {
                                title: editForm.title.trim() || task.title,
                                description: editForm.description.trim() || null,
                                priority: editForm.priority,
                                due_at: editForm.due_at
                                  ? new Date(`${editForm.due_at}T09:00:00.000Z`).toISOString()
                                  : null,
                              },
                              'Task updated.',
                            )
                          }
                        >
                          Save changes
                        </Button>
                        {task.status !== 'cancelled' && task.status !== 'done' ? (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              void updateTask(task.id, {status: 'cancelled'}, 'Task cancelled.')
                            }
                          >
                            Cancel task
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
