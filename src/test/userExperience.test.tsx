import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../lib/supabase', async () => {
  const {buildSupabaseMock} = await import('./mockSupabase');
  return {supabase: buildSupabaseMock()};
});

import {AuthProvider} from '../auth/AuthContext';
import {AppRoutes} from '../routes';
import {makeProfile, makeSession, mockCtl, mockData, resetMockCtl} from './mockSupabase';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <LocationDisplay />
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-02T10:00:00.000Z';

function seedConversation() {
  mockData['management_conversations'] = [
    {
      id: 'conv-1',
      user_id: 'user-1',
      subject: 'Conversation with management — Test Person',
      status: 'open',
      assigned_to: null,
      created_at: T1,
      updated_at: T2,
    },
  ];
  mockData['management_messages'] = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      body: 'Hello from me',
      is_internal: false,
      read_at: T1,
      attachments: [],
      created_at: T1,
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'manager-1',
      body: 'Management reply',
      is_internal: false,
      read_at: null,
      attachments: [],
      created_at: T2,
    },
  ];
}

function seedRequest() {
  mockData.requests = [
    {
      id: 'req-1',
      user_id: 'user-1',
      type: 'meet_greet',
      title: 'Meet at the theatre',
      description: 'I would love to attend a premiere.',
      status: 'submitted',
      priority: 'normal',
      assigned_to: null,
      preferred_date: null,
      preferred_time: null,
      location: null,
      participants: 'just me',
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
    {
      id: 'evt-2',
      request_id: 'req-1',
      actor_id: 'manager-1',
      event_type: 'review_started',
      note: null,
      created_at: T2,
    },
  ];
}

function seedNotification() {
  mockData.notifications = [
    {
      id: 'notif-1',
      user_id: 'user-1',
      title: 'Management replied',
      body: 'We have received your request.',
      type: 'request',
      link: '/dashboard/requests/req-1',
      read_at: null,
      created_at: T2,
    },
  ];
}

function seedApplicant() {
  mockData['applicant_profiles'] = [
    {
      id: 'app-1',
      user_id: 'user-1',
      status: 'new',
      headline: null,
      background: null,
      interests: null,
      reason_for_joining: null,
      platform_motivation: null,
      connection_interest: null,
      experience_interests: [],
      contact_email_ok: true,
      contact_phone_ok: false,
      contact_whatsapp_ok: false,
      whatsapp_number: null,
      application_completed_at: T1,
      referred_by: null,
      submitted_at: T1,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: T1,
      updated_at: T1,
    },
  ];
}

beforeEach(() => {
  resetMockCtl();
  mockCtl.session = makeSession('user-1');
  mockCtl.profile = makeProfile('user-1', 'user');
});

describe('home page', () => {
  it('renders the private home with hero, six sessions and footer', async () => {
    renderApp('/home');

    expect(await screen.findByText(/welcome to your private space/i)).toBeInTheDocument();
    expect(
      screen.getByText(/A private space for personal requests, carefully considered experiences/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Gillian Anderson Management/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', {name: /YOUR\s*JOURNEY/i})).toBeInTheDocument();
    expect(screen.getByText('INTRODUCE')).toBeInTheDocument();
    expect(screen.getByText('DISCUSS')).toBeInTheDocument();
    expect(screen.getByText('CURATE')).toBeInTheDocument();
    expect(screen.getByText('ARRANGE')).toBeInTheDocument();
    expect(screen.getByText('PERSONAL')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', {name: /Begin a conversation/i}).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', {name: /Explore experiences/i}).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', {name: /Discuss membership/i}).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/PRIVATE · DISCREET · BY ARRANGEMENT/i)).toBeInTheDocument();
    // home is not the dashboard
    expect(screen.queryByText(/Good (morning|afternoon|evening)/)).not.toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
  });

  it('keeps the navigation: HOME, DASHBOARD, MESSAGES, REQUESTS, MEMBERSHIP', async () => {
    renderApp('/home');
    await screen.findByText(/welcome to your private space/i);
    for (const label of ['HOME', 'DASHBOARD', 'MESSAGES', 'REQUESTS', 'MEMBERSHIP']) {
      expect(screen.getAllByRole('link', {name: label}).length).toBeGreaterThan(0);
    }
  });

  it('navigates between home and dashboard', async () => {
    const user = userEvent.setup();
    renderApp('/home');
    await screen.findByText(/welcome to your private space/i);

    await user.click(screen.getAllByRole('link', {name: 'DASHBOARD'})[0]);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
    expect(await screen.findByText(/^Good (morning|afternoon|evening), Test\.$/)).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', {name: 'Gillian Anderson Management home'})[0]);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/home'));
    expect(await screen.findByText(/welcome to your private space/i)).toBeInTheDocument();
  });
});

describe('dashboard', () => {
  it('renders greeting, summary cards and first-time empty states', async () => {
    seedApplicant();
    renderApp('/dashboard');

    expect(await screen.findByText(/^Good (morning|afternoon|evening), Test\.$/)).toBeInTheDocument();
    expect(
      screen.getByText("Here's what's happening in your private space."),
    ).toBeInTheDocument();

    expect(screen.getAllByText('Membership').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MANAGEMENT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REQUESTS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EXPERIENCES').length).toBeGreaterThan(0);

    expect(screen.getByText('Not Yet Active')).toBeInTheDocument();
    expect(screen.getByText('No Active Conversation')).toBeInTheDocument();
    expect(screen.getByText('No Upcoming Experience')).toBeInTheDocument();
    expect(screen.getByText('Not yet a member')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No conversation yet. Start a private conversation with management.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No requests yet. When management receives your first request, it will appear here.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No upcoming experiences')).toBeInTheDocument();
    expect(
      screen.getByText("You're up to date. Notifications will appear here."),
    ).toBeInTheDocument();

    // sidebar groups
    expect(screen.getByText('MAIN')).toBeInTheDocument();
    expect(screen.getByText('PERSONAL')).toBeInTheDocument();
  });

  it('shows a page-level error state with retry', async () => {
    mockCtl.failTables.add('management_conversations');
    mockCtl.failTables.add('requests');
    renderApp('/dashboard');

    expect(await screen.findByText(/Could not load your dashboard|mock failure/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Try again'})).toBeInTheDocument();
  });
});

describe('messaging', () => {
  it('lists conversations with unread state and opens a thread', async () => {
    seedConversation();
    const user = userEvent.setup();
    renderApp('/dashboard/messages');

    expect(
      await screen.findByText('Conversation with management — Test Person'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Management: Management reply/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', {name: /Conversation with management/}));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/messages/conv-1'),
    );

    expect(await screen.findByText('Management reply')).toBeInTheDocument();
    expect(screen.getByText('Hello from me')).toBeInTheDocument();

    // incoming message is marked read
    await waitFor(() => {
      const incoming = mockData['management_messages'].find((m) => m.id === 'msg-2');
      expect(incoming?.read_at).toBeTruthy();
    });
  });

  it('sends a message with an attachment', async () => {
    seedConversation();
    const user = userEvent.setup();
    renderApp('/dashboard/messages/conv-1');

    expect(await screen.findByText('Management reply')).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'note.txt', {type: 'text/plain'});
    await user.upload(fileInput, file);
    expect(await screen.findByText('note.txt')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Message'), 'Thank you for the update');
    await user.click(screen.getByRole('button', {name: /Send/}));

    await waitFor(() => {
      const sent = mockData['management_messages'].find(
        (m) => m.body === 'Thank you for the update',
      ) as {attachments?: Array<{name?: string}>} | undefined;
      expect(sent).toBeTruthy();
      expect(sent?.attachments).toHaveLength(1);
      expect(sent?.attachments?.[0]?.name).toBe('note.txt');
    });
    expect(await screen.findByText('Thank you for the update')).toBeInTheDocument();
  });

  it('creates a conversation when none exists', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard/messages');

    expect(await screen.findByText('No conversations yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /Talk to management/}));

    await waitFor(() => expect(mockData['management_conversations']).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/messages/'),
    );
  });

  it('reuses the active conversation instead of opening a second one', async () => {
    seedConversation();
    const user = userEvent.setup();
    renderApp('/dashboard/messages');

    expect(
      await screen.findByText('Conversation with management — Test Person'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /Talk to management/}));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/messages/conv-1'),
    );
    expect(mockData['management_conversations']).toHaveLength(1);
  });

  it('keeps closed threads below active ones and labels them', async () => {
    mockData['management_conversations'] = [
      {
        id: 'conv-closed',
        user_id: 'user-1',
        subject: 'Archived thread',
        status: 'closed',
        assigned_to: null,
        created_at: T1,
        updated_at: '2026-10-05T10:00:00.000Z',
      },
      {
        id: 'conv-open',
        user_id: 'user-1',
        subject: 'Active thread',
        status: 'open',
        assigned_to: null,
        created_at: T1,
        updated_at: T2,
      },
    ];
    renderApp('/dashboard/messages');

    expect(await screen.findByText('Active thread')).toBeInTheDocument();
    const headings = screen.getAllByText(/thread$/).map((node) => node.textContent);
    expect(headings[0]).toBe('Active thread');
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

describe('requests', () => {
  it('validates the new request form and submits with a real timeline', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard/requests/new');

    expect(await screen.findByRole('heading', {name: 'Request something personal'})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /Submit request/}));

    expect(await screen.findByText('Choose a request category.')).toBeInTheDocument();
    expect(screen.getByText(/Give your request a clear title/)).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Category'), 'meet_greet');
    await user.type(screen.getByLabelText('Title'), 'Meet at the premiere');
    await user.type(
      screen.getByLabelText('Description'),
      'I would love to attend a premiere event with a meet and greet.',
    );
    await user.click(screen.getByRole('button', {name: /Submit request/}));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/requests/mock-requests-'),
    );
    expect(await screen.findByRole('heading', {name: 'Meet at the premiere'})).toBeInTheDocument();

    const created = mockData.requests.find((r) => r.title === 'Meet at the premiere');
    expect(created).toMatchObject({
      type: 'meet_greet',
      status: 'submitted',
      user_id: 'user-1',
    });
    expect(await screen.findByText('Request submitted')).toBeInTheDocument();
  });

  it('shows only timeline events that actually happened', async () => {
    seedRequest();
    renderApp('/dashboard/requests/req-1');

    expect(await screen.findByRole('heading', {name: 'Meet at the theatre'})).toBeInTheDocument();
    expect(screen.getByText('Request submitted')).toBeInTheDocument();
    expect(screen.getByText('Review started')).toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    expect(screen.queryByText('Scheduled')).not.toBeInTheDocument();
    expect(screen.queryByText('Proposal created')).not.toBeInTheDocument();
    expect(screen.getByText(/Only events that have actually happened/)).toBeInTheDocument();
  });

  it('allows withdrawing a submitted request', async () => {
    seedRequest();
    const user = userEvent.setup();
    renderApp('/dashboard/requests/req-1');

    expect(await screen.findByRole('heading', {name: 'Meet at the theatre'})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Withdraw request'}));
    await user.click(screen.getByRole('button', {name: 'Yes, withdraw'}));

    await waitFor(() => expect(mockData.requests[0].status).toBe('cancelled'));
    const cancelledLabels = await screen.findAllByText('Cancelled');
    expect(cancelledLabels.length).toBeGreaterThan(0);
    expect(mockData.request_events.some((e) => e.event_type === 'cancelled')).toBe(true);
  });

  it('shows the payment details management attached to the proposal', async () => {
    seedRequest();
    mockData.requests[0].status = 'payment_required';
    mockData.experience_proposals = [
      {
        id: 'prop-1',
        request_id: 'req-1',
        version: 1,
        summary: 'Private tea, forty-five minutes.',
        terms: null,
        amount_cents: 25000,
        currency: 'GBP',
        status: 'accepted',
        proposed_date: '2026-11-20',
        proposed_time: '15:00',
        location: 'London',
        duration_minutes: 45,
        participants: '2',
        notes: null,
        payment_provider: 'bank_transfer',
        payment_instructions: 'Transfer to GA Events, reference REQ1.',
        sent_at: T1,
        responded_at: T2,
        viewed_at: T1,
        expires_at: null,
        created_at: T1,
        updated_at: T1,
      },
    ];
    renderApp('/dashboard/requests/req-1');

    expect(await screen.findByText(/How to pay/)).toBeInTheDocument();
    expect(screen.getAllByText(/Transfer to GA Events/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Management will confirm the accepted payment method/),
    ).not.toBeInTheDocument();
  });

  it('lists requests with status filters', async () => {
    seedRequest();
    const user = userEvent.setup();
    renderApp('/dashboard/requests');

    expect(await screen.findByText('Meet at the theatre')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Under Review'}));
    expect(screen.getByText('No requests with this status.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'All'}));
    expect(await screen.findByText('Meet at the theatre')).toBeInTheDocument();
  });

  it('surfaces a load error with retry', async () => {
    mockCtl.failTables.add('requests');
    const user = userEvent.setup();
    renderApp('/dashboard/requests');

    expect(await screen.findByText('mock failure on requests')).toBeInTheDocument();
    mockCtl.failTables.delete('requests');
    await user.click(screen.getByRole('button', {name: 'Try again'}));
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });
});

describe('notifications', () => {
  it('shows unread state, marks all read and opens a detail', async () => {
    seedNotification();
    const user = userEvent.setup();
    renderApp('/dashboard/notifications');

    expect(await screen.findByText('Management replied')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Mark all read'}));
    await waitFor(() => expect(mockData.notifications[0].read_at).toBeTruthy());
    expect(await screen.findByText('0 unread')).toBeInTheDocument();

    await user.click(screen.getByRole('link', {name: /Management replied/}));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/notifications/notif-1'),
    );
    expect(await screen.findByRole('heading', {name: 'Management replied'})).toBeInTheDocument();
    expect(screen.getByText('We have received your request.')).toBeInTheDocument();
    expect(mockData.notifications[0].read_at).toBeTruthy();
  });
});

describe('profile', () => {
  it('saves editable details without touching protected fields', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard/profile');

    const nameInput = (await screen.findByDisplayValue('Test Person')) as HTMLInputElement;
    // email is read-only
    expect(screen.getByLabelText('Email')).toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed Person');
    await user.click(screen.getByRole('button', {name: 'Save changes'}));

    expect(await screen.findByText('Your profile has been saved.')).toBeInTheDocument();
    const row = mockData.profiles.find((r) => r.id === 'user-1');
    expect(row?.full_name).toBe('Renamed Person');
    expect(row?.role).toBe('user');
    expect(row?.status).toBe('active');
  });
});

describe('settings', () => {
  it('validates password change', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard/settings');

    expect(await screen.findByText('Preferences & security')).toBeInTheDocument();

    await user.type(await screen.findByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', {name: /Change password/}));
    expect(await screen.findByText('Password must be at least 8 characters long.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('New password'));
    await user.clear(screen.getByLabelText('Confirm new password'));
    await user.type(screen.getByLabelText('New password'), 'longenough1');
    await user.type(screen.getByLabelText('Confirm new password'), 'longenough2');
    await user.click(screen.getByRole('button', {name: /Change password/}));
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockCtl.updateUser).not.toHaveBeenCalled();
  });

  it('saves communication preferences on the application record', async () => {
    seedApplicant();
    const user = userEvent.setup();
    renderApp('/dashboard/settings');

    expect(await screen.findByText('Communication preferences')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', {name: /contact me by phone/i}));
    await user.click(screen.getByRole('button', {name: 'Save communication preferences'}));

    expect(await screen.findByText('Communication preferences saved.')).toBeInTheDocument();
    const app = mockData['applicant_profiles'].find((a) => a.id === 'app-1');
    expect(app?.contact_phone_ok).toBe(true);
  });

  it('sends an account deletion request to management instead of deleting', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard/settings');

    expect(await screen.findByText('Account deletion')).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Why are you leaving?'),
      'I no longer need the platform.',
    );
    await user.click(
      screen.getByRole('checkbox', {name: /I understand this sends a deletion request/i}),
    );
    await user.click(screen.getByRole('button', {name: /Request account deletion/}));

    await waitFor(() => {
      const request = mockData.requests.find((r) => r.title === 'Account deletion request');
      expect(request).toMatchObject({type: 'other', user_id: 'user-1'});
    });
    expect(
      await screen.findByText(/Your deletion request has been sent to management/),
    ).toBeInTheDocument();
    // no deletion happened: the account still exists
    expect(mockCtl.session).not.toBeNull();
  });
});

describe('route smoke', () => {
  const paths = [
    '/home',
    '/dashboard',
    '/dashboard/messages',
    '/dashboard/requests',
    '/dashboard/requests/new',
    '/dashboard/notifications',
    '/dashboard/profile',
    '/dashboard/settings',
    '/dashboard/experiences',
    '/dashboard/membership',
    '/dashboard/documents',
  ];

  it.each(paths)('renders %s without crashing', async (path) => {
    renderApp(path);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(path));
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders detail routes without crashing', async () => {
    seedConversation();
    seedRequest();
    seedNotification();

    for (const path of [
      '/dashboard/messages/conv-1',
      '/dashboard/requests/req-1',
      '/dashboard/notifications/notif-1',
    ]) {
      const view = render(
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <LocationDisplay />
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>,
      );
      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(path));
      expect(within(view.container).queryByText('Something went wrong')).not.toBeInTheDocument();
      view.unmount();
    }
  });
});
