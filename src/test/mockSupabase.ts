import {vi} from 'vitest';
import type {Session} from '@supabase/supabase-js';

import type {AcknowledgementVersion, Profile} from '../types';

export interface MockControl {
  session: Session | null;
  profile: Profile | null;
  ackVersion: AcknowledgementVersion | null;
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
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resend: vi.fn(),
  verifyOtp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
};

export function resetMockCtl() {
  mockCtl.session = null;
  mockCtl.profile = null;
  mockCtl.ackVersion = null;
  mockCtl.signInWithPassword.mockReset();
  mockCtl.signUp.mockReset();
  mockCtl.signOut.mockReset();
  mockCtl.resend.mockReset();
  mockCtl.verifyOtp.mockReset();
  mockCtl.resetPasswordForEmail.mockReset();
  mockCtl.updateUser.mockReset();
  mockCtl.exchangeCodeForSession.mockReset();
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
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function profileQuery() {
  const api = {
    select: () => api,
    eq: () => api,
    not: () => api,
    order: () => api,
    limit: () => api,
    maybeSingle: async () => ({data: mockCtl.profile, error: null}),
  };
  return api;
}

function ackQuery() {
  const api = {
    select: () => api,
    eq: () => api,
    not: () => api,
    order: () => api,
    limit: () => api,
    maybeSingle: async () => ({data: mockCtl.ackVersion, error: null}),
  };
  return api;
}

function applicantQuery() {
  const api = {
    select: () => api,
    eq: () => api,
    not: () => api,
    order: () => api,
    limit: () => api,
    maybeSingle: async () => ({data: null, error: null}),
  };
  return api;
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
    from: vi.fn((table: string) => {
      if (table === 'acknowledgement_versions') return ackQuery();
      if (table === 'applicant_profiles') return applicantQuery();
      return profileQuery();
    }),
  };
}
