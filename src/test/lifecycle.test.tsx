import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../lib/supabase', async () => {
  const {buildSupabaseMock} = await import('./mockSupabase');
  return {supabase: buildSupabaseMock()};
});

import {AuthProvider} from '../auth/AuthContext';
import {AppRoutes} from '../routes';
import {supabase} from '../lib/supabase';
import {makeProfile, makeSession, mockCtl, mockData, resetMockCtl} from './mockSupabase';

type Row = Record<string, unknown>;

const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-02T10:00:00.000Z';

function signInAs(role: 'user' | 'management' | 'admin', id = 'manager-1') {
  mockCtl.session = makeSession(id);
  mockCtl.profile = makeProfile(id, role);
}

function seedTier() {
  mockData.membership_tiers = [
    {
      id: 'tier-1',
      key: 'gold_circle',
      name: 'Gold Circle',
      description: 'The inner circle.',
      price_cents: 50000,
      currency: 'USD',
      interval: 'annual',
      benefits: [],
      sort_order: 1,
      status: 'active',
      created_at: T1,
      updated_at: T1,
    },
  ];
}

function seedOffer(status = 'sent') {
  mockData.membership_offers = [
    {
      id: 'offer-1',
      user_id: 'user-1',
      tier_id: 'tier-1',
      status,
      price_cents: null,
      currency: 'USD',
      message: 'An invitation.',
      benefits: [],
      terms: null,
      sent_at: status === 'sent' ? T1 : null,
      viewed_at: null,
      responded_at: null,
      expires_at: null,
      created_by: 'manager-1',
      created_at: T1,
      updated_at: T1,
    },
  ];
}

function seedMembership(status: string) {
  mockData.memberships = [
    {
      id: 'mem-1',
      user_id: 'user-1',
      tier_id: 'tier-1',
      offer_id: null,
      status,
      membership_number: null,
      activation_date: null,
      expiration_date: null,
      cancelled_at: null,
      created_at: T1,
      updated_at: T1,
    },
  ];
}

function seedMembershipPayment(status: string) {
  mockData.membership_payments = [
    {
      id: 'mpay-1',
      membership_id: 'mem-1',
      user_id: 'user-1',
      amount_cents: 50000,
      currency: 'USD',
      status,
      provider: 'manual',
      reference: null,
      notes: null,
      paid_at: status === 'paid' ? T2 : null,
      created_at: T1,
      updated_at: T1,
    },
  ];
}

function seedRequest(status = 'submitted') {
  mockData.requests = [
    {
      id: 'req-1',
      user_id: 'user-1',
      type: 'personal_experience',
      experience_id: null,
      title: 'A private tea gathering',
      description: 'An afternoon in a quiet drawing room.',
      status,
      priority: 'normal',
      assigned_to: null,
      preferred_date: null,
      preferred_time: null,
      location: null,
      participants: '2',
      contact_method: 'email',
      additional_requirements: null,
      submitted_at: T1,
      resolved_at: null,
      created_at: T1,
      updated_at: T1,
    },
  ];
  mockData.request_events = [
    {
      id: 'evt-1',
      request_id: 'req-1',
      actor_id: 'user-1',
      event_type: 'submitted',
      note: null,
      created_at: T1,
    },
  ];
}

function seedProposal(status = 'draft', amount: number | null = 25000) {
  mockData.experience_proposals = [
    {
      id: 'prop-1',
      request_id: 'req-1',
      version: 1,
      summary: 'Private tea, forty-five minutes.',
      terms: 'Non-transferable.',
      amount_cents: amount,
      currency: 'USD',
      proposed_date: '2026-11-20',
      proposed_time: '15:00',
      location: 'London',
      duration_minutes: 45,
      participants: '2',
      notes: null,
      status,
      sent_at: status === 'sent' ? T1 : null,
      responded_at: null,
      viewed_at: null,
      expires_at: null,
      created_at: T1,
      updated_at: T1,
    },
  ];
  mockData.experience_payments = [];
}

function requestRow(): Row {
  return mockData.requests[0];
}

function events(): string[] {
  return mockData.request_events.map((event) => String(event.event_type));
}

describe('membership lifecycle', () => {
  beforeEach(() => {
    resetMockCtl();
    signInAs('management');
    seedTier();
    seedOffer();
  });

  it('accepting an offer creates a pending membership and its payment request', async () => {
    const {error} = await supabase
      .from('membership_offers')
      .update({status: 'accepted'})
      .eq('id', 'offer-1');
    expect(error).toBeNull();

    expect(mockData.memberships).toHaveLength(1);
    expect(mockData.memberships[0].status).toBe('pending');
    expect(mockData.memberships[0].membership_number).toBeNull();

    expect(mockData.membership_payments).toHaveLength(1);
    expect(mockData.membership_payments[0].status).toBe('pending');
    expect(mockData.membership_payments[0].amount_cents).toBe(50000);
  });

  it('a paid membership payment moves the membership to verification, never active', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    const payment = mockData.membership_payments[0];

    const {error} = await supabase
      .from('membership_payments')
      .update({status: 'paid'})
      .eq('id', payment.id);
    expect(error).toBeNull();

    expect(mockData.membership_payments[0].paid_at).not.toBeNull();
    expect(mockData.memberships[0].status).toBe('verification');
    expect(
      mockData.notifications.some((notification) => notification.title === 'Payment received'),
    ).toBe(true);
  });

  it('rejects accepting a second offer while a membership already exists', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    seedOffer('sent');
    mockData.membership_offers[0].id = 'offer-2';

    const {error} = await supabase
      .from('membership_offers')
      .update({status: 'accepted'})
      .eq('id', 'offer-2');
    expect(error?.message).toMatch(/already has a pending or active membership/);
    expect(mockData.memberships).toHaveLength(1);
  });

  it('activation is management-only', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    const payment = mockData.membership_payments[0];
    await supabase.from('membership_payments').update({status: 'paid'}).eq('id', payment.id);
    const membershipId = String(mockData.memberships[0].id);

    signInAs('user', 'user-1');
    const {error} = await supabase.rpc('activate_membership', {p_membership_id: membershipId});
    expect(error?.message).toMatch(/only management can activate memberships/);
    expect(mockData.memberships[0].status).toBe('verification');
  });

  it('activation is blocked while the payment is still open', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    const membershipId = String(mockData.memberships[0].id);

    const {error} = await supabase.rpc('activate_membership', {p_membership_id: membershipId});
    expect(error?.message).toMatch(/payment must be confirmed before activation/);
    expect(mockData.memberships[0].status).toBe('pending');
  });

  it('management activates only after payment, and the card is issued server-side', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    const payment = mockData.membership_payments[0];
    await supabase.from('membership_payments').update({status: 'paid'}).eq('id', payment.id);
    const membershipId = String(mockData.memberships[0].id);

    const {data, error} = await supabase.rpc('activate_membership', {
      p_membership_id: membershipId,
    });
    expect(error).toBeNull();

    const membership = mockData.memberships[0];
    expect(membership.status).toBe('active');
    expect(String(membership.membership_number)).toMatch(/^GA-\d{6}$/);
    expect(membership.activation_date).not.toBeNull();
    expect(membership.expiration_date).not.toBeNull();

    const card = mockData.membership_cards[0];
    expect(String(card.card_serial)).toMatch(/^GA-GOLD-CIRCLE-[0-9A-F]{5}$/);
    expect((data as Row).card_serial).toBe(card.card_serial);

    const reissued = await supabase.rpc('reissue_membership_card', {
      p_membership_id: membershipId,
    });
    expect(reissued.error).toBeNull();
    expect(String(reissued.data)).toMatch(/^GA-GOLD-CIRCLE-[0-9A-F]{5}$/);
    expect(mockData.membership_cards[0].card_serial).toBe(reissued.data);
    expect(mockData.membership_cards[0].revoked_at).toBeNull();
  });

  it('an already active membership cannot be activated twice', async () => {
    seedMembership('active');
    const {error} = await supabase.rpc('activate_membership', {p_membership_id: 'mem-1'});
    expect(error?.message).toMatch(/already active/);
  });

  it('a member reports the payment sent; management still verifies before activation', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    mockData.profiles = [makeProfile('manager-1', 'management') as unknown as Row];
    const payment = mockData.membership_payments[0];

    signInAs('user', 'user-1');
    const {error} = await supabase.rpc('report_payment_sent', {
      p_payment_id: payment.id,
      p_table: 'membership_payments',
    });
    expect(error).toBeNull();
    expect(mockData.membership_payments[0].status).toBe('processing');
    expect(mockData.memberships[0].status).toBe('pending');
    expect(
      mockData.notifications.some(
        (notification) =>
          notification.title === 'Member reported a payment sent' &&
          notification.user_id === 'manager-1',
      ),
    ).toBe(true);

    signInAs('management');
    const blocked = await supabase.rpc('activate_membership', {
      p_membership_id: String(mockData.memberships[0].id),
    });
    expect(blocked.error?.message).toMatch(/payment must be confirmed before activation/);

    await supabase.from('membership_payments').update({status: 'paid'}).eq('id', payment.id);
    expect(mockData.memberships[0].status).toBe('verification');
  });

  it('only the owner can report a payment, and only once', async () => {
    await supabase.from('membership_offers').update({status: 'accepted'}).eq('id', 'offer-1');
    const payment = mockData.membership_payments[0];

    signInAs('user', 'user-2');
    const stranger = await supabase.rpc('report_payment_sent', {
      p_payment_id: payment.id,
      p_table: 'membership_payments',
    });
    expect(stranger.error?.message).toMatch(/does not belong to you/);
    expect(mockData.membership_payments[0].status).toBe('pending');

    signInAs('user', 'user-1');
    const first = await supabase.rpc('report_payment_sent', {
      p_payment_id: payment.id,
      p_table: 'membership_payments',
    });
    expect(first.error).toBeNull();
    const second = await supabase.rpc('report_payment_sent', {
      p_payment_id: payment.id,
      p_table: 'membership_payments',
    });
    expect(second.error?.message).toMatch(/already been reported/);
    expect(mockData.membership_payments[0].status).toBe('processing');
  });
});

describe('experience lifecycle', () => {
  beforeEach(() => {
    resetMockCtl();
    signInAs('management');
    seedRequest();
    seedProposal();
  });

  it('sending a proposal moves the request to proposal and notifies the member', async () => {
    const {error} = await supabase
      .from('experience_proposals')
      .update({status: 'sent'})
      .eq('id', 'prop-1');
    expect(error).toBeNull();

    expect(requestRow().status).toBe('proposal');
    expect(events()).toContain('proposal_created');
    expect(
      mockData.notifications.some((notification) =>
        notification.title === 'Management sent you a proposal',
      ),
    ).toBe(true);
  });

  it('accepting the proposal requires payment before anything is confirmed', async () => {
    await supabase.from('experience_proposals').update({status: 'sent'}).eq('id', 'prop-1');
    const {error} = await supabase
      .from('experience_proposals')
      .update({status: 'accepted'})
      .eq('id', 'prop-1');
    expect(error).toBeNull();

    expect(requestRow().status).toBe('payment_required');
    expect(events()).toContain('proposal_accepted');
    expect(mockData.experience_payments).toHaveLength(1);
    expect(mockData.experience_payments[0].status).toBe('pending');
    expect(mockData.experience_payments[0].user_id).toBe('user-1');
  });

  it('a paid experience payment never confirms the request by itself', async () => {
    await supabase.from('experience_proposals').update({status: 'sent'}).eq('id', 'prop-1');
    await supabase.from('experience_proposals').update({status: 'accepted'}).eq('id', 'prop-1');
    const payment = mockData.experience_payments[0];

    const {error} = await supabase
      .from('experience_payments')
      .update({status: 'paid'})
      .eq('id', payment.id);
    expect(error).toBeNull();

    expect(mockData.experience_payments[0].paid_at).not.toBeNull();
    expect(requestRow().status).toBe('payment_required');
    expect(events()).not.toContain('confirmed');
  });

  it('a member reports the experience payment sent; the request stays payment_required', async () => {
    await supabase.from('experience_proposals').update({status: 'sent'}).eq('id', 'prop-1');
    await supabase.from('experience_proposals').update({status: 'accepted'}).eq('id', 'prop-1');
    mockData.profiles = [makeProfile('manager-1', 'management') as unknown as Row];
    const payment = mockData.experience_payments[0];

    signInAs('user', 'user-1');
    const {error} = await supabase.rpc('report_payment_sent', {
      p_payment_id: payment.id,
      p_table: 'experience_payments',
    });
    expect(error).toBeNull();
    expect(mockData.experience_payments[0].status).toBe('processing');
    expect(requestRow().status).toBe('payment_required');
    expect(
      mockData.notifications.some(
        (notification) => notification.title === 'Member reported a payment sent',
      ),
    ).toBe(true);
  });

  it('management confirms, and scheduling is gated on confirmation', async () => {
    const early = await supabase.rpc('schedule_experience', {
      p_request_id: 'req-1',
      p_title: 'Tea',
      p_starts_at: '2026-11-20T15:00:00.000Z',
      p_ends_at: '2026-11-20T15:45:00.000Z',
    });
    expect(early.error?.message).toMatch(/confirmed before scheduling/);

    const {error: confirmError} = await supabase
      .from('requests')
      .update({status: 'confirmed'})
      .eq('id', 'req-1');
    expect(confirmError).toBeNull();
    expect(events()).toContain('confirmed');

    const scheduled = await supabase.rpc('schedule_experience', {
      p_request_id: 'req-1',
      p_title: 'Private tea gathering',
      p_starts_at: '2026-11-20T15:00:00.000Z',
      p_ends_at: '2026-11-20T15:45:00.000Z',
      p_timezone: 'Europe/London',
      p_location: 'London',
      p_virtual_link: null,
      p_meeting_instructions: 'Arrive fifteen minutes early.',
    });
    expect(scheduled.error).toBeNull();

    expect(requestRow().status).toBe('scheduled');
    expect(events()).toContain('scheduled');

    const appointment = mockData.appointments[0];
    expect(appointment.status).toBe('confirmed');
    expect(appointment.request_id).toBe('req-1');
    expect(appointment.timezone).toBe('Europe/London');

    const schedule = mockData.experience_schedules[0];
    expect(schedule.status).toBe('scheduled');
    expect(schedule.request_id).toBe('req-1');

    expect(
      mockData.notifications.some((notification) =>
        notification.title === 'Your experience is scheduled',
      ),
    ).toBe(true);
  });

  it('an end that precedes the start is rejected', async () => {
    await supabase.from('requests').update({status: 'confirmed'}).eq('id', 'req-1');
    const {error} = await supabase.rpc('schedule_experience', {
      p_request_id: 'req-1',
      p_title: 'Tea',
      p_starts_at: '2026-11-20T15:45:00.000Z',
      p_ends_at: '2026-11-20T15:00:00.000Z',
    });
    expect(error?.message).toMatch(/end must be after start/);
  });

  it('declining the proposal cancels the request', async () => {
    await supabase.from('experience_proposals').update({status: 'sent'}).eq('id', 'prop-1');
    const {error} = await supabase
      .from('experience_proposals')
      .update({status: 'declined'})
      .eq('id', 'prop-1');
    expect(error).toBeNull();

    expect(requestRow().status).toBe('cancelled');
    expect(events()).toContain('cancelled');
  });

  it('a priced proposal with no amount creates no payment request', async () => {
    mockData.experience_proposals[0].amount_cents = null;
    await supabase.from('experience_proposals').update({status: 'sent'}).eq('id', 'prop-1');
    await supabase.from('experience_proposals').update({status: 'accepted'}).eq('id', 'prop-1');

    expect(requestRow().status).toBe('payment_required');
    expect(mockData.experience_payments).toHaveLength(0);
  });
});

describe('management console activation', () => {
  beforeEach(() => {
    resetMockCtl();
    signInAs('management');
    mockData.profiles = [
      makeProfile('manager-1', 'management') as unknown as Row,
      makeProfile('user-1', 'user') as unknown as Row,
    ];
    seedTier();
    seedMembership('verification');
    seedMembershipPayment('paid');
  });

  it('activates a verified membership from the console and shows the issued card', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/management/memberships/mem-1']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    );

    const activateButton = await screen.findByRole('button', {name: /Activate membership/i});
    await user.click(activateButton);

    await waitFor(() => {
      expect(mockData.memberships[0].status).toBe('active');
    });
    expect(await screen.findByText(/Membership activated/i)).toBeInTheDocument();
    expect(String(mockData.membership_cards[0].card_serial)).toMatch(
      /^GA-GOLD-CIRCLE-[0-9A-F]{5}$/,
    );
  });
});
