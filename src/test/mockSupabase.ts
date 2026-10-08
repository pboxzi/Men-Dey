import {vi} from 'vitest';
import type {Session} from '@supabase/supabase-js';

import type {AcknowledgementVersion, Profile} from '../types';

type Row = Record<string, unknown>;

interface MockResult {
  data: unknown;
  error: {message: string} | null;
  count: number | null;
}

export interface MockControl {
  session: Session | null;
  profile: Profile | null;
  ackVersion: AcknowledgementVersion | null;
  /** Tables that resolve with an error instead of data. */
  failTables: Set<string>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  resend: ReturnType<typeof vi.fn>;
  verifyOtp: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  exchangeCodeForSession: ReturnType<typeof vi.fn>;
  invoke: ReturnType<typeof vi.fn>;
}

export const mockCtl: MockControl = {
  session: null,
  profile: null,
  ackVersion: null,
  failTables: new Set<string>(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resend: vi.fn(),
  verifyOtp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  invoke: vi.fn(async () => ({data: null, error: null})),
};

/** Per-table fixture rows the generic query builder reads and writes. */
export const mockData: Record<string, Row[]> = {};

export function resetMockCtl() {
  mockCtl.session = null;
  mockCtl.profile = null;
  mockCtl.ackVersion = null;
  mockCtl.failTables = new Set<string>();
  mockCtl.signInWithPassword.mockReset();
  mockCtl.signUp.mockReset();
  mockCtl.signOut.mockReset();
  mockCtl.resend.mockReset();
  mockCtl.verifyOtp.mockReset();
  mockCtl.resetPasswordForEmail.mockReset();
  mockCtl.updateUser.mockReset();
  mockCtl.exchangeCodeForSession.mockReset();
  mockCtl.invoke.mockReset();
  mockCtl.invoke.mockResolvedValue({data: null, error: null});
  resetMockData();
}

export function resetMockData() {
  for (const key of Object.keys(mockData)) delete mockData[key];
  membershipNumberSeq = 0;
}

let idCounter = 0;
let membershipNumberSeq = 0;

function nextId(table: string): string {
  return `mock-${table}-${++idCounter}`;
}

/** Mirrors public.notify_user: a preference-aware user notification row. */
function notifyUser(
  userId: string,
  type: 'request' | 'membership' | 'experience',
  title: string,
  body: string,
  link: string,
) {
  materialize('notifications').push({
    id: nextId('notifications'),
    user_id: userId,
    title,
    body,
    type,
    link,
    read_at: null,
    created_at: new Date().toISOString(),
  });
}

/** Mirrors public.record_request_events: status changes append timeline events. */
const REQUEST_EVENT_FOR_STATUS: Record<string, string> = {
  in_review: 'review_started',
  information_requested: 'information_requested',
  proposal: 'proposal_created',
  payment_required: 'proposal_accepted',
  confirmed: 'confirmed',
  approved: 'approved',
  scheduled: 'scheduled',
  completed: 'completed',
  declined: 'declined',
  cancelled: 'cancelled',
};

function applyRequestStatus(row: Row, nextStatus: string) {
  const previous = row.status;
  if (previous === nextStatus) return;
  row.status = nextStatus;
  row.updated_at = new Date().toISOString();
  const event = REQUEST_EVENT_FOR_STATUS[nextStatus];
  if (event) {
    materialize('request_events').push({
      id: nextId('request_events'),
      request_id: row.id,
      actor_id: null,
      event_type: event,
      note: null,
      created_at: new Date().toISOString(),
    });
  }
}

function materialize(table: string): Row[] {
  if (table === 'profiles' && !mockData.profiles?.length && mockCtl.profile) {
    mockData.profiles = [structuredClone(mockCtl.profile as unknown as Row)];
  }
  if (table === 'acknowledgement_versions' && !mockData.acknowledgement_versions?.length && mockCtl.ackVersion) {
    mockData.acknowledgement_versions = [structuredClone(mockCtl.ackVersion as unknown as Row)];
  }
  if (!mockData[table]) mockData[table] = [];
  return mockData[table];
}

class MockBuilder implements PromiseLike<MockResult> {
  private table: string;
  private op: 'select' | 'insert' | 'update' = 'select';
  private payload: Row[] = [];
  private patch: Row | null = null;
  private filters: Array<(row: Row) => boolean> = [];
  private orderSpec: {col: string; asc: boolean} | null = null;
  private limitN: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private returning = false;
  private head = false;
  private selectCols = '';

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: {count?: string; head?: boolean}) {
    if (this.op === 'select') {
      this.selectCols = columns ?? '';
      if (options?.head) this.head = true;
    } else {
      this.returning = true;
    }
    return this;
  }

  insert(rows: Row | Row[]) {
    this.op = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(patch: Row) {
    this.op = 'update';
    this.patch = patch;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] != null && row[column] !== value);
    return this;
  }

  is(column: string, value: unknown) {
    if (value === null) {
      this.filters.push((row) => row[column] == null);
    } else {
      this.filters.push((row) => row[column] === value);
    }
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is' && value === null) {
      this.filters.push((row) => row[column] != null);
    } else if (operator === 'eq') {
      this.filters.push((row) => row[column] !== value);
    }
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push((row) => String(row[column] ?? '') >= String(value));
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push((row) => String(row[column] ?? '') <= String(value));
    return this;
  }

  order(column: string, options?: {ascending?: boolean}) {
    this.orderSpec = {col: column, asc: options?.ascending !== false};
    return this;
  }

  limit(count: number) {
    this.limitN = count;
    return this;
  }

  single() {
    this.mode = 'single';
    return this;
  }

  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }

  private matchingRows(): Row[] {
    const rows = materialize(this.table).slice();
    let out = rows;
    for (const filter of this.filters) out = out.filter(filter);
    if (this.orderSpec) {
      const {col, asc} = this.orderSpec;
      out = out.slice().sort((a, b) => {
        const av = a[col] ?? '';
        const bv = b[col] ?? '';
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (asc ? 1 : -1);
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    return out;
  }

  private execute(): Promise<MockResult> {
    if (mockCtl.failTables.has(this.table)) {
      return Promise.resolve({data: null, error: {message: `mock failure on ${this.table}`}, count: null});
    }

    if (this.op === 'insert') {
      const inserted: Row[] = [];
      const now = new Date().toISOString();
      const defaults: Record<string, Row> = {
        requests: {
          status: 'submitted',
          priority: 'normal',
          assigned_to: null,
          submitted_at: now,
          resolved_at: null,
          preferred_date: null,
          preferred_time: null,
          location: null,
          participants: null,
          contact_method: null,
          additional_requirements: null,
        },
      };
      for (const raw of this.payload) {
        const row: Row = {
          id: `mock-${this.table}-${++idCounter}`,
          created_at: now,
          updated_at: now,
          ...(defaults[this.table] ?? {}),
          ...structuredClone(raw),
        };
        materialize(this.table).push(row);
        inserted.push(row);
      }
      // Mirror the database trigger: creating a request records its 'submitted' event.
      if (this.table === 'requests') {
        for (const row of inserted) {
          materialize('request_events').push({
            id: nextId('request_events'),
            request_id: row.id,
            actor_id: row.user_id ?? null,
            event_type: 'submitted',
            note: null,
            created_at: now,
          });
        }
      }
      // Mirror trg_fill_experience_payment_user: owner + paid_at are filled server-side.
      if (this.table === 'experience_payments') {
        for (const row of inserted) {
          if (row.user_id == null) {
            const owner = materialize('requests').find((request) => request.id === row.request_id);
            row.user_id = owner?.user_id ?? null;
          }
          if (row.status === 'paid' && row.paid_at == null) row.paid_at = now;
        }
      }
      if (!this.returning) return Promise.resolve({data: null, error: null, count: null});
      if (this.mode === 'single') {
        if (inserted.length !== 1) {
          return Promise.resolve({data: null, error: {message: 'insert single: expected 1 row'}, count: null});
        }
        return Promise.resolve({data: structuredClone(inserted[0]), error: null, count: null});
      }
      return Promise.resolve({data: structuredClone(inserted), error: null, count: null});
    }

    if (this.op === 'update') {
      const store = materialize(this.table);
      const matched = this.matchingRows();
      const now = new Date().toISOString();
      const patchStatus = typeof this.patch?.status === 'string' ? this.patch.status : null;

      // Mirror apply_offer_acceptance: accepting must not collide with an existing membership.
      if (this.table === 'membership_offers' && patchStatus === 'accepted' && matched.length === 1) {
        const offer = matched[0];
        if (offer.status !== 'accepted') {
          const memberships = materialize('memberships');
          const alreadyLinked = memberships.some((m) => m.offer_id === offer.id);
          const hasMembership = memberships.some(
            (m) =>
              m.user_id === offer.user_id &&
              ['pending', 'verification', 'active'].includes(String(m.status)),
          );
          if (!alreadyLinked && hasMembership) {
            return Promise.resolve({
              data: null,
              error: {message: 'this user already has a pending or active membership'},
              count: null,
            });
          }
        }
      }

      const statusEventMap: Record<string, string> = {
        in_review: 'review_started',
        information_requested: 'information_requested',
        proposal: 'proposal_created',
        payment_required: 'proposal_accepted',
        confirmed: 'confirmed',
        approved: 'approved',
        scheduled: 'scheduled',
        completed: 'completed',
        declined: 'declined',
        cancelled: 'cancelled',
      };
      for (const row of store) {
        if (matched.includes(row)) {
          const previousStatus = row.status;
          Object.assign(row, structuredClone(this.patch ?? {}));

          // Mirror the database trigger: status changes append timeline events.
          if (this.table === 'requests' && patchStatus && patchStatus !== previousStatus) {
            const eventType = statusEventMap[patchStatus];
            if (eventType) {
              materialize('request_events').push({
                id: nextId('request_events'),
                request_id: row.id,
                actor_id: null,
                event_type: eventType,
                note: null,
                created_at: now,
              });
            }
          }

          // Mirror trg_apply_offer_acceptance: accept → pending membership (+ payment request).
          if (
            this.table === 'membership_offers' &&
            patchStatus === 'accepted' &&
            previousStatus !== 'accepted'
          ) {
            const memberships = materialize('memberships');
            if (!memberships.some((m) => m.offer_id === row.id)) {
              const membership: Row = {
                id: nextId('memberships'),
                user_id: row.user_id,
                tier_id: row.tier_id,
                offer_id: row.id,
                status: 'pending',
                membership_number: null,
                activation_date: null,
                expiration_date: null,
                created_at: now,
                updated_at: now,
              };
              memberships.push(membership);
              const tier = materialize('membership_tiers').find((t) => t.id === row.tier_id);
              const amount = Number(row.price_cents ?? tier?.price_cents ?? 0);
              if (amount > 0) {
                materialize('membership_payments').push({
                  id: nextId('membership_payments'),
                  membership_id: membership.id,
                  user_id: row.user_id,
                  amount_cents: amount,
                  currency: row.currency ?? tier?.currency ?? 'USD',
                  status: 'pending',
                  provider: null,
                  reference: null,
                  notes: null,
                  paid_at: null,
                  created_at: now,
                  updated_at: now,
                });
              }
            }
          }
          if (
            this.table === 'membership_offers' &&
            patchStatus === 'sent' &&
            previousStatus === 'draft'
          ) {
            notifyUser(
              row.user_id as string,
              'membership',
              'Management has sent you a membership offer',
              'Review the offer, its benefits and terms. You can accept or decline it yourself.',
              '/dashboard/membership/offers',
            );
          }

          // Mirror trg_apply_membership_payment: paid → verification (never auto-active).
          if (
            this.table === 'membership_payments' &&
            patchStatus === 'paid' &&
            previousStatus !== 'paid'
          ) {
            if (row.paid_at == null) row.paid_at = now;
            const membership = materialize('memberships').find((m) => m.id === row.membership_id);
            if (membership && membership.status === 'pending') {
              membership.status = 'verification';
              membership.updated_at = now;
            }
            notifyUser(
              row.user_id as string,
              'membership',
              'Payment received',
              'Management is verifying your payment. Your membership will be activated after confirmation.',
              '/dashboard/membership',
            );
          }

          // Mirror trg_apply_experience_payment: paid_at fill + confirmation notice.
          if (
            this.table === 'experience_payments' &&
            patchStatus === 'paid' &&
            previousStatus !== 'paid'
          ) {
            if (row.paid_at == null) row.paid_at = now;
            notifyUser(
              row.user_id as string,
              'experience',
              'Payment received',
              'Management is verifying your payment and will confirm your experience next.',
              `/dashboard/experiences/${row.request_id}`,
            );
          }

          // Mirror trg_apply_proposal_response: proposal responses drive the request.
          if (
            this.table === 'experience_proposals' &&
            patchStatus &&
            patchStatus !== previousStatus
          ) {
            const request = materialize('requests').find((r) => r.id === row.request_id);
            if (request) {
              if (
                patchStatus === 'sent' &&
                previousStatus === 'draft' &&
                ['submitted', 'in_review', 'information_requested'].includes(String(request.status))
              ) {
                applyRequestStatus(request, 'proposal');
                notifyUser(
                  request.user_id as string,
                  'experience',
                  'Management sent you a proposal',
                  'Review the dates, requirements and price, then accept or decline.',
                  `/dashboard/experiences/${row.request_id}`,
                );
              }
              if (
                patchStatus === 'accepted' &&
                previousStatus !== 'accepted' &&
                request.status === 'proposal'
              ) {
                applyRequestStatus(request, 'payment_required');
                const amount = Number(row.amount_cents ?? 0);
                const payments = materialize('experience_payments');
                if (amount > 0 && !payments.some((p) => p.proposal_id === row.id)) {
                  payments.push({
                    id: nextId('experience_payments'),
                    request_id: row.request_id,
                    user_id: request.user_id ?? null,
                    proposal_id: row.id,
                    amount_cents: amount,
                    currency: row.currency ?? 'USD',
                    status: 'pending',
                    provider: null,
                    reference: null,
                    notes: null,
                    paid_at: null,
                    created_at: now,
                    updated_at: now,
                  });
                  notifyUser(
                    request.user_id as string,
                    'experience',
                    'Payment required for your experience',
                    'Management will confirm the payment method. Your experience is confirmed after payment is verified.',
                    `/dashboard/experiences/${row.request_id}`,
                  );
                }
              }
              if (
                patchStatus === 'declined' &&
                previousStatus !== 'declined' &&
                request.status === 'proposal'
              ) {
                applyRequestStatus(request, 'cancelled');
              }
            }
          }
        }
      }
      if (this.table === 'profiles' && mockCtl.profile) {
        const updated = store.find((row) => row.id === mockCtl.profile?.id);
        if (updated) mockCtl.profile = structuredClone(updated) as unknown as Profile;
      }
      if (this.returning) {
        return Promise.resolve({data: structuredClone(matched), error: null, count: matched.length});
      }
      return Promise.resolve({data: null, error: null, count: null});
    }

    const rows = this.matchingRows();
    if (this.head) {
      return Promise.resolve({data: null, error: null, count: rows.length});
    }
    if (this.mode === 'single') {
      if (rows.length !== 1) {
        return Promise.resolve({data: null, error: {message: `single: expected 1 row, got ${rows.length}`}, count: null});
      }
      const single = structuredClone(rows);
      return Promise.resolve({data: single[0], error: null, count: null});
    }
    if (this.mode === 'maybe') {
      const maybe = rows.length ? structuredClone(rows) : [];
      return Promise.resolve({data: maybe.length ? maybe[0] : null, error: null, count: null});
    }
    return Promise.resolve({data: structuredClone(rows), error: null, count: rows.length});
  }

  then<TResult1 = MockResult, TResult2 = never>(
    onfulfilled?: ((value: MockResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function makeSession(userId: string): Session {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      aud: 'authenticated',
      email: 'tester@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      identities: [],
      is_aud: false,
      is_anonymous: false,
    },
  } as unknown as Session;
}

export function makeProfile(userId: string, role: Profile['role']): Profile {
  return {
    id: userId,
    email: 'tester@example.com',
    full_name: 'Test Person',
    phone: null,
    country: null,
    city: null,
    address: null,
    date_of_birth: null,
    occupation: null,
    company: null,
    website: null,
    preferred_contact_method: null,
    profile_photo: null,
    role,
    status: 'active',
    email_verified_at: '2026-01-01T00:00:00Z',
    notify_requests: true,
    notify_membership: true,
    notify_experiences: true,
    notify_messages: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

export function buildSupabaseMock() {
  const listeners = new Set<(event: string, session: Session | null) => void>();

  const isManagement = () =>
    mockCtl.session !== null &&
    (mockCtl.profile?.role === 'management' || mockCtl.profile?.role === 'admin');

  const executeRpc = async (name: string, params: Record<string, unknown>): Promise<MockResult> => {
    const fail = (message: string): MockResult => ({data: null, error: {message}, count: null});
    const now = new Date().toISOString();
    const hex5 = () =>
      Math.random().toString(16).slice(2, 7).toUpperCase().padEnd(5, '0').slice(0, 5);

    switch (name) {
      case 'activate_membership': {
        // Mirrors public.activate_membership(uuid): management-only, payment-gated, server-issued card.
        if (!isManagement()) return fail('only management can activate memberships');
        const membership = materialize('memberships').find((m) => m.id === params.p_membership_id);
        if (!membership) return fail('membership not found');
        if (membership.status === 'active') return fail('membership is already active');
        if (!['pending', 'verification'].includes(String(membership.status))) {
          return fail(`membership cannot be activated while ${membership.status}`);
        }
        const hasOpenPayment = materialize('membership_payments').some(
          (p) =>
            p.membership_id === membership.id &&
            ['pending', 'processing'].includes(String(p.status)),
        );
        if (hasOpenPayment) return fail('payment must be confirmed before activation');

        const tier = materialize('membership_tiers').find((t) => t.id === membership.tier_id);
        const tierKey = String(tier?.key ?? 'TIER').toUpperCase().replace(/[^A-Z0-9]+/g, '-');
        const interval = String(tier?.interval ?? '');
        membership.status = 'active';
        membership.activation_date = now;
        membership.expiration_date =
          interval === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : interval === 'annual'
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              : null;
        membership.updated_at = now;
        membershipNumberSeq += 1;
        membership.membership_number = `GA-${String(membershipNumberSeq).padStart(6, '0')}`;

        const serial = `GA-${tierKey}-${hex5()}`;
        const cards = materialize('membership_cards');
        const existing = cards.find((c) => c.membership_id === membership.id);
        if (existing) {
          existing.card_serial = serial;
          existing.issued_at = now;
          existing.revoked_at = null;
          existing.updated_at = now;
        } else {
          cards.push({
            id: nextId('membership_cards'),
            membership_id: membership.id,
            card_serial: serial,
            issued_at: now,
            revoked_at: null,
            created_at: now,
            updated_at: now,
          });
        }
        materialize('audit_logs').push({
          id: nextId('audit_logs'),
          actor_id: mockCtl.profile?.id ?? null,
          action: 'membership.activated',
          entity: 'membership',
          entity_id: String(membership.id),
          metadata: {membership_number: membership.membership_number, card_serial: serial},
          created_at: now,
        });
        return {data: {membership_id: membership.id, membership_number: membership.membership_number, card_serial: serial}, error: null, count: null};
      }

      case 'reissue_membership_card': {
        if (!isManagement()) return fail('only management can reissue cards');
        const membership = materialize('memberships').find((m) => m.id === params.p_membership_id);
        if (!membership) return fail('membership not found');
        if (membership.status !== 'active') return fail('cards can only be issued for active memberships');
        const card = materialize('membership_cards').find((c) => c.membership_id === membership.id);
        if (!card) return fail('no card on file for this membership');

        const tier = materialize('membership_tiers').find((t) => t.id === membership.tier_id);
        const tierKey = String(tier?.key ?? 'TIER').toUpperCase().replace(/[^A-Z0-9]+/g, '-');
        const serial = `GA-${tierKey}-${hex5()}`;
        card.card_serial = serial;
        card.issued_at = now;
        card.revoked_at = null;
        card.updated_at = now;
        materialize('audit_logs').push({
          id: nextId('audit_logs'),
          actor_id: mockCtl.profile?.id ?? null,
          action: 'membership_card.reissued',
          entity: 'membership',
          entity_id: String(membership.id),
          metadata: {card_serial: serial},
          created_at: now,
        });
        return {data: serial, error: null, count: null};
      }

      case 'schedule_experience': {
        if (!isManagement()) return fail('only management can schedule experiences');
        const startsAt = String(params.p_starts_at ?? '');
        const endsAt = String(params.p_ends_at ?? '');
        if (endsAt <= startsAt) return fail('schedule end must be after start');
        const request = materialize('requests').find((r) => r.id === params.p_request_id);
        if (!request) return fail('request not found');
        if (request.status !== 'confirmed') {
          return fail('experience must be confirmed before scheduling');
        }

        const appointmentId = nextId('appointments');
        materialize('appointments').push({
          id: appointmentId,
          user_id: request.user_id ?? null,
          request_id: request.id,
          title: String(params.p_title ?? ''),
          description: null,
          location: (params.p_location as string) ?? null,
          starts_at: startsAt,
          ends_at: endsAt,
          timezone: String(params.p_timezone ?? 'UTC') || 'UTC',
          virtual_link: (params.p_virtual_link as string) ?? null,
          meeting_instructions: (params.p_meeting_instructions as string) ?? null,
          status: 'confirmed',
          created_by: mockCtl.profile?.id ?? null,
          created_at: now,
          updated_at: now,
        });
        materialize('experience_schedules').push({
          id: nextId('experience_schedules'),
          experience_id: request.experience_id ?? null,
          request_id: request.id,
          title: String(params.p_title ?? ''),
          location: (params.p_location as string) ?? null,
          starts_at: startsAt,
          ends_at: endsAt,
          timezone: String(params.p_timezone ?? 'UTC') || 'UTC',
          virtual_link: (params.p_virtual_link as string) ?? null,
          meeting_instructions: (params.p_meeting_instructions as string) ?? null,
          internal_notes: null,
          status: 'scheduled',
          created_at: now,
          updated_at: now,
        });
        applyRequestStatus(request, 'scheduled');
        materialize('audit_logs').push({
          id: nextId('audit_logs'),
          actor_id: mockCtl.profile?.id ?? null,
          action: 'experience.scheduled',
          entity: 'request',
          entity_id: String(request.id),
          metadata: {appointment_id: appointmentId, starts_at: startsAt},
          created_at: now,
        });
        notifyUser(
          request.user_id as string,
          'experience',
          'Your experience is scheduled',
          'The date, time and meeting details are now visible in your experiences.',
          `/dashboard/experiences/${request.id}`,
        );
        return {data: {appointment_id: appointmentId, request_id: request.id}, error: null, count: null};
      }

      case 'report_payment_sent': {
        // Mirrors public.report_payment_sent(uuid, text): member reports, management verifies.
        const table = String(params.p_table ?? 'membership_payments');
        if (table !== 'membership_payments' && table !== 'experience_payments') {
          return fail('unknown payment table');
        }
        const payment = materialize(table).find((row) => row.id === params.p_payment_id);
        if (!payment) return fail('payment not found');
        if (payment.user_id !== mockCtl.profile?.id) {
          return fail('this payment does not belong to you');
        }
        if (payment.status !== 'pending') return fail('this payment has already been reported');
        payment.status = 'processing';
        payment.updated_at = now;
        const label =
          table === 'membership_payments' ? 'Membership payment' : 'Experience payment';
        for (const staff of materialize('profiles').filter(
          (row) =>
            (row.role === 'management' || row.role === 'admin') && row.status === 'active',
        )) {
          notifyUser(
            String(staff.id),
            'membership',
            'Member reported a payment sent',
            `${label} reported as sent. Verify it on the payments page.`,
            '/management/payments',
          );
        }
        return {data: null, error: null, count: null};
      }

      default:
        return fail(`unknown rpc function: ${name}`);
    }
  };

  return {
    auth: {
      getSession: vi.fn(async () => ({data: {session: mockCtl.session}, error: null})),
      onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
        listeners.add(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(cb),
            },
          },
        };
      }),
      signInWithPassword: mockCtl.signInWithPassword,
      signUp: mockCtl.signUp,
      signOut: mockCtl.signOut,
      resend: mockCtl.resend,
      verifyOtp: mockCtl.verifyOtp,
      resetPasswordForEmail: mockCtl.resetPasswordForEmail,
      updateUser: mockCtl.updateUser,
      exchangeCodeForSession: mockCtl.exchangeCodeForSession,
    },
    functions: {
      invoke: mockCtl.invoke,
    },
    from: vi.fn((table: string) => new MockBuilder(table)),
    rpc: vi.fn((name: string, params: Record<string, unknown> = {}) => ({
      then: (
        onfulfilled?: ((value: MockResult) => unknown) | null,
        onrejected?: ((reason: unknown) => unknown) | null,
      ) => executeRpc(name, params).then(onfulfilled, onrejected),
    })),
    channel: vi.fn((name: string) => {
      const channel = {
        name,
        on: () => channel,
        subscribe: () => channel,
        unsubscribe: () => channel,
      };
      return channel;
    }),
    removeChannel: vi.fn(async () => ({error: null})),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (path: string) => ({data: {path}, error: null})),
        createSignedUrl: vi.fn(async (path: string) => ({
          data: {signedUrl: `https://signed.test/${path}`},
          error: null,
        })),
      })),
    },
  };
}
