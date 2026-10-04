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
  resetMockData();
}

export function resetMockData() {
  for (const key of Object.keys(mockData)) delete mockData[key];
}

let idCounter = 0;

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
            id: `mock-request_events-${++idCounter}`,
            request_id: row.id,
            actor_id: row.user_id ?? null,
            event_type: 'submitted',
            note: null,
            created_at: now,
          });
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
      const statusEventMap: Record<string, string> = {
        in_review: 'review_started',
        information_requested: 'information_requested',
        proposal: 'proposal_created',
        approved: 'approved',
        scheduled: 'scheduled',
        completed: 'completed',
        declined: 'declined',
        cancelled: 'cancelled',
      };
      for (const row of store) {
        if (matched.includes(row)) {
          const previousStatus = row.status;
          const patchStatus = typeof this.patch?.status === 'string' ? this.patch.status : null;
          Object.assign(row, structuredClone(this.patch ?? {}));
          // Mirror the database trigger: status changes append timeline events.
          if (this.table === 'requests' && patchStatus && patchStatus !== previousStatus) {
            const eventType = statusEventMap[patchStatus];
            if (eventType) {
              materialize('request_events').push({
                id: `mock-request_events-${++idCounter}`,
                request_id: row.id,
                actor_id: null,
                event_type: eventType,
                note: null,
                created_at: now,
              });
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
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

export function buildSupabaseMock() {
  const listeners = new Set<(event: string, session: Session | null) => void>();

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
    from: vi.fn((table: string) => new MockBuilder(table)),
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
